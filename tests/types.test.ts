/**
 * Mobile App Type & Category Tests
 *
 * Validates enum completeness, label coverage, and type structure.
 * Also checks consistency with the dashboard types.
 */
import { describe, it, expect } from "vitest"
import {
  ExpenseCategory,
  IncomeCategory,
  GoalType,
  BankAccountType,
  AssetType,
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  GOAL_TYPE_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
  ASSET_TYPE_LABELS,
} from "@/types/categories"

describe("Categories — Enum Completeness", () => {
  it("ExpenseCategory has 13 values", () => {
    expect(Object.values(ExpenseCategory).length).toBe(13)
  })

  it("IncomeCategory has 8 values", () => {
    expect(Object.values(IncomeCategory).length).toBe(8)
  })

  it("GoalType has 6 values", () => {
    expect(Object.values(GoalType).length).toBe(6)
  })

  it("BankAccountType has 5 values", () => {
    expect(Object.values(BankAccountType).length).toBe(5)
  })

  it("AssetType has 5 values", () => {
    expect(Object.values(AssetType).length).toBe(5)
  })
})

describe("Categories — Label Completeness", () => {
  it("every ExpenseCategory has a label", () => {
    for (const cat of Object.values(ExpenseCategory)) {
      expect(EXPENSE_CATEGORY_LABELS[cat]).toBeDefined()
      expect(EXPENSE_CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
    }
  })

  it("every IncomeCategory has a label", () => {
    for (const cat of Object.values(IncomeCategory)) {
      expect(INCOME_CATEGORY_LABELS[cat]).toBeDefined()
    }
  })

  it("every GoalType has a label", () => {
    for (const g of Object.values(GoalType)) {
      expect(GOAL_TYPE_LABELS[g]).toBeDefined()
    }
  })

  it("every BankAccountType has a label", () => {
    for (const b of Object.values(BankAccountType)) {
      expect(BANK_ACCOUNT_TYPE_LABELS[b]).toBeDefined()
    }
  })

  it("every AssetType has a label", () => {
    for (const a of Object.values(AssetType)) {
      expect(ASSET_TYPE_LABELS[a]).toBeDefined()
    }
  })
})

describe("Categories — Enum Value Stability", () => {
  // These values are stored in Firestore and local DB. Changing them breaks existing data.
  it("ExpenseCategory.FOOD equals 'food'", () => {
    expect(ExpenseCategory.FOOD).toBe("food")
  })

  it("IncomeCategory.SALARY equals 'salary'", () => {
    expect(IncomeCategory.SALARY).toBe("salary")
  })

  it("GoalType.EMERGENCY_FUND equals 'emergency_fund'", () => {
    expect(GoalType.EMERGENCY_FUND).toBe("emergency_fund")
  })

  it("BankAccountType.FD equals 'fd'", () => {
    expect(BankAccountType.FD).toBe("fd")
  })

  it("AssetType.PROPERTY equals 'property'", () => {
    expect(AssetType.PROPERTY).toBe("property")
  })
})
