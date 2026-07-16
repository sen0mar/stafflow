import { ArrowLeft, Edit3, Power, PowerOff } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { PageHeader } from '@/shared/components/layout/page-header'
import {
  useEmployee,
  useDisableEmployee,
  useUpdateEmployeeStatus,
} from '../hooks/use-employees'
import { EmployeeProfileCard } from '../components/employee-profile-card'
import { useDemoMode } from '@/features/auth/hooks/use-auth-config'

export const EmployeeDetailsPage = () => {
  const demoMode = useDemoMode()
  const { id } = useParams()
  const employeeQuery = useEmployee(id ?? '', Boolean(id))
  const disableEmployee = useDisableEmployee()
  const updateEmployeeStatus = useUpdateEmployeeStatus()
  const employee = employeeQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee?.fullName ?? 'Employee details'}
        description="Review account status, profile details, and assignment information."
        actions={
          <Button asChild type="button" variant="outline">
            <Link to="/app/employees">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        }
      />

      {employeeQuery.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-default bg-surface p-4 shadow-soft">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : null}

      {employeeQuery.isError ? (
        <div className="rounded-xl border border-default bg-inset p-6 text-sm text-muted">
          Employee details could not be loaded.
        </div>
      ) : null}

      {employee ? (
        <>
          <EmployeeProfileCard employee={employee} />
          {!demoMode ? (
            <section className="rounded-2xl border border-default bg-surface p-4 shadow-soft">
              <h2 className="font-semibold text-primary">Admin actions</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild type="button" variant="outline">
                  <Link to="/app/employees">
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit from list
                  </Link>
                </Button>
                {employee.status === 'ACTIVE' ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={disableEmployee.isPending}
                    onClick={() => disableEmployee.mutate(employee.id)}
                  >
                    <PowerOff className="h-4 w-4" aria-hidden="true" />
                    Disable employee
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={updateEmployeeStatus.isPending}
                    onClick={() =>
                      updateEmployeeStatus.mutate({
                        accountStatus:
                          employee.account?.status === 'DISABLED'
                            ? 'ACTIVE'
                            : employee.account?.status,
                        employeeStatus: 'ACTIVE',
                        id: employee.id,
                      })
                    }
                  >
                    <Power className="h-4 w-4" aria-hidden="true" />
                    Enable employee
                  </Button>
                )}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
