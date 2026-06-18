import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCodeSchema } from "@/lib/validation";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const parsed = verifyCodeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { email, code } = parsed.data;

    const record = await db.emailVerificationCode.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "No code found. Please request a new one." }, { status: 404 });
    }
    if (record.expires < new Date()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 410 });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
    }

    if (record.code !== code) {
      await db.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    // Success — mark the user verified and clean up codes.
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    await db.emailVerificationCode.deleteMany({ where: { email } });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[VERIFY_CODE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
