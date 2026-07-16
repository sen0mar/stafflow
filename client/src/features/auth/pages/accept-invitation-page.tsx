import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, LogIn } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ThemeToggle } from '@/shared/components/ui/theme-toggle'
import { getSafeErrorMessage } from '@/shared/lib/api-errors'
import { useAcceptInvitation } from '../hooks/use-accept-invitation'
import { useDemoMode } from '../hooks/use-auth-config'

const minPasswordLength = 12
const maxBcryptPasswordBytes = 72

const getUtf8ByteLength = (value: string) => new Blob([value]).size

export const AcceptInvitationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const acceptInvitation = useAcceptInvitation()
  const demoMode = useDemoMode()
  const token = useMemo(
    () => new URLSearchParams(location.search).get('token')?.trim() ?? '',
    [location.search],
  )
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const missingToken = token.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (missingToken || demoMode) {
      return
    }

    if (password.length < minPasswordLength) {
      toast.error(`Password must be at least ${minPasswordLength} characters.`)
      return
    }

    if (getUtf8ByteLength(password) > maxBcryptPasswordBytes) {
      toast.error(`Password must be ${maxBcryptPasswordBytes} bytes or fewer.`)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    acceptInvitation.mutate(
      { password, token },
      {
        onError: (error) => {
          toast.error(
            getSafeErrorMessage(
              error,
              'This invitation could not be accepted.',
            ),
          )
        },
        onSuccess: () => {
          setIsComplete(true)
          toast.success('Password set. You can now sign in.')
        },
      },
    )
  }

  return (
    <main className="min-h-screen bg-base text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden lg:block">
            <div className="max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow">
                <KeyRound className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-normal text-primary">
                Set up your Stafflow account
              </h1>
              <p className="mt-4 text-base leading-7 text-muted">
                Create a password for your invited employee account, then sign
                in with your company email.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-2xl border border-default bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-normal text-primary">
                {isComplete
                  ? 'Your password is ready'
                  : demoMode
                    ? 'Invitations are disabled in the public demo'
                    : missingToken
                      ? 'Invalid invitation link'
                      : 'Choose a password'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {isComplete
                  ? 'Use your employee email and new password to access your workspace.'
                  : demoMode
                    ? 'Sign in with a seeded demo account to explore the read-only workspace.'
                    : missingToken
                      ? 'Ask your admin for a fresh setup link, then open it from the message they send you.'
                      : 'Use at least 12 characters. This password will be used for future sign-ins.'}
              </p>
            </div>

            {isComplete || missingToken || demoMode ? (
              <Button
                className="w-full"
                type="button"
                onClick={() => navigate('/login')}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Go to sign in
              </Button>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    autoComplete="new-password"
                    id="password"
                    name="newPassword"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    type="password"
                    value={password}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    autoComplete="new-password"
                    id="confirmPassword"
                    name="confirmPassword"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    type="password"
                    value={confirmPassword}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={acceptInvitation.isPending}
                  type="submit"
                >
                  {acceptInvitation.isPending ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  )}
                  {acceptInvitation.isPending
                    ? 'Setting password...'
                    : 'Set password'}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
