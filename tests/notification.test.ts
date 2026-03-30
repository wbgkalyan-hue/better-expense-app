/**
 * Notification Matching Tests
 *
 * Tests the notification → transaction matching logic, built-in templates,
 * custom pattern matching, and the pattern generator.
 */
import { describe, it, expect } from "vitest"
import {
  testPattern,
  NOTIFICATION_TEMPLATES,
} from "@/services/notification-templates"
import {
  matchNotification,
  generatePatternFromExample,
} from "@/services/notification-matcher"
import type { NotificationPattern } from "@/types"

// ---------------------------------------------------------------------------
// testPattern — low-level regex tester
// ---------------------------------------------------------------------------

describe("testPattern — Basic Matching", () => {
  it("extracts amount from simple Rs pattern", () => {
    const result = testPattern(
      "(?:Rs\\.?)\\s*([\\d,]+(?:\\.\\d{2})?)",
      "Rs.500.00 debited",
    )
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(500)
  })

  it("extracts amount with commas", () => {
    const result = testPattern(
      "(?:Rs\\.?)\\s*([\\d,]+(?:\\.\\d{2})?)",
      "Rs.1,25,000.00 credited",
    )
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(125000)
  })

  it("returns not matched for unrelated text", () => {
    const result = testPattern(
      "(?:Rs\\.?)\\s*([\\d,]+)",
      "Your OTP is 123456",
    )
    expect(result.matched).toBe(false)
  })

  it("handles invalid regex gracefully", () => {
    const result = testPattern("[invalid(", "test text")
    expect(result.matched).toBe(false)
  })

  it("handles empty pattern", () => {
    const result = testPattern("", "some text")
    // Empty regex matches everything but no capture group
    expect(result.matched).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Built-in Notification Templates
// ---------------------------------------------------------------------------

describe("NOTIFICATION_TEMPLATES — Structure", () => {
  it("has at least 10 templates", () => {
    expect(NOTIFICATION_TEMPLATES.length).toBeGreaterThanOrEqual(10)
  })

  it("every template has required fields", () => {
    for (const tmpl of NOTIFICATION_TEMPLATES) {
      expect(tmpl.id).toBeTruthy()
      expect(tmpl.name).toBeTruthy()
      expect(tmpl.brokerOrBank).toBeTruthy()
      expect(tmpl.regexPattern).toBeTruthy()
      expect(tmpl.exampleNotification).toBeTruthy()
      expect(tmpl.extractionFields).toContain("amount")
      expect(["broker", "bank", "upi"]).toContain(tmpl.category)
    }
  })

  it("template ids are unique", () => {
    const ids = NOTIFICATION_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("NOTIFICATION_TEMPLATES — Each Template Matches Its Example", () => {
  for (const tmpl of NOTIFICATION_TEMPLATES) {
    it(`${tmpl.name}: matches its own example`, () => {
      const result = testPattern(tmpl.regexPattern, tmpl.exampleNotification)
      expect(result.matched).toBe(true)
      expect(result.amount).toBeGreaterThan(0)
    })
  }
})

describe("NOTIFICATION_TEMPLATES — Specific Broker Tests", () => {
  it("Zerodha Kite: extracts 5000", () => {
    const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.id === "kite_zerodha")!
    const result = testPattern(
      tmpl.regexPattern,
      "Rs. 5,000.00 transferred to your Kite account via UPI",
    )
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(5000)
  })

  it("SBI: extracts 500", () => {
    const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.id === "sbi")!
    const result = testPattern(
      tmpl.regexPattern,
      "Your A/c XX1234 debited Rs.500.00 on 25Mar. SBI UPI Ref: 123456",
    )
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(500)
  })

  it("Google Pay: extracts 200", () => {
    const tmpl = NOTIFICATION_TEMPLATES.find((t) => t.id === "gpay")!
    const result = testPattern(
      tmpl.regexPattern,
      "You sent Rs.200 via Google Pay to Swiggy",
    )
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// matchNotification — pattern priority
// ---------------------------------------------------------------------------

describe("matchNotification — User Patterns First", () => {
  const userPatterns: NotificationPattern[] = [
    {
      id: "custom-1",
      userId: "u1",
      name: "My Custom Bank",
      brokerOrBank: "CustomBank",
      regexPattern: "(?:Rs\\.?)\\s*([\\d,]+(?:\\.\\d{2})?)\\s+.*CustomBank",
      isTemplate: false,
      extractionFields: ["amount"],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ]

  it("matches user pattern before built-in templates", () => {
    const result = matchNotification(
      "Rs.750 credited to CustomBank account",
      userPatterns,
    )
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(750)
    expect(result.brokerOrBank).toBe("CustomBank")
    expect(result.patternId).toBe("custom-1")
  })

  it("falls back to built-in templates when no user pattern matches", () => {
    const result = matchNotification(
      "You sent Rs.200 via Google Pay to Swiggy",
      userPatterns,
    )
    expect(result.matched).toBe(true)
    expect(result.brokerOrBank).toBe("Google Pay")
  })

  it("returns unmatched for random text", () => {
    const result = matchNotification(
      "Your OTP is 654321. Do not share with anyone.",
      userPatterns,
    )
    expect(result.matched).toBe(false)
    expect(result.rawText).toContain("OTP")
  })
})

// ---------------------------------------------------------------------------
// generatePatternFromExample
// ---------------------------------------------------------------------------

describe("generatePatternFromExample", () => {
  it("generates a pattern that matches the example amount", () => {
    const pattern = generatePatternFromExample(
      "Rs.1,500.00 deposited to MyBroker account",
      "MyBroker",
    )
    expect(typeof pattern).toBe("string")
    const result = testPattern(pattern, "Rs.1,500.00 deposited to MyBroker account")
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(1500)
  })

  it("generates a pattern that captures different amounts", () => {
    const pattern = generatePatternFromExample(
      "Rs.1,500.00 deposited to MyBroker account",
      "MyBroker",
    )
    // Test with a different amount in similar format
    const result = testPattern(pattern, "Rs.2,000.00 deposited to MyBroker account")
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(2000)
  })

  it("handles INR prefix", () => {
    const pattern = generatePatternFromExample(
      "INR 10000 added to TestBroker",
      "TestBroker",
    )
    const result = testPattern(pattern, "INR 10000 added to TestBroker")
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(10000)
  })

  it("handles ₹ symbol", () => {
    const pattern = generatePatternFromExample(
      "₹500 paid via TestUPI",
      "TestUPI",
    )
    const result = testPattern(pattern, "₹500 paid via TestUPI")
    expect(result.matched).toBe(true)
    expect(result.amount).toBe(500)
  })

  it("fallback for no recognized amount creates generic pattern", () => {
    const pattern = generatePatternFromExample(
      "Transaction completed for MyBroker",
      "MyBroker",
    )
    // Should still produce a valid regex string
    expect(typeof pattern).toBe("string")
    // Verify it's valid regex
    expect(() => new RegExp(pattern)).not.toThrow()
  })
})
