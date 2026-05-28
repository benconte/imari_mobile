import { useState, useEffect, useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Notification, NotificationPreference, NotificationSection } from '../types/notification.types'
import { mockNotifications, mockPreferences } from '../mocks/notifications.mock'
import { groupDateLabel } from '../lib/utils/date'

// Global in-memory state for mocks
let MOCK_DB = [...mockNotifications]
let PREFS_DB = { ...mockPreferences }

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      // Sort desc
      const sorted = [...MOCK_DB].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setNotifications(sorted)
      setIsLoading(false)
    }, 400)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = async (id: string) => {
    MOCK_DB = MOCK_DB.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
  }

  const markAllRead = async () => {
    const now = new Date().toISOString()
    MOCK_DB = MOCK_DB.map(n => ({ ...n, isRead: true, readAt: n.readAt || now }))
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt || now })))
  }

  const dismiss = async (id: string) => {
    MOCK_DB = MOCK_DB.filter(n => n.id !== id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Group by date
  const sectionsMap = new Map<string, Notification[]>()
  notifications.forEach(n => {
    const label = groupDateLabel(n.createdAt)
    if (!sectionsMap.has(label)) {
      sectionsMap.set(label, [])
    }
    sectionsMap.get(label)!.push(n)
  })

  const sections: NotificationSection[] = Array.from(sectionsMap.entries()).map(([title, data]) => ({
    title,
    data
  }))

  return {
    sections,
    unreadCount,
    isLoading,
    refetch: fetchNotifications,
    markRead,
    markAllRead,
    dismiss
  }
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setPreferences({ ...PREFS_DB })
      setIsLoading(false)
    }, 300)
  }, [])

  const update = async (prefs: Partial<NotificationPreference>) => {
    setIsUpdating(true)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        PREFS_DB = { ...PREFS_DB, ...prefs }
        setPreferences({ ...PREFS_DB })
        setIsUpdating(false)
        resolve()
      }, 500)
    })
  }

  return {
    preferences,
    isLoading,
    update,
    isUpdating
  }
}

export async function registerPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  try {
    const token = await Notifications.getExpoPushTokenAsync()
    // POST token to backend would go here
    console.log('Expo Push Token:', token.data)
    return token.data
  } catch (error) {
    console.warn('Failed to get push token:', error)
    return null
  }
}
