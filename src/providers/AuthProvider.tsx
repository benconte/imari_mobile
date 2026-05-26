/**
 * Imari AuthProvider.
 * Manages JWT auth state, hydrates from expo-secure-store on mount,
 * and injects the logout callback into the Axios interceptor.
 */

import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { storage } from '../lib/storage'
import { injectLogout } from '../lib/api'
import { STORAGE_KEYS } from '../lib/constants'
import type { User, AuthContextValue } from '../types/auth.types'

export const AuthContext = createContext<AuthContextValue | null>(null)

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const isHydrated = useRef(false)

  const logout = useCallback(async (): Promise<void> => {
    await storage.delete(STORAGE_KEYS.ACCESS_TOKEN)
    await storage.delete(STORAGE_KEYS.REFRESH_TOKEN)
    await storage.delete(STORAGE_KEYS.USER)
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
        const [token, userJson] = await Promise.all([
          storage.get(STORAGE_KEYS.ACCESS_TOKEN),
          storage.get(STORAGE_KEYS.USER),
        ])

        if (token && userJson) {
          const user = JSON.parse(userJson) as User
          setState({ user, accessToken: token, isAuthenticated: true, isLoading: false })
        } else {
          setState((prev) => ({ ...prev, isLoading: false }))
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
      setState({ user, accessToken, isAuthenticated: true, isLoading: false })
    },
    [],
  )

  const setUser = useCallback((user: User): void => {
    setState((prev) => ({ ...prev, user }))
    storage.set(STORAGE_KEYS.USER, JSON.stringify(user))
  }, [])

  const value: AuthContextValue = {
    user: state.user,
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
