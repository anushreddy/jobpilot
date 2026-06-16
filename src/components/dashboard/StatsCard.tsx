import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  change?: number;
  suffix?: string;
  sparkline?: boolean;
}

export function StatsCard({ label, value, change, suffix }: Props) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {value}
            {suffix && <span className="text-base font-medium text-muted-foreground ml-0.5">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", positive ? "text-green-400" : "text-red-400")}>
              {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {positive ? "+" : ""}{change}%
            </div>
          )}
        </div>
        <div className="h-8 w-16 opacity-60">
          <svg viewBox="0 0 64 32" className="w-full h-full">
            <polyline
              points={positive
                ? "0,28 10,22 20,26 30,18 40,20 50,12 64,6"
                : "0,8 10,12 20,10 30,18 40,16 50,22 64,26"}
              fill="none"
              stroke={positive ? "#4ade80" : "#f87171"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">vs last 7 days</p>
    </div>
  );
}
