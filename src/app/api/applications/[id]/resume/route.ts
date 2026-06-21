import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type RouteContext = { params: Promise<{ id: string }> };

/** Downloads the exact resume that was used for an application (as a .doc). */
export async function GET(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const app = await db.application.findFirst({
    where: { id, userId: session.user.id },
    include: { job: { select: { title: true, company: true } } },
  });

  if (!app || !app.resumeUsed) {
    return NextResponse.json({ error: "No resume on this application" }, { status: 404 });
  }

  const html = `<!DOCTYPE html><html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>
    <body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;white-space:pre-wrap;line-height:1.5;">${esc(
      app.resumeUsed
    )}</body></html>`;

  const safe = `${app.job.company}-${app.job.title}`.replace(/[^\w]+/g, "-").toLowerCase();
  const label = (app.resumeLabel ?? "resume").toLowerCase();

  return new NextResponse("﻿" + html, {
    headers: {
      "Content-Type": "application/msword",
      "Content-Disposition": `attachment; filename="${safe}-${label}.doc"`,
    },
  });
}
