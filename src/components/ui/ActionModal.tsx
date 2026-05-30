/**
 * ActionModal — modern, animated action sheet modal.
 * Replaces Alert.alert() for every ⋮ (3-dots) menu in the app.
 *
 * Design: dark glassmorphism card, pill-shaped option rows,
 * spring open/close animation, haptic on option press.
 */

import React, { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionModalOption {
  label: string
  icon?: string
  description?: string
  onPress: () => void
  destructive?: boolean
}

interface ActionModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  options: ActionModalOption[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActionModal({
  visible,
  onClose,
  title,
  subtitle,
  options,
}: ActionModalProps) {
  const { COLORS } = useTheme()

  // Keep Modal mounted during closing animation
  const [mounted, setMounted] = useState(false)
  const translateY = useSharedValue(500)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      backdropOpacity.value = withTiming(1, { duration: 250 })
      translateY.value = withSpring(0, { damping: 22, stiffness: 240 })
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 })
      translateY.value = withSpring(500, { damping: 22, stiffness: 240 }, () => {
        // After animation finishes, unmount
        // Use JS thread setTimeout fallback
      })
      // Unmount after animation
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [visible])

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  if (!mounted && !visible) return null

  function handleOptionPress(opt: ActionModalOption) {
    Haptics.impactAsync(
      opt.destructive
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    )
    onClose()
    // Small delay so the sheet animates closed before the action fires
    setTimeout(() => opt.onPress(), 180)
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            backdropAnimStyle,
          ]}
        />
      </Pressable>

      {/* Sheet */}
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: COLORS.background.primary },
            sheetAnimStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleArea}>
            <View style={[styles.handle, { backgroundColor: COLORS.border.default }]} />
          </View>

          {/* Title block */}
          {(title || subtitle) && (
            <View style={styles.titleBlock}>
              {title && (
                <Text
                  variant="h3"
                  style={{ color: COLORS.text.primary, textAlign: 'center' }}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  variant="caption"
                  style={{
                    color: COLORS.text.secondary,
                    textAlign: 'center',
                    marginTop: spacing[1],
                  }}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          {/* Options card */}
          <View
            style={[
              styles.optionsCard,
              { backgroundColor: COLORS.background.secondary },
            ]}
          >
            {options.map((opt, idx) => (
              <View key={`${opt.label}-${idx}`}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: COLORS.border.subtle },
                    ]}
                  />
                )}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => handleOptionPress(opt)}
                  activeOpacity={0.65}
                >
                  {opt.icon !== undefined && (
                    <View style={styles.iconWrap}>
                      <Text style={styles.optionIcon}>{opt.icon}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="body"
                      style={{
                        color: opt.destructive
                          ? COLORS.status.error
                          : COLORS.text.primary,
                        fontFamily: opt.destructive
                          ? 'DMSans_700Bold'
                          : 'DMSans_500Medium',
                      }}
                    >
                      {opt.label}
                    </Text>
                    {opt.description && (
                      <Text
                        variant="caption"
                        style={{ color: COLORS.text.tertiary, marginTop: 2 }}
                      >
                        {opt.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: COLORS.background.secondary },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text
              variant="label"
              style={{ color: COLORS.text.secondary, textAlign: 'center' }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: spacing[10],
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
  },
  titleBlock: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    paddingTop: spacing[1],
  },
  optionsCard: {
    marginHorizontal: spacing[4],
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    minHeight: 60,
  },
  iconWrap: {
    width: 36,
    alignItems: 'center',
    marginRight: spacing[2],
  },
  optionIcon: {
    fontSize: 22,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[4] + 36 + spacing[2],
  },
  cancelButton: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
  },
})
