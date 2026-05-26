/**
 * useAuth — returns the auth context.
 */

import { useContext } from 'react'
import { AuthContext } from '../providers/AuthProvider'
import type { AuthContextValue } from '../types/auth.types'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
