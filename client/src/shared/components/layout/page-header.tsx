import type { ReactNode } from 'react'

interface PageHeaderProps {
  actions?: ReactNode
  eyebrow?: string
  title: string
  description?: string
}

export const PageHeader = ({ actions, eyebrow, title, description }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow ? <p className="text-sm font-medium text-brand-text">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-semibold tracking-normal text-primary sm:text-4xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
)
