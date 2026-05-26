/**
 * Imari secure storage wrapper.
 * Wraps expo-secure-store with a clean async interface.
 * All keys should come from STORAGE_KEYS in constants.ts.
 */

import * as SecureStore from 'expo-secure-store'

export const storage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value)
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {
      // Key may not exist — safe to ignore
    }
  },
}
