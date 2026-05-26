/**
 * Imari Providers — composite root.
 * Order: QueryProvider → ThemeProvider → AuthProvider → children
 */

import React from 'react'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
