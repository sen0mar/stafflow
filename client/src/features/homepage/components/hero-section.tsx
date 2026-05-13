import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { DashboardPreview } from './dashboard-preview'
import { LandingIconWell } from './landing-icon-well'
import { valuePoints } from './landing-data'

export const HeroSection = () => (
  <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] items-center gap-10 px-5 pb-8 pt-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:pb-6 lg:pt-6 2xl:max-w-[1760px] 2xl:grid-cols-[0.72fr_1.28fr] 2xl:gap-16 2xl:px-10">
    <div>
      <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-normal text-primary sm:text-6xl lg:text-7xl">
        Manage your workforce{' '}
        <span className="text-brand-text">in one place</span>
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-secondary sm:text-lg">
        Stafflow helps you streamline employee data, track attendance, manage
        leave requests, organize departments, and keep full control with smart
        admin tools.
      </p>

      <div className="mt-7">
        <Button asChild size="lg">
          <Link to="/login">
            Try Demo
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {valuePoints.map((point) => (
          <div key={point.title} className="flex items-start gap-3">
            <LandingIconWell
              icon={point.icon}
              className="h-10 w-10 shrink-0 rounded-full"
            />
            <div>
              <h2 className="text-sm font-semibold text-primary">
                {point.title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <DashboardPreview />
  </section>
)
