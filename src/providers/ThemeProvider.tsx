/**
 * Imari ThemeProvider.
 * Provides scheme-aware COLORS proxy, isDark flag, and toggleTheme().
 * Theme override persisted in expo-secure-store.
 * Max 120 lines.
 */

import React, { createContext, useCallback, useEffect, useState } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import { lightColors, darkColors, type ColorPalette } from '../theme/colors'
import { typography, type Typography } from '../theme/typography'
import { spacing, type Spacing } from '../theme/spacing'
import { radius, type Radius } from '../theme/radius'
import { shadows, type Shadows } from '../theme/shadows'
import { storage } from '../lib/storage'
import { STORAGE_KEYS } from '../lib/constants'

export interface ThemeContextValue {
  scheme: 'light' | 'dark'
  isDark: boolean
  COLORS: ColorPalette
  typography: Typography
  spacing: Spacing
  radius: Radius
  shadows: Shadows
  toggleTheme(): void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'light'
  const [overrideScheme, setOverrideScheme] = useState<'light' | 'dark' | null>(null)

  // Hydrate override from storage on mount
  useEffect(() => {
    storage.get(STORAGE_KEYS.THEME_OVERRIDE).then((saved) => {
      console.log(saved)
      if (saved === 'light' || saved === 'dark') {
        setOverrideScheme(saved)
      }
    })
  }, [])

  const scheme: 'light' | 'dark' = overrideScheme ?? systemScheme
  // const isDark = scheme === 'dark'
  const isDark = false
  const COLORS: ColorPalette = isDark ? darkColors : lightColors

  const toggleTheme = useCallback(async () => {
    const next = isDark ? 'light' : 'dark'
    setOverrideScheme(next)
    await storage.set(STORAGE_KEYS.THEME_OVERRIDE, next)
  }, [isDark])

  const value: ThemeContextValue = {
    scheme,
    isDark,
    COLORS,
    typography,
    spacing,
    radius,
    shadows,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
