import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'
import { AppShell } from '@/shared/components/layout/app-shell'
import { NotFoundPage } from '@/shared/components/layout/not-found-page'
import { AttendancePage } from '@/features/attendance/pages/attendance-page'
import { AuditLogsPage } from '@/features/audit-logs/pages/audit-logs-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { DepartmentsPage } from '@/features/departments/pages/departments-page'
import { EmployeeDetailsPage } from '@/features/employees/pages/employee-details-page'
import { EmployeeProfilePage } from '@/features/employees/pages/employee-profile-page'
import { EmployeesPage } from '@/features/employees/pages/employees-page'
import { HomePage } from '@/features/homepage/pages/home-page'
import { LeaveRequestsPage } from '@/features/leave/pages/leave-requests-page'
import { PayslipsPage } from '@/features/payslips/pages/payslips-page'
import { SettingsPage } from '@/features/settings/pages/settings-page'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'employees',
            element: <EmployeesPage />,
          },
          {
            path: 'employees/:id',
            element: <EmployeeDetailsPage />,
          },
          {
            path: 'profile',
            element: <EmployeeProfilePage />,
          },
          {
            path: 'departments',
            element: <DepartmentsPage />,
          },
          {
            path: 'attendance',
            element: <AttendancePage />,
          },
          {
            path: 'leave-requests',
            element: <LeaveRequestsPage />,
          },
          {
            path: 'payslips',
            element: <PayslipsPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'audit-logs',
            element: <AuditLogsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
