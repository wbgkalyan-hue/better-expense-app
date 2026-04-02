/**
 * Mobile Firestore New Collections — Encryption Tests
 *
 * Verifies that addXxx / getXxx functions for all 9 new collections
 * correctly encrypt sensitive fields on write and decrypt on read.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// -------------------------------------------------------------------
// Mock Firestore
// -------------------------------------------------------------------
const mockDocs = new Map<string, Record<string, unknown>>()
let addDocCounter = 0

const mockDelete = vi.fn(async () => {})
const mockUpdate = vi.fn(async (data: Record<string, unknown>) => {})

const mockGet = vi.fn(async () => ({
  docs: Array.from(mockDocs.entries()).map(([id, data]) => ({
    id,
    data: () => data,
  })),
}))

const mockAdd = vi.fn(async (data: Record<string, unknown>) => {
  const id = `auto-id-${++addDocCounter}`
  mockDocs.set(id, data)
  return { id }
})

const mockFirestoreInstance = {
  collection: vi.fn(() => ({
    where: vi.fn(function () {
      const chain = {
        orderBy: vi.fn(() => ({ get: mockGet })),
        where: vi.fn(() => chain),
        get: mockGet,
      }
      return chain
    }),
    add: mockAdd,
    doc: vi.fn(() => ({
      delete: mockDelete,
      update: mockUpdate,
    })),
  })),
}

vi.mock("@/services/firebase", () => {
  const mockFirestoreFn = vi.fn(() => mockFirestoreInstance) as any
  mockFirestoreFn.FieldValue = { serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP") }
  return {
    firestore: mockFirestoreFn,
    auth: vi.fn(() => ({ currentUser: { uid: "u1" } })),
  }
})

vi.mock("@/services/encryption", () => ({
  encryptValue: vi.fn((value: unknown) => `ENC(${JSON.stringify(value)})`),
  decryptValue: vi.fn(<T>(encoded: string): T => {
    const match = encoded.match(/^ENC\((.+)\)$/)
    if (match) return JSON.parse(match[1]) as T
    throw new Error("Not encrypted")
  }),
  isEncryptionReady: vi.fn(() => true),
}))

import {
  addRealEstateInvestment,
  getRealEstateInvestments,
  deleteRealEstateInvestment,
  addInsurancePolicy,
  getInsurancePolicies,
  deleteInsurancePolicy,
  addCreditCard,
  getCreditCards,
  deleteCreditCard,
  addLoan,
  getLoans,
  deleteLoan,
  addFriend,
  getFriends,
  deleteFriend,
  addFamilyMember,
  getFamilyMembers,
  deleteFamilyMember,
  addFriendsLedgerEntry,
  getFriendsLedger,
  deleteFriendsLedgerEntry,
  addFamilyLedgerEntry,
  getFamilyLedger,
  deleteFamilyLedgerEntry,
  addProperty,
  getProperties,
  deleteProperty,
  addCustomCategory,
  getCustomCategories,
  deleteCustomCategory,
} from "@/services/firestore"

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function resetMocks() {
  mockDocs.clear()
  addDocCounter = 0
  mockGet.mockClear()
  mockAdd.mockClear()
  mockDelete.mockClear()
  mockUpdate.mockClear()
}

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

describe("Real Estate Investments", () => {
  beforeEach(resetMocks)

  it("addRealEstateInvestment encrypts sensitive fields", async () => {
    const id = await addRealEstateInvestment({
      userId: "u1",
      name: "Beach Villa",
      location: "Goa",
      type: "residential",
      purchasePrice: 5000000,
      currentValue: 6000000,
      monthlyRent: 25000,
      purchaseDate: "2023-01-15",
      notes: "Great location",
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.purchasePrice)).toMatch(/^ENC\(/)
    expect(String(stored.currentValue)).toMatch(/^ENC\(/)
    expect(String(stored.monthlyRent)).toMatch(/^ENC\(/)
    expect(String(stored.notes)).toMatch(/^ENC\(/)
    expect(stored.name).toBe("Beach Villa")
    expect(stored.location).toBe("Goa")
    expect(stored._encrypted).toBe(true)
  })

  it("getRealEstateInvestments decrypts sensitive fields", async () => {
    mockDocs.set("re1", {
      userId: "u1",
      name: "Beach Villa",
      location: "Goa",
      type: "residential",
      purchasePrice: 'ENC(5000000)',
      currentValue: 'ENC(6000000)',
      monthlyRent: 'ENC(25000)',
      purchaseDate: "2023-01-15",
      notes: 'ENC("Great location")',
      _encrypted: true,
      createdAt: "2023-01-15",
      updatedAt: "2023-01-15",
    })
    const items = await getRealEstateInvestments()
    expect(items.length).toBe(1)
    expect(items[0].purchasePrice).toBe(5000000)
    expect(items[0].currentValue).toBe(6000000)
    expect(items[0].name).toBe("Beach Villa")
  })

  it("deleteRealEstateInvestment calls delete", async () => {
    await deleteRealEstateInvestment("re1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Insurance Policies", () => {
  beforeEach(resetMocks)

  it("addInsurancePolicy encrypts sensitive fields", async () => {
    const id = await addInsurancePolicy({
      userId: "u1",
      name: "Family Health",
      insurer: "ICICI Lombard",
      type: "health",
      policyNumber: "POL123",
      premium: 15000,
      coverageAmount: 500000,
      startDate: "2024-01-01",
      frequency: "yearly",
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.policyNumber)).toMatch(/^ENC\(/)
    expect(String(stored.premium)).toMatch(/^ENC\(/)
    expect(String(stored.coverageAmount)).toMatch(/^ENC\(/)
    expect(stored.name).toBe("Family Health")
    expect(stored.insurer).toBe("ICICI Lombard")
  })

  it("getInsurancePolicies decrypts sensitive fields", async () => {
    mockDocs.set("ins1", {
      userId: "u1",
      name: "Family Health",
      insurer: "ICICI Lombard",
      type: "health",
      premium: "ENC(15000)",
      coverageAmount: "ENC(500000)",
      startDate: "2024-01-01",
      frequency: "yearly",
      _encrypted: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })
    const items = await getInsurancePolicies()
    expect(items.length).toBe(1)
    expect(items[0].premium).toBe(15000)
    expect(items[0].coverageAmount).toBe(500000)
  })

  it("deleteInsurancePolicy calls delete", async () => {
    await deleteInsurancePolicy("ins1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Credit Cards", () => {
  beforeEach(resetMocks)

  it("addCreditCard encrypts sensitive fields", async () => {
    const id = await addCreditCard({
      userId: "u1",
      name: "HDFC Millennia",
      bank: "HDFC",
      last4: "1234",
      creditLimit: 200000,
      outstandingBalance: 50000,
      minPayment: 5000,
      interestRate: 36,
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.last4)).toMatch(/^ENC\(/)
    expect(String(stored.creditLimit)).toMatch(/^ENC\(/)
    expect(String(stored.outstandingBalance)).toMatch(/^ENC\(/)
    expect(String(stored.minPayment)).toMatch(/^ENC\(/)
    expect(String(stored.interestRate)).toMatch(/^ENC\(/)
    expect(stored.name).toBe("HDFC Millennia")
    expect(stored.bank).toBe("HDFC")
  })

  it("getCreditCards decrypts sensitive fields", async () => {
    mockDocs.set("cc1", {
      userId: "u1",
      name: "HDFC Millennia",
      bank: "HDFC",
      creditLimit: "ENC(200000)",
      outstandingBalance: "ENC(50000)",
      _encrypted: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })
    const items = await getCreditCards()
    expect(items.length).toBe(1)
    expect(items[0].creditLimit).toBe(200000)
    expect(items[0].outstandingBalance).toBe(50000)
  })

  it("deleteCreditCard calls delete", async () => {
    await deleteCreditCard("cc1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Loans", () => {
  beforeEach(resetMocks)

  it("addLoan encrypts sensitive fields", async () => {
    const id = await addLoan({
      userId: "u1",
      name: "Home Loan – SBI",
      lender: "SBI",
      type: "home",
      principalAmount: 5000000,
      outstandingAmount: 4500000,
      interestRate: 8.5,
      emiAmount: 45000,
      startDate: "2022-06-01",
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.principalAmount)).toMatch(/^ENC\(/)
    expect(String(stored.outstandingAmount)).toMatch(/^ENC\(/)
    expect(String(stored.interestRate)).toMatch(/^ENC\(/)
    expect(String(stored.emiAmount)).toMatch(/^ENC\(/)
    expect(stored.name).toBe("Home Loan – SBI")
    expect(stored.lender).toBe("SBI")
  })

  it("getLoans decrypts sensitive fields", async () => {
    mockDocs.set("loan1", {
      userId: "u1",
      name: "Home Loan – SBI",
      lender: "SBI",
      type: "home",
      principalAmount: "ENC(5000000)",
      outstandingAmount: "ENC(4500000)",
      interestRate: "ENC(8.5)",
      emiAmount: "ENC(45000)",
      startDate: "2022-06-01",
      _encrypted: true,
      createdAt: "2022-06-01",
      updatedAt: "2022-06-01",
    })
    const items = await getLoans()
    expect(items.length).toBe(1)
    expect(items[0].principalAmount).toBe(5000000)
    expect(items[0].emiAmount).toBe(45000)
  })

  it("deleteLoan calls delete", async () => {
    await deleteLoan("loan1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Friends", () => {
  beforeEach(resetMocks)

  it("addFriend encrypts sensitive fields", async () => {
    const id = await addFriend({
      userId: "u1",
      name: "Rahul",
      phone: "9876543210",
      email: "rahul@example.com",
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.name)).toMatch(/^ENC\(/)
    expect(String(stored.phone)).toMatch(/^ENC\(/)
    expect(String(stored.email)).toMatch(/^ENC\(/)
  })

  it("getFriends decrypts sensitive fields", async () => {
    mockDocs.set("f1", {
      userId: "u1",
      name: 'ENC("Rahul")',
      phone: 'ENC("9876543210")',
      email: 'ENC("rahul@example.com")',
      _encrypted: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })
    const items = await getFriends()
    expect(items.length).toBe(1)
    expect(items[0].name).toBe("Rahul")
    expect(items[0].phone).toBe("9876543210")
  })

  it("deleteFriend calls delete", async () => {
    await deleteFriend("f1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Family Members", () => {
  beforeEach(resetMocks)

  it("addFamilyMember encrypts sensitive fields", async () => {
    const id = await addFamilyMember({
      userId: "u1",
      name: "Priya",
      relationship: "wife",
      phone: "9876543211",
      email: "priya@home.com",
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.name)).toMatch(/^ENC\(/)
    expect(String(stored.phone)).toMatch(/^ENC\(/)
    expect(String(stored.email)).toMatch(/^ENC\(/)
  })

  it("getFamilyMembers decrypts sensitive fields", async () => {
    mockDocs.set("fm1", {
      userId: "u1",
      name: 'ENC("Priya")',
      relationship: "wife",
      phone: 'ENC("9876543211")',
      _encrypted: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })
    const items = await getFamilyMembers()
    expect(items.length).toBe(1)
    expect(items[0].name).toBe("Priya")
  })

  it("deleteFamilyMember calls delete", async () => {
    await deleteFamilyMember("fm1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Friends Ledger", () => {
  beforeEach(resetMocks)

  it("addFriendsLedgerEntry encrypts sensitive fields", async () => {
    const id = await addFriendsLedgerEntry({
      userId: "u1",
      friendId: "f1",
      friendName: "Rahul",
      type: "lent",
      amount: 5000,
      description: "Lunch money",
      date: "2024-03-01",
      settled: false,
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.amount)).toMatch(/^ENC\(/)
    expect(String(stored.description)).toMatch(/^ENC\(/)
    expect(stored.type).toBe("lent")
    expect(stored.settled).toBe(false)
  })

  it("getFriendsLedger decrypts sensitive fields", async () => {
    mockDocs.set("fl1", {
      userId: "u1",
      friendId: "f1",
      type: "lent",
      amount: "ENC(5000)",
      description: 'ENC("Lunch money")',
      date: "2024-03-01",
      settled: false,
      _encrypted: true,
      createdAt: "2024-03-01",
      updatedAt: "2024-03-01",
    })
    const items = await getFriendsLedger()
    expect(items.length).toBe(1)
    expect(items[0].amount).toBe(5000)
    expect(items[0].description).toBe("Lunch money")
  })

  it("deleteFriendsLedgerEntry calls delete", async () => {
    await deleteFriendsLedgerEntry("fl1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Family Ledger", () => {
  beforeEach(resetMocks)

  it("addFamilyLedgerEntry encrypts sensitive fields", async () => {
    const id = await addFamilyLedgerEntry({
      userId: "u1",
      familyMemberId: "fm1",
      familyMemberName: "Priya",
      type: "paid",
      amount: 10000,
      description: "Grocery shopping",
      date: "2024-03-15",
      settled: false,
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.amount)).toMatch(/^ENC\(/)
    expect(String(stored.description)).toMatch(/^ENC\(/)
    expect(stored.type).toBe("paid")
  })

  it("getFamilyLedger decrypts sensitive fields", async () => {
    mockDocs.set("fl1", {
      userId: "u1",
      familyMemberId: "fm1",
      type: "paid",
      amount: "ENC(10000)",
      description: 'ENC("Grocery shopping")',
      date: "2024-03-15",
      settled: false,
      _encrypted: true,
      createdAt: "2024-03-15",
      updatedAt: "2024-03-15",
    })
    const items = await getFamilyLedger()
    expect(items.length).toBe(1)
    expect(items[0].amount).toBe(10000)
    expect(items[0].description).toBe("Grocery shopping")
  })

  it("deleteFamilyLedgerEntry calls delete", async () => {
    await deleteFamilyLedgerEntry("fl1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("Properties", () => {
  beforeEach(resetMocks)

  it("addProperty encrypts sensitive fields", async () => {
    const id = await addProperty({
      userId: "u1",
      name: "Bangalore Flat",
      address: "HSR Layout",
      type: "owned",
      category: "residential",
      currentValue: 8000000,
      purchasePrice: 6000000,
      monthlyRent: 30000,
      monthlyEmi: 45000,
    })
    expect(id).toBe("auto-id-1")
    const stored = mockDocs.get(id)!
    expect(String(stored.address)).toMatch(/^ENC\(/)
    expect(String(stored.currentValue)).toMatch(/^ENC\(/)
    expect(String(stored.purchasePrice)).toMatch(/^ENC\(/)
    expect(String(stored.monthlyRent)).toMatch(/^ENC\(/)
    expect(String(stored.monthlyEmi)).toMatch(/^ENC\(/)
    expect(stored.name).toBe("Bangalore Flat")
    expect(stored.type).toBe("owned")
    expect(stored.category).toBe("residential")
  })

  it("getProperties decrypts sensitive fields", async () => {
    mockDocs.set("prop1", {
      userId: "u1",
      name: "Bangalore Flat",
      address: 'ENC("HSR Layout")',
      type: "owned",
      category: "residential",
      currentValue: "ENC(8000000)",
      purchasePrice: "ENC(6000000)",
      _encrypted: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })
    const items = await getProperties()
    expect(items.length).toBe(1)
    expect(items[0].currentValue).toBe(8000000)
    expect(items[0].address).toBe("HSR Layout")
    expect(items[0].name).toBe("Bangalore Flat")
  })

  it("deleteProperty calls delete", async () => {
    await deleteProperty("prop1")
    expect(mockDelete).toHaveBeenCalled()
  })
})

// =====================================================================
// Custom Categories (no encryption)
// =====================================================================
describe("Firestore — Custom Categories", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
    vi.clearAllMocks()
  })

  it("addCustomCategory stores group, label, value", async () => {
    await addCustomCategory({
      userId: "u1",
      group: "expense_category",
      label: "Groceries",
      value: "groceries",
    })
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        group: "expense_category",
        label: "Groceries",
        value: "groceries",
      })
    )
  })

  it("getCustomCategories returns stored categories", async () => {
    mockDocs.set("cc1", {
      userId: "u1",
      group: "expense_category",
      label: "Groceries",
      value: "groceries",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    })
    const items = await getCustomCategories("u1", "expense_category")
    expect(items.length).toBe(1)
    expect(items[0].label).toBe("Groceries")
    expect(items[0].group).toBe("expense_category")
  })

  it("deleteCustomCategory calls delete", async () => {
    await deleteCustomCategory("cc1")
    expect(mockDelete).toHaveBeenCalled()
  })
})
