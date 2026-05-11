import type {
  LeaveRequestListParams,
  LeaveTypeListParams,
  SelfLeaveRequestListParams,
} from './leave.api'

export const leaveKeys = {
  all: () => ['leave'] as const,
  leaveTypes: () => [...leaveKeys.all(), 'types'] as const,
  leaveTypeList: (params: LeaveTypeListParams) => [...leaveKeys.leaveTypes(), 'list', params] as const,
  requestDetail: (id: string) => [...leaveKeys.requestDetails(), id] as const,
  requestDetails: () => [...leaveKeys.requests(), 'detail'] as const,
  requestList: (params: LeaveRequestListParams) => [...leaveKeys.requestLists(), params] as const,
  requestLists: () => [...leaveKeys.requests(), 'list'] as const,
  requests: () => [...leaveKeys.all(), 'requests'] as const,
  selfRequestList: (params: SelfLeaveRequestListParams) => [...leaveKeys.self(), 'requests', params] as const,
  self: () => [...leaveKeys.all(), 'self'] as const,
}
