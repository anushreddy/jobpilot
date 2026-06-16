// Extracts plain text from an uploaded resume buffer (PDF, DOCX, or plain text).
// Used so ATS scoring has real content to work with regardless of file type.

export async function extractResumeText(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  try {
    if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
      // Dynamic import keeps pdf-parse out of the edge/client bundle.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return result.text.trim();
    }

    if (
      lower.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }
  } catch (err) {
    console.error("[RESUME_PARSER] extraction failed:", err);
    return "";
  }

  // Plain text / markdown / unknown — treat as UTF-8 text.
  return buffer.toString("utf-8").trim();
}
