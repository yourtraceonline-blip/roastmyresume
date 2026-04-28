declare module "pdf-parse/lib/pdf-parse.js" {
  function pdfParse(data: Buffer, options?: any): Promise<{ text: string; numpages: number; info: any }>;
  export = pdfParse;
}
