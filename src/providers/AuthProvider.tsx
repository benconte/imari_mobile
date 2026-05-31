/**
 * Imari AuthProvider.
 * Manages JWT auth state, hydrates from expo-secure-store on mount,
 * and injects the logout callback into the Axios interceptor.
 *
 * isPinSet — user-scoped flag for whether a wallet PIN has been set.
 * The backend PIN model (WalletPin) is keyed by userId (one PIN per user).
 * Backend does not yet return isPinSet in the login/profile responses,
 * so we manage it separately in MMKV and expose setIsPinSet() to update it
 * after a successful PIN setup or change.
 * TODO: once backend adds isPinSet to GET /identity/profile, hydrate from there.
 *
 * isLocallyVerified — in-memory flag. True after the user passes the lock
 * screen (biometrics/PIN). False on every cold app start. Not persisted.
 */

import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { injectLogout } from '../lib/api'
import { STORAGE_KEYS } from '../lib/constants'
import { storage } from '../lib/storage'
import type { AuthContextValue, User } from '../types/auth.types'

export const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Auth state ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const [isPinSet, setIsPinSetState] = useState<boolean>(false)
  // In-memory only — resets on every cold start, triggering the lock screen
  const [isLocallyVerified, setIsLocallyVerifiedState] = useState<boolean>(false)
  const isHydrated = useRef(false)

  const logout = useCallback(async (): Promise<void> => {
    await storage.delete(STORAGE_KEYS.ACCESS_TOKEN)
    await storage.delete(STORAGE_KEYS.REFRESH_TOKEN)
    await storage.delete(STORAGE_KEYS.USER)
    await storage.delete(STORAGE_KEYS.BIOMETRICS_ENABLED)
    // Reset isPinSet on logout so next user gets a clean state
    await storage.set(STORAGE_KEYS.IS_PIN_SET_KEY, 'false')
    setIsPinSetState(false)
    setIsLocallyVerifiedState(false)
    setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
  }, [])

  // Inject logout into Axios interceptor to break circular imports
  useEffect(() => {
    injectLogout(logout)
  }, [logout])

  // Hydrate auth state from secure storage on first mount
  useEffect(() => {
    if (isHydrated.current) return
    isHydrated.current = true

    const hydrate = async (): Promise<void> => {
      try {
        const [token, userJson, pinSetValue] = await Promise.all([
          storage.get(STORAGE_KEYS.ACCESS_TOKEN),
          storage.get(STORAGE_KEYS.USER),
          storage.get(STORAGE_KEYS.IS_PIN_SET_KEY),
        ])

        if (token && userJson) {
          const user = JSON.parse(userJson) as User
          setState({ user, accessToken: token, isAuthenticated: true, isLoading: false })
          // isLocallyVerified stays false — lock screen will prompt on next render
        } else {
          setState((prev) => ({ ...prev, isLoading: false }))
        }

        // Restore isPinSet from storage (synced from backend on login/profile)
        if (pinSetValue !== null) {
          setIsPinSetState(pinSetValue === 'true')
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    hydrate()
  }, [])

  const login = useCallback(
    async (accessToken: string, refreshToken: string, user: User): Promise<void> => {
      await storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      await storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
      await storage.set(STORAGE_KEYS.USER, JSON.stringify(user))
      // Sync isPinSet from the login response (backend returns this field)
      const pinSetValue = user.isPinSet ?? false
      setIsPinSetState(pinSetValue)
      await storage.set(STORAGE_KEYS.IS_PIN_SET_KEY, pinSetValue ? 'true' : 'false')
      // Fresh login counts as locally verified — user just authenticated with credentials/MFA
      setIsLocallyVerifiedState(true)
      setState({ user, accessToken, isAuthenticated: true, isLoading: false })
    },
    [],
  )

  const setUser = useCallback((user: User): void => {
    setState((prev) => ({ ...prev, user }))
    storage.set(STORAGE_KEYS.USER, JSON.stringify(user))
  }, [])

  /** Called after a successful POST /wallet/pin or PUT /wallet/pin. */
  const setIsPinSet = useCallback((value: boolean): void => {
    setIsPinSetState(value)
    storage.set(STORAGE_KEYS.IS_PIN_SET_KEY, value ? 'true' : 'false').catch(() => { })
  }, [])

  /** Called from the lock screen after biometric/PIN verification succeeds. */
  const setLocallyVerified = useCallback((value: boolean): void => {
    setIsLocallyVerifiedState(value)
  }, [])

  const value: AuthContextValue = {
    user: state.user,
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isPinSet,
    isLocallyVerified,
    login,
    logout,
    setUser,
    setIsPinSet,
    setLocallyVerified,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
