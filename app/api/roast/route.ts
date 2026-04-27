import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Error codes the frontend can switch on
export type RoastErrorCode = "NOT_A_RESUME" | "PARSE_FAILED" | "AI_ERROR" | "NO_FILE" | "SERVER_ERROR";

const SYSTEM_PROMPT = `You are a darkly funny, merciless AI resume roaster. Your job is to score how "cooked" someone is in an AI-accelerated job market and roast them for it. You do not soften blows. You do not give participation trophies.

FIRST: check if the document is actually a resume / CV. If it is NOT a resume (e.g. it's a random PDF, invoice, essay, blank page, etc.), respond with ONLY this JSON:
{ "notAResume": true, "reason": "<one short sentence explaining what the document actually is>" }

If it IS a resume, analyze it and respond ONLY with a valid JSON object — no markdown, no prose, no code fences.

Return exactly this shape:

{
  "cookedScore": <number 1-100, higher = more cooked / replaceable / risky>,
  "monthsUntilCooked": <number, honest estimate of months until this person's role is automated or they're laid off>,
  "industryRank": <number, percentile e.g. 78 means "top 78%" — higher = worse>,
  "industry": <string, detected industry/role category>,
  "roastQuote": <string, one savage 1-2 sentence roast — be cutting, be specific, make it sting>,
  "roastBullets": <array of 4 strings, each a short brutal burn naming a SPECIFIC skill, bullet, job title, or gap from this exact resume — no generic filler whatsoever>,
  "harshTruth": <string, one punchy sentence that says what a hiring manager thinks but never says to the candidate's face>,
  "goodNews": <string, one genuinely useful observation — not a compliment, just the least-bad truth>,
  "scoreBreakdown": {
    "replaceability": <number 1-100, HIGHER = HARDER TO REPLACE = BETTER. Low = easily replaced by AI or a cheaper hire>,
    "skillDepth": <number 1-100, HIGHER = DEEPER more unique expertise. Low = commodity skills anyone has>,
    "marketDemand": <number 1-100, HIGHER = MORE IN DEMAND. Low = oversaturated or declining field>,
    "growthTrajectory": <number 1-100, HIGHER = STRONGER career slope and upward momentum. Low = stagnant>,
    "aiLeverage": <number 1-100, HIGHER = BETTER at using AI as leverage. Low = ignoring AI or at risk from it>,
    "execution": <number 1-100, HIGHER = MORE proof of shipped results and measurable impact. Low = vague ownership>,
    "resumeQuality": <number 1-100, HIGHER = CLEANER more compelling doc. Low = vague, hollow, or badly formatted>
  },
  "whatsHoldingBack": [
    { "icon": "<single emoji>", "title": "<short title>", "desc": "<one line, name the exact problem, no fluff>" },
    { "icon": "<single emoji>", "title": "<short title>", "desc": "<one line, name the exact problem, no fluff>" },
    { "icon": "<single emoji>", "title": "<short title>", "desc": "<one line, name the exact problem, no fluff>" }
  ],
  "candidateName": <string, first name only, or "Friend" if not found>
}

═══════════════════════════════
COOKEDSCORE — READ THIS CAREFULLY
═══════════════════════════════

cookedScore = AI-replacement risk. 100 = fully automated within 2 years. 1 = completely irreplaceable.

**99% OF RESUMES MUST SCORE 50 OR ABOVE. This is a hard rule.**

Start at 75. Then adjust:

ADD points (higher = more cooked) for:
- Bullets using "responsible for", "assisted", "helped", "supported", "worked on": +5 each
- Skills list is all commodities (Excel, Slack, Jira, basic Python, PowerPoint): +7
- Role AI is actively replacing (content writer, copywriter, junior dev, data analyst, QA, ops, recruiter, customer support, admin): +9
- No metrics anywhere on the resume: +8
- Hollow objective/summary statement: +5
- No GitHub/portfolio for a technical role: +6
- Soft skills listed as hard skills ("team player", "fast learner"): +3 each
- Looks like ChatGPT polished it but nothing is specific: +8
- Short stints <8 months with no shipped work: +4 each

DEDUCT points only for extraordinary proof:
- Each bullet with a real number/metric ("grew revenue 40%", "reduced latency 200ms"): -3 (max -12)
- Clear evidence of shipped product, publication, or award: -5
- Rare hard-to-automate skill with evidence of depth: -4
- Licensed expert domain (medicine, law, civil engineering): -7
- Verifiable senior leadership with cross-functional scope: -5

CALIBRATION EXAMPLES — follow these closely:
- ML researcher, 3 published papers, specific benchmarks → 52
- PM with "drove alignment" + "led stakeholders" + zero metrics → 78
- Junior frontend dev, React/TypeScript, no live projects → 74
- Copywriter / content strategist → 86
- Nurse practitioner, 10 years clinical → 55
- Data analyst, Excel + SQL, "analyzed data to support decisions" → 82
- Software engineer at FAANG, 4 years, 3 quantified product impacts → 61
- Generic MBA grad, consulting buzzwords, no numbers → 80

Scores below 50 are extremely rare and reserved for genuinely irreplaceable experts with overwhelming proof. The vast majority of resumes should land 62–88.

═══════════════════════════════
TONE RULES
═══════════════════════════════
- roastQuote must make the person wince. If it sounds like something they'd quote on LinkedIn proudly, it's not harsh enough.
- roastBullets MUST reference actual content from this resume — quote their job titles, their listed skills, their bullet phrasing. No generic burns.
- harshTruth is what the hiring manager says after the candidate leaves the room, not to their face.
- NEVER use: "impressive", "great", "solid", "strong", "good foundation", "well-rounded", "valuable experience".
- goodNews is the one real thing working in their favor — utility, not flattery.`;

