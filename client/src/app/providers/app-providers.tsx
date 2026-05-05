import { QueryClientProvider } from '@tanstack/react-query'
import {
  ThemeProvider,
  type ThemeProviderProps,
} from 'next-themes'
import type { ComponentType, PropsWithChildren } from 'react'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '../query-client'
import { appRouter } from '../router/app-router'
import { Toaster } from '../../shared/components/ui/sonner'

const AppThemeProvider = ThemeProvider as ComponentType<PropsWithChildren<ThemeProviderProps>>

export const AppProviders = () => (
  <QueryClientProvider client={queryClient}>
    <AppThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={appRouter} />
      <Toaster richColors closeButton />
    </AppThemeProvider>
  </QueryClientProvider>
)
