import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized } from "../../../../lib/authServer";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractPdfText(buffer: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "";
  
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText;
}

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

  const lower = file.name.toLowerCase();

  if (lower.endsWith(".txt")) {
    const text = await file.text();
    return NextResponse.json({ text: text.slice(0, 16000) });
  }

  if (lower.endsWith(".pdf")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = await extractPdfText(uint8Array);
      
      if (!text || text.trim().length < 50) {
        return NextResponse.json(
          { error: "Could not extract text from PDF. Try converting to text or copy/paste." },
          { status: 422 }
        );
      }
      
      return NextResponse.json({ text: text.slice(0, 16000) });
    } catch (err) {
      console.error("PDF parse error:", err);
      return NextResponse.json(
        { error: "Failed to parse PDF. Try a simpler PDF or copy/paste your resume." },
        { status: 422 }
      );
    }
  }

  if (lower.endsWith(".docx")) {
    return NextResponse.json(
      { error: "DOCX not supported yet. Please convert to PDF or paste text directly." },
      { status: 422 }
    );
  }

  return NextResponse.json({ error: "Use PDF or TXT files." }, { status: 400 });
}