/**
 * Imari Screen component.
 * Safe area wrapper with themed background. Optional scroll and keyboard avoidance.
 */

import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../hooks/useTheme'

interface ScreenProps {
  children: React.ReactNode
  scrollable?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export function Screen({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const { COLORS } = useTheme()

  const bg = { backgroundColor: COLORS.background.primary }

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, bg, style]} edges={edges}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.accent.primary}
                  colors={[COLORS.accent.primary]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, bg, style]} edges={edges}>
      <View style={[styles.flex, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
})
