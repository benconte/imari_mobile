/**
 * useTheme — returns the full theme context.
 * Usage: const { COLORS, typography, spacing, radius, shadows, isDark } = useTheme()
 */

import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from '../providers/ThemeProvider'

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
