import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'
import { RouteFallback } from './route-fallback'
import { AppShell } from '@/shared/components/layout/app-shell'
import { NotFoundPage } from '@/shared/components/layout/not-found-page'
import {
  AppRouteErrorBoundary,
  RouteErrorBoundary,
} from '@/shared/components/layout/page-state'

const routeFallbackElement = <RouteFallback />

export const appRouter = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeFallbackElement,
    lazy: async () => {
      const { HomePage } = await import('@/features/homepage/pages/home-page')

      return { Component: HomePage }
    },
  },
  {
    path: '/login',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeFallbackElement,
    lazy: async () => {
      const { LoginPage } = await import('@/features/auth/pages/login-page')

      return { Component: LoginPage }
    },
  },
  {
    path: '/accept-invitation',
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeFallbackElement,
    lazy: async () => {
      const { AcceptInvitationPage } =
        await import('@/features/auth/pages/accept-invitation-page')

      return { Component: AcceptInvitationPage }
    },
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        errorElement: <AppRouteErrorBoundary />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { DashboardPage } =
                await import('@/features/dashboard/pages/dashboard-page')

              return { Component: DashboardPage }
            },
          },
          {
            path: 'employees',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { EmployeesPage } =
                await import('@/features/employees/pages/employees-page')

              return { Component: EmployeesPage }
            },
          },
          {
            path: 'employees/:id',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { EmployeeDetailsPage } =
                await import('@/features/employees/pages/employee-details-page')

              return { Component: EmployeeDetailsPage }
            },
          },
          {
            path: 'profile',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { EmployeeProfilePage } =
                await import('@/features/employees/pages/employee-profile-page')

              return { Component: EmployeeProfilePage }
            },
          },
          {
            path: 'departments',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { DepartmentsPage } =
                await import('@/features/departments/pages/departments-page')

              return { Component: DepartmentsPage }
            },
          },
          {
            path: 'attendance',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { AttendancePage } =
                await import('@/features/attendance/pages/attendance-page')

              return { Component: AttendancePage }
            },
          },
          {
            path: 'leave-requests',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { LeaveRequestsPage } =
                await import('@/features/leave/pages/leave-requests-page')

              return { Component: LeaveRequestsPage }
            },
          },
          {
            path: 'payslips',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { PayslipsPage } =
                await import('@/features/payslips/pages/payslips-page')

              return { Component: PayslipsPage }
            },
          },
          {
            path: 'settings',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { SettingsPage } =
                await import('@/features/settings/pages/settings-page')

              return { Component: SettingsPage }
            },
          },
          {
            path: 'audit-logs',
            hydrateFallbackElement: routeFallbackElement,
            lazy: async () => {
              const { AuditLogsPage } =
                await import('@/features/audit-logs/pages/audit-logs-page')

              return { Component: AuditLogsPage }
            },
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
