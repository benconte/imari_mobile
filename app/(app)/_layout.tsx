/**
 * Imari (app) Drawer Layout.
 * Wraps all authenticated routes. Drawer slides over tab content.
 *
 * KYC Guard: on mount checks kycStatus from /identity/profile.
 *   - IN_PROGRESS → /kyc-pending (blocks app access until approved)
 *   - NOT_STARTED / REJECTED → /kyc (must complete KYC first)
 *   - VERIFIED → allowed through
 *
 * IMPORTANT: react-native-gesture-handler must be imported at root _layout.tsx.
 */

import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Drawer } from 'expo-router/drawer'
import { router } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'
import { useAuth } from '../../src/hooks/useAuth'
import { DrawerContent } from '../../src/components/layout/DrawerContent'
import { Platform } from 'react-native'
import { api } from '../../src/lib/api'
import type { UserProfile } from '../../src/types/profile.types'

function useKycGuard() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return

    let cancelled = false
    const check = async () => {
      try {
        const { data } = await api.get<{ data: UserProfile }>('/identity/profile')
        if (cancelled) return
        const status = data.data.kycStatus
        if (status === 'IN_PROGRESS') {
          router.replace('/(app)/kyc-pending' as never)
        } else if (status !== 'VERIFIED') {
          router.replace('/(app)/kyc' as never)
        }
      } catch {
        // If profile fetch fails, let the user through — api.ts handles 401/logout
      }
    }
    check()
    return () => { cancelled = true }
  }, [isAuthenticated, isLoading])
}

export default function AppLayout() {
  const { COLORS } = useTheme()
  useKycGuard()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          drawerStyle: {
            width: '75%',
            backgroundColor: COLORS.drawer.background,
          },
          swipeEnabled: true,
          swipeEdgeWidth: Platform.OS === 'ios' ? 30 : 80,
          overlayColor: COLORS.background.overlay,
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ title: 'Home' }} />
        <Drawer.Screen name="budget" options={{ title: 'Budget' }} />
        <Drawer.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
        <Drawer.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
        <Drawer.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
        <Drawer.Screen name="kyc" options={{ title: 'Verify Identity', swipeEnabled: false }} />
        <Drawer.Screen name="kyc-pending" options={{ title: 'KYC Pending', swipeEnabled: false }} />
      </Drawer>
    </GestureHandlerRootView>
  )
}
