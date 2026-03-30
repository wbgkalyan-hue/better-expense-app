/**
 * WatermelonDB Schema Tests
 *
 * Validates schema table definitions, column counts, indexed fields,
 * and consistency with the model classes.
 */
import { describe, it, expect } from "vitest"
import { schema } from "@/database/schema"

describe("Database Schema — Version", () => {
  it("schema version is 1", () => {
    expect(schema.version).toBe(1)
  })
})

describe("Database Schema — Table Existence", () => {
  const expectedTables = [
    "transactions",
    "broker_accounts",
    "investment_transactions",
    "goals",
    "notification_patterns",
    "bank_accounts",
    "assets",
    "networth_snapshots",
  ]

  for (const tableName of expectedTables) {
    it(`table '${tableName}' exists`, () => {
      const table = schema.tables[tableName]
      expect(table).toBeDefined()
    })
  }

  it("has exactly 8 tables", () => {
    expect(Object.keys(schema.tables).length).toBe(8)
  })
})

describe("Database Schema — Transactions Table", () => {
  it("has required columns", () => {
    const cols = schema.tables["transactions"].columnArray.map(
      (c: { name: string }) => c.name,
    )
    expect(cols).toContain("user_id")
    expect(cols).toContain("type")
    expect(cols).toContain("category")
    expect(cols).toContain("date")
    expect(cols).toContain("encrypted_amount")
    expect(cols).toContain("encrypted_description")
    expect(cols).toContain("is_synced")
    expect(cols).toContain("firestore_id")
  })

  it("user_id is indexed", () => {
    const col = schema.tables["transactions"].columnArray.find(
      (c: { name: string }) => c.name === "user_id",
    )
    expect(col?.isIndexed).toBe(true)
  })

  it("date is indexed", () => {
    const col = schema.tables["transactions"].columnArray.find(
      (c: { name: string }) => c.name === "date",
    )
    expect(col?.isIndexed).toBe(true)
  })
})

describe("Database Schema — Goals Table", () => {
  it("has priority and deadline columns", () => {
    const cols = schema.tables["goals"].columnArray.map(
      (c: { name: string }) => c.name,
    )
    expect(cols).toContain("priority")
    expect(cols).toContain("deadline")
    expect(cols).toContain("is_active")
    expect(cols).toContain("deducts_from_networth")
    expect(cols).toContain("encrypted_target_amount")
    expect(cols).toContain("encrypted_current_amount")
  })
})

describe("Database Schema — Every Table Has is_synced", () => {
  for (const [name, table] of Object.entries(schema.tables)) {
    it(`${name} has is_synced column`, () => {
      const cols = (table as any).columnArray.map(
        (c: { name: string }) => c.name,
      )
      expect(cols).toContain("is_synced")
    })
  }
})

describe("Database Schema — Every Table Has firestore_id", () => {
  for (const [name, table] of Object.entries(schema.tables)) {
    it(`${name} has firestore_id column`, () => {
      const cols = (table as any).columnArray.map(
        (c: { name: string }) => c.name,
      )
      expect(cols).toContain("firestore_id")
    })
  }
})

describe("Database Schema — Every Table Has user_id Indexed", () => {
  for (const [name, table] of Object.entries(schema.tables)) {
    it(`${name} has user_id indexed`, () => {
      const col = (table as any).columnArray.find(
        (c: { name: string }) => c.name === "user_id",
      )
      expect(col).toBeDefined()
      expect(col?.isIndexed).toBe(true)
    })
  }
})
