/**
 * Imari Subscriptions Screen — skeleton (full implementation in Session 8)
 */

import { Screen } from '../../src/components/layout/Screen'
import { Text } from '../../src/components/ui/Text'
import { useTheme } from '../../src/hooks/useTheme'

export default function SubscriptionsScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <Text variant="h1" color={COLORS.text.primary}>Subscriptions</Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
        Subscription tracker
      </Text>
    </Screen>
  )
}
