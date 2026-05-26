/**
 * device.ts — collect and persist device info for backend auth.
 *
 * The backend stores a UserDevice row on every login.
 * We send: deviceId (stable UUID), deviceName, deviceType, platform,
 *          osVersion, appVersion, fingerprint (basic), pushToken (future).
 *
 * deviceId is generated once and stored in SecureStore so the same
 * physical device always reports the same id across sessions.
 */

import * as Device from 'expo-device'
import * as Application from 'expo-application'
import { Platform } from 'react-native'
import { storage } from './storage'
import { STORAGE_KEYS } from './constants'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: 'IOS' | 'ANDROID' | 'WEB'
  platform: string
  osVersion?: string
  appVersion?: string
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
 * Collect device info for the login payload.
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

  return {
    deviceId,
    deviceName,
    deviceType: getDeviceType(),
    platform: Platform.OS,
    osVersion,
    appVersion,
  }
}
