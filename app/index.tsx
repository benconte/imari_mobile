/**
 * Imari auth gate — redirects based on auth + local verification state.
 *
 * Flow:
 *  1. isLoading → show nothing (splash stays visible)
 *  2. Not authenticated → login
 *  3. Authenticated + not locally verified → lock screen
 *  4. Authenticated + locally verified → app
 */

import { Redirect } from 'expo-router'
import { useAuth } from '../src/hooks/useAuth'

export default function IndexPage() {
  const { isAuthenticated, isLoading, isLocallyVerified, hasSeenOnboarding } = useAuth()

  if (isLoading) return null

  if (!hasSeenOnboarding) {
    return <Redirect href={'/onboarding' as never} />
  }

  if (!isAuthenticated) {
    return <Redirect href={'/auth/login' as never} />
  }

  // Authenticated but not yet passed the lock screen this session
  if (!isLocallyVerified) {
    return <Redirect href={'/lock' as never} />
  }

  return <Redirect href={'/(app)/(tabs)/home' as never} />
}
