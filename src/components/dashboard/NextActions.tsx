import Link from "next/link";
import { ChevronRight, Zap, FileText, Bell } from "lucide-react";

interface Props {
  matchedJobs: number;
}

export function NextActions({ matchedJobs }: Props) {
  const actions = [
    {
      icon: Zap,
      title: `Apply to 5 high-match jobs`,
      subtitle: `You have ${matchedJobs} high match jobs`,
      href: "/jobs",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: FileText,
      title: "Customize your resume",
      subtitle: "Improve match for more roles",
      href: "/resume",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Bell,
      title: "Set job alerts",
      subtitle: "Stay ahead of new opportunities",
      href: "/alerts",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="glass rounded-xl p-5">
      <p className="text-sm font-semibold text-foreground/80 mb-4">NEXT ACTIONS</p>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition group"
          >
            <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center flex-shrink-0`}>
              <action.icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight">{action.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
