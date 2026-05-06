import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

interface LandingItem {
  title: string
  description: string
  icon: LucideIcon
}

interface LandingMetric {
  label: string
  value: string
  detail: string
  icon: LucideIcon
}

interface PreviewNavItem {
  label: string
  icon: LucideIcon
}

interface ChartPoint {
  x: number
  y: number
  value?: string
}

export const valuePoints: LandingItem[] = [
  {
    title: 'Secure & reliable',
    description: 'Role-aware access for sensitive employee records.',
    icon: ShieldCheck,
  },
  {
    title: 'Save valuable time',
    description: 'Automate daily admin workflows with less manual work.',
    icon: Zap,
  },
  {
    title: 'Smarter decisions',
    description: 'See attendance and team signals before they drift.',
    icon: CheckCircle2,
  },
]

export const modules: LandingItem[] = [
  {
    title: 'Employee Management',
    description: 'Centralize employee profiles, roles, and key details in one secure place.',
    icon: Users,
  },
  {
    title: 'Attendance Tracking',
    description: 'Track daily attendance and analyze patterns with clear visual reports.',
    icon: CalendarCheck,
  },
  {
    title: 'Leave Requests',
    description: 'Employees submit requests while admins review, approve, and keep history tidy.',
    icon: CheckCircle2,
  },
  {
    title: 'Payslips',
    description: 'Organize payslip records and keep private employee documents easy to find.',
    icon: FileText,
  },
  {
    title: 'Departments',
    description: 'Structure teams, departments, and reporting lines without spreadsheet sprawl.',
    icon: Building2,
  },
  {
    title: 'Role-Based Access',
    description: 'Keep admin controls separated from employee self-service workspaces.',
    icon: ShieldCheck,
  },
]

export const metrics: LandingMetric[] = [
  {
    label: 'Total Employees',
    value: '128',
    detail: '8 from last month',
    icon: Users,
  },
  {
    label: 'Present Today',
    value: '96',
    detail: '5 from yesterday',
    icon: Users,
  },
  {
    label: 'Pending Requests',
    value: '7',
    detail: '3 new requests',
    icon: Clock3,
  },
  {
    label: 'Departments',
    value: '12',
    detail: 'Active departments',
    icon: Building2,
  },
]

export const previewNavItems: PreviewNavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Employees',
    icon: Users,
  },
  {
    label: 'Departments',
    icon: Building2,
  },
  {
    label: 'Attendance',
    icon: CalendarCheck,
  },
  {
    label: 'Leave Requests',
    icon: CheckCircle2,
  },
  {
    label: 'Payslips',
    icon: FileText,
  },
  {
    label: 'Settings',
    icon: Settings,
  },
]

export const leaveRequestNames = ['Priya Sharma', 'Rohan Mehta', 'Aayel Verma', 'Karan Singh']

export const chartLabels = ['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18']

export const presentPoints: ChartPoint[] = [
  { x: 8, y: 72, value: '80' },
  { x: 54, y: 58, value: '90' },
  { x: 100, y: 62, value: '88' },
  { x: 146, y: 48, value: '95' },
  { x: 192, y: 54, value: '92' },
  { x: 238, y: 42, value: '98' },
  { x: 284, y: 46, value: '96' },
]

export const absentPoints: ChartPoint[] = [
  { x: 8, y: 104 },
  { x: 54, y: 96 },
  { x: 100, y: 100 },
  { x: 146, y: 92 },
  { x: 192, y: 98 },
  { x: 238, y: 88 },
  { x: 284, y: 94 },
]

export const gridLines = [24, 48, 72, 96, 120]

export const toChartPath = (points: ChartPoint[]) => points.map(({ x, y }) => `${x} ${y}`).join(' L')
