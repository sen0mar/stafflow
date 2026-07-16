import type {
  AttendanceListParams,
  SelfAttendanceListParams,
} from './attendance.api'

export const attendanceKeys = {
  all: () => ['attendance'] as const,
  list: (params: AttendanceListParams) =>
    [...attendanceKeys.lists(), params] as const,
  lists: () => [...attendanceKeys.all(), 'list'] as const,
  selfHistory: (params: SelfAttendanceListParams) =>
    [...attendanceKeys.self(), 'history', params] as const,
  selfToday: () => [...attendanceKeys.self(), 'today'] as const,
  self: () => [...attendanceKeys.all(), 'self'] as const,
}
