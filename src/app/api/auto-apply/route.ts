import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await db.autoApplyConfig.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(config ?? { enabled: false, dailyLimit: 10, minMatchScore: 70, platforms: [] });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.plan === "FREE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const data = await req.json();

  const config = await db.autoApplyConfig.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(config);
}
