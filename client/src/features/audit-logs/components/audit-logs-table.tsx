import { Eye } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { AuditLog } from '../api/audit-logs.api'
import {
  formatAuditDateTime,
  humanizeAuditAction,
} from '../lib/audit-formatters'

interface AuditLogsTableProps {
  auditLogs: AuditLog[]
  onView: (auditLog: AuditLog) => void
}

export const AuditLogsTable = ({ auditLogs, onView }: AuditLogsTableProps) => (
  <div className="overflow-hidden rounded-lg border border-default bg-surface p-2 shadow-soft">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.map((auditLog) => (
          <TableRow key={auditLog.id}>
            <TableCell>
              <Badge variant="secondary">
                {humanizeAuditAction(auditLog.action)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="font-medium text-primary">
                {auditLog.actorUser?.email ?? 'System or unauthenticated'}
              </div>
              <div className="text-xs text-muted">
                {auditLog.actorUserId ?? 'No actor ID'}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-primary">
                {auditLog.entityType}
              </div>
              <div className="max-w-56 truncate text-xs text-muted">
                {auditLog.entityId ?? 'No entity ID'}
              </div>
            </TableCell>
            <TableCell>{formatAuditDateTime(auditLog.createdAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Button
                  aria-label={`View ${auditLog.action} audit log`}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => onView(auditLog)}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
