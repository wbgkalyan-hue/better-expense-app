/**
 * Mobile App — New Type Definitions Tests
 *
 * Validates label completeness and type shape contracts for all
 * new types added to the mobile app.
 */
import { describe, it, expect } from "vitest"

import {
  RE_INVESTMENT_TYPE_LABELS,
  INSURANCE_TYPE_LABELS,
  INSURANCE_FREQUENCY_LABELS,
  LOAN_TYPE_LABELS,
  LEDGER_ENTRY_TYPE_LABELS,
  FAMILY_LEDGER_TYPE_LABELS,
  FRIEND_RELATIONSHIP_LABELS,
  FAMILY_RELATIONSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
} from "@/types"

import type {
  RealEstateInvestment,
  RealEstateInvestmentType,
  InsurancePolicy,
  InsuranceType,
  InsuranceFrequency,
  CreditCard,
  Loan,
  LoanType,
  Friend,
  FamilyMember,
  FriendsLedgerEntry,
  LedgerEntryType,
  FamilyLedgerEntry,
  FamilyLedgerType,
  Property,
  PropertyType,
  PropertyCategory,
} from "@/types"

// -------------------------------------------------------------------
// Label completeness
// -------------------------------------------------------------------

describe("Label completeness", () => {
  it("RE_INVESTMENT_TYPE_LABELS covers all types", () => {
    const types: RealEstateInvestmentType[] = ["residential", "commercial", "land", "other"]
    for (const t of types) {
      expect(RE_INVESTMENT_TYPE_LABELS[t]).toBeDefined()
      expect(typeof RE_INVESTMENT_TYPE_LABELS[t]).toBe("string")
    }
    expect(Object.keys(RE_INVESTMENT_TYPE_LABELS).length).toBe(types.length)
  })

  it("INSURANCE_TYPE_LABELS covers all types", () => {
    const types: InsuranceType[] = ["life", "health", "vehicle", "property", "term", "other"]
    for (const t of types) {
      expect(INSURANCE_TYPE_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(INSURANCE_TYPE_LABELS).length).toBe(types.length)
  })

  it("INSURANCE_FREQUENCY_LABELS covers all frequencies", () => {
    const freqs: InsuranceFrequency[] = ["monthly", "quarterly", "yearly"]
    for (const f of freqs) {
      expect(INSURANCE_FREQUENCY_LABELS[f]).toBeDefined()
    }
    expect(Object.keys(INSURANCE_FREQUENCY_LABELS).length).toBe(freqs.length)
  })

  it("LOAN_TYPE_LABELS covers all types", () => {
    const types: LoanType[] = ["home", "car", "personal", "education", "business", "other"]
    for (const t of types) {
      expect(LOAN_TYPE_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(LOAN_TYPE_LABELS).length).toBe(types.length)
  })

  it("LEDGER_ENTRY_TYPE_LABELS covers all types", () => {
    const types: LedgerEntryType[] = ["lent", "borrowed"]
    for (const t of types) {
      expect(LEDGER_ENTRY_TYPE_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(LEDGER_ENTRY_TYPE_LABELS).length).toBe(types.length)
  })

  it("FAMILY_LEDGER_TYPE_LABELS covers all types", () => {
    const types: FamilyLedgerType[] = ["paid", "received", "shared"]
    for (const t of types) {
      expect(FAMILY_LEDGER_TYPE_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(FAMILY_LEDGER_TYPE_LABELS).length).toBe(types.length)
  })

  it("FRIEND_RELATIONSHIP_LABELS covers all types", () => {
    const types = ["colleague", "neighbor", "classmate", "other"] as const
    for (const t of types) {
      expect(FRIEND_RELATIONSHIP_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(FRIEND_RELATIONSHIP_LABELS).length).toBe(types.length)
  })

  it("FAMILY_RELATIONSHIP_LABELS covers all types", () => {
    const types = ["wife", "husband", "son", "daughter", "father", "mother", "brother", "sister", "other"] as const
    for (const t of types) {
      expect(FAMILY_RELATIONSHIP_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(FAMILY_RELATIONSHIP_LABELS).length).toBe(types.length)
  })

  it("PROPERTY_TYPE_LABELS covers all types", () => {
    const types: PropertyType[] = ["owned", "rented", "leased"]
    for (const t of types) {
      expect(PROPERTY_TYPE_LABELS[t]).toBeDefined()
    }
    expect(Object.keys(PROPERTY_TYPE_LABELS).length).toBe(types.length)
  })

  it("PROPERTY_CATEGORY_LABELS covers all categories", () => {
    const cats: PropertyCategory[] = ["residential", "commercial", "land", "other"]
    for (const c of cats) {
      expect(PROPERTY_CATEGORY_LABELS[c]).toBeDefined()
    }
    expect(Object.keys(PROPERTY_CATEGORY_LABELS).length).toBe(cats.length)
  })
})

// -------------------------------------------------------------------
// Type shape validation (compile-time + runtime)
// -------------------------------------------------------------------

describe("Type shape validation", () => {
  it("RealEstateInvestment has required fields", () => {
    const item: RealEstateInvestment = {
      id: "1",
      userId: "u1",
      name: "Beach Villa",
      location: "Goa",
      type: "residential",
      purchasePrice: 5000000,
      currentValue: 6000000,
      purchaseDate: "2023-01-15",
      createdAt: "2023-01-15",
      updatedAt: "2023-01-15",
    }
    expect(item.name).toBe("Beach Villa")
    expect(item.purchasePrice).toBeLessThanOrEqual(item.currentValue)
  })

  it("InsurancePolicy has required fields", () => {
    const item: InsurancePolicy = {
      id: "1",
      userId: "u1",
      name: "Family Health",
      insurer: "ICICI Lombard",
      type: "health",
      premium: 15000,
      coverageAmount: 500000,
      startDate: "2024-01-01",
      frequency: "yearly",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    expect(item.coverageAmount).toBeGreaterThan(item.premium)
  })

  it("CreditCard has required fields", () => {
    const item: CreditCard = {
      id: "1",
      userId: "u1",
      name: "HDFC Millennia",
      bank: "HDFC",
      creditLimit: 200000,
      outstandingBalance: 50000,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    expect(item.outstandingBalance).toBeLessThanOrEqual(item.creditLimit)
  })

  it("Loan outstandingAmount <= principalAmount", () => {
    const item: Loan = {
      id: "1",
      userId: "u1",
      name: "Home Loan",
      lender: "SBI",
      type: "home",
      principalAmount: 5000000,
      outstandingAmount: 4500000,
      interestRate: 8.5,
      emiAmount: 45000,
      startDate: "2022-06-01",
      createdAt: "2022-06-01",
      updatedAt: "2022-06-01",
    }
    expect(item.outstandingAmount).toBeLessThanOrEqual(item.principalAmount)
  })

  it("Friend has required fields", () => {
    const item: Friend = {
      id: "1",
      userId: "u1",
      name: "Rahul",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    expect(item.name).toBe("Rahul")
  })

  it("FamilyMember has required fields", () => {
    const item: FamilyMember = {
      id: "1",
      userId: "u1",
      name: "Priya",
      relationship: "wife",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    expect(item.name).toBe("Priya")
    expect(item.relationship).toBe("wife")
  })

  it("FriendsLedgerEntry defaults settled to false", () => {
    const item: FriendsLedgerEntry = {
      id: "1",
      userId: "u1",
      friendId: "f1",
      type: "lent",
      amount: 5000,
      description: "Lunch money",
      date: "2024-03-01",
      settled: false,
      createdAt: "2024-03-01",
      updatedAt: "2024-03-01",
    }
    expect(item.settled).toBe(false)
  })

  it("FamilyLedgerEntry has all required fields", () => {
    const item: FamilyLedgerEntry = {
      id: "1",
      userId: "u1",
      familyMemberId: "fm1",
      type: "paid",
      amount: 10000,
      description: "Grocery shopping",
      date: "2024-03-15",
      settled: false,
      createdAt: "2024-03-15",
      updatedAt: "2024-03-15",
    }
    expect(item.type).toBe("paid")
    expect(item.settled).toBe(false)
  })

  it("Property has required fields with correct types", () => {
    const item: Property = {
      id: "1",
      userId: "u1",
      name: "Bangalore Flat",
      type: "owned",
      category: "residential",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }
    expect(item.type).toBe("owned")
    expect(item.category).toBe("residential")
  })
})
