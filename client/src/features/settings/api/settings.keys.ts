export const settingsKeys = {
  all: ['settings'] as const,
  attendance: () => [...settingsKeys.all, 'attendance'] as const,
  company: () => [...settingsKeys.all, 'company'] as const,
  leave: () => [...settingsKeys.all, 'leave'] as const,
}
