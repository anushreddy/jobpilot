import { BarChart3, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your job search performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Application Rate", value: "4.6/day", change: "+12%", positive: true },
          { label: "Response Rate", value: "40%", change: "+8%", positive: true },
          { label: "Interview Conversion", value: "18%", change: "-2%", positive: false },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={`text-xs font-medium mt-1 ${stat.positive ? "text-green-400" : "text-red-400"}`}>
              {stat.change} this week
            </p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-8 text-center">
        <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Detailed Analytics Coming Soon</p>
        <p className="text-xs text-muted-foreground">
          Apply to more jobs to unlock full analytics dashboard with charts and insights.
        </p>
      </div>
    </div>
  );
}
