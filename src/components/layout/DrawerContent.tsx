/**
 * Imari DrawerContent.
 * Custom drawer sidebar: avatar + name + balance, nav items, version footer.
 * Dark luxury aesthetic — indigo accents on deep navy.
 */

import React from 'react'
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { type DrawerContentComponentProps } from '@react-navigation/drawer'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { Text } from '../ui/Text'
import { APP_NAME, APP_VERSION } from '../../lib/constants'

type DrawerRoute = {
  label: string
  icon: string
  route: string
}

const DRAWER_ITEMS: DrawerRoute[] = [
  { label: 'Analytics', icon: '◈', route: '/(app)/analytics' },
  { label: 'Budget', icon: '◎', route: '/(app)/budget' },
  { label: 'Subscriptions', icon: '⟳', route: '/(app)/subscriptions' },
  { label: 'Notifications', icon: '◐', route: '/(app)/notifications' },
  { label: 'Profile', icon: '◉', route: '/(app)/profile' },
]

export function DrawerContent({ state }: DrawerContentComponentProps) {
  const { COLORS, spacing, radius } = useTheme()
  const { user, logout } = useAuth()

  const activeRoute = state.routes[state.index]?.name ?? ''

  const handleNav = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(route as never)
  }

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    await logout()
    router.replace('/auth/login' as never)
  }

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'IM'

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: COLORS.drawer.background, paddingTop: spacing[12] },
      ]}
    >
      {/* Header — Avatar + Name */}
      <View style={[styles.header, { paddingHorizontal: spacing[6], marginBottom: spacing[8] }]}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: COLORS.accent.primaryMuted,
              borderColor: COLORS.accent.primary,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text variant="h3" color={COLORS.accent.primary}>
            {initials}
          </Text>
        </View>
        <Text variant="h3" color={COLORS.text.primary} style={{ marginTop: spacing[3] }}>
          {user ? `${user.firstName} ${user.lastName}` : APP_NAME}
        </Text>
        <Text variant="bodySmall" color={COLORS.text.secondary}>
          {user?.email ?? ''}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: COLORS.border.subtle, marginBottom: spacing[4] }]} />

      {/* Navigation Items */}
      <View style={[styles.nav, { paddingHorizontal: spacing[4] }]}>
        {DRAWER_ITEMS.map((item) => {
          const isActive = activeRoute.includes(item.route.split('/').pop() ?? '')
          return (
            <Pressable
              key={item.route}
              onPress={() => handleNav(item.route)}
              style={({ pressed }) => [
                styles.navItem,
                {
                  borderRadius: radius.lg,
                  backgroundColor: isActive ? COLORS.drawer.itemActiveBg : 'transparent',
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[4],
                  marginBottom: spacing[1],
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
            >
              <Text
                variant="label"
                style={{ fontSize: 18, marginRight: spacing[3] }}
                color={isActive ? COLORS.drawer.itemActive : COLORS.drawer.itemInactive}
              >
                {item.icon}
              </Text>
              <Text
                variant="body"
                color={isActive ? COLORS.drawer.itemActive : COLORS.drawer.itemInactive}
                style={{ fontFamily: 'DMSans_500Medium' }}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: COLORS.border.subtle, marginTop: spacing[4] }]} />

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.logoutBtn,
          { paddingHorizontal: spacing[8], paddingVertical: spacing[4], opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Text variant="body" color={COLORS.status.error} style={{ fontFamily: 'DMSans_500Medium' }}>
          ⇥  Sign out
        </Text>
      </Pressable>

      {/* Footer */}
      <View style={[styles.footer, { paddingHorizontal: spacing[8], paddingBottom: spacing[8] }]}>
        <Text variant="caption" color={COLORS.text.tertiary}>
          {APP_NAME} v{APP_VERSION}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'flex-start' },
  avatar: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  divider: { height: StyleSheet.hairlineWidth },
  nav: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center' },
  logoutBtn: {},
  footer: { marginTop: 'auto' },
})
