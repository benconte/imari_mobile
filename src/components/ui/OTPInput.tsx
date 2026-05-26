/**
 * Imari OTPInput component.
 * 6 individual boxes, auto-advance, auto-focus previous on backspace, paste support.
 * Uses DM Mono font. Focus: indigo border + subtle glow.
 */

import React, { createRef, useCallback, useRef, useState } from 'react'
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native'
import { useTheme } from '../../hooks/useTheme'

const OTP_LENGTH = 6

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function OTPInput({ value, onChange, disabled = false }: OTPInputProps) {
  const { COLORS, radius, spacing } = useTheme()
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const inputRefs = useRef(Array.from({ length: OTP_LENGTH }, () => createRef<TextInput>()))

  const digits = value.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH).split('')

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Handle paste: if multiple chars entered at once
      const cleaned = text.replace(/\D/g, '')
      if (cleaned.length > 1) {
        const newValue = (value + cleaned).slice(0, OTP_LENGTH)
        onChange(newValue)
        const nextIndex = Math.min(newValue.length, OTP_LENGTH - 1)
        inputRefs.current[nextIndex]?.current?.focus()
        return
      }

      const newDigits = [...digits]
      newDigits[index] = cleaned
      const newValue = newDigits.join('').replace(/\s/g, '')
      onChange(newValue)

      if (cleaned && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.current?.focus()
      }
    },
    [digits, value, onChange],
  )

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        onChange(newDigits.join('').replace(/\s/g, ''))
        inputRefs.current[index - 1]?.current?.focus()
      }
    },
    [digits, onChange],
  )

  return (
    <View style={[styles.container, { gap: spacing[2] }]}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => {
        const isFocused = focusedIndex === index
        const hasValue = Boolean(digits[index]?.trim())

        return (
          <TextInput
            key={index}
            ref={inputRefs.current[index]}
            style={[
              styles.box,
              {
                width: 48,
                height: 58,
                borderRadius: radius.lg,
                borderColor: isFocused
                  ? COLORS.border.focus
                  : hasValue
                    ? COLORS.border.default
                    : COLORS.border.subtle,
                backgroundColor: COLORS.background.tertiary,
                color: COLORS.text.primary,
                fontFamily: 'DMMono_400Regular',
                fontSize: 22,
                // Subtle glow on focus (iOS shadow)
                ...(isFocused && {
                  shadowColor: COLORS.accent.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                }),
              },
            ]}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH} // allows paste
            value={digits[index] === ' ' ? '' : digits[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            editable={!disabled}
            selectTextOnFocus
            textAlign="center"
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    borderWidth: 1.5,
    textAlignVertical: 'center',
  },
})
