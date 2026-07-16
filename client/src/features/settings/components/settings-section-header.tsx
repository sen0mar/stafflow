import type { LucideIcon } from 'lucide-react'
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

interface SettingsSectionHeaderProps {
  description: string
  icon: LucideIcon
  title: string
}

export const SettingsSectionHeader = ({
  description,
  icon: Icon,
  title,
}: SettingsSectionHeaderProps) => (
  <CardHeader>
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-brand-soft p-2 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </div>
    </div>
  </CardHeader>
)
