import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../../lib/authServer";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read upload." }, { status: 400 });
  }

  const file = formData.get("resume") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }

  const lower = file.name.toLowerCase();

  if (lower.endsWith(".txt")) {
    return NextResponse.json({ text: (await file.text()).slice(0, 16000) });
  }

  if (!lower.endsWith(".pdf")) {
    return NextResponse.json({ error: "Use PDF or TXT files." }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

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
        temperature: 0,
        provider: { order: ["Anthropic"], allow_fallbacks: false },
        messages: [
          {
            role: "user",
            content: [
              { type: "file", file: { filename: file.name, file_data: `data:application/pdf;base64,${base64}` } },
              { type: "text", text: "Extract all text from this resume PDF. Return plain text only — no markdown, no commentary, preserve the original structure as closely as possible." },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Extract API error:", await res.text());
      return NextResponse.json({ error: "Failed to extract PDF text." }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content ?? "").slice(0, 16000);

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from PDF." }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Extract fetch error:", e);
    return NextResponse.json({ error: "Failed to extract PDF text." }, { status: 502 });
  }
}
