/**
 * Vitest setup for mobile app tests.
 *
 * Polyfill btoa/atob for Node.js and mock React Native modules.
 */
import { vi } from "vitest"

// Polyfill btoa / atob if missing
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str: string) => Buffer.from(str, "binary").toString("base64")
}
if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64: string) => Buffer.from(b64, "base64").toString("binary")
}

// Mock expo-secure-store
vi.mock("expo-secure-store", () => {
  const store = new Map<string, string>()
  return {
    getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      store.delete(key)
    }),
  }
})

// Mock @react-native-firebase
vi.mock("@react-native-firebase/auth", () => ({
  default: vi.fn(() => ({
    currentUser: { uid: "test-user-id" },
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  })),
}))

vi.mock("@react-native-firebase/firestore", () => {
  const mockCollection = {
    doc: vi.fn(() => ({
      get: vi.fn(async () => ({ data: () => null, exists: false })),
      set: vi.fn(),
    })),
  }
  return {
    default: vi.fn(() => ({
      collection: vi.fn(() => mockCollection),
    })),
  }
})

vi.mock("@react-native-firebase/app", () => ({
  default: {},
}))

// Mock services/firebase
vi.mock("@/services/firebase", () => ({
  firebase: {},
  auth: vi.fn(() => ({
    currentUser: { uid: "test-user-id" },
  })),
  firestore: Object.assign(
    vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => ({ data: () => null, exists: false })),
          set: vi.fn(),
        })),
        add: vi.fn(async () => ({ id: "mock-firestore-id" })),
      })),
    })),
    { FieldValue: { serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP") } },
  ),
}))
