import {
  absentPoints,
  chartLabels,
  gridLines,
  presentPoints,
  toChartPath,
} from './landing-data'

const presentPath = `M${toChartPath(presentPoints)}`
const absentPath = `M${toChartPath(absentPoints)}`

export const AttendancePreviewChart = () => (
  <div className="mt-4 overflow-hidden rounded-xl bg-inset p-3">
    <div className="relative h-40">
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 300 130"
        role="img"
        aria-label="Attendance trend line chart"
      >
        <defs>
          <linearGradient id="attendance-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((y) => (
          <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        <path d={`${presentPath} L284 120 L8 120 Z`} fill="url(#attendance-fill)" />
        <path d={absentPath} fill="none" stroke="var(--chart-secondary)" strokeWidth="2" />
        <path d={presentPath} fill="none" stroke="var(--accent-primary)" strokeLinecap="round" strokeWidth="3" />
        {presentPoints.map(({ x, y, value }) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="4" fill="var(--accent-primary)" />
            <text x={x} y={y - 9} textAnchor="middle" className="fill-brand-text text-[9px] font-semibold">
              {value}
            </text>
          </g>
        ))}
        {absentPoints.map(({ x, y }) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--chart-secondary)" />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 text-center text-[9px] font-medium text-muted sm:text-[10px]">
        {chartLabels.map(({ label, detail }) => (
          <span key={detail} title={detail}>
            {label}
          </span>
        ))}
      </div>
    </div>
  </div>
)
