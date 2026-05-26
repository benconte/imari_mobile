/**
 * Imari KeyboardView component.
 * KeyboardAvoidingView wrapper with platform-specific behavior.
 */

import React from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, type ViewStyle } from 'react-native'

interface KeyboardViewProps {
  children: React.ReactNode
  style?: ViewStyle
  offset?: number
}

export function KeyboardView({ children, style, offset = 0 }: KeyboardViewProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
})
