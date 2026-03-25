import { ExpenseCategory, IncomeCategory } from "./categories"

export type TransactionType = "expense" | "income"
export type TransactionSource = "manual" | "auto"

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: TransactionType
  category: ExpenseCategory | IncomeCategory
  description: string
  merchant?: string
  date: string
  source: TransactionSource
  rawNotification?: string
  createdAt: string
  updatedAt: string
}
