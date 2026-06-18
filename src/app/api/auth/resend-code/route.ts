import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/validation";
import { sendVerificationEmail, generateCode } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: parsed.data } });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Already verified" }, { status: 409 });
    }

    const code = generateCode();
    await db.emailVerificationCode.deleteMany({ where: { email: parsed.data } });
    await db.emailVerificationCode.create({
      data: { email: parsed.data, code, expires: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendVerificationEmail(parsed.data, code);
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("[RESEND_CODE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
