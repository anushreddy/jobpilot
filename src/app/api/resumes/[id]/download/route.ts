import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { buildResumePdf } from "@/lib/resume-pdf";
import type { TailoredResumeDoc } from "@/types/resume";

function toArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/plain",
  json: "application/json",
};

type RouteContext = { params: Promise<{ id: string }> };

/** Downloads a saved resume — tailored → formatted PDF, original → native file. */
export async function GET(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const saved = await db.savedResume.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!saved?.storageKey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const storage = getStorage();
  const safe = saved.name.replace(/[^\w]+/g, "-").toLowerCase();

  let bytes: Buffer;
  try {
    bytes = await storage.get(saved.storageKey);
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  // Tailored resumes are stored as structured JSON → render a formatted PDF.
  if (saved.kind === "tailored") {
    try {
      const doc = JSON.parse(bytes.toString("utf-8")) as TailoredResumeDoc;
      const pdf = await buildResumePdf(doc);
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safe}.pdf"`,
        },
      });
    } catch {
      /* fall through to raw stream */
    }
  }

  // Original (or fallback): stream the stored file with its native type.
  const ext = saved.name.split(".").pop()?.toLowerCase() ?? "";
  const type = MIME[ext] ?? "application/octet-stream";
  return new NextResponse(toArrayBuffer(bytes), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${saved.name}"`,
    },
  });
}
