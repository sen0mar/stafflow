import { FileText } from 'lucide-react'
import { RoutePlaceholder } from '@/shared/components/layout/route-placeholder'

export const PayslipsPage = () => (
  <RoutePlaceholder
    eyebrow="Protected app route"
    title="Payslips"
    description="Payslip placeholder for private PDF metadata, uploads, and employee downloads."
    icon={FileText}
  />
)
