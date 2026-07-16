export const authKeys = {
  config: () => ['auth', 'config'] as const,
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
}
