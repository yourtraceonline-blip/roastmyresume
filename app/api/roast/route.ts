import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

// Error codes the frontend can switch on
export type RoastErrorCode = "NOT_A_RESUME" | "PARSE_FAILED" | "AI_ERROR" | "NO_FILE" | "SERVER_ERROR";

const SYSTEM_PROMPT = `You are a brutally honest, witty AI resume roaster.

FIRST: check if the document is actually a resume / CV. If it is NOT a resume (e.g. it's a random PDF, invoice, essay, blank page, etc.), respond with ONLY this JSON:
{ "notAResume": true, "reason": "<one short sentence explaining what the document actually is>" }

If it IS a resume, analyze it and respond ONLY with a valid JSON object — no markdown, no prose, no code fences.

Return exactly this shape:

{
  "cookedScore": <number 1-100, higher = more cooked / replaceable>,
  "monthsUntilCooked": <number, honest estimate of months until this person's role is automated or they're laid off>,
  "industryRank": <number, percentile e.g. 78 means "top 78%" — higher = worse>,
  "industry": <string, detected industry/role category>,
  "roastQuote": <string, one savage 1-2 sentence roast quote about the resume overall>,
  "roastBullets": <array of 4 strings, each a short brutal specific burn about the resume>,
  "harshTruth": <string, one punchy harsh truth sentence>,
  "goodNews": <string, one genuinely useful piece of good news>,
  "scoreBreakdown": {
    "replaceability": <number 1-100>,
    "skillDepth": <number 1-100>,
    "marketDemand": <number 1-100>,
    "growthTrajectory": <number 1-100>,
    "aiLeverage": <number 1-100>,
    "execution": <number 1-100>,
    "resumeQuality": <number 1-100>
  },
  "whatsHoldingBack": [
    { "icon": "<single emoji>", "title": "<short title>", "desc": "<one line fix>" },
    { "icon": "<single emoji>", "title": "<short title>", "desc": "<one line fix>" },
    { "icon": "<single emoji>", "title": "<short title>", "desc": "<one line fix>" }
  ],
  "candidateName": <string, first name only, or "Friend" if not found>
}

Be specific to the actual resume content — name real skills, real job titles, real gaps you see. Don't be generic.`;

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

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.name.toLowerCase().endsWith(".docx")
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return errorResponse("SERVER_ERROR", "Server misconfiguration.", 500);
  }

  let raw = "";
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://roastmyresume.fun",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Here is the document to analyze:" },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return errorResponse("AI_ERROR", "The AI service is temporarily unavailable. Please try again in a moment.", 502);
    }

    const data = await response.json();
    raw = data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.error("Fetch error:", e);
    return errorResponse("AI_ERROR", "Could not reach the AI service. Please try again.", 502);
  }

  // Parse the JSON response
  let roastData: Record<string, unknown>;
  try {
    const stripped = raw.replace(/```(?:json)?/gi, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    roastData = JSON.parse(jsonMatch[0]);
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

    // One row per browser: delete by client_id when present; else legacy delete by name
    if (clientId) {
      await supabase.from("roasts").delete().eq("client_id", clientId);
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
