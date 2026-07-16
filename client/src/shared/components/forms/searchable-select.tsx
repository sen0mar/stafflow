import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useId, useState } from 'react'
import { Popover } from 'radix-ui'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

export interface SearchableSelectOption {
  description?: string
  label: string
  value: string
}

interface SearchableSelectProps {
  ariaLabel: string
  className?: string
  emptyMessage: string
  emptyOption?: SearchableSelectOption
  errorMessage: string
  id?: string
  isError?: boolean
  isLoading?: boolean
  onRetry?: () => void
  onSearchChange: (search: string) => void
  onValueChange: (value: string, option: SearchableSelectOption) => void
  options: SearchableSelectOption[]
  placeholder: string
  searchPlaceholder: string
  selectedOption?: SearchableSelectOption | null
  value: string
}

export const SearchableSelect = ({
  ariaLabel,
  className,
  emptyMessage,
  emptyOption,
  errorMessage,
  id,
  isError = false,
  isLoading = false,
  onRetry,
  onSearchChange,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  selectedOption,
  value,
}: SearchableSelectProps) => {
  const generatedId = useId()
  const listboxId = `${id ?? generatedId}-options`
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const currentOption =
    (emptyOption?.value === value ? emptyOption : undefined) ??
    options.find((option) => option.value === value) ??
    (selectedOption?.value === value ? selectedOption : undefined)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen && search) {
      setSearch('')
      onSearchChange('')
    }
  }

  const handleSelect = (option: SearchableSelectOption) => {
    onValueChange(option.value, option)
    handleOpenChange(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <Button
          aria-controls={listboxId}
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            'h-9 w-full min-w-0 justify-between bg-elevated px-3 font-normal hover:bg-elevated',
            !currentOption && 'text-muted',
            className,
          )}
          id={id}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="min-w-0 truncate">
            {currentOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-56 rounded-md border border-default bg-popover p-1 text-primary shadow-md"
          sideOffset={4}
        >
          <div className="relative p-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              aria-controls={listboxId}
              aria-label={searchPlaceholder}
              autoComplete="off"
              className="pl-8"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => {
                const nextSearch = event.target.value
                setSearch(nextSearch)
                onSearchChange(nextSearch)
              }}
            />
          </div>
          <div
            aria-busy={isLoading}
            className="max-h-64 overflow-y-auto p-1"
            id={listboxId}
            role="listbox"
          >
            {emptyOption ? (
              <button
                aria-selected={value === emptyOption.value}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-brand-soft focus-visible:bg-brand-soft"
                role="option"
                type="button"
                onClick={() => handleSelect(emptyOption)}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value !== emptyOption.value && 'opacity-0',
                  )}
                  aria-hidden
                />
                <span className="truncate">{emptyOption.label}</span>
              </button>
            ) : null}
            {options.map((option) => (
              <button
                aria-selected={value === option.value}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-brand-soft focus-visible:bg-brand-soft"
                key={option.value}
                role="option"
                type="button"
                onClick={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    value !== option.value && 'opacity-0',
                  )}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.description ? (
                    <span className="block truncate text-xs text-muted">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
            {isLoading ? (
              <p className="px-2 py-3 text-sm text-muted" role="status">
                Loading options…
              </p>
            ) : null}
            {!isLoading && isError ? (
              <div className="space-y-2 px-2 py-3" role="alert">
                <p className="text-sm text-destructive">{errorMessage}</p>
                {onRetry ? (
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={onRetry}
                  >
                    Try again
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!isLoading && !isError && options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted">{emptyMessage}</p>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
