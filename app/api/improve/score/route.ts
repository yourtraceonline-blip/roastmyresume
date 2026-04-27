import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../../lib/authServer";
import { hasPaidAccess } from "../../../../lib/paidAccess";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCORE_SYSTEM = `You score resumes for "cooked risk" (replaceability / weak signal).

Respond ONLY with valid JSON (no markdown):
{
  "cookedScore": <integer 1-100, higher = more cooked / worse>,
  "roastQuote": "<one savage short line about this draft>",
  "scoreBreakdown": {
    "replaceability": <1-100>,
    "skillDepth": <1-100>,
    "resumeQuality": <1-100>
  }
}

Calibration: strong specific resumes with metrics score under 45. Generic buzzword soup scores 70+.`;

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();
  if (!(await hasPaidAccess(auth.user.id))) {
    return NextResponse.json({ error: "Payment required." }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  const resumeText = typeof body.resumeText === "string" ? body.resumeText.slice(0, 12000) : "";
  if (!resumeText.trim()) {
    return NextResponse.json({ error: "Paste or upload resume text first." }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_KEY is missing." }, { status: 500 });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://roastmyresume.fun",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      temperature: 0.55,
      messages: [
        { role: "system", content: SCORE_SYSTEM },
        { role: "user", content: `Score this resume draft:\n\n${resumeText}` },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Score OpenRouter error:", text);
    return NextResponse.json({ error: "Could not score this draft." }, { status: 502 });
  }

  const ai = await response.json();
  const raw = ai.choices?.[0]?.message?.content ?? "";
  try {
    const stripped = raw.replace(/```(?:json)?/gi, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]) as {
      cookedScore?: number;
      roastQuote?: string;
      scoreBreakdown?: Record<string, number>;
    };
    const cookedScore = Math.min(100, Math.max(1, Math.round(Number(parsed.cookedScore) || 50)));
    return NextResponse.json({
      cookedScore,
      roastQuote: typeof parsed.roastQuote === "string" ? parsed.roastQuote : "",
      scoreBreakdown: parsed.scoreBreakdown ?? null,
    });
  } catch {
    console.error("Score parse failed:", raw);
    return NextResponse.json({ error: "AI returned an invalid score." }, { status: 502 });
  }
}
