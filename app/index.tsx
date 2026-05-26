/**
 * Imari auth gate — redirects based on auth state.
 * No UI rendered. Splash stays visible while isLoading is true.
 */

import { Redirect } from 'expo-router'
import { useAuth } from '../src/hooks/useAuth'

export default function IndexPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Redirect href={'/(app)/(tabs)/home' as never} />
  }

  return <Redirect href={'/auth/login' as never} />
}
