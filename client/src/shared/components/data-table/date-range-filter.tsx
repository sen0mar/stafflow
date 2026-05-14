import { Input } from '@/shared/components/ui/input'

interface DateRangeFilterProps {
  from: string
  fromId?: string
  fromLabel?: string
  fromName?: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  to: string
  toId?: string
  toLabel?: string
  toName?: string
}

export const DateRangeFilter = ({
  from,
  fromId,
  fromLabel = 'From date',
  fromName,
  onFromChange,
  onToChange,
  to,
  toId,
  toLabel = 'To date',
  toName,
}: DateRangeFilterProps) => (
  <>
    {fromId ? (
      <label className="sr-only" htmlFor={fromId}>
        {fromLabel}
      </label>
    ) : null}
    <Input
      aria-label={fromLabel}
      autoComplete="off"
      id={fromId}
      name={fromName ?? fromId}
      type="date"
      value={from}
      onChange={(event) => onFromChange(event.target.value)}
    />
    {toId ? (
      <label className="sr-only" htmlFor={toId}>
        {toLabel}
      </label>
    ) : null}
    <Input
      aria-label={toLabel}
      autoComplete="off"
      id={toId}
      name={toName ?? toId}
      type="date"
      value={to}
      onChange={(event) => onToChange(event.target.value)}
    />
  </>
)
