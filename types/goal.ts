import { GoalType } from "./categories"

export interface Goal {
  id: string
  userId: string
  title: string
  type: GoalType | (string & {})
  targetAmount: number
  currentAmount: number
  priority: number
  deadline?: string
  isActive: boolean
  deductsFromNetworth: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface GoalWithProgress extends Goal {
  progressPercent: number
  remainingAmount: number
  availableNetworth: number
  isFundingConflict: boolean
}
