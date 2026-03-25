import type { Goal, GoalWithProgress } from "@/types"

/**
 * Calculate goal allocations with priority-based networth locking.
 *
 * Goals are sorted by priority (1 = highest). Each goal that has
 * `deductsFromNetworth = true` "locks" its targetAmount from the
 * available networth. Lower-priority goals see reduced available funds.
 *
 * If a goal's targetAmount exceeds the remaining available networth,
 * it's flagged as a funding conflict.
 */
export function calculateGoalAllocations(
  goals: Goal[],
  totalNetworth: number,
): GoalWithProgress[] {
  const sorted = [...goals].sort((a, b) => a.priority - b.priority)
  let availableNetworth = totalNetworth

  return sorted.map((goal) => {
    const progressPercent =
      goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0

    const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0)
    const isFundingConflict =
      goal.deductsFromNetworth &&
      goal.isActive &&
      goal.targetAmount > availableNetworth

    const result: GoalWithProgress = {
      ...goal,
      progressPercent,
      remainingAmount,
      availableNetworth,
      isFundingConflict,
    }

    // Lock funds for this goal if it deducts from networth
    if (goal.deductsFromNetworth && goal.isActive) {
      availableNetworth = Math.max(availableNetworth - goal.targetAmount, 0)
    }

    return result
  })
}

/**
 * Calculate total amount locked by all active goals that deduct from networth.
 */
export function getTotalLockedByGoals(goals: Goal[]): number {
  return goals
    .filter((g) => g.isActive && g.deductsFromNetworth)
    .reduce((sum, g) => sum + g.targetAmount, 0)
}
