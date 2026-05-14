import { Check, Copy } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { EmployeeInvitation } from '../api/employees.api'

interface EmployeeInvitationsPanelProps {
  copiedEmployeeId: string | null
  generatingEmployeeId: string | null
  hasError: boolean
  invitations: EmployeeInvitation[]
  onDismissLink: (employeeId: string) => void
  onGenerateLink: (invitation: EmployeeInvitation) => void
  setupUrlsByEmployeeId: Record<string, string>
}

export const EmployeeInvitationsPanel = ({
  copiedEmployeeId,
  generatingEmployeeId,
  hasError,
  invitations,
  onDismissLink,
  onGenerateLink,
  setupUrlsByEmployeeId,
}: EmployeeInvitationsPanelProps) => {
  if (invitations.length === 0 && !hasError) {
    return null
  }

  if (invitations.length === 0 && hasError) {
    return (
      <section className="rounded-2xl border border-default bg-surface p-4 shadow-soft">
        <h2 className="font-semibold text-primary">
          Invitations could not be loaded
        </h2>
        <p className="mt-1 text-sm text-muted">
          Refresh the page or try again later.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl border border-default bg-brand-soft p-4 shadow-soft">
      <div>
        <h2 className="font-semibold text-primary">Pending invitations</h2>
        <p className="mt-1 text-sm text-muted">
          Copy setup links through a secure channel. Links stay available here
          as pending rows, but raw tokens are only shown after creation or
          regeneration.
        </p>
      </div>
      <div className="grid gap-3">
        {invitations.map((invitation) => {
          const setupUrl = setupUrlsByEmployeeId[invitation.employeeId]
          const isCopied = copiedEmployeeId === invitation.employeeId
          const isGenerating = generatingEmployeeId === invitation.employeeId

          return (
            <div
              className="grid gap-3 rounded-xl border border-default bg-surface p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
              key={invitation.employeeId}
            >
              <div className="min-w-0">
                <p className="font-medium text-primary">
                  {invitation.employeeName}
                </p>
                <p className="mt-1 truncate text-sm text-muted">
                  {invitation.email}
                </p>
                <p className="mt-1 text-xs text-faint">
                  Expires on{' '}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
                {setupUrl ? (
                  <code className="mt-3 block overflow-auto rounded-xl border border-default bg-inset px-3 py-2 text-sm text-primary">
                    {setupUrl}
                  </code>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button
                  type="button"
                  variant={setupUrl ? 'outline' : 'default'}
                  disabled={isGenerating}
                  onClick={() => onGenerateLink(invitation)}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isCopied
                    ? 'Copied'
                    : setupUrl
                      ? 'Copy link'
                      : isGenerating
                        ? 'Generating...'
                        : 'Generate link'}
                </Button>
                {setupUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDismissLink(invitation.employeeId)}
                  >
                    Hide link
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
