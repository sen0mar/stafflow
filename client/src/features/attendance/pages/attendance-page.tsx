import { CalendarCheck } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const AttendancePage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Attendance"
    description="Attendance placeholder for clock-in state, history, filters, and admin corrections."
    icon={CalendarCheck}
  />
)
