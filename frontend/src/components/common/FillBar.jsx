import { getFillColor } from "../../config/appConfig";

export function FillBar({ percentage, height = "h-2", showLabel = false }) {
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const color = getFillColor(pct);

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-dark-700 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono font-semibold text-dark-300 w-10 text-right">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

export function FillGauge({ percentage, size = 80 }) {
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const color = getFillColor(pct);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71,85,105,0.4)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-dark-100 leading-none">{pct.toFixed(0)}</span>
        <span className="text-[9px] text-dark-500">%</span>
      </div>
    </div>
  );
}
