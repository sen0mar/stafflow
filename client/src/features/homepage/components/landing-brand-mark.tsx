import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LandingBrandMarkProps {
  compact?: boolean
}

export const LandingBrandMark = ({ compact = false }: LandingBrandMarkProps) => (
  <Link to="/" className="flex items-center gap-3 text-primary" aria-label="Stafflow home">
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-primary-foreground shadow-glow">
      <Users className="h-5 w-5" aria-hidden="true" />
    </span>
    <span className="leading-tight">
      <span className="block text-lg font-semibold tracking-normal">Stafflow</span>
      {!compact && <span className="block text-xs font-medium text-muted">Employee Management System</span>}
    </span>
  </Link>
)
