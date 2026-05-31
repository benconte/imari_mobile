/**
 * Imari Axios HTTP client.
 *
 * - Attaches Bearer token from secure storage on every request.
 * - On 401: attempts a single token refresh, retries original request.
 * - On refresh failure: calls the provided logout callback and rejects.
 *
 * NOTE: The logout callback must be injected via `injectLogout()` from
 * AuthProvider to avoid circular import issues.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_URL, API_TIMEOUT_MS, STORAGE_KEYS } from './constants'
import { storage } from './storage'

let logoutCallback: (() => Promise<void>) | null = null

export function injectLogout(fn: () => Promise<void>): void {
  logoutCallback = fn
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor — attach access token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.get(STORAGE_KEYS.ACCESS_TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// Track in-flight refresh to prevent duplicate calls
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processPendingQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  pendingQueue = []
}

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Do not intercept 401s for authentication endpoints
    const url = originalRequest.url || ''
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = await storage.get(STORAGE_KEYS.REFRESH_TOKEN)
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post<{
        data: { accessToken: string; refreshToken: string }
      }>(`${API_URL}/auth/refresh`, { refreshToken })

      const newAccessToken = data.data.accessToken
      await storage.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
      await storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken)

      processPendingQueue(null, newAccessToken)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      }
      return api(originalRequest)
    } catch (refreshError) {
      processPendingQueue(refreshError, null)
      await logoutCallback?.()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
