import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'

interface SearchInputProps {
  ariaLabel?: string
  debounceMs?: number
  onDebouncedChange: (value: string) => void
  placeholder: string
  value: string
}

export const SearchInput = ({
  ariaLabel,
  debounceMs,
  onDebouncedChange,
  placeholder,
  value,
}: SearchInputProps) => {
  const [draftValue, setDraftValue] = useState(value)
  const debouncedValue = useDebouncedValue(draftValue, debounceMs)

  useEffect(() => {
    onDebouncedChange(debouncedValue)
  }, [debouncedValue, onDebouncedChange])

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Input
        aria-label={ariaLabel ?? placeholder}
        className="pl-9"
        placeholder={placeholder}
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
      />
    </div>
  )
}
