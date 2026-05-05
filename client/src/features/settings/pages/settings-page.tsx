import { Settings } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const SettingsPage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Settings"
    description="Settings placeholder for company, attendance, leave, and demo-mode configuration."
    icon={Settings}
  />
)
