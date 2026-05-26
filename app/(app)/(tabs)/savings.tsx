/**
 * Imari Savings Screen — skeleton (full implementation in Session 5)
 */

import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { useTheme } from '../../../src/hooks/useTheme'

export default function SavingsScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <Text variant="h1" color={COLORS.text.primary}>Savings</Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
        Savings vaults — coming in Session 5
      </Text>
    </Screen>
  )
}
