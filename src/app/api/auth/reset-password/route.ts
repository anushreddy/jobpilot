import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const record = await db.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used) {
      return NextResponse.json({ error: "This reset link is invalid or already used." }, { status: 400 });
    }
    if (record.expires < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 410 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { hashedPassword } }),
      db.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
