import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type RouteContext = { params: Promise<{ key: string[] }> };

/**
 * Streams a stored file (local driver only — S3 uses presigned URLs directly).
 * Authorization: the storage key embeds the owner's userId
 * ({env}/resumes/{userId}/...), so we only serve keys belonging to the caller.
 */
export async function GET(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key: segments } = await context.params;
  const key = segments.join("/");

  // Reject path traversal and cross-user access.
  if (key.includes("..") || !key.includes(`/${session.user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await getStorage().get(key);
    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
