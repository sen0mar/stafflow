import {
  differenceFromTodayInCalendarDays,
  formatDateOnly,
} from '@/shared/lib/dates'

export const formatDashboardStatus = (status: string) =>
  status
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

export const formatDashboardDateRange = (
  startDate: string,
  endDate: string,
) => {
  const start = formatDateOnly(startDate, 'MMM d')
  const end = formatDateOnly(endDate, 'MMM d')

  return start === end ? start : `${start} - ${end}`
}

export const formatDashboardMinutes = (minutes: number | null) => {
  if (minutes === null) {
    return 'Not recorded'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}

export const getLeavePriority = (startDate: string) => {
  const daysUntil = differenceFromTodayInCalendarDays(startDate)

  if (daysUntil <= 1) return { label: 'Urgent', variant: 'error' as const }
  if (daysUntil <= 3) return { label: 'Soon', variant: 'warning' as const }
  if (daysUntil <= 7) return { label: 'Upcoming', variant: 'info' as const }

  return null
}
