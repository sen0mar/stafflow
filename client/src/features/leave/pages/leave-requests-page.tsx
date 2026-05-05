import { ClipboardList } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const LeaveRequestsPage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Leave Requests"
    description="Leave request placeholder for employee submissions, status tracking, and admin review."
    icon={ClipboardList}
  />
)
