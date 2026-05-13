import type { ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

export interface FilterSelectOption<TValue extends string> {
  label: ReactNode
  value: TValue
}

interface FilterSelectProps<TValue extends string> {
  ariaLabel?: string
  className?: string
  icon?: ReactNode
  onValueChange: (value: TValue) => void
  options: FilterSelectOption<TValue>[]
  value: TValue
}

export const FilterSelect = <TValue extends string>({
  ariaLabel,
  className,
  icon,
  onValueChange,
  options,
  value,
}: FilterSelectProps<TValue>) => (
  <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as TValue)}>
    <SelectTrigger aria-label={ariaLabel} className={className ?? 'w-full'}>
      {icon}
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
