import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ThemeToggle } from '@/shared/components/ui/theme-toggle'
import { LandingBrandMark } from './landing-brand-mark'

export const LandingHeader = () => (
  <header className="border-b border-default bg-overlay backdrop-blur">
    <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:px-10">
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
    </div>
  </header>
)
