/**
 * Cross-Platform Compatibility Tests
 *
 * Validates that the mobile and dashboard encryption implementations
 * produce compatible wire formats and that shared types/enums are
 * consistent across both codebases.
 */
import { describe, it, expect } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"

const APP_TYPES = path.resolve(__dirname, "../types")
const DASHBOARD_TYPES = path.resolve(
  __dirname,
  "../../better-expense-dashboard/types",
)

const SHARED_TYPE_FILES = [
  "transaction.ts",
  "investment.ts",
  "goal.ts",
  "bank.ts",
  "asset.ts",
  "networth.ts",
  "user.ts",
  "categories.ts",
]

describe("Cross-Platform — Shared Type Files Exist in Both Projects", () => {
  for (const file of SHARED_TYPE_FILES) {
    it(`${file} exists in mobile app`, () => {
      expect(fs.existsSync(path.join(APP_TYPES, file))).toBe(true)
    })

    it(`${file} exists in dashboard`, () => {
      expect(fs.existsSync(path.join(DASHBOARD_TYPES, file))).toBe(true)
    })
  }
})

describe("Cross-Platform — Core Type Contents Match", () => {
  const coreFiles = [
    "transaction.ts",
    "bank.ts",
    "asset.ts",
    "networth.ts",
    "user.ts",
  ]

  for (const file of coreFiles) {
    it(`${file} is identical across projects`, () => {
      const appContent = fs.readFileSync(path.join(APP_TYPES, file), "utf-8")
      const dashContent = fs.readFileSync(
        path.join(DASHBOARD_TYPES, file),
        "utf-8",
      )
      expect(appContent.trim()).toBe(dashContent.trim())
    })
  }
})

describe("Cross-Platform — Category Enum Values Match", () => {
  it("categories.ts enum values are identical", () => {
    const appContent = fs.readFileSync(
      path.join(APP_TYPES, "categories.ts"),
      "utf-8",
    )
    const dashContent = fs.readFileSync(
      path.join(DASHBOARD_TYPES, "categories.ts"),
      "utf-8",
    )

    // Extract all enum values via regex
    const extractEnumValues = (content: string) => {
      const matches = content.match(/= "([^"]+)"/g)
      return matches?.map((m) => m.replace('= "', "").replace('"', "")) ?? []
    }

    const appValues = extractEnumValues(appContent)
    const dashValues = extractEnumValues(dashContent)
    expect(appValues).toEqual(dashValues)
  })
})

describe("Cross-Platform — Encryption Wire Format Spec", () => {
  // Both implementations use: base64( salt[16] + iv[12] + ciphertext+authTag )
  // These are structural verifications.

  it("both use SALT_LENGTH = 16", () => {
    const appEnc = fs.readFileSync(
      path.resolve(__dirname, "../services/encryption.ts"),
      "utf-8",
    )
    const dashEnc = fs.readFileSync(
      path.resolve(__dirname, "../../better-expense-dashboard/lib/encryption.ts"),
      "utf-8",
    )
    expect(appEnc).toContain("SALT_LENGTH = 16")
    expect(dashEnc).toContain("SALT_LENGTH = 16")
  })

  it("both use IV_LENGTH = 12", () => {
    const appEnc = fs.readFileSync(
      path.resolve(__dirname, "../services/encryption.ts"),
      "utf-8",
    )
    const dashEnc = fs.readFileSync(
      path.resolve(__dirname, "../../better-expense-dashboard/lib/encryption.ts"),
      "utf-8",
    )
    expect(appEnc).toContain("IV_LENGTH = 12")
    expect(dashEnc).toContain("IV_LENGTH = 12")
  })

  it("both use PBKDF2_ITERATIONS = 600_000", () => {
    const appEnc = fs.readFileSync(
      path.resolve(__dirname, "../services/encryption.ts"),
      "utf-8",
    )
    const dashEnc = fs.readFileSync(
      path.resolve(__dirname, "../../better-expense-dashboard/lib/encryption.ts"),
      "utf-8",
    )
    expect(appEnc).toContain("PBKDF2_ITERATIONS = 600_000")
    expect(dashEnc).toContain("PBKDF2_ITERATIONS = 600_000")
  })

  it("both use AES-GCM / AES-256", () => {
    const appEnc = fs.readFileSync(
      path.resolve(__dirname, "../services/encryption.ts"),
      "utf-8",
    )
    const dashEnc = fs.readFileSync(
      path.resolve(__dirname, "../../better-expense-dashboard/lib/encryption.ts"),
      "utf-8",
    )
    // Mobile uses gcm from @noble/ciphers
    expect(appEnc).toContain("gcm")
    expect(appEnc).toContain("KEY_LENGTH = 32")
    // Dashboard uses Web Crypto AES-GCM
    expect(dashEnc).toContain("AES-GCM")
    expect(dashEnc).toContain("KEY_LENGTH = 256")
  })
})
