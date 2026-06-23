import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { buildResumePdf } from "@/lib/resume-pdf";
import type { TailoredResumeDoc } from "@/types/resume";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/plain",
};

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Downloads the exact resume used for an application.
 * - Tailored → formatted PDF rebuilt from the structured doc (cloud or stored).
 * - Regular  → the ORIGINAL uploaded file (PDF/DOCX/etc.), format preserved.
 */
export async function GET(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const app = await db.application.findFirst({
    where: { id, userId: session.user.id },
    include: { job: { select: { title: true, company: true } } },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const safe = `${app.job.company}-${app.job.title}`.replace(/[^\w]+/g, "-").toLowerCase();
  const storage = getStorage();

  // ── Regular resume: stream the original uploaded file unchanged ──────────
  if (app.resumeLabel !== "Tailored") {
    if (app.resumeStorageKey) {
      try {
        const bytes = await storage.get(app.resumeStorageKey);
        const name = app.resumeFileName || "resume";
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        const type = MIME[ext] ?? "application/octet-stream";
        return new NextResponse(new Uint8Array(bytes), {
          headers: {
            "Content-Type": type,
            "Content-Disposition": `attachment; filename="${safe}-${name}"`,
          },
        });
      } catch {
        /* fall through to text fallback */
      }
    }
    // Fallback: extracted text → .doc
    if (app.resumeUsed) {
      const html = `<!DOCTYPE html><html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>
        <body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;white-space:pre-wrap;line-height:1.5;">${esc(
          app.resumeUsed
        )}</body></html>`;
      return new NextResponse("﻿" + html, {
        headers: {
          "Content-Type": "application/msword",
          "Content-Disposition": `attachment; filename="${safe}-regular.doc"`,
        },
      });
    }
    return NextResponse.json({ error: "No resume on this application" }, { status: 404 });
  }

  // ── Tailored resume: render a formatted PDF from the structured doc ───────
  let doc: TailoredResumeDoc | null = null;
  if (app.resumeStorageKey) {
    try {
      const bytes = await storage.get(app.resumeStorageKey);
      doc = JSON.parse(bytes.toString("utf-8")) as TailoredResumeDoc;
    } catch {
      doc = null;
    }
  }
  if (!doc && app.resumeDoc) doc = app.resumeDoc as unknown as TailoredResumeDoc;

  if (doc) {
    const pdf = await buildResumePdf(doc);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safe}-tailored.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "No resume on this application" }, { status: 404 });
}
