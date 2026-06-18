import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { registerSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const role = searchParams.get("role") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (plan) where.plan = plan;
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { applications: true } },
        resume: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;
  const role = body.role === "ADMIN" ? "ADMIN" : "USER";
  const plan = ["FREE", "PRO", "ENTERPRISE"].includes(body.plan) ? body.plan : "FREE";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    // Admin-created accounts are pre-verified.
    data: { name, email, hashedPassword, role, plan, emailVerified: new Date() },
  });
  await db.userPreferences.create({ data: { userId: user.id } });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
