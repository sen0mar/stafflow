import { useState } from 'react'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/shared/components/forms/searchable-select'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { useEmployee, useEmployees } from '../hooks/use-employees'

interface EmployeeSelectorProps {
  allOption?: boolean
  ariaLabel: string
  className?: string
  id?: string
  onValueChange: (value: string) => void
  value: string
}

export const employeeSelectorPageSize = 20
const allEmployeesOption = { label: 'All employees', value: 'all' }

const toEmployeeOption = (employee: {
  employeeCode: string
  fullName: string
  id: string
}): SearchableSelectOption => ({
  description: employee.employeeCode,
  label: employee.fullName,
  value: employee.id,
})

export const EmployeeSelector = ({
  allOption = false,
  ariaLabel,
  className,
  id,
  onValueChange,
  value,
}: EmployeeSelectorProps) => {
  const [search, setSearch] = useState('')
  const [selectedOption, setSelectedOption] =
    useState<SearchableSelectOption | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const employeesQuery = useEmployees({
    limit: employeeSelectorPageSize,
    page: 1,
    search: debouncedSearch.trim() || undefined,
    sort: 'name',
    status: 'ACTIVE',
  })
  const options = (employeesQuery.data?.data ?? []).map(toEmployeeOption)
  const hasCurrentOption = options.some((option) => option.value === value)
  const employeeQuery = useEmployee(
    value,
    Boolean(value && value !== allEmployeesOption.value && !hasCurrentOption),
  )
  const preservedOption =
    selectedOption?.value === value
      ? selectedOption
      : employeeQuery.data
        ? toEmployeeOption(employeeQuery.data)
        : null

  return (
    <SearchableSelect
      ariaLabel={ariaLabel}
      className={className}
      emptyMessage="No employees found."
      emptyOption={allOption ? allEmployeesOption : undefined}
      errorMessage="Employees could not be loaded."
      id={id}
      isError={employeesQuery.isError || employeeQuery.isError}
      isLoading={
        employeesQuery.isLoading ||
        employeesQuery.isFetching ||
        employeeQuery.isLoading
      }
      onRetry={() => {
        void Promise.all([
          employeesQuery.refetch(),
          ...(employeeQuery.isError ? [employeeQuery.refetch()] : []),
        ])
      }}
      onSearchChange={setSearch}
      onValueChange={(nextValue, option) => {
        setSelectedOption(option)
        onValueChange(nextValue)
      }}
      options={options}
      placeholder="Select employee"
      searchPlaceholder="Search employees"
      selectedOption={preservedOption}
      value={value}
    />
  )
}
