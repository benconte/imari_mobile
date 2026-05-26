/**
 * useColorScheme — SSR-safe wrapper around React Native's useColorScheme.
 * Returns 'light' as the default during SSR/server render to prevent hydration mismatch.
 */

import { useColorScheme as useRNColorScheme } from 'react-native'

export function useColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme()
  return scheme ?? 'light'
}
