import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const PLATFORMS = ["LINKEDIN", "INDEED", "GLASSDOOR"] as const;
type LinkedPlatform = (typeof PLATFORMS)[number];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await db.linkedAccount.findMany({
    where: { userId: session.user.id },
    select: { platform: true, username: true, isActive: true },
  });
  return NextResponse.json({ accounts });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform, username } = await req.json();
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const account = await db.linkedAccount.upsert({
    where: { userId_platform: { userId: session.user.id, platform: platform as LinkedPlatform } },
    update: { username, isActive: true },
    create: { userId: session.user.id, platform: platform as LinkedPlatform, username, isActive: true },
  });

  return NextResponse.json({ platform: account.platform, username: account.username });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await req.json();
  await db.linkedAccount.deleteMany({
    where: { userId: session.user.id, platform },
  });
  return NextResponse.json({ ok: true });
}
