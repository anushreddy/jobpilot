"use client";

interface Props {
  score: number;
}

export function ApplyVelocityGauge({ score }: Props) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const angle = -135 + (clampedScore / 100) * 270;
  const label =
    clampedScore >= 80 ? "High Velocity" :
    clampedScore >= 50 ? "Good Pace" :
    clampedScore >= 25 ? "Steady" : "Getting Started";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 130" className="w-52 h-auto text-foreground">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d="M 20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(clampedScore / 100) * 251.3} 251.3`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const a = (-135 + (tick / 100) * 270) * (Math.PI / 180);
          const x1 = 100 + 68 * Math.cos(a);
          const y1 = 110 + 68 * Math.sin(a);
          const x2 = 100 + 76 * Math.cos(a);
          const y2 = 110 + 76 * Math.sin(a);
          return (
            <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.25} strokeWidth="2" />
          );
        })}
        {/* Needle */}
        <g transform={`rotate(${angle}, 100, 110)`}>
          <line x1="100" y1="110" x2="100" y2="45" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="110" r="5" fill="#a855f7" />
          <circle cx="100" cy="110" r="3" className="fill-card" />
        </g>
        {/* Score */}
        <text x="100" y="95" textAnchor="middle" fill="currentColor" fontSize="28" fontWeight="700">
          {clampedScore}
        </text>
        <text x="100" y="115" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="600">
          {label}
        </text>
        {/* Labels */}
        <text x="16" y="126" fill="currentColor" fillOpacity={0.45} fontSize="9">0</text>
        <text x="182" y="126" fill="currentColor" fillOpacity={0.45} fontSize="9" textAnchor="end">100</text>
      </svg>
    </div>
  );
}
