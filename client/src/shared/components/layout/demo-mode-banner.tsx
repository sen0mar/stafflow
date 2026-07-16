import { Eye } from 'lucide-react'

export const DemoModeBanner = () => (
  <div
    className="border-b border-brand/25 bg-brand-soft px-5 py-2.5 text-sm text-primary sm:px-6 lg:px-8"
    role="status"
  >
    <div className="mx-auto flex max-w-7xl items-center gap-2 2xl:max-w-[1760px] min-[2200px]:!max-w-none">
      <Eye className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
      <p>
        <span className="font-medium">Public demo:</span> this workspace is
        read-only. Explore the seeded data without changing it.
      </p>
    </div>
  </div>
)
