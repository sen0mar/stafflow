import { format } from 'date-fns'

export const formatDate = (date: Date | string | number, pattern = 'PP') =>
  format(new Date(date), pattern)
