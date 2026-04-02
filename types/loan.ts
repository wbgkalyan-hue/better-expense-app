/** Category of loan. */
export type LoanType = "home" | "car" | "personal" | "education" | "business" | "other"

/** Human-readable labels for {@link LoanType}. */
export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  home: "Home Loan",
  car: "Car Loan",
  personal: "Personal Loan",
  education: "Education Loan",
  business: "Business Loan",
  other: "Other",
}

/**
 * A loan or EMI obligation tracked by the user.
 * Financial fields (`principalAmount`, `outstandingAmount`,
 * `interestRate`, `emiAmount`) are encrypted at rest in Firestore.
 */
export type Loan = {
  id: string
  userId: string
  name: string
  lender: string
  type: LoanType
  principalAmount: number
  outstandingAmount: number
  interestRate: number
  emiAmount: number
  startDate: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
