import {
  Building2,
  CalendarCheck,
  Clock3,
  FileText,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

interface DashboardStat {
  detail: string
  icon: LucideIcon
  label: string
  trend: string
  value: string
}

interface LeaveRequest {
  date: string
  employee: string
  status: 'Approved' | 'In Review' | 'Pending'
  type: string
}

interface RecentEmployee {
  department: string
  initials: string
  name: string
  role: string
  status: 'Active' | 'Onboarding'
}

interface DepartmentShare {
  count: number
  label: string
  width: string
}

export const dashboardStats: DashboardStat[] = [
  {
    label: 'Total Employees',
    value: '128',
    detail: '8 joined this month',
    trend: '+6.7%',
    icon: UsersRound,
  },
  {
    label: 'Present Today',
    value: '96',
    detail: '75% attendance rate',
    trend: '+4.2%',
    icon: CalendarCheck,
  },
  {
    label: 'Pending Requests',
    value: '7',
    detail: '3 need review today',
    trend: 'Review',
    icon: Clock3,
  },
  {
    label: 'Departments',
    value: '12',
    detail: 'Across active teams',
    trend: 'Stable',
    icon: Building2,
  },
]

export const leaveRequests: LeaveRequest[] = [
  { employee: 'Priya Sharma', type: 'Annual Leave', date: 'May 20-24', status: 'Approved' },
  { employee: 'Rohan Mehta', type: 'Sick Leave', date: 'May 21', status: 'In Review' },
  { employee: 'Aayel Verma', type: 'Personal Leave', date: 'May 26-27', status: 'Pending' },
]

export const recentEmployees: RecentEmployee[] = [
  { name: 'Nora Patel', initials: 'NP', role: 'Product Designer', department: 'Design', status: 'Active' },
  { name: 'Omar Reed', initials: 'OR', role: 'Backend Engineer', department: 'Engineering', status: 'Active' },
  { name: 'Leah Chen', initials: 'LC', role: 'People Ops', department: 'HR', status: 'Onboarding' },
]

export const departmentShares: DepartmentShare[] = [
  { label: 'Engineering', count: 44, width: 'w-[76%]' },
  { label: 'Operations', count: 28, width: 'w-[48%]' },
  { label: 'Sales', count: 24, width: 'w-[42%]' },
  { label: 'People', count: 16, width: 'w-[28%]' },
]

export const dashboardActions = [
  { label: 'Add employee', icon: UserRoundPlus },
  { label: 'Upload payslip', icon: FileText },
]
