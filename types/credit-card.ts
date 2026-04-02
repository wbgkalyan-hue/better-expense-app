/**
 * A credit card tracked by the user.
 * Financial fields (`last4`, `creditLimit`, `outstandingBalance`,
 * `minPayment`, `interestRate`) are encrypted at rest in Firestore.
 */
export type CreditCard = {
  id: string
  userId: string
  name: string
  bank: string
  last4?: string
  creditLimit: number
  outstandingBalance: number
  minPayment?: number
  dueDate?: string
  interestRate?: number
  notes?: string
  createdAt: string
  updatedAt: string
}
