import type { AttendanceStatus } from '../api/attendance.api'

export const attendanceStatusLabel = (status: AttendanceStatus) =>
  status
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

export const formatMinutes = (minutes: number | null) => {
  if (minutes === null) {
    return 'Not recorded'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}

export const toCorrectionPayloadDate = (value?: string) =>
  value ? new Date(value).toISOString() : null
