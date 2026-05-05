import { ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'

export const HomePage = () => (
  <main className="dot-grid min-h-screen">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
      <Link to="/" className="text-sm font-semibold text-primary">
        Stafflow
      </Link>
      <Button asChild>
        <Link to="/login">Demo Login</Link>
      </Button>
    </header>

    <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 pt-12 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:pt-20">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-brand-text">Employee management system</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-primary sm:text-5xl">
          Staff operations, ready for the first real workflows.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          Route scaffold placeholder for the public homepage. The production app will grow from here into
          authenticated employee, department, attendance, leave, payslip, settings, and audit workflows.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/dashboard">
              Open dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-default bg-surface p-6 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <Building2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-medium text-brand-text">Public route</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-primary">Homepage placeholder</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          This route stays public and links into the temporary app scaffold while auth is being built.
        </p>
      </div>
    </section>
  </main>
)
