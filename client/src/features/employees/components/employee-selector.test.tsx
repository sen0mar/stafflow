import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import type { Employee, EmployeeListParams } from '../api/employees.api'
import { useEmployee, useEmployees } from '../hooks/use-employees'
import { EmployeeSelector, employeeSelectorPageSize } from './employee-selector'

vi.mock('../hooks/use-employees', () => ({
  useEmployee: vi.fn(),
  useEmployees: vi.fn(),
}))

const employees = Array.from({ length: 101 }, (_item, index): Employee => {
  const number = index + 1

  return {
    account: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    department: null,
    departmentId: null,
    employeeCode: `EMP-${String(number).padStart(3, '0')}`,
    firstName: 'Employee',
    fullName: `Employee ${number}`,
    hireDate: null,
    id: `employee-${number}`,
    jobTitle: null,
    lastName: String(number),
    phone: null,
    status: 'ACTIVE',
    terminationDate: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
})

const mockedUseEmployees = vi.mocked(useEmployees)
const mockedUseEmployee = vi.mocked(useEmployee)

const Harness = () => {
  const [value, setValue] = useState('')

  return (
    <EmployeeSelector
      ariaLabel="Choose employee"
      value={value}
      onValueChange={setValue}
    />
  )
}

describe('EmployeeSelector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockedUseEmployees.mockImplementation((params: EmployeeListParams) => {
      const matches = params.search
        ? employees.filter(
            (employee) => employee.employeeCode === params.search,
          )
        : employees

      return {
        data: {
          data: matches.slice(0, employeeSelectorPageSize),
          meta: {
            limit: employeeSelectorPageSize,
            page: 1,
            total: matches.length,
            totalPages: Math.max(
              1,
              Math.ceil(matches.length / employeeSelectorPageSize),
            ),
          },
        },
        isError: false,
        isFetching: false,
        isLoading: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useEmployees>
    })
    mockedUseEmployee.mockImplementation(
      (id, enabled) =>
        ({
          data: enabled
            ? employees.find((employee) => employee.id === id)
            : undefined,
        }) as unknown as ReturnType<typeof useEmployee>,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces a bounded server search, selects employee 101, and preserves it', () => {
    render(<Harness />)

    expect(mockedUseEmployees).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 20, page: 1, search: undefined }),
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Choose employee' }))
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search employees' }),
      {
        target: { value: 'EMP-101' },
      },
    )

    expect(mockedUseEmployees).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: undefined }),
    )

    act(() => vi.advanceTimersByTime(349))
    expect(mockedUseEmployees).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: undefined }),
    )

    act(() => vi.advanceTimersByTime(1))
    expect(mockedUseEmployees).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 20, page: 1, search: 'EMP-101' }),
    )

    fireEvent.click(screen.getByRole('option', { name: /Employee 101/ }))

    act(() => vi.advanceTimersByTime(350))

    expect(
      screen.getByRole('combobox', { name: 'Choose employee' }),
    ).toHaveTextContent('Employee 101')
    expect(mockedUseEmployee).toHaveBeenLastCalledWith('employee-101', true)
  })
})
