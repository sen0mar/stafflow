import { Input } from '@/shared/components/ui/input'

interface DateRangeFilterProps {
  from: string
  fromLabel?: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  to: string
  toLabel?: string
}

export const DateRangeFilter = ({
  from,
  fromLabel = 'From date',
  onFromChange,
  onToChange,
  to,
  toLabel = 'To date',
}: DateRangeFilterProps) => (
  <>
    <Input
      aria-label={fromLabel}
      type="date"
      value={from}
      onChange={(event) => onFromChange(event.target.value)}
    />
    <Input
      aria-label={toLabel}
      type="date"
      value={to}
      onChange={(event) => onToChange(event.target.value)}
    />
  </>
)
