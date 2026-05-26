/**
 * Imari Text component.
 * Thin wrapper around RN Text that applies theme typography automatically.
 */

import React from 'react'
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native'
import { useTheme } from '../../hooks/useTheme'

export type TextVariant =
  | 'hero'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'mono'
  | 'monoLg'

interface TextProps extends RNTextProps {
  variant?: TextVariant
  color?: string
}

export function Text({ variant = 'body', color, style, children, ...rest }: TextProps) {
  const { COLORS, typography } = useTheme()

  const variantStyle = variantStyles[variant]
  const textColor = color ?? COLORS.text.primary

  return (
    <RNText
      style={[
        styles.base,
        variantStyle,
        {
          fontFamily:
            variant === 'mono' || variant === 'monoLg'
              ? typography.fontFamily.mono
              : typography.fontFamily.sans,
          color: textColor,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  )
}

const variantStyles = StyleSheet.create({
  hero: { fontSize: 56, fontFamily: 'DMSans_700Bold', lineHeight: 67 },
  display: { fontSize: 40, fontFamily: 'DMSans_700Bold', lineHeight: 48 },
  h1: { fontSize: 32, fontFamily: 'DMSans_700Bold', lineHeight: 38 },
  h2: { fontSize: 24, fontFamily: 'DMSans_700Bold', lineHeight: 29 },
  h3: { fontSize: 20, fontFamily: 'DMSans_500Medium', lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 13, fontFamily: 'DMSans_500Medium', lineHeight: 16 },
  caption: { fontSize: 11, lineHeight: 16 },
  mono: { fontSize: 15, fontFamily: 'DMMono_400Regular', lineHeight: 22 },
  monoLg: { fontSize: 24, fontFamily: 'DMMono_400Regular', lineHeight: 29 },
})

const styles = StyleSheet.create({
  base: {
    fontFamily: 'DMSans_400Regular',
  },
})
