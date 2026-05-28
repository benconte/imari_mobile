import React, { useEffect } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './Text'
import { useTheme } from '../../hooks/useTheme'
import { useUIStore, ToastVariant } from '../../stores/ui.store'

const getIconAndColor = (variant: ToastVariant, COLORS: any) => {
  switch (variant) {
    case 'success': return { icon: 'check-circle' as const, color: COLORS.status.success }
    case 'error': return { icon: 'error' as const, color: COLORS.status.error }
    case 'warning': return { icon: 'warning' as const, color: COLORS.status.warning }
    case 'info':
    default: return { icon: 'info' as const, color: COLORS.status.info }
  }
}

export function Toast() {
  const { toast, hideToast } = useUIStore()
  const { COLORS, spacing, radius } = useTheme()
  const insets = useSafeAreaInsets()
  
  const translateY = useSharedValue(-100)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (toast?.visible) {
      translateY.value = withSpring(insets.top + spacing[4], { damping: 15 })
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withTiming(-100, { duration: 200 })
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [toast?.visible, insets.top, spacing, translateY, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!toast) return null

  const { icon, color } = getIconAndColor(toast.variant, COLORS)

  return (
    <Animated.View style={[styles.container, animatedStyle, { paddingHorizontal: spacing[4] }]} pointerEvents="box-none">
      <Pressable onPress={hideToast} style={[styles.toast, { backgroundColor: COLORS.background.secondary, borderRadius: radius.lg, shadowColor: '#000' }]}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        <Text variant="body" color={COLORS.text.primary} style={styles.message}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
  }
})
