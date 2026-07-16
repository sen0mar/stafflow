import { useState } from 'react'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/shared/components/forms/searchable-select'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { useDepartment, useDepartments } from '../hooks/use-departments'

interface DepartmentSelectorProps {
  allOption?: boolean
  ariaLabel: string
  className?: string
  id?: string
  onValueChange: (value: string) => void
  unassignedOption?: boolean
  value: string
}

const selectorPageSize = 20
const allDepartmentsOption = { label: 'All departments', value: 'all' }
const unassignedDepartmentOption = { label: 'Unassigned', value: 'unassigned' }

const toDepartmentOption = (department: {
  id: string
  name: string
}): SearchableSelectOption => ({
  label: department.name,
  value: department.id,
})

export const DepartmentSelector = ({
  allOption = false,
  ariaLabel,
  className,
  id,
  onValueChange,
  unassignedOption = false,
  value,
}: DepartmentSelectorProps) => {
  const [search, setSearch] = useState('')
  const [selectedOption, setSelectedOption] =
    useState<SearchableSelectOption | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const departmentsQuery = useDepartments({
    isActive: true,
    page: 1,
    pageSize: selectorPageSize,
    search: debouncedSearch.trim() || undefined,
  })
  const options = (departmentsQuery.data?.data ?? []).map(toDepartmentOption)
  const hasCurrentOption = options.some((option) => option.value === value)
  const isEmptyValue =
    !value ||
    value === allDepartmentsOption.value ||
    value === unassignedDepartmentOption.value
  const departmentQuery = useDepartment(
    value,
    Boolean(!isEmptyValue && !hasCurrentOption),
  )
  const preservedOption =
    selectedOption?.value === value
      ? selectedOption
      : departmentQuery.data
        ? toDepartmentOption(departmentQuery.data)
        : null

  return (
    <SearchableSelect
      ariaLabel={ariaLabel}
      className={className}
      emptyMessage="No departments found."
      emptyOption={
        allOption
          ? allDepartmentsOption
          : unassignedOption
            ? unassignedDepartmentOption
            : undefined
      }
      errorMessage="Departments could not be loaded."
      id={id}
      isError={departmentsQuery.isError || departmentQuery.isError}
      isLoading={
        departmentsQuery.isLoading ||
        departmentsQuery.isFetching ||
        departmentQuery.isLoading
      }
      onRetry={() => {
        void Promise.all([
          departmentsQuery.refetch(),
          ...(departmentQuery.isError ? [departmentQuery.refetch()] : []),
        ])
      }}
      onSearchChange={setSearch}
      onValueChange={(nextValue, option) => {
        setSelectedOption(option)
        onValueChange(nextValue)
      }}
      options={options}
      placeholder="Select department"
      searchPlaceholder="Search departments"
      selectedOption={preservedOption}
      value={value}
    />
  )
}
