import { UsersRound } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const EmployeesPage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Employees"
    description="Employee management placeholder for profiles, statuses, departments, and admin-created accounts."
    icon={UsersRound}
  />
)
