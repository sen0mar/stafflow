import type { ReactNode } from 'react'

interface PageHeaderProps {
  actions?: ReactNode
  title: string
  description?: string
}

export const PageHeader = ({
  actions,
  title,
  description,
}: PageHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-3xl font-semibold tracking-normal text-primary sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
      </div>
    ) : null}
  </div>
)
