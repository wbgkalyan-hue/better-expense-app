import { BankAccountType } from "./categories"

export interface BankAccount {
  id: string
  userId: string
  name: string
  bankName: string
  type: BankAccountType | (string & {})
  balance: number
  interestRate?: number
  maturityDate?: string
  createdAt: string
  updatedAt: string
}
