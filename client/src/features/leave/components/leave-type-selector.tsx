import { useState } from 'react'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/shared/components/forms/searchable-select'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { useLeaveType, useLeaveTypes } from '../hooks/use-leave'

interface LeaveTypeSelectorProps {
  activeOnly?: boolean
  allOption?: boolean
  ariaLabel: string
  className?: string
  id?: string
  onValueChange: (value: string) => void
  value: string
}

const selectorPageSize = 20
const allLeaveTypesOption = { label: 'All leave types', value: 'all' }

const toLeaveTypeOption = (leaveType: {
  id: string
  name: string
}): SearchableSelectOption => ({
  label: leaveType.name,
  value: leaveType.id,
})

export const LeaveTypeSelector = ({
  activeOnly = false,
  allOption = false,
  ariaLabel,
  className,
  id,
  onValueChange,
  value,
}: LeaveTypeSelectorProps) => {
  const [search, setSearch] = useState('')
  const [selectedOption, setSelectedOption] =
    useState<SearchableSelectOption | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const leaveTypesQuery = useLeaveTypes({
    isActive: activeOnly ? true : undefined,
    limit: selectorPageSize,
    page: 1,
    search: debouncedSearch.trim() || undefined,
  })
  const options = (leaveTypesQuery.data?.data ?? []).map(toLeaveTypeOption)
  const hasCurrentOption = options.some((option) => option.value === value)
  const leaveTypeQuery = useLeaveType(
    value,
    Boolean(value && value !== allLeaveTypesOption.value && !hasCurrentOption),
  )
  const preservedOption =
    selectedOption?.value === value
      ? selectedOption
      : leaveTypeQuery.data
        ? toLeaveTypeOption(leaveTypeQuery.data)
        : null

  return (
    <SearchableSelect
      ariaLabel={ariaLabel}
      className={className}
      emptyMessage="No leave types found."
      emptyOption={allOption ? allLeaveTypesOption : undefined}
      errorMessage="Leave types could not be loaded."
      id={id}
      isError={leaveTypesQuery.isError || leaveTypeQuery.isError}
      isLoading={
        leaveTypesQuery.isLoading ||
        leaveTypesQuery.isFetching ||
        leaveTypeQuery.isLoading
      }
      onRetry={() => {
        void Promise.all([
          leaveTypesQuery.refetch(),
          ...(leaveTypeQuery.isError ? [leaveTypeQuery.refetch()] : []),
        ])
      }}
      onSearchChange={setSearch}
      onValueChange={(nextValue, option) => {
        setSelectedOption(option)
        onValueChange(nextValue)
      }}
      options={options}
      placeholder="Select leave type"
      searchPlaceholder="Search leave types"
      selectedOption={preservedOption}
      value={value}
    />
  )
}
