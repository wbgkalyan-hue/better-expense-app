/**
 * Mobile App Goal Engine Tests
 *
 * Tests priority-based networth allocation, funding conflicts,
 * and progress calculation.
 */
import { describe, it, expect } from "vitest"
import {
  calculateGoalAllocations,
  getTotalLockedByGoals,
} from "@/services/goal-engine"
import type { Goal } from "@/types"

function makeGoal(overrides: Partial<Goal>): Goal {
  return {
    id: "g1",
    userId: "u1",
    title: "Test Goal",
    type: "custom" as any,
    targetAmount: 100000,
    currentAmount: 0,
    priority: 1,
    isActive: true,
    deductsFromNetworth: false,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  }
}

describe("calculateGoalAllocations", () => {
  it("returns goals sorted by priority", () => {
    const goals = [
      makeGoal({ id: "g2", title: "Low", priority: 3 }),
      makeGoal({ id: "g1", title: "High", priority: 1 }),
      makeGoal({ id: "g3", title: "Mid", priority: 2 }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].title).toBe("High")
    expect(result[1].title).toBe("Mid")
    expect(result[2].title).toBe("Low")
  })

  it("calculates progress percentage correctly", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, currentAmount: 25000 }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].progressPercent).toBe(25)
  })

  it("caps progress at 100%", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, currentAmount: 150000 }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].progressPercent).toBe(100)
  })

  it("handles zero targetAmount without division error", () => {
    const goals = [
      makeGoal({ targetAmount: 0, currentAmount: 0 }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].progressPercent).toBe(0)
  })

  it("calculates remainingAmount", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, currentAmount: 60000 }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].remainingAmount).toBe(40000)
  })

  it("remainingAmount does not go negative", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, currentAmount: 150000 }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].remainingAmount).toBe(0)
  })

  it("deductsFromNetworth reduces available networth for lower priority goals", () => {
    const goals = [
      makeGoal({
        id: "g1",
        priority: 1,
        targetAmount: 200000,
        deductsFromNetworth: true,
      }),
      makeGoal({
        id: "g2",
        priority: 2,
        targetAmount: 100000,
        deductsFromNetworth: false,
      }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].availableNetworth).toBe(500000) // first sees full
    expect(result[1].availableNetworth).toBe(300000) // reduced by 200k
  })

  it("flags funding conflict when targetAmount exceeds available", () => {
    const goals = [
      makeGoal({
        id: "g1",
        priority: 1,
        targetAmount: 400000,
        deductsFromNetworth: true,
      }),
      makeGoal({
        id: "g2",
        priority: 2,
        targetAmount: 200000,
        deductsFromNetworth: true,
      }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[0].isFundingConflict).toBe(false) // 400k < 500k
    expect(result[1].isFundingConflict).toBe(true) // 200k > 100k remaining
  })

  it("inactive goals do not deduct from networth", () => {
    const goals = [
      makeGoal({
        id: "g1",
        priority: 1,
        targetAmount: 300000,
        deductsFromNetworth: true,
        isActive: false,
      }),
      makeGoal({
        id: "g2",
        priority: 2,
        targetAmount: 100000,
        deductsFromNetworth: true,
      }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    // g1 is inactive — should not deduct
    expect(result[1].availableNetworth).toBe(500000)
    expect(result[1].isFundingConflict).toBe(false)
  })

  it("available networth never goes below 0", () => {
    const goals = [
      makeGoal({
        id: "g1",
        priority: 1,
        targetAmount: 600000,
        deductsFromNetworth: true,
      }),
      makeGoal({
        id: "g2",
        priority: 2,
        targetAmount: 100000,
        deductsFromNetworth: true,
      }),
    ]
    const result = calculateGoalAllocations(goals, 500000)
    expect(result[1].availableNetworth).toBe(0) // clamped at 0
  })

  it("empty goals array returns empty", () => {
    const result = calculateGoalAllocations([], 500000)
    expect(result).toEqual([])
  })
})

describe("getTotalLockedByGoals", () => {
  it("sums active deducting goals", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, deductsFromNetworth: true, isActive: true }),
      makeGoal({ targetAmount: 200000, deductsFromNetworth: true, isActive: true }),
      makeGoal({ targetAmount: 50000, deductsFromNetworth: false, isActive: true }),
    ]
    expect(getTotalLockedByGoals(goals)).toBe(300000)
  })

  it("excludes inactive goals", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, deductsFromNetworth: true, isActive: false }),
      makeGoal({ targetAmount: 200000, deductsFromNetworth: true, isActive: true }),
    ]
    expect(getTotalLockedByGoals(goals)).toBe(200000)
  })

  it("returns 0 for empty array", () => {
    expect(getTotalLockedByGoals([])).toBe(0)
  })

  it("returns 0 when nothing deducts", () => {
    const goals = [
      makeGoal({ targetAmount: 100000, deductsFromNetworth: false }),
    ]
    expect(getTotalLockedByGoals(goals)).toBe(0)
  })
})
