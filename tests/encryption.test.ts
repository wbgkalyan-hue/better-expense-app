/**
 * Mobile App Encryption Tests
 *
 * Tests AES-256-GCM encrypt/decrypt with @noble/ciphers,
 * PBKDF2 key derivation, wire format, and cross-compatibility.
 */
import { describe, it, expect, beforeEach, vi } from "vitest"

// We import the functions that don't require Firebase interaction
// For initializeEncryption we test the lower-level encrypt/decrypt
import {
  encrypt,
  decrypt,
  encryptValue,
  decryptValue,
  isEncryptionReady,
  clearEncryption,
} from "@/services/encryption"

// Directly access the internal state via the init function
// We need to call initializeEncryption which hits Firebase,
// but we've mocked it. Let's also import it.
import { initializeEncryption, restoreEncryption } from "@/services/encryption"

describe("Mobile Encryption — Lifecycle", () => {
  beforeEach(async () => {
    await clearEncryption()
  })

  it("isEncryptionReady is false before init", () => {
    expect(isEncryptionReady()).toBe(false)
  })

  it("isEncryptionReady is true after init", async () => {
    await initializeEncryption("test-password")
    expect(isEncryptionReady()).toBe(true)
  })

  it("clearEncryption resets ready state", async () => {
    await initializeEncryption("test-password")
    expect(isEncryptionReady()).toBe(true)
    await clearEncryption()
    expect(isEncryptionReady()).toBe(false)
  })

  it("encrypt throws when not initialized", () => {
    expect(() => encrypt("hello")).toThrow("Encryption not initialized")
  })

  it("restoreEncryption works after init", async () => {
    await initializeEncryption("test-password")
    await clearEncryption()
    // SecureStore should have the key saved
    const restored = await restoreEncryption()
    expect(restored).toBe(true)
    expect(isEncryptionReady()).toBe(true)
  })
})

describe("Mobile Encryption — Encrypt / Decrypt", () => {
  beforeEach(async () => {
    await clearEncryption()
    await initializeEncryption("test-password-123!")
  })

  it("encrypts and decrypts a string", () => {
    const original = "Hello World"
    const encrypted = encrypt(original)
    expect(typeof encrypted).toBe("string")
    expect(encrypted).not.toBe(original)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it("encrypts and decrypts JSON values via encryptValue/decryptValue", () => {
    const num = 12345.67
    const enc = encryptValue(num)
    const dec = decryptValue<number>(enc)
    expect(dec).toBe(num)
  })

  it("encrypts and decrypts zero", () => {
    const enc = encryptValue(0)
    const dec = decryptValue<number>(enc)
    expect(dec).toBe(0)
  })

  it("encrypts and decrypts negative numbers", () => {
    const enc = encryptValue(-500.25)
    const dec = decryptValue<number>(enc)
    expect(dec).toBe(-500.25)
  })

  it("encrypts and decrypts a boolean", () => {
    const enc = encryptValue(true)
    const dec = decryptValue<boolean>(enc)
    expect(dec).toBe(true)
  })

  it("encrypts and decrypts null", () => {
    const enc = encryptValue(null)
    const dec = decryptValue<null>(enc)
    expect(dec).toBeNull()
  })

  it("encrypts and decrypts an object", () => {
    const obj = { amount: 1500, description: "Rent payment" }
    const enc = encryptValue(obj)
    const dec = decryptValue<typeof obj>(enc)
    expect(dec).toEqual(obj)
  })

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const e1 = encrypt("same value")
    const e2 = encrypt("same value")
    expect(e1).not.toBe(e2) // IVs differ
    expect(decrypt(e1)).toBe("same value")
    expect(decrypt(e2)).toBe("same value")
  })
})

describe("Mobile Encryption — Wire Format", () => {
  beforeEach(async () => {
    await clearEncryption()
    await initializeEncryption("test-password-123!")
  })

  it("output is base64(salt[16] + iv[12] + ciphertext)", () => {
    const encrypted = encrypt("test")
    const raw = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
    // Minimum: 16 (salt) + 12 (iv) + 16 (GCM auth tag) + >= 1 ciphertext byte
    expect(raw.length).toBeGreaterThanOrEqual(29)
  })

  it("first 16 bytes are the user salt", () => {
    const e1 = encrypt("aaa")
    const e2 = encrypt("bbb")
    const raw1 = Uint8Array.from(atob(e1), (c) => c.charCodeAt(0))
    const raw2 = Uint8Array.from(atob(e2), (c) => c.charCodeAt(0))
    const salt1 = Array.from(raw1.slice(0, 16))
    const salt2 = Array.from(raw2.slice(0, 16))
    expect(salt1).toEqual(salt2) // same session → same salt
  })
})

describe("Mobile Encryption — Unicode & Edge Cases", () => {
  beforeEach(async () => {
    await clearEncryption()
    await initializeEncryption("test-password-123!")
  })

  it("handles Unicode (Hindi + emoji)", () => {
    const original = "₹5,000 paid to स्विगी 🍕"
    const dec = decrypt(encrypt(original))
    expect(dec).toBe(original)
  })

  it("handles empty string", () => {
    const dec = decrypt(encrypt(""))
    expect(dec).toBe("")
  })

  it("handles very long strings", () => {
    const original = "x".repeat(10_000)
    const dec = decrypt(encrypt(original))
    expect(dec).toBe(original)
  })
})

describe("Mobile Encryption — Key Derivation Consistency", () => {
  it("same password derives the same key (encrypt then re-init, decrypt)", async () => {
    await clearEncryption()
    await initializeEncryption("my-password")
    const encrypted = encrypt("consistency check")

    await clearEncryption()
    // Re-derive with same password — should restore from SecureStore
    const restored = await restoreEncryption()
    expect(restored).toBe(true)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe("consistency check")
  })
})
