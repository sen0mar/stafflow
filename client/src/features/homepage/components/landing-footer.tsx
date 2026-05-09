import { Link } from 'react-router-dom'
import { LandingBrandMark } from './landing-brand-mark'

export const LandingFooter = () => (
  <footer className="border-t border-default bg-overlay backdrop-blur">
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 2xl:max-w-[1760px] 2xl:px-10">
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
    </div>
  </footer>
)
