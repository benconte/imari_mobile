/**
 * Imari Cards Screen — skeleton (full implementation in Session 7)
 */

import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { useTheme } from '../../../src/hooks/useTheme'

export default function CardsScreen() {
  const { COLORS, spacing } = useTheme()
  return (
    <Screen scrollable style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
      <Text variant="h1" color={COLORS.text.primary}>Cards</Text>
      <Text variant="body" color={COLORS.text.secondary} style={{ marginTop: spacing[2] }}>
        Virtual cards — coming in Session 7
      </Text>
    </Screen>
  )
}
