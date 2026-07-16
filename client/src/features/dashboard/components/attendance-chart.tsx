import type { AdminAttendanceOverviewPoint } from '../api/dashboard.api'
import { formatDateOnly } from '@/shared/lib/dates'

interface ChartPoint {
  x: number
  y: number
  value?: string
}

const gridLines = [24, 48, 72, 96, 120]

const toChartPath = (points: ChartPoint[]) =>
  points.map(({ x, y }) => `${x} ${y}`).join(' L')

const getY = (value: number, maxValue: number) => 112 - (value / maxValue) * 82

const toPoints = (
  values: number[],
  maxValue: number,
  includeLabels = false,
): ChartPoint[] =>
  values.map((value, index) => ({
    value: includeLabels ? String(value) : undefined,
    x: values.length === 1 ? 146 : 8 + (276 / (values.length - 1)) * index,
    y: getY(value, maxValue),
  }))

interface AttendanceChartProps {
  data: AdminAttendanceOverviewPoint[]
}

export const AttendanceChart = ({ data }: AttendanceChartProps) => {
  const chartData = data.length > 0 ? data : []
  const presentValues = chartData.map(
    (point) => point.present + point.late + point.partial,
  )
  const absentValues = chartData.map((point) => point.absent)
  const maxValue = Math.max(1, ...presentValues, ...absentValues)
  const presentPoints = toPoints(presentValues, maxValue, true)
  const absentPoints = toPoints(absentValues, maxValue)
  const presentPath =
    presentPoints.length > 0 ? `M${toChartPath(presentPoints)}` : ''
  const absentPath =
    absentPoints.length > 0 ? `M${toChartPath(absentPoints)}` : ''

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-inset p-3">
      <div className="relative h-56 sm:h-64">
        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 300 130"
          role="img"
          aria-label="Attendance trend line chart"
        >
          <defs>
            <linearGradient
              id="dashboard-attendance-fill"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--accent-primary)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-primary)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          {gridLines.map((y) => (
            <line
              key={y}
              x1="0"
              x2="300"
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
          ))}
          {presentPath ? (
            <path
              d={`${presentPath} L284 120 L8 120 Z`}
              fill="url(#dashboard-attendance-fill)"
            />
          ) : null}
          {absentPath ? (
            <path
              d={absentPath}
              fill="none"
              stroke="var(--chart-secondary)"
              strokeWidth="2"
            />
          ) : null}
          {presentPath ? (
            <path
              d={presentPath}
              fill="none"
              stroke="var(--accent-primary)"
              strokeLinecap="round"
              strokeWidth="3"
            />
          ) : null}
          {presentPoints.map(({ x, y, value }) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="4" fill="var(--accent-primary)" />
              <text
                x={x}
                y={y - 9}
                textAnchor="middle"
                className="fill-brand-text text-[9px] font-semibold"
              >
                {value}
              </text>
            </g>
          ))}
          {absentPoints.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="3"
              fill="var(--chart-secondary)"
            />
          ))}
        </svg>
        <div
          className="absolute inset-x-0 bottom-0 grid text-center text-[10px] font-medium text-muted"
          style={{
            gridTemplateColumns: `repeat(${Math.max(chartData.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {chartData.map((point) => (
            <span key={point.date}>{formatDateOnly(point.date, 'MMM d')}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
