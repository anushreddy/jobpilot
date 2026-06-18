import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  // Don't let an admin delete their own account here.
  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  // Cascade deletes remove related preferences, resume, applications, etc.
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (["FREE", "PRO", "ENTERPRISE"].includes(body.plan)) data.plan = body.plan;
  if (["USER", "ADMIN"].includes(body.role)) data.role = body.role;

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ id: user.id });
}
