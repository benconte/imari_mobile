/**
 * Imari typography tokens.
 * DM Sans — UI labels, body text
 * DM Mono — numbers, balances, card numbers
 */

export const fontFamily = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  mono: 'DMMono_400Regular',
  monoBold: 'DMMono_500Medium',
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
  hero: 56,
} as const

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1.5,
} as const

export type Typography = {
  fontFamily: typeof fontFamily
  fontSize: typeof fontSize
  fontWeight: typeof fontWeight
  lineHeight: typeof lineHeight
  letterSpacing: typeof letterSpacing
}

export const typography: Typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
}
