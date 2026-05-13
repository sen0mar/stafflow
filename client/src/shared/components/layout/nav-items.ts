import {
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export interface AppNavItem {
  label: string
  path: string
  icon: LucideIcon
  adminOnly?: boolean
  requiresEmployeeProfile?: boolean
}

export const appNavItems: AppNavItem[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  {
    label: 'Profile',
    path: '/app/profile',
    icon: UserRound,
    requiresEmployeeProfile: true,
  },
  {
    label: 'Employees',
    path: '/app/employees',
    icon: UsersRound,
    adminOnly: true,
  },
  {
    label: 'Departments',
    path: '/app/departments',
    icon: Building2,
    adminOnly: true,
  },
  { label: 'Attendance', path: '/app/attendance', icon: CalendarCheck },
  { label: 'Leave Requests', path: '/app/leave-requests', icon: ClipboardList },
  { label: 'Payslips', path: '/app/payslips', icon: FileText },
  { label: 'Settings', path: '/app/settings', icon: Settings, adminOnly: true },
  {
    label: 'Audit Logs',
    path: '/app/audit-logs',
    icon: ScrollText,
    adminOnly: true,
  },
]
