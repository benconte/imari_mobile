/**
 * Imari Analytics Screen — skeleton (full implementation in Session 9)
 */

import { Text } from '../../../src/components/ui/Text'
import { useTheme } from '../../../src/hooks/useTheme'
import { Screen } from '../../../src/components/layout/Screen'

export default function AnalyticsScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <Text variant="h1" color={COLORS.text.primary}>Analytics</Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
        Analytics dashboard
      </Text>
    </Screen>
  )
}
