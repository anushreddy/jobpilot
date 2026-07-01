import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Map a hostname to one of our Platform enum values.
function detectPlatform(host: string): string {
  const h = host.toLowerCase();
  if (h.includes("linkedin")) return "LINKEDIN";
  if (h.includes("indeed")) return "INDEED";
  if (h.includes("glassdoor")) return "GLASSDOOR";
  if (h.includes("wellfound") || h.includes("angel.co")) return "WELLFOUND";
  if (h.includes("lever.co")) return "LEVER";
  if (h.includes("greenhouse")) return "GREENHOUSE";
  if (h.includes("workday") || h.includes("myworkdayjobs")) return "WORKDAY";
  return "OTHER";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|li|br|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function metaContent(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const m = html.match(re) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i")
  );
  return m ? m[1] : null;
}

// Pull a schema.org JobPosting out of any JSON-LD blocks on the page.
function parseJsonLd(html: string): Record<string, unknown> | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const json = JSON.parse(b[1].trim());
      const arr = Array.isArray(json) ? json : json["@graph"] ?? [json];
      const items = Array.isArray(arr) ? arr : [arr];
      const posting = items.find((x: Record<string, unknown>) => {
        const t = x?.["@type"];
        return t === "JobPosting" || (Array.isArray(t) && t.includes("JobPosting"));
      });
      if (posting) return posting as Record<string, unknown>;
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Please enter a valid job posting URL" }, { status: 400 });
  }

  let html = "";
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
    });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not fetch that URL" }, { status: 502 });
  }

  const ld = parseJsonLd(html);

  // Title
  const title =
    (ld?.title as string) ||
    metaContent(html, "og:title") ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ||
    "Untitled Role";

  // Company
  const org = ld?.hiringOrganization as Record<string, unknown> | undefined;
  const company =
    (org?.name as string) ||
    metaContent(html, "og:site_name") ||
    parsed.hostname.replace(/^www\./, "").split(".")[0] ||
    "Unknown";

  // Description
  const rawDesc =
    (ld?.description as string) ||
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    "";
  const description = stripHtml(rawDesc) || "No description was found on the page. You can edit this job's details.";

  // Location
  const loc = ld?.jobLocation as Record<string, unknown> | undefined;
  const addr = (loc?.address ?? (Array.isArray(loc) ? (loc[0] as Record<string, unknown>)?.address : undefined)) as
    | Record<string, unknown>
    | undefined;
  const location =
    [addr?.addressLocality, addr?.addressRegion].filter(Boolean).join(", ") ||
    (typeof loc?.address === "string" ? (loc.address as string) : "") ||
    "Not specified";

  const postedAt = ld?.datePosted ? new Date(ld.datePosted as string) : new Date();

  const job = await db.job.create({
    data: {
      title: String(title).slice(0, 255),
      company: String(company).slice(0, 255),
      location: String(location).slice(0, 255),
      locationType: /remote/i.test(description) ? "remote" : "onsite",
      description: description.slice(0, 12000),
      requirements: [],
      skills: [],
      platform: detectPlatform(parsed.hostname) as never,
      platformUrl: parsed.toString(),
      postedAt: isNaN(postedAt.getTime()) ? new Date() : postedAt,
      externalId: `manual-${session.user.id}-${Date.now()}`,
    },
  });

  return NextResponse.json({ id: job.id }, { status: 201 });
}
