/**
 * device.ts — collect and persist device info for backend auth.
 *
 * The backend stores a UserDevice row on every login.
 * We send: deviceId (stable UUID), deviceName, deviceType, platform,
 *          osVersion, appVersion, pushToken (Expo push token if permitted).
 *
 * deviceId is generated once and stored in SecureStore so the same
 * physical device always reports the same id across sessions.
 */

import * as Device from 'expo-device'
import * as Application from 'expo-application'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { storage } from './storage'
import { STORAGE_KEYS } from './constants'
import Constants from 'expo-constants';
import { push } from 'expo-router/build/global-state/routing'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: 'IOS' | 'ANDROID' | 'WEB'
  platform: string
  osVersion?: string
  appVersion?: string
  pushToken?: string
}

function getDeviceType(): 'IOS' | 'ANDROID' | 'WEB' {
  if (Platform.OS === 'ios') return 'IOS'
  if (Platform.OS === 'android') return 'ANDROID'
  return 'WEB'
}

/**
 * Get or generate a stable device ID stored in SecureStore.
 */
async function getOrCreateDeviceId(): Promise<string> {
  const stored = await storage.get(STORAGE_KEYS.DEVICE_ID)
  if (stored) return stored

  // Generate a UUID-like string without external deps
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

  await storage.set(STORAGE_KEYS.DEVICE_ID, id)
  return id
}

/**
 * Try to get the Expo push token if permission is already granted.
 * Does NOT request permission — that is done separately by registerPushNotifications()
 * after the user is authenticated. This silently reads the token if it's available.
 */
export async function getExistingPushToken(): Promise<string | undefined> {
  try {
    if (!Device.isDevice) return undefined
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return undefined
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.expoConfig?.extra?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    return tokenData.data
  } catch {
    return undefined
  }
}

/**
 * Collect device info for the login payload, including the Expo push token
 * if notification permission has already been granted on this device.
 *
 * Call once per login attempt — the result is safe to include in the body.
 */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getOrCreateDeviceId()

  const deviceName =
    Device.deviceName ?? Device.modelName ?? `${Platform.OS} device`

  const osVersion =
    Device.osVersion ?? Platform.Version?.toString()

  const appVersion =
    Application.nativeApplicationVersion ?? undefined

  // Include push token if already permitted — no permission prompt here
  const pushToken = await getExistingPushToken()
  console.log("pushToken:", pushToken);


  return {
    deviceId,
    deviceName,
    deviceType: getDeviceType(),
    platform: Platform.OS,
    osVersion,
    appVersion,
    ...(pushToken ? { pushToken } : {}),
  }
}
