import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { Notification, NotificationType } from '../../types/notification.types'
import { relativeDate } from '../../lib/utils/date'

interface NotificationItemProps {
  notification: Notification
  onPress: (notification: Notification) => void
  onDismiss: (id: string) => void
}

const getIconConfig = (type: NotificationType) => {
  switch (type) {
    case 'TRANSACTION_ALERT': return { icon: 'swap-vert' as const, color: '#4F8EF7' }
    case 'SECURITY_WARNING': return { icon: 'security' as const, color: '#EF4444' }
    case 'SAVINGS_UPDATE': return { icon: 'savings' as const, color: '#10B981' }
    case 'BUDGET_ALERT': return { icon: 'insert-chart' as const, color: '#F0B429' }
    case 'PAYMENT_CONFIRMATION': return { icon: 'check-circle' as const, color: '#10B981' }
    case 'PROMOTIONAL': return { icon: 'card-giftcard' as const, color: '#8B5CF6' }
    case 'FINANCIAL_INSIGHT': return { icon: 'lightbulb' as const, color: '#4F8EF7' }
    case 'SUBSCRIPTION_REMINDER': return { icon: 'event' as const, color: '#F0B429' }
    case 'KYC_UPDATE': return { icon: 'verified-user' as const, color: '#10B981' }
    case 'CARD_ALERT': return { icon: 'credit-card' as const, color: '#4F8EF7' }
    default: return { icon: 'notifications' as const, color: '#9CA3AF' }
  }
}

export function NotificationItem({ notification, onPress, onDismiss }: NotificationItemProps) {
  const { COLORS } = useTheme()
  const translateX = useSharedValue(0)
  const itemHeight = useSharedValue<number | undefined>(undefined)
  const hasTriggeredHaptic = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      // Only allow swiping left
      if (e.translationX > 0) {
        translateX.value = 0
      } else {
        translateX.value = e.translationX
        
        // Trigger haptic when crossing the threshold
        if (translateX.value <= -80 && !hasTriggeredHaptic.value) {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
          hasTriggeredHaptic.value = true
        } else if (translateX.value > -80 && hasTriggeredHaptic.value) {
          hasTriggeredHaptic.value = false
        }
      }
    })
    .onEnd(() => {
      if (translateX.value < -80) {
        translateX.value = withTiming(-500, { duration: 200 }, () => {
          itemHeight.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(onDismiss)(notification.id)
          })
        })
      } else {
        translateX.value = withSpring(0)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }))

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value !== undefined ? itemHeight.value : 'auto',
    opacity: itemHeight.value !== undefined ? withTiming(0) : 1,
    overflow: 'hidden'
  }))

  const { icon, color } = getIconConfig(notification.type)
  const isUnread = !notification.isRead

  return (
    <Animated.View style={containerStyle}>
      <View style={[styles.backgroundView, { backgroundColor: COLORS.status.error }]}>
        <MaterialIcons name="delete" size={24} color="#FFF" style={{ marginRight: 24 }} />
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable 
            onPress={() => onPress(notification)}
            style={[
              styles.row, 
              { 
                backgroundColor: isUnread ? COLORS.background.secondary : COLORS.background.primary,
                borderLeftColor: isUnread ? COLORS.accent.primary : 'transparent'
              }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <MaterialIcons name={icon} size={24} color={color} />
            </View>
            
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text variant="label" color={COLORS.text.primary} style={{ flex: 1 }}>{notification.title}</Text>
                {isUnread && <View style={[styles.unreadDot, { backgroundColor: COLORS.accent.primary }]} />}
              </View>
              <Text variant="caption" color={COLORS.text.secondary} numberOfLines={2}>
                {notification.body}
              </Text>
              <Text variant="caption" color={COLORS.text.tertiary} style={{ marginTop: 4 }}>
                {relativeDate(notification.createdAt)}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  backgroundView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    padding: 16,
    minHeight: 72,
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  }
})
