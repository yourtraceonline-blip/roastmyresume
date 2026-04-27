import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../lib/authServer";
import { hasPaidAccess, hasUsedFreeImprovement } from "../../../lib/paidAccess";
import { createSupabaseServiceClient } from "../../../lib/supabaseServer";

export const runtime = "nodejs";
export const maxDuration = 60;

type ImprovementResponse = {
  cookedScore: number;
  roastQuote: string;
  peerComparison: string;
  lineEdits: Array<{
    section: string;
    original: string;
    suggested: string;
    why: string;
  }>;
  rewrittenBullets: string[];
  strategy: string;
};

export async function GET(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("resume_improvements")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ latest: data ?? null });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const current_resume =
    typeof body.current_resume === "string" ? body.current_resume.slice(0, 16000) : "";

  const supabase = createSupabaseServiceClient();
  const { data: latest } = await supabase
    .from("resume_improvements")
    .select("id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.id) {
    const { error } = await supabase
      .from("resume_improvements")
      .update({ current_resume, updated_at: new Date().toISOString() })
      .eq("id", latest.id);
    if (error) {
      console.error("Improve PATCH:", error);
      return NextResponse.json({ error: "Could not save resume." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: latest.id });
  }

  const { error } = await supabase.from("resume_improvements").insert({
    user_id: auth.user.id,
    email: auth.user.email ?? null,
    roast_snapshot: {},
    current_resume,
    peer_comparison: null,
    line_edits: [],
    rewritten_bullets: [],
    strategy: null,
  });
  if (error) {
    console.error("Improve PATCH insert:", error);
    return NextResponse.json({ error: "Could not save resume." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();
  const paid = await hasPaidAccess(auth.user.id);
  if (!paid && (await hasUsedFreeImprovement(auth.user.id))) {
    return NextResponse.json({ error: "Payment required. You've used your free analysis." }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  const roastResult = body.roastResult ?? {};
  const currentResume = typeof body.currentResume === "string" ? body.currentResume.slice(0, 16000) : "";

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_KEY is missing." }, { status: 500 });

  const prompt = `You are a professional resume editor and ATS expert. Generate improvement feedback for a resume.

The resume text is provided below. Analyze it thoroughly and provide SPECIFIC, CONCRETE improvements.

Return ONLY valid JSON in this exact shape:
{
  "cookedScore": number from 0-100,
  "roastQuote": "short witty roast quote about the resume",
  "peerComparison": "2-4 sentences comparing this resume against stronger peers in the same industry.",
  "lineEdits": [
    { "section": "Experience", "original": "EXACT phrase from resume", "suggested": "EXACT improved phrase", "why": "why this improves score" }
  ],
  "rewrittenBullets": ["weak phrase | better phrase"],
  "strategy": "short practical plan to improve the resume score",
  "atsScore": {"score": number from 0-100, "keywordsFound": ["keyword1", "keyword2"], "keywordsMissing": ["keyword3", "keyword4"], "formatIssues": ["issue1"]},
  "atsRecommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

CRITICAL RULES:
1. MUST include 3-5 specific lineEdits with EXACT original text from the resume
2. MUST include 5-8 rewrittenBullets in "weak | better" format 
3. Extract keywords from the resume content - look for skills, technologies, tools
4. DO NOT give generic advice - every suggestion must reference specific content from the resume
5. If you cannot find specific content to improve, say "Review resume for quantified achievements" in that field
6. Analyze the actual resume text provided - find weak verbs, missing metrics, vague descriptions`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://roastmyresume.fun",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4.5",
      temperature: 0.7,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Roast result JSON:\n${JSON.stringify(roastResult, null, 2)}\n\nResume/editor text:\n${currentResume || "(user has not pasted resume text yet)"}` },
      ],
    }),
  });
  if (!res.ok) {
    console.error("Improve API error:", await res.text());
    return NextResponse.json({ error: "AI improvement generation failed." }, { status: 502 });
  }
  const ai = await res.json();
  const raw = ai.choices?.[0]?.message?.content ?? "";
  let parsed: ImprovementResponse;
  try {
    const stripped = raw.replace(/```(?:json)?/gi, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse improve response:", raw);
    return NextResponse.json({ error: "AI returned invalid improvement JSON." }, { status: 502 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("resume_improvements")
    .insert({
      user_id: auth.user.id,
      email: auth.user.email,
      roast_snapshot: roastResult,
      current_resume: currentResume,
      peer_comparison: parsed.peerComparison,
      line_edits: parsed.lineEdits ?? [],
      rewritten_bullets: parsed.rewrittenBullets ?? [],
      strategy: parsed.strategy,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save improvement:", error);
    return NextResponse.json({ error: "Could not save improvement." }, { status: 500 });
  }

  return NextResponse.json({ 
    improvement: {
      ...data,
      cookedScore: parsed.cookedScore,
      roastQuote: parsed.roastQuote,
    }
  });
}