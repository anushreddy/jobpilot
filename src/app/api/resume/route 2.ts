import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unlink } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await db.resume.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(resume ?? null);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, content } = await req.json();

  const resume = await db.resume.upsert({
    where: { userId: session.user.id },
    update: { fileName, content },
    create: { userId: session.user.id, fileName, content },
  });

  return NextResponse.json(resume);
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await db.resume.findUnique({ where: { userId: session.user.id } });
  if (!resume) return NextResponse.json({ ok: true });

  // Remove the local file if one was stored.
  if (resume.filePath) {
    await unlink(path.join(process.cwd(), resume.filePath)).catch(() => {});
  }

  await db.resume.delete({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
