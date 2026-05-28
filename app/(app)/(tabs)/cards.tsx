import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { 
  SharedValue,
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolation, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Screen } from '../../../src/components/layout/Screen'
import { Text } from '../../../src/components/ui/Text'
import { Badge } from '../../../src/components/ui/Badge'
import { Button } from '../../../src/components/ui/Button'
import { ProgressBar } from '../../../src/components/ui/ProgressBar'
import { EmptyState } from '../../../src/components/ui/EmptyState'
import { VirtualCardDisplay } from '../../../src/components/cards/VirtualCardDisplay'
import { useVirtualCards } from '../../../src/hooks/useVirtualCards'
import { useTheme } from '../../../src/hooks/useTheme'
import { formatCurrency } from '../../../src/lib/utils/currency'
import { VirtualCard } from '../../../src/types/card.types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = 320
const GAP = 16
const SNAP_INTERVAL = CARD_WIDTH + GAP
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2

function CarouselItem({ 
  card, 
  index, 
  scrollX, 
  isFocused, 
  onPress 
}: { 
  card: VirtualCard, 
  index: number, 
  scrollX: SharedValue<number>, 
  isFocused: boolean, 
  onPress: () => void 
}) {
  const panX = useSharedValue(0)
  const panY = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!isFocused) return
      panX.value = e.translationX
      panY.value = e.translationY
    })
    .onEnd(() => {
      panX.value = withSpring(0)
      panY.value = withSpring(0)
    })

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)()
  })

  const composed = Gesture.Simultaneous(panGesture, tapGesture)

  const animatedStyle = useAnimatedStyle(() => {
    const offset = index * SNAP_INTERVAL
    const diff = scrollX.value - offset
    
    const scale = interpolate(diff, [-SNAP_INTERVAL, 0, SNAP_INTERVAL], [0.92, 1, 0.92], Extrapolation.CLAMP)
    const opacity = interpolate(diff, [-SNAP_INTERVAL, 0, SNAP_INTERVAL], [0.7, 1, 0.7], Extrapolation.CLAMP)
    
    const rotateY = interpolate(panX.value, [-60, 60], [-12, 12], Extrapolation.CLAMP)
    const rotateX = interpolate(panY.value, [-40, 40], [8, -8], Extrapolation.CLAMP)

    return {
      opacity,
      transform: [
        { perspective: 800 },
        { scale },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` }
      ]
    }
  })

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, { width: CARD_WIDTH, marginHorizontal: GAP / 2 }]}>
        <VirtualCardDisplay card={card} />
      </Animated.View>
    </GestureDetector>
  )
}

export default function CardsScreen() {
  const router = useRouter()
  const { COLORS, spacing } = useTheme()
  const { cards, isLoading } = useVirtualCards()
  
  const [focusedIndex, setFocusedIndex] = useState(0)
  const scrollX = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x
    },
  })

  const handleMomentumScrollEnd = useCallback((e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x
    const newIndex = Math.round(offsetX / SNAP_INTERVAL)
    setFocusedIndex(newIndex)
  }, [])

  if (!isLoading && cards.length === 0) {
    return (
      <Screen scrollable={true} style={{ paddingHorizontal: 0 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4] }}>
          <Text variant="h1" color={COLORS.text.primary}>My Cards</Text>
          <Text variant="caption" color={COLORS.text.secondary} style={{ marginTop: 2 }}>0 cards</Text>
        </View>
        <EmptyState 
          title="No cards yet" 
          description="Create a virtual card for safe online shopping" 
          icon={<Text style={{ fontSize: 36 }}>💳</Text>}
          action={{ label: 'Create New Card', onPress: () => router.push('/(app)/cards/create') }}
        />
      </Screen>
    )
  }

  const activeCard = cards[focusedIndex] || cards[0]

  return (
    <Screen scrollable={true} style={{ paddingHorizontal: 0 }} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4], marginBottom: spacing[6] }}>
        <Text variant="h1" color={COLORS.text.primary}>My Cards</Text>
        <Text variant="caption" color={COLORS.text.secondary} style={{ marginTop: 2 }}>
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </Text>
      </View>

      <View style={{ height: 220 }}>
        <Animated.FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING - GAP / 2 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item, index }) => (
            <CarouselItem 
              card={item} 
              index={index} 
              scrollX={scrollX} 
              isFocused={focusedIndex === index}
              onPress={() => router.push(`/(app)/cards/${item.id}` as any)}
            />
          )}
        />
      </View>

      {activeCard && (
        <View style={{ paddingHorizontal: spacing[6], marginTop: spacing[6], gap: spacing[6], flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            <Badge 
              label={activeCard.status.charAt(0) + activeCard.status.slice(1).toLowerCase()} 
              variant={activeCard.status === 'ACTIVE' ? 'success' : activeCard.status === 'FROZEN' ? 'info' : 'neutral'} 
              size="sm" 
            />
            <Text variant="caption" color={COLORS.text.secondary}>
              {activeCard.type === 'VIRTUAL_ONLY' ? 'Virtual Card' : 'Standard Card'}
            </Text>
          </View>

          {activeCard.spendingLimit !== null && (
            <View>
              <Text variant="body" color={COLORS.text.primary} style={{ marginBottom: spacing[3] }}>
                Spent today: <Text style={{ fontFamily: 'DMMono_500Medium' }}>{formatCurrency(activeCard.spentToday, activeCard.currency)}</Text> of <Text style={{ fontFamily: 'DMMono_500Medium' }}>{formatCurrency(activeCard.spendingLimit, activeCard.currency)}</Text> limit
              </Text>
              <ProgressBar 
                value={(activeCard.spentToday / activeCard.spendingLimit) * 100} 
                height={8} 
              />
            </View>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: spacing[6], paddingBottom: spacing[6], paddingTop: spacing[4] }}>
        <Button variant="secondary" fullWidth onPress={() => router.push('/(app)/cards/create')}>
          + Create New Card
        </Button>
      </View>
    </Screen>
  )
}
