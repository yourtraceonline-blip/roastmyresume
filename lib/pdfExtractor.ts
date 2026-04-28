import { unzipSync } from "node:zlib";
// Import the internal parser directly to skip the top-level test script in index.js
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Extract plain text from a PDF file (ArrayBuffer) using pdf-parse.
 */
export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const data = await pdfParse(Buffer.from(buffer));
  return data.text;
}

/**
 * Extract plain text from a DOCX file (ArrayBuffer) by unzipping and
 * reading word/document.xml, then stripping XML tags.
 */
export function extractTextFromDocx(buffer: ArrayBuffer): string {
  const zip = unzipSync(Buffer.from(buffer)) as unknown as Record<string, Buffer>;
  const documentXml = zip["word/document.xml"];
  if (!documentXml) {
    throw new Error("Invalid DOCX: word/document.xml not found");
  }
  const xml = documentXml.toString("utf-8");
  // Strip XML tags, keep text nodes
  const text = xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

/**
 * Detect file type by extension and extract text.
 */
export async function extractTextFromFile(
  buffer: ArrayBuffer,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return extractTextFromPdf(buffer);
  }
  if (lower.endsWith(".docx")) {
    return extractTextFromDocx(buffer);
  }
  if (lower.endsWith(".txt")) {
    return new TextDecoder().decode(buffer);
  }
  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.");
}
