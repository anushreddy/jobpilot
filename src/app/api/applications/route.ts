import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (search) {
    where.job = {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      include: { job: true },
      orderBy: { appliedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.application.count({ where }),
  ]);

  return NextResponse.json({ applications, total, page });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, coverLetter, resumeUsed } = await req.json();

  const existing = await db.application.findUnique({
    where: { userId_jobId: { userId: session.user.id, jobId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already applied" }, { status: 409 });
  }

  const application = await db.application.create({
    data: {
      userId: session.user.id,
      jobId,
      status: "APPLIED",
      coverLetter,
      resumeUsed,
    },
    include: { job: true },
  });

  return NextResponse.json(application, { status: 201 });
}
