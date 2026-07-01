import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Deletes a saved resume: removes the object from storage (S3/local) FIRST,
 * then removes the DB record. If it was the user's current resume, clears that
 * too so the page stays consistent.
 */
export async function DELETE(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const saved = await db.savedResume.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 1. Delete from storage first.
  if (saved.storageKey) {
    await getStorage().delete(saved.storageKey);
  }

  // 2. If this file is the user's current resume, clear that record too.
  if (saved.storageKey) {
    const current = await db.resume.findUnique({ where: { userId: session.user.id } });
    if (current?.filePath === saved.storageKey) {
      await db.resume.delete({ where: { userId: session.user.id } }).catch(() => {});
    }
  }

  // 3. Delete the saved-resume record.
  await db.savedResume.delete({ where: { id: saved.id } });

  return NextResponse.json({ ok: true });
}
