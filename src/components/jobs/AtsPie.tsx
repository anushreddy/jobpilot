interface Props {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#4ade80"; // green
  if (score >= 60) return "#a855f7"; // purple
  if (score >= 40) return "#facc15"; // yellow
  return "#f87171"; // red
}

/** Compact ATS score donut for table rows. */
export function AtsPie({ score, size = 44 }: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const stroke = size * 0.12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color }}>
        {clamped}
      </span>
    </div>
  );
}
