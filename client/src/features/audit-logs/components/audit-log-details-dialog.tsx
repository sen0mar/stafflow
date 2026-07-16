import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { AuditLog } from '../api/audit-logs.api'
import { AuditMetadata } from './audit-metadata'
import {
  formatAuditDateTime,
  humanizeAuditAction,
} from '../lib/audit-formatters'

interface AuditLogDetailsDialogProps {
  auditLog: AuditLog | null
  isLoading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DetailItem = ({
  label,
  value,
}: {
  label: string
  value: string | null
}) => (
  <div>
    <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
    <dd className="mt-1 break-words text-sm text-primary">{value ?? 'None'}</dd>
  </div>
)

export const AuditLogDetailsDialog = ({
  auditLog,
  isLoading,
  open,
  onOpenChange,
}: AuditLogDetailsDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Audit log details</DialogTitle>
        <DialogDescription>
          Sensitive metadata is redacted before it is stored and displayed.
        </DialogDescription>
      </DialogHeader>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}
      {auditLog ? (
        <div className="space-y-5">
          <div className="grid gap-4 rounded-lg border border-default bg-inset p-4 sm:grid-cols-2">
            <DetailItem
              label="Action"
              value={humanizeAuditAction(auditLog.action)}
            />
            <DetailItem
              label="Created"
              value={formatAuditDateTime(auditLog.createdAt)}
            />
            <DetailItem
              label="Actor"
              value={auditLog.actorUser?.email ?? auditLog.actorUserId}
            />
            <DetailItem label="Actor user ID" value={auditLog.actorUserId} />
            <DetailItem label="Entity" value={auditLog.entityType} />
            <DetailItem label="Entity ID" value={auditLog.entityId} />
            <DetailItem label="IP address" value={auditLog.ipAddress} />
            <DetailItem label="User agent" value={auditLog.userAgent} />
          </div>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">Metadata</h3>
            <AuditMetadata metadata={auditLog.metadata} />
          </section>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>
)
