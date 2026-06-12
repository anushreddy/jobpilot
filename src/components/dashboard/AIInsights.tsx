import { Sparkles, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";

const fallbackInsights = [
  "Your resume is strongly matched for Frontend Engineer roles",
  "Consider adding more projects with measurable impact",
  "You're most likely to hear back on Tuesdays and Thursdays",
];

async function getInsights(userId: string): Promise<string[]> {
  try {
    const prefs = await db.userPreferences.findUnique({ where: { userId } });
    if (!prefs?.skills?.length) return fallbackInsights;

    // Use fallback for now to avoid API calls on every page load
    return fallbackInsights;
  } catch {
    return fallbackInsights;
  }
}

export async function AIInsights({ userId }: { userId: string }) {
  const insights = await getInsights(userId);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground/80">AI INSIGHTS</p>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
