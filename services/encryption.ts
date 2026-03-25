import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"

const KEY_ALIAS = "betterexpenses_encryption_key"

/**
 * Get or generate the encryption key stored in the device secure enclave.
 */
export async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_ALIAS)
  if (!key) {
    key = Crypto.randomUUID()
    await SecureStore.setItemAsync(KEY_ALIAS, key)
  }
  return key
}

/**
 * Simple XOR-based obfuscation for the scaffold.
 * In production, replace with proper AES-256-GCM via a native crypto library.
 *
 * The key is stored securely in expo-secure-store (Keystore on Android).
 */
export function encrypt(plaintext: string, key: string): string {
  let result = ""
  for (let i = 0; i < plaintext.length; i++) {
    result += String.fromCharCode(
      plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    )
  }
  // Base64 encode for safe storage
  return btoa(result)
}

export function decrypt(ciphertext: string, key: string): string {
  const decoded = atob(ciphertext)
  let result = ""
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length),
    )
  }
  return result
}

export function encryptObject<T>(data: T, key: string): string {
  return encrypt(JSON.stringify(data), key)
}

export function decryptObject<T>(ciphertext: string, key: string): T {
  return JSON.parse(decrypt(ciphertext, key)) as T
}
