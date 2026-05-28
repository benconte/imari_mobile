import React from 'react'
import { StyleSheet, View, TouchableOpacity, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useNavigation } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { spacing } from '../../theme/spacing'
import { APP_NAME } from '../../lib/constants'
import { useAuth } from '../../hooks/useAuth'

export function Header() {
  const { COLORS } = useTheme()
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  // For a personalized touch if we wanted, or just the app name.
  // The user requested a "proper app header".
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[2], backgroundColor: COLORS.background.primary }]}>
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Open drawer menu"
        accessibilityRole="button"
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 6h16M4 12h16M4 18h16"
            stroke={COLORS.text.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      <Text variant="h2" style={[styles.title, { color: COLORS.text.primary }]}>
        {APP_NAME}
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(app)/notifications' as never)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel="Notifications"
        accessibilityRole="button"
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={COLORS.text.secondary}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent', // Make it seamless or add a subtle border
  },
  title: {
    fontFamily: 'DMSans_700Bold',
  },
})
