import { PDFParse } from "pdf-parse";

/**
 * Extracts plain text from an uploaded PDF. Runs on the Node runtime only
 * (API routes that call this must not opt into the edge runtime).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  } finally {
    await parser.destroy();
  }
}
