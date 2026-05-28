import React from 'react'
import { View, StyleSheet, SectionList, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Svg, Circle, Path } from 'react-native-svg'
import { Screen } from '../../src/components/layout/Screen'
import { Text } from '../../src/components/ui/Text'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { Divider } from '../../src/components/ui/Divider'
import { NotificationItem } from '../../src/components/notifications/NotificationItem'
import { useNotifications } from '../../src/hooks/useNotifications'
import { useTheme } from '../../src/hooks/useTheme'
import * as Haptics from 'expo-haptics'
import { Notification } from '../../src/types/notification.types'

const CheckmarkIllustration = ({ color }: { color: string }) => (
  <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <Circle cx="40" cy="40" r="40" fill={color} fillOpacity="0.2" />
    <Path 
      d="M25 40L35 50L55 30" 
      stroke={color} 
      strokeWidth="6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
)

export default function NotificationsScreen() {
  const router = useRouter()
  const { COLORS, spacing } = useTheme()
  const { sections, unreadCount, isLoading, refetch, markRead, markAllRead, dismiss } = useNotifications()

  const handleNotificationPress = async (notification: Notification) => {
    await markRead(notification.id)
    const { data, type } = notification
    switch (type) {
      case 'TRANSACTION_ALERT':
      case 'PAYMENT_CONFIRMATION':
        if (data?.transactionId) router.push(`/(app)/transaction/${data.transactionId}` as any)
        break
      case 'SAVINGS_UPDATE':
        if (data?.vaultId) router.push(`/(app)/savings/${data.vaultId}` as any)
        break
      case 'BUDGET_ALERT':
        router.push('/(app)/budget')
        break
      case 'SUBSCRIPTION_REMINDER':
        if (data?.subscriptionId) router.push(`/(app)/subscription/${data.subscriptionId}` as any)
        break
      case 'SECURITY_WARNING':
        router.push('/(app)/profile') // security settings
        break
      default:
        break // no navigation for PROMOTIONAL, FINANCIAL_INSIGHT
    }
  }

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await markAllRead()
  }

  return (
    <Screen scrollable={false} style={{ paddingHorizontal: 0 }}>
      <View style={[styles.header, { paddingHorizontal: spacing[6], paddingTop: spacing[4], paddingBottom: spacing[4] }]}>
        <Text variant="h1" color={COLORS.text.primary}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text variant="label" color={COLORS.accent.primary}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
            onDismiss={dismiss}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: COLORS.background.primary, paddingHorizontal: spacing[6], paddingVertical: spacing[2] }}>
            <Text variant="label" color={COLORS.text.secondary}>{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ flex: 1, marginTop: spacing[12] }}>
              <EmptyState 
                title="You're all caught up"
                description="No new notifications"
                icon={<CheckmarkIllustration color={COLORS.status.success} />}
              />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={refetch} 
            tintColor={COLORS.accent.primary}
            colors={[COLORS.accent.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: spacing[8] }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
})
