import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../../lib/authServer";
import { extractTextFromFile } from "../../../../lib/pdfExtractor";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser(req);
  if (!auth) return unauthorized();

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

  try {
    const buffer = await file.arrayBuffer();
    const text = (await extractTextFromFile(buffer, file.name)).slice(0, 16000);

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file." }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("Extract error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to extract text from file." },
      { status: 502 }
    );
  }
}
