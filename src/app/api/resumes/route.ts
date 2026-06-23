import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/** Lists the user's saved resumes (originals, replaced originals, tailored). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await db.savedResume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, kind: true, atsScore: true, createdAt: true, storageKey: true },
  });

  return NextResponse.json({
    resumes: resumes.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      atsScore: r.atsScore,
      createdAt: r.createdAt,
      hasFile: Boolean(r.storageKey),
    })),
  });
}
