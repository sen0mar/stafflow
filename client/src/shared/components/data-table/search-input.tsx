import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'

interface SearchInputProps {
  ariaLabel?: string
  autoComplete?: string
  hasVisibleLabel?: boolean
  debounceMs?: number
  id?: string
  name?: string
  onDebouncedChange: (value: string) => void
  placeholder: string
  value: string
}

export const SearchInput = ({
  ariaLabel,
  autoComplete = 'off',
  hasVisibleLabel = false,
  debounceMs,
  id,
  name,
  onDebouncedChange,
  placeholder,
  value,
}: SearchInputProps) => {
  const [draftState, setDraftState] = useState({
    draftValue: value,
    externalValue: value,
  })
  const draftValue =
    draftState.externalValue === value ? draftState.draftValue : value
  const debouncedValue = useDebouncedValue(draftValue, debounceMs)

  if (draftState.externalValue !== value) {
    setDraftState({ draftValue: value, externalValue: value })
  }

  useEffect(() => {
    if (
      draftState.externalValue === value &&
      draftState.draftValue === debouncedValue &&
      debouncedValue !== value
    ) {
      onDebouncedChange(debouncedValue)
    }
  }, [debouncedValue, draftState, onDebouncedChange, value])

  return (
    <div className="relative min-w-0">
      {id && !hasVisibleLabel ? (
        <label className="sr-only" htmlFor={id}>
          {ariaLabel ?? placeholder}
        </label>
      ) : null}
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Input
        aria-label={ariaLabel ?? placeholder}
        autoComplete={autoComplete}
        className="pl-9"
        id={id}
        name={name ?? id}
        placeholder={placeholder}
        value={draftValue}
        onChange={(event) => {
          setDraftState({
            draftValue: event.target.value,
            externalValue: value,
          })
        }}
      />
    </div>
  )
}
