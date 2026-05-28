import React, { useEffect } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, withSequence } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { VirtualCard, RevealedCard } from '../../types/card.types'
import { Text } from '../ui/Text'
import { useTheme } from '../../hooks/useTheme'
import { MaterialIcons } from '@expo/vector-icons'

interface VirtualCardDisplayProps {
  card: VirtualCard
  revealed?: RevealedCard | null
  isRevealing?: boolean
  size?: 'full' | 'compact'
  style?: StyleProp<ViewStyle>
}

function ChipIcon() {
  return (
    <Svg width={40} height={30} viewBox="0 0 40 30" fill="none">
      <Rect x={2} y={2} width={36} height={26} rx={4} stroke="#F0B429" strokeWidth={1.5} />
      <Path d="M12 2v26M28 2v26M2 10h10M28 10h10M2 20h10M28 20h10" stroke="#F0B429" strokeWidth={1.5} />
    </Svg>
  )
}

function NetworkLogo() {
  return (
    <Svg width={44} height={28} viewBox="0 0 44 28" fill="none">
      <Circle cx={14} cy={14} r={14} fill="#FF0000" fillOpacity={0.8} />
      <Circle cx={30} cy={14} r={14} fill="#FF5F00" fillOpacity={0.8} />
    </Svg>
  )
}

const AnimatedDigit = ({ digit, index, isRevealing, revealed }: { digit: string, index: number, isRevealing: boolean, revealed: boolean }) => {
  const rotation = useSharedValue(0)
  
  useEffect(() => {
    if (revealed && !isRevealing) {
      rotation.value = 90
    } else if (isRevealing) {
      rotation.value = withDelay(index * 40, withSequence(
        withTiming(90, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ))
    } else {
      rotation.value = 0
    }
  }, [revealed, isRevealing, index, rotation])

  const style = useAnimatedStyle(() => ({
    transform: [{ rotateX: `${rotation.value}deg` }]
  }))

  return (
    <Animated.View style={style}>
      <Text style={[styles.cardNumber, { fontFamily: 'DMMono_400Regular' }]}>
        {digit}
      </Text>
    </Animated.View>
  )
}

export function VirtualCardDisplay({ card, revealed, isRevealing = false, size = 'full', style }: VirtualCardDisplayProps) {
  const { COLORS, radius } = useTheme()
  const isCompact = size === 'compact'
  const isFrozen = card.status === 'FROZEN'

  const formattedMasked = card.maskedNumber
  const panString = revealed ? revealed.pan : formattedMasked

  const renderCardNumber = () => {
    if (isCompact) {
      return <Text style={[styles.cardNumber, { fontSize: 16 }]}>{formattedMasked}</Text>
    }

    if (!revealed) {
      return <Text style={styles.cardNumber}>{formattedMasked}</Text>
    }

    const chars = panString.replace(/\s+/g, '').split('')
    return (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {chars.map((char, i) => (
          <React.Fragment key={i}>
            <AnimatedDigit digit={char} index={i} isRevealing={isRevealing} revealed={!!revealed} />
            {(i + 1) % 4 === 0 && i !== 15 && <View style={{ width: 8 }} />}
          </React.Fragment>
        ))}
      </View>
    )
  }

  const expiryStr = `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`

  return (
    <View style={[styles.container, isCompact && styles.containerCompact, style, isFrozen && { opacity: 0.5 }]}>
      <LinearGradient colors={['#0D1B3E', '#1A2F6B', '#0D1B3E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={['#4F8EF715', '#4F8EF730', '#4F8EF710']} style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', opacity: 0.04 }]} />

      {isFrozen && (
        <>
          <LinearGradient colors={['#B8D4FF20', '#E8F4FF30']} style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
            <MaterialIcons name="ac-unit" size={48} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 14, letterSpacing: 2, marginTop: 8, fontFamily: 'DMSans_700Bold' }}>FROZEN</Text>
          </View>
        </>
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>imari</Text>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{card.type}</Text>
          </View>
        </View>

        {!isCompact && (
          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <ChipIcon />
          </View>
        )}

        <View style={[styles.numberRow, isCompact && { marginTop: 'auto', marginBottom: 16 }]}>
          {renderCardNumber()}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.holderSection}>
            {!isCompact && <Text style={styles.label}>CARD HOLDER</Text>}
            <Text style={[styles.value, isCompact && { fontSize: 12 }]} numberOfLines={1}>{card.cardHolder}</Text>
          </View>
          
          {!isCompact && (
            <>
              <View style={styles.expirySection}>
                <Text style={styles.label}>EXPIRES</Text>
                <Text style={styles.value}>{expiryStr}</Text>
              </View>
              <View style={styles.cvvSection}>
                <Text style={styles.label}>CVV</Text>
                <Text style={styles.value}>{revealed ? revealed.cvv : '***'}</Text>
              </View>
            </>
          )}

          <View style={styles.networkLogo}>
            <NetworkLogo />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 200,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  containerCompact: {
    width: 160,
    height: 100,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordmark: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
  typeChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNumber: {
    color: '#FFF',
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: 'DMMono_400Regular',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  holderSection: {
    flex: 2,
  },
  expirySection: {
    flex: 1,
    alignItems: 'center',
  },
  cvvSection: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 4,
  },
  value: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'DMMono_400Regular',
    textTransform: 'uppercase',
  },
  networkLogo: {
    marginLeft: 8,
  },
})
