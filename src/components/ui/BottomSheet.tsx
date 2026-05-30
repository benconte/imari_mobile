/**
 * Reusable animated bottom sheet.
 * Slides up from bottom with spring. Backdrop fades in/out.
 * Pan gesture on handle to dismiss.
 */


import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native'
import React, { useEffect, useCallback, useState } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated'
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler'
import { useTheme } from '../../hooks/useTheme'
import { Text } from './Text'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  snapPoints?: number[]
  children: React.ReactNode
  /** When true, sheet appears instantly without spring animation */
  disableAnimation?: boolean
}

function Backdrop({ opacity, onClose }: { opacity: SharedValue<number>; onClose: () => void }) {
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))
  return (
    <TouchableWithoutFeedback onPress={onClose} accessible={false}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, style]} />
    </TouchableWithoutFeedback>
  )
}

export function BottomSheet({
  visible,
  onClose,
  title,
  snapPoints = [300],
  children,
  disableAnimation = false,
}: BottomSheetProps) {
  const { COLORS } = useTheme()
  const sheetHeight = snapPoints[0]

  const translateY = useSharedValue(sheetHeight)
  const backdropOpacity = useSharedValue(0)

  const [modalVisible, setModalVisible] = useState(visible)

  const openSheet = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 200 })
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 })
  }, [backdropOpacity, translateY])

  const closeSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 })
    translateY.value = withSpring(sheetHeight, { damping: 18, stiffness: 200 }, () => {
      runOnJS(setModalVisible)(false)
      runOnJS(onClose)()
    })
  }, [backdropOpacity, translateY, sheetHeight, onClose])

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      if (disableAnimation) {
        backdropOpacity.value = withTiming(1, { duration: 150 })
        translateY.value = withTiming(0, { duration: 0 })
      } else {
        openSheet()
      }
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 })
      translateY.value = withTiming(sheetHeight, { duration: 200 }, () => {
        runOnJS(setModalVisible)(false)
      })
    }
  }, [visible, openSheet, closeSheet, backdropOpacity, translateY, sheetHeight, disableAnimation])

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
      }
    })
    .onEnd((e) => {
      if (e.translationY > sheetHeight * 0.4 || e.velocityY > 800) {
        runOnJS(closeSheet)()
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 })
      }
    })

  if (!modalVisible && !visible) return null

  return (
    <Modal visible={modalVisible} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Backdrop opacity={backdropOpacity} onClose={closeSheet} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: COLORS.background.primary, height: sheetHeight },
              sheetStyle,
            ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: COLORS.border.default }]} />
            </View>
          </GestureDetector>
          {title && (
            <Text variant="h3" style={styles.title}>
              {title}
            </Text>
          )}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingBottom: spacing[8],
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
  },
  title: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
})
