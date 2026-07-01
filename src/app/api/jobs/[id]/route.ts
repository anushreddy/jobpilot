import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/** Edit a job's parsed details (title, company, description, skills, etc.). */
export async function PATCH(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.slice(0, 255);
  if (typeof body.company === "string") data.company = body.company.slice(0, 255);
  if (typeof body.location === "string") data.location = body.location.slice(0, 255);
  if (typeof body.locationType === "string") data.locationType = body.locationType;
  if (typeof body.salary === "string") data.salary = body.salary;
  if (typeof body.description === "string") data.description = body.description.slice(0, 12000);
  if (Array.isArray(body.skills)) {
    data.skills = body.skills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 40);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const job = await db.job.update({ where: { id }, data });
  return NextResponse.json({ id: job.id });
}
