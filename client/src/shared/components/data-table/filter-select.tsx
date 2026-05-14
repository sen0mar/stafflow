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
  ariaLabelledby?: string
  autoComplete?: string
  className?: string
  icon?: ReactNode
  id?: string
  name?: string
  onValueChange: (value: TValue) => void
  options: FilterSelectOption<TValue>[]
  value: TValue
}

export const FilterSelect = <TValue extends string>({
  ariaLabel,
  ariaLabelledby,
  autoComplete = 'off',
  className,
  icon,
  id,
  name,
  onValueChange,
  options,
  value,
}: FilterSelectProps<TValue>) => (
  <Select
    autoComplete={autoComplete}
    value={value}
    onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
  >
    <SelectTrigger
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={className ?? 'w-full'}
      id={id}
      data-field-name={name}
    >
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
