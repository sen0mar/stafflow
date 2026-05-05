import { ScrollText } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const AuditLogsPage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Audit Logs"
    description="Audit log placeholder for sensitive admin and employee action history."
    icon={ScrollText}
  />
)
