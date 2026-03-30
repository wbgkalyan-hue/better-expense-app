/**
 * Password-manager-style AES-256-GCM encryption for local storage.
 *
 * Architecture:
 * - On login, a shared per-user salt is fetched from Firestore (or created).
 * - The salt + password are used via PBKDF2 to derive a 256-bit master key.
 * - The master key is stored in expo-secure-store (Android Keystore backed).
 * - All local data (WatermelonDB) is encrypted/decrypted with this key.
 * - On logout, the key is wiped — local data becomes unreadable blobs.
 * - Format: base64(salt[16] + iv[12] + ciphertext+authTag) — compatible with dashboard.
 * - The shared salt ensures both mobile and dashboard derive the same key.
 */

import { gcm } from "@noble/ciphers/aes.js"
import { pbkdf2 } from "@noble/hashes/pbkdf2.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { randomBytes } from "@noble/hashes/utils.js"
import * as SecureStore from "expo-secure-store"
import { firestore, auth } from "@/services/firebase"

const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 32 // 256 bits
const PBKDF2_ITERATIONS = 600_000 // OWASP recommended minimum

const KEY_ALIAS = "betterexpenses_master_key"
const SALT_ALIAS = "betterexpenses_user_salt"

// In-memory cache for the session
let masterKey: Uint8Array | null = null
let userSalt: Uint8Array | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

/**
 * Initialize encryption after user login.
 * Fetches (or creates) a shared per-user salt from Firestore so that
 * both mobile and dashboard derive the same key from the same password.
 */
export async function initializeEncryption(password: string): Promise<void> {
  let salt: Uint8Array

  // Try to get the shared salt from Firestore
  const user = auth().currentUser
  if (user) {
    try {
      const doc = await firestore()
        .collection("user_settings")
        .doc(user.uid)
        .get()
      const docData = doc.data()
      if (docData?.encryptionSalt) {
        salt = base64ToBytes(docData.encryptionSalt)
      } else {
        // First login — create shared salt
        salt = randomBytes(SALT_LENGTH)
        await firestore()
          .collection("user_settings")
          .doc(user.uid)
          .set({ encryptionSalt: bytesToBase64(salt) }, { merge: true })
      }
    } catch {
      // Offline fallback — use locally cached salt or generate
      const localSalt = await SecureStore.getItemAsync(SALT_ALIAS)
      salt = localSalt ? base64ToBytes(localSalt) : randomBytes(SALT_LENGTH)
    }
  } else {
    // No auth — use local salt
    const localSalt = await SecureStore.getItemAsync(SALT_ALIAS)
    salt = localSalt ? base64ToBytes(localSalt) : randomBytes(SALT_LENGTH)
  }

  // Cache salt locally for offline use
  await SecureStore.setItemAsync(SALT_ALIAS, bytesToBase64(salt))
  userSalt = salt

  // Derive master key via PBKDF2(SHA-256, 600k iterations)
  const derivedKey = pbkdf2(sha256, new TextEncoder().encode(password), userSalt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LENGTH,
  })
  masterKey = derivedKey

  // Store master key in SecureStore (hardware-backed Android Keystore)
  await SecureStore.setItemAsync(KEY_ALIAS, bytesToBase64(derivedKey))
}

/**
 * Restore encryption key from SecureStore (e.g., app restart while logged in).
 */
export async function restoreEncryption(): Promise<boolean> {
  const keyB64 = await SecureStore.getItemAsync(KEY_ALIAS)
  const saltB64 = await SecureStore.getItemAsync(SALT_ALIAS)
  if (keyB64 && saltB64) {
    masterKey = base64ToBytes(keyB64)
    userSalt = base64ToBytes(saltB64)
    return true
  }
  return false
}

/**
 * Clear encryption key on logout. Local data becomes unreadable.
 */
export async function clearEncryption(): Promise<void> {
  masterKey = null
  userSalt = null
  await SecureStore.deleteItemAsync(KEY_ALIAS)
  // Keep the salt — it's needed to re-derive the same key on next login
}

/**
 * Check if encryption is initialized and ready to use.
 */
export function isEncryptionReady(): boolean {
  return masterKey !== null && userSalt !== null
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt plaintext → base64(salt[16] + iv[12] + ciphertext+authTag).
 *
 * Uses the cached master key with the user's fixed salt.
 * Format is compatible with the dashboard's Web Crypto API implementation.
 */
export function encrypt(plaintext: string): string {
  if (!masterKey || !userSalt) {
    throw new Error("Encryption not initialized — user must be logged in")
  }

  const iv = randomBytes(IV_LENGTH)
  const encoded = new TextEncoder().encode(plaintext)

  const aes = gcm(masterKey, iv)
  const ciphertext = aes.encrypt(encoded)

  // Combine: salt[16] + iv[12] + ciphertext (GCM auth tag is appended by noble)
  const combined = new Uint8Array(
    userSalt.length + iv.length + ciphertext.length,
  )
  combined.set(userSalt, 0)
  combined.set(iv, userSalt.length)
  combined.set(ciphertext, userSalt.length + iv.length)

  return bytesToBase64(combined)
}

/**
 * Decrypt base64-encoded ciphertext → plaintext.
 *
 * Handles both:
 * - Mobile-encrypted data (uses cached master key when salt matches)
 * - Dashboard-encrypted data (derives key from password + embedded salt)
 */
export function decrypt(encoded: string, password?: string): string {
  const combined = base64ToBytes(encoded)

  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

  let key: Uint8Array

  // If salt matches our user salt, use the cached master key (fast path)
  if (masterKey && userSalt && salt.every((b, i) => b === userSalt![i])) {
    key = masterKey
  } else if (password) {
    // Different salt (e.g., dashboard-encrypted data) — derive key on the fly
    key = pbkdf2(sha256, new TextEncoder().encode(password), salt, {
      c: PBKDF2_ITERATIONS,
      dkLen: KEY_LENGTH,
    })
  } else {
    throw new Error("Cannot decrypt: salt mismatch and no password provided")
  }

  const aes = gcm(key, iv)
  const plaintext = aes.decrypt(ciphertext)

  return new TextDecoder().decode(plaintext)
}

/**
 * Encrypt a JSON-serializable value.
 */
export function encryptValue(value: unknown): string {
  return encrypt(JSON.stringify(value))
}

/**
 * Decrypt a JSON value.
 */
export function decryptValue<T>(encoded: string, password?: string): T {
  return JSON.parse(decrypt(encoded, password)) as T
}
