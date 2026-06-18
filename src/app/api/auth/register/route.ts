import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { sendVerificationEmail, generateCode } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input — email must be a well-formed address.
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // If a previous signup never verified, allow resending instead of erroring.
      if (existing.emailVerified) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create (or update) an unverified user. emailVerified stays null until OTP confirmed.
    const user = await db.user.upsert({
      where: { email },
      update: { name, hashedPassword },
      create: { name, email, hashedPassword },
    });

    await db.userPreferences.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // Issue a fresh 6-digit code (invalidate any prior ones for this email).
    const code = generateCode();
    await db.emailVerificationCode.deleteMany({ where: { email } });
    await db.emailVerificationCode.create({
      data: { email, code, expires: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ email, requiresVerification: true }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
