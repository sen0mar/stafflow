import type { LucideIcon } from 'lucide-react'
import { LandingIconWell } from './landing-icon-well'

interface FeatureCardProps {
  description: string
  icon: LucideIcon
  title: string
}

export const FeatureCard = ({ description, icon, title }: FeatureCardProps) => (
  <article className="rounded-3xl border border-default bg-overlay p-5 shadow-soft backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-strong hover:shadow-card">
    <LandingIconWell icon={icon} />
    <h2 className="mt-6 text-base font-semibold text-primary">{title}</h2>
    <p className="mt-3 text-sm leading-6 text-secondary">{description}</p>
  </article>
)
