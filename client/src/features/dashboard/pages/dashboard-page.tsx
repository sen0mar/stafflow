import { LayoutDashboard } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const DashboardPage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Dashboard"
    description="Overview placeholder for attendance, leave activity, recent employees, and operational metrics."
    icon={LayoutDashboard}
  />
)
