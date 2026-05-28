/**
 * Top-up redirect — navigates to the wallet fund screen.
 * The full funding flow is implemented at /(app)/wallet/fund.
 */
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function TopUpRedirectScreen() {
  const router = useRouter()

  useEffect(() => {
    // Redirect immediately to the wallet fund screen
    router.replace('/(app)/wallet/fund' as never)
  }, [router])

  return null
}
