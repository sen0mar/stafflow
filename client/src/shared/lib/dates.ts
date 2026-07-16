import { format } from 'date-fns'

export const formatDate = (date: Date | string | number, pattern = 'PP') =>
  format(new Date(date), pattern)

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

export const getDateOnlyParts = (value: string) => {
  const match = dateOnlyPattern.exec(value)

  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utcDate = new Date(Date.UTC(year, month - 1, day))

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date-only value: ${value}`)
  }

  return { day, month, year }
}

export const parseDateOnly = (value: string) => {
  const { day, month, year } = getDateOnlyParts(value)

  return new Date(Date.UTC(year, month - 1, day))
}

export const formatDateOnly = (value: string, pattern = 'PP') => {
  const { day, month, year } = getDateOnlyParts(value)

  // Construct from numeric local components so the browser timezone cannot
  // shift the API's calendar date to the previous or next day.
  return format(new Date(year, month - 1, day), pattern)
}

export const differenceFromTodayInCalendarDays = (
  value: string,
  today = new Date(),
) => {
  const { day, month, year } = getDateOnlyParts(value)
  const targetDay = Date.UTC(year, month - 1, day)
  const currentDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )

  return Math.round((targetDay - currentDay) / 86_400_000)
}
