import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const parsed = emailSchema.safeParse(email);
    // Always respond success to avoid leaking which emails are registered.
    if (!parsed.success) return NextResponse.json({ ok: true });

    const user = await db.user.findUnique({ where: { email: parsed.data } });

    // Only send for accounts that actually use a password (not OAuth-only).
    if (user?.hashedPassword) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

      // Invalidate any previous reset tokens for this user.
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await db.passwordResetToken.create({
        data: { userId: user.id, token, expires },
      });

      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const link = `${base}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, link);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ ok: true });
  }
}
