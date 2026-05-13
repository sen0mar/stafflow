import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Loader2,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ThemeToggle } from '@/shared/components/ui/theme-toggle'
import { getSafeErrorMessage } from '@/shared/lib/api-errors'
import { useLogin } from '../hooks/use-login'

const demoPassword = 'StafflowDemo'
const demoAccounts = [
  {
    description: 'Full company operations view',
    email: 'admin.demo@example.com',
    icon: ShieldCheck,
    label: 'Admin demo',
  },
  {
    description: 'Self-service employee workspace',
    email: 'employee.demo@example.com',
    icon: UserRound,
    label: 'Employee demo',
  },
] as const

type LocationState = {
  from?: {
    pathname?: string
  }
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()
  const [email, setEmail] = useState<string>(demoAccounts[0].email)
  const [password, setPassword] = useState<string>(demoPassword)
  const searchRedirect = new URLSearchParams(location.search).get('from')
  const safeSearchRedirect = searchRedirect?.startsWith('/app')
    ? searchRedirect
    : undefined
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ??
    safeSearchRedirect ??
    '/app/dashboard'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    loginMutation.mutate(
      { email, password },
      {
        onError: (error) => {
          toast.error(getSafeErrorMessage(error, 'Unable to sign in.'))
        },
        onSuccess: () => {
          navigate(redirectTo, { replace: true })
        },
      },
    )
  }

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <main className="min-h-screen bg-base text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Stafflow
          </Link>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden lg:block">
            <div className="max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow">
                <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-normal text-primary">
                Sign in to Stafflow
              </h1>
              <p className="mt-4 text-base leading-7 text-muted">
                Access the demo workspace with seeded admin or employee
                credentials. Accounts are created by admins only.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-2xl border border-default bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                <LogIn className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-normal text-primary">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Use an invited account or one of the portfolio demo users.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  autoComplete="current-password"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </div>

              <Button
                className="w-full"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                )}
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 border-t border-subtle pt-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-faint">
                Demo credentials
              </p>
              <div className="mt-3 grid gap-3">
                {demoAccounts.map(
                  ({ description, email: demoEmail, icon: Icon, label }) => (
                    <button
                      className="flex w-full items-center gap-3 rounded-xl border border-default bg-elevated p-3 text-left transition hover:-translate-y-0.5 hover:bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      key={demoEmail}
                      onClick={() => fillDemoAccount(demoEmail)}
                      type="button"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-primary">
                          {label}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {demoEmail}
                        </span>
                        <span className="block text-xs text-faint">
                          {description}
                        </span>
                      </span>
                    </button>
                  ),
                )}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">
                Password:{' '}
                <span className="font-mono text-brand-text">
                  {demoPassword}
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
