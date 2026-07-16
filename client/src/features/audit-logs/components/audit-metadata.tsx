import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

const getChangedFields = (metadata: unknown) =>
  isRecord(metadata) && Array.isArray(metadata.changedFields)
    ? metadata.changedFields.filter(
        (field): field is string => typeof field === 'string',
      )
    : []

const getOldNewMetadata = (metadata: unknown) => {
  if (!isRecord(metadata) || !isRecord(metadata.from) || !isRecord(metadata.to))
    return null
  return { from: metadata.from, to: metadata.to }
}

export const AuditMetadata = ({ metadata }: { metadata: unknown }) => {
  const oldNew = getOldNewMetadata(metadata)
  const changedFields = getChangedFields(metadata)

  if (!oldNew) {
    return (
      <pre className="max-h-72 overflow-auto rounded-lg bg-inset p-3 text-xs leading-5 text-primary">
        {stringifyValue(metadata)}
      </pre>
    )
  }

  const fields =
    changedFields.length > 0
      ? changedFields
      : Array.from(
          new Set([...Object.keys(oldNew.from), ...Object.keys(oldNew.to)]),
        )

  return (
    <div className="overflow-hidden rounded-lg border border-default">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Old</TableHead>
            <TableHead>New</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field}>
              <TableCell className="font-medium text-primary">
                {field}
              </TableCell>
              <TableCell>
                <code className="whitespace-pre-wrap text-xs text-muted">
                  {stringifyValue(oldNew.from[field])}
                </code>
              </TableCell>
              <TableCell>
                <code className="whitespace-pre-wrap text-xs text-muted">
                  {stringifyValue(oldNew.to[field])}
                </code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
