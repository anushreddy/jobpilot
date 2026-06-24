import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { jobSearchConfigSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const country = searchParams.get("country") ?? "";
  const status = searchParams.get("status") ?? ""; // "active" | "inactive"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { roleTitle: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }
  if (country) where.country = country.toUpperCase();
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [configs, total] = await Promise.all([
    db.jobSearchConfig.findMany({
      where,
      // Same ordering the dispatcher lambda uses: high priority first,
      // then least-recently fetched (never-fetched configs surface first).
      orderBy: [{ priority: "asc" }, { lastFetchedAt: { sort: "asc", nulls: "first" } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.jobSearchConfig.count({ where }),
  ]);

  return NextResponse.json({ configs, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = jobSearchConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const config = await db.jobSearchConfig.create({ data: parsed.data });
  return NextResponse.json(config, { status: 201 });
}
