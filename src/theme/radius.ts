/**
 * Imari border radius tokens.
 */

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const

export type Radius = typeof radius
