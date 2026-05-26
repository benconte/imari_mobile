/**
 * Imari custom TabBar.
 * Floating, glassmorphic pill with animated sliding indicator (Reanimated).
 * Haptic feedback on tab press. Icons via react-native-svg paths.
 */

import React, { useCallback } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useTheme } from '../../hooks/useTheme'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const TAB_HEIGHT = 64
const TAB_MARGIN_BOTTOM = 20
const TAB_MARGIN_HORIZONTAL = 16
const INDICATOR_SIZE = 40

// Inline SVG icon paths for the 5 tabs
type IconName = 'home' | 'transactions' | 'savings' | 'cards' | 'analytics'

function TabIcon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      )
    case 'transactions':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 16V4m0 0L3 8m4-4l4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M17 8v12m0 0l4-4m-4 4l-4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )
    case 'savings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M16 4h4v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 8v4l2.5 2.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )
    case 'cards':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={2} y={5} width={20} height={14} rx={2} stroke={color} strokeWidth={1.8} />
          <Path d="M2 10h20" stroke={color} strokeWidth={1.8} />
          <Rect x={5} y={14} width={4} height={2} rx={0.5} fill={color} />
        </Svg>
      )
    case 'analytics':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 20V12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8 20V8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M12 20V14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M16 20V6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M20 20V10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      )
  }
}

const TAB_ICON_NAMES: IconName[] = ['home', 'transactions', 'savings', 'cards', 'analytics']

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { COLORS, radius } = useTheme()
  const insets = useSafeAreaInsets()

  const tabCount = state.routes.length
  const indicatorX = useSharedValue(0)

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  const handleTabPress = useCallback(
    (routeName: string, index: number, isFocused: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const event = navigation.emit({
        type: 'tabPress',
        target: routeName,
        canPreventDefault: true,
      })

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName)
      }
    },
    [navigation],
  )

  // Update indicator position when active tab changes
  const tabWidth = (343 - TAB_MARGIN_HORIZONTAL * 0) / tabCount // approx, Reanimated handles exact

  React.useEffect(() => {
    const targetX = state.index * (tabWidth - INDICATOR_SIZE / tabCount)
    indicatorX.value = withSpring(targetX, { damping: 20, stiffness: 200 })
  }, [state.index, tabWidth, indicatorX])

  const bottomOffset = insets.bottom + TAB_MARGIN_BOTTOM

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: bottomOffset, marginHorizontal: TAB_MARGIN_HORIZONTAL },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={80}
          tint="dark"
          style={[styles.bar, { borderRadius: radius.xxl, borderColor: COLORS.border.subtle }]}
        >
          <TabBarContent
            state={state}
            descriptors={descriptors}
            COLORS={COLORS}
            indicatorStyle={indicatorStyle}
            handleTabPress={handleTabPress}
            radius={radius}
            tabCount={tabCount}
          />
        </BlurView>
      ) : (
        <View
          style={[
            styles.bar,
            {
              borderRadius: radius.xxl,
              backgroundColor: COLORS.tab.background,
              borderColor: COLORS.border.subtle,
            },
          ]}
        >
          <TabBarContent
            state={state}
            descriptors={descriptors}
            COLORS={COLORS}
            indicatorStyle={indicatorStyle}
            handleTabPress={handleTabPress}
            radius={radius}
            tabCount={tabCount}
          />
        </View>
      )}
    </View>
  )
}

function TabBarContent({
  state,
  descriptors,
  COLORS,
  indicatorStyle,
  handleTabPress,
  radius,
  tabCount,
}: {
  state: BottomTabBarProps['state']
  descriptors: BottomTabBarProps['descriptors']
  COLORS: ReturnType<typeof useTheme>['COLORS']
  indicatorStyle: ReturnType<typeof useAnimatedStyle>
  handleTabPress: (routeName: string, index: number, isFocused: boolean) => void
  radius: ReturnType<typeof useTheme>['radius']
  tabCount: number
}) {
  return (
    <View style={styles.tabRow}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index
        const iconName = TAB_ICON_NAMES[index] ?? 'home'

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => handleTabPress(route.name, index, isFocused)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={descriptors[route.key]?.options.title ?? route.name}
          >
            {isFocused && (
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: COLORS.accent.primaryMuted,
                    borderRadius: radius.full,
                  },
                ]}
              />
            )}
            <TabIcon
              name={iconName}
              color={isFocused ? COLORS.tab.active : COLORS.tab.inactive}
              size={22}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
  },
  bar: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
  },
})
