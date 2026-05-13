import { metrics } from './landing-data'
import { LandingIconWell } from './landing-icon-well'

export const MetricsStrip = () => (
  <section className="mx-auto max-w-[1440px] px-5 py-5 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:px-10">
    <div className="grid gap-4 rounded-3xl border border-default bg-overlay p-5 shadow-card backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex items-center gap-4">
          <LandingIconWell
            icon={metric.icon}
            className="h-11 w-11 shrink-0 rounded-xl"
          />
          <div>
            <p className="text-sm font-medium text-muted">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-faint">{metric.detail}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)
