import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardPreview } from '@/features/homepage/components/dashboard-preview'
import { LandingBrandMark } from '@/features/homepage/components/landing-brand-mark'
import { modules, valuePoints } from '@/features/homepage/components/landing-data'
import { LandingIconWell } from '@/features/homepage/components/landing-icon-well'
import { ReactiveDotGrid } from '@/features/homepage/components/reactive-dot-grid'
import { Button } from '@/shared/components/ui/button'
import { ThemeToggle } from '@/shared/components/ui/theme-toggle'

export const HomePage = () => (
  <main className="relative min-h-screen overflow-hidden bg-base text-primary">
    <ReactiveDotGrid />
    <div className="relative z-10">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <LandingBrandMark />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link to="/login">
              Demo Login
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="icon" className="sm:hidden" aria-label="Demo Login">
            <Link to="/login">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] items-center gap-10 px-5 pb-8 pt-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:pb-6 lg:pt-6">
        <div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-normal text-primary sm:text-6xl lg:text-7xl">
            Manage your workforce <span className="text-brand-text">in one place</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-secondary sm:text-lg">
            Stafflow helps you streamline employee data, track attendance, manage leave requests, organize
            departments, and keep full control with smart admin tools.
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
                <LandingIconWell icon={point.icon} className="h-10 w-10 shrink-0 rounded-full" />
                <div>
                  <h2 className="text-sm font-semibold text-primary">{point.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-5 py-5 sm:px-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:px-8">
        {modules.map((module) => (
          <article
            key={module.title}
            className="rounded-3xl border border-default bg-overlay p-5 shadow-soft backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-strong hover:shadow-card"
          >
            <LandingIconWell icon={module.icon} />
            <h2 className="mt-6 text-base font-semibold text-primary">{module.title}</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">{module.description}</p>
          </article>
        ))}
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 pb-8 pt-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <LandingBrandMark />
        <p>© 2026 Stafflow. All rights reserved.</p>
        <div className="flex flex-wrap gap-5">
          <Link to="/" className="transition hover:text-brand-text">
            Privacy Policy
          </Link>
          <Link to="/" className="transition hover:text-brand-text">
            Terms of Service
          </Link>
          <Link to="/" className="transition hover:text-brand-text">
            Support
          </Link>
        </div>
      </footer>
    </div>
  </main>
)
