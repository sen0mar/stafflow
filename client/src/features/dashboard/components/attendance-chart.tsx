interface ChartPoint {
  x: number
  y: number
  value?: string
}

const chartLabels = ['May 12', '13', '14', '15', '16', '17', '18']
const gridLines = [24, 48, 72, 96, 120]
const presentPoints: ChartPoint[] = [
  { x: 8, y: 72, value: '80' },
  { x: 54, y: 58, value: '90' },
  { x: 100, y: 62, value: '88' },
  { x: 146, y: 48, value: '95' },
  { x: 192, y: 54, value: '92' },
  { x: 238, y: 42, value: '98' },
  { x: 284, y: 46, value: '96' },
]
const absentPoints: ChartPoint[] = [
  { x: 8, y: 104 },
  { x: 54, y: 96 },
  { x: 100, y: 100 },
  { x: 146, y: 92 },
  { x: 192, y: 98 },
  { x: 238, y: 88 },
  { x: 284, y: 94 },
]

const toChartPath = (points: ChartPoint[]) => points.map(({ x, y }) => `${x} ${y}`).join(' L')

const presentPath = `M${toChartPath(presentPoints)}`
const absentPath = `M${toChartPath(absentPoints)}`

export const AttendanceChart = () => (
  <div className="mt-4 overflow-hidden rounded-xl bg-inset p-3">
    <div className="relative h-56 sm:h-64">
      <svg className="h-full w-full overflow-visible" viewBox="0 0 300 130" role="img" aria-label="Attendance trend line chart">
        <defs>
          <linearGradient id="dashboard-attendance-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((y) => (
          <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        <path d={`${presentPath} L284 120 L8 120 Z`} fill="url(#dashboard-attendance-fill)" />
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
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 text-center text-[10px] font-medium text-muted">
        {chartLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  </div>
)
