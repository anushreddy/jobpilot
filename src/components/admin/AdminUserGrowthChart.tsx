"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { date: string; count: number }[];
}

export function AdminUserGrowthChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              color: "#fff",
            }}
            labelStyle={{ color: "#cbd5e1" }}
          />
          <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#userGrad)" name="New users" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
