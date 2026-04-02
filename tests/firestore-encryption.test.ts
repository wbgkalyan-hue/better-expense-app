/**
 * Mobile Firestore Encryption Tests
 *
 * Verifies that encryptDoc / decryptDoc helpers in services/firestore.ts
 * correctly encrypt sensitive fields on write and decrypt them on read,
 * and that plaintext (legacy) documents pass through unmodified.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// -------------------------------------------------------------------
// Mock @react-native-firebase/firestore
// -------------------------------------------------------------------
const mockDocs = new Map<string, Record<string, unknown>>()
let addDocCounter = 0

const mockGet = vi.fn(async () => ({
  docs: Array.from(mockDocs.entries()).map(([id, data]) => ({
    id,
    data: () => data,
  })),
}))

const mockAdd = vi.fn(async (data: Record<string, unknown>) => {
  const id = `mob-id-${++addDocCounter}`
  mockDocs.set(id, data)
  return { id }
})

const mockFirestoreInstance = {
  collection: vi.fn(() => ({
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({ get: mockGet })),
      get: mockGet,
    })),
    add: mockAdd,
  })),
}

// React Native Firebase accesses FieldValue as a static on the function itself:
// firestore.FieldValue.serverTimestamp() — not on the instance.
vi.mock("@/services/firebase", () => {
  const mockFirestoreFn = vi.fn(() => mockFirestoreInstance) as any
  mockFirestoreFn.FieldValue = { serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP") }
  return {
    firestore: mockFirestoreFn,
    auth: vi.fn(() => ({ currentUser: { uid: "u1" } })),
  }
})

// -------------------------------------------------------------------
// Mock encryption — transparent ENC() wrapper
// -------------------------------------------------------------------
vi.mock("@/services/encryption", () => ({
  encryptValue: vi.fn((value: unknown) => `ENC(${JSON.stringify(value)})`),
  decryptValue: vi.fn(<T>(encoded: string): T => {
    const match = encoded.match(/^ENC\((.+)\)$/)
    if (match) return JSON.parse(match[1]) as T
    throw new Error("Not encrypted")
  }),
  isEncryptionReady: vi.fn(() => true),
}))

import { addTransaction, getTransactions } from "@/services/firestore"

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

describe("Mobile Firestore — encryptDoc on write", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
    mockGet.mockClear()
    mockAdd.mockClear()
  })

  it("addTransaction wraps sensitive fields in ENC() when encryption is ready", async () => {
    await addTransaction({
      userId: "u1",
      amount: 500,
      type: "expense",
      category: "food" as any,
      description: "Lunch",
      date: "2026-03-28",
      source: "manual",
    })

    const stored = mockDocs.get("mob-id-1")
    expect(stored).toBeDefined()
    // Sensitive fields must be encrypted
    expect(String(stored!.amount)).toMatch(/^ENC\(/)
    expect(String(stored!.description)).toMatch(/^ENC\(/)
    // Non-sensitive fields must be plain
    expect(stored!.type).toBe("expense")
    expect(stored!.date).toBe("2026-03-28")
    // _encrypted flag must be set
    expect(stored!._encrypted).toBe(true)
  })

  it("addTransaction preserves non-sensitive fields exactly", async () => {
    await addTransaction({
      userId: "u1",
      amount: 200,
      type: "expense",
      category: "transport" as any,
      description: "Uber",
      date: "2026-04-01",
      source: "auto",
    })

    const stored = mockDocs.get("mob-id-1")
    expect(stored!.userId).toBe("u1")
    expect(stored!.type).toBe("expense")
    expect(stored!.category).toBe("transport")
    expect(stored!.source).toBe("auto")
    expect(stored!.date).toBe("2026-04-01")
    expect(stored!.createdAt).toBe("SERVER_TIMESTAMP")
  })
})

describe("Mobile Firestore — decryptDoc on read", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
    mockGet.mockClear()
  })

  it("getTransactions decrypts ENC() wrapped sensitive fields", async () => {
    mockDocs.set("t1", {
      userId: "u1",
      amount: "ENC(500)",
      description: '"ENC(\\"Lunch\\")"' === '"ENC(\\"Lunch\\")"'
        ? `ENC("Lunch")`
        : `ENC("Lunch")`,
      merchant: null,
      type: "expense",
      category: "food",
      date: "2026-03-28",
      source: "manual",
      _encrypted: true,
      createdAt: "2026-03-28",
      updatedAt: "2026-03-28",
    })

    const txns = await getTransactions()
    expect(txns.length).toBe(1)
    expect(txns[0].amount).toBe(500)
    // _encrypted flag must be stripped from result
    expect((txns[0] as any)._encrypted).toBeUndefined()
  })

  it("getTransactions filters out docs whose decryption fails", async () => {
    mockDocs.set("t1", {
      userId: "u1",
      amount: "CORRUPT",
      description: "CORRUPT",
      _encrypted: true,
      date: "2026-03-28",
      type: "expense",
      category: "food",
      source: "manual",
      createdAt: "2026-03-28",
      updatedAt: "2026-03-28",
    })

    const { decryptValue } = await import("@/services/encryption")
    vi.mocked(decryptValue).mockImplementationOnce(() => {
      throw new Error("bad cipher")
    })

    const txns = await getTransactions()
    expect(txns.length).toBe(0)
  })
})

describe("Mobile Firestore — plaintext passthrough", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
    mockGet.mockClear()
  })

  it("getTransactions returns non-encrypted docs as-is", async () => {
    mockDocs.set("t1", {
      userId: "u1",
      amount: 300,
      description: "Coffee",
      type: "expense",
      category: "food",
      date: "2026-03-28",
      source: "manual",
      createdAt: "2026-03-28",
      updatedAt: "2026-03-28",
      // No _encrypted flag
    })

    const txns = await getTransactions()
    expect(txns.length).toBe(1)
    expect(txns[0].amount).toBe(300)
    expect(txns[0].description).toBe("Coffee")
  })

  it("getTransactions returns mix of encrypted and plaintext docs", async () => {
    mockDocs.set("t1", {
      userId: "u1", amount: 100, description: "Tea",
      type: "expense", category: "food", date: "2026-03-27",
      source: "manual", createdAt: "2026-03-27", updatedAt: "2026-03-27",
    })
    mockDocs.set("t2", {
      userId: "u1", amount: "ENC(200)", description: `ENC("Dinner")`,
      type: "expense", category: "food", date: "2026-03-28",
      source: "manual", _encrypted: true,
      createdAt: "2026-03-28", updatedAt: "2026-03-28",
    })

    const txns = await getTransactions()
    expect(txns.length).toBe(2)
  })
})