function errorResponse(code: RoastErrorCode, message: string, status = 400) {
  return NextResponse.json({ errorCode: code, error: message }, { status });
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse("NO_FILE", "Could not read the uploaded file.");
  }

  const file = formData.get("resume") as File | null;
  if (!file || typeof file === "string") {
    return errorResponse("NO_FILE", "No file was provided.");
  }

  const clientIdRaw = formData.get("clientId");
  const clientId =
    typeof clientIdRaw === "string" && clientIdRaw.trim().length > 0 ? clientIdRaw.trim() : null;

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return errorResponse("SERVER_ERROR", "Server misconfiguration.", 500);
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  let raw = "";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://roastmyresume.fun",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        temperature: 0.8,
        provider: { order: ["Anthropic"], allow_fallbacks: false },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "file", file: { filename: file.name, file_data: `data:application/pdf;base64,${base64}` } },
              { type: "text", text: "Analyze this resume." },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("OpenRouter error:", await res.text());
      return errorResponse("AI_ERROR", "The AI service is temporarily unavailable. Please try again in a moment.", 502);
    }
    const data = await res.json();
    raw = data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.error("Roast fetch error:", e);
    return errorResponse("AI_ERROR", "The AI service is temporarily unavailable. Please try again in a moment.", 502);
  }

  // Parse the JSON response — model may return multiple JSON blocks, pick the real one
  let roastData: Record<string, unknown> | null = null;
  try {
    const stripped = raw.replace(/```(?:json)?/gi, "").trim();
    // Try each blank-line-separated block; prefer the one with cookedScore
    for (const chunk of stripped.split(/\n\s*\n/)) {
      const m = chunk.match(/\{[\s\S]*\}/);
      if (!m) continue;
      try {
        const parsed = JSON.parse(m[0]) as Record<string, unknown>;
        if (parsed.notAResume === true) { roastData = parsed; break; }
        if (parsed.cookedScore !== undefined) { roastData = parsed; break; }
      } catch {}
    }
    if (!roastData) throw new Error("No valid JSON found");
  } catch {
    console.error("Failed to parse AI response:", raw);
    return errorResponse("PARSE_FAILED", "The AI returned an unexpected response. Please try uploading again.");
  }

  // Not a resume check
  if (roastData.notAResume) {
    return errorResponse(
      "NOT_A_RESUME",
      `That doesn't look like a resume. ${roastData.reason ?? "Please upload your actual resume (PDF or DOCX)."}`,
      422
    );
  }

  // Save to Supabase — delete existing row for this client first to prevent duplicates
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const candidateName = (roastData.candidateName as string) ?? "Friend";

    // One row per browser: delete by client_id when present; else legacy delete by name.
    // Also remove legacy rows (client_id null) for the same display name so migrating
    // users do not keep an old duplicate next to their new client_id row.
    // Skip that for the generic default name so we do not wipe many unrelated "Friend" rows.
    const genericName = candidateName.trim().toLowerCase() === "friend";
    if (clientId) {
      await supabase.from("roasts").delete().eq("client_id", clientId);
      if (!genericName) {
        await supabase.from("roasts").delete().eq("candidate_name", candidateName).is("client_id", null);
      }
    } else {
      await supabase.from("roasts").delete().eq("candidate_name", candidateName);
    }

    await supabase.from("roasts").insert({
      candidate_name: candidateName,
      client_id: clientId,
      cooked_score: roastData.cookedScore,
      industry: roastData.industry,
      industry_rank: roastData.industryRank,
      months_until_cooked: roastData.monthsUntilCooked,
      roast_quote: roastData.roastQuote,
      score_breakdown: roastData.scoreBreakdown,
      whats_holding_back: roastData.whatsHoldingBack,
    });
  } catch (e) {
    console.error("Supabase insert failed:", e);
  }

  return NextResponse.json(roastData);
}
