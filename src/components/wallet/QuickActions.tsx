/**
 * QuickActions — 4 action buttons below the balance card.
 * SVG icons, haptic feedback, spring scale press animation.
 */

import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import Svg, { Path, Circle } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { spacing } from '../../theme/spacing'
import { radius } from '../../theme/radius'

interface QuickActionsProps {
  onSend: () => void
  onReceive: () => void
  onTopUp: () => void
  onScan: () => void
}

interface ActionButtonProps {
  label: string
  icon: React.ReactNode
  onPress: () => void
  accentColor: string
  accentMuted: string
}

function ActionButton({ label, icon, onPress, accentColor, accentMuted }: ActionButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  function handlePress() {
    scale.value = withSpring(0.92, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 12 })
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <TouchableOpacity style={styles.actionItem} onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.iconCircle, { backgroundColor: accentMuted }, animatedStyle]}>
        {icon}
      </Animated.View>
      <Text variant="caption" style={{ color: '#8C9BBC', marginTop: spacing[1] }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export function QuickActions({ onSend, onReceive, onTopUp, onScan }: QuickActionsProps) {
  const { COLORS } = useTheme()
  const accent = COLORS.accent.primary
  const accentMuted = COLORS.accent.primaryMuted

  return (
    <View style={styles.container}>
      <ActionButton
        label="Send"
        accentColor={accent}
        accentMuted={accentMuted}
        onPress={onSend}
        icon={
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M7 17L17 7M17 7H7M17 7v10" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        }
      />
      <ActionButton
        label="Receive"
        accentColor={accent}
        accentMuted={accentMuted}
        onPress={onReceive}
        icon={
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M17 7L7 17M7 17H17M7 17V7" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        }
      />
      <ActionButton
        label="Top Up"
        accentColor={accent}
        accentMuted={accentMuted}
        onPress={onTopUp}
        icon={
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={accent} strokeWidth={2} />
            <Path d="M12 8v8M8 12h8" stroke={accent} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        }
      />
      <ActionButton
        label="Scan"
        accentColor={accent}
        accentMuted={accentMuted}
        onPress={onScan}
        icon={
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM11 9h2v6h-2z" stroke={accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
