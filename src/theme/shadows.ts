/**
 * Imari shadow tokens.
 * iOS uses shadow* props; Android uses elevation.
 * Use the `shadow(size, isDark)` helper for cross-platform shadows.
 */

import type { ViewStyle } from 'react-native'

export type ShadowSize = 'sm' | 'md' | 'lg'

export interface ShadowTokens {
  sm: ViewStyle
  md: ViewStyle
  lg: ViewStyle
}

const iosShadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
}

const iosDarkShadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
}

const androidShadow: ShadowTokens = {
  sm: { elevation: 2 },
  md: { elevation: 6 },
  lg: { elevation: 14 },
}

export type Shadows = {
  ios: {
    light: ShadowTokens
    dark: ShadowTokens
  }
  android: ShadowTokens
  get(size: ShadowSize, isDark: boolean): ViewStyle
}

export const shadows: Shadows = {
  ios: {
    light: iosShadow,
    dark: iosDarkShadow,
  },
  android: androidShadow,
  get(size: ShadowSize, isDark: boolean): ViewStyle {
    // Platform detection handled at call site
    return isDark ? iosDarkShadow[size] : iosShadow[size]
  },
}
