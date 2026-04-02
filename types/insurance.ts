/** Category of insurance policy. */
export type InsuranceType = "life" | "health" | "vehicle" | "property" | "term" | "other" | (string & {})

/** Human-readable labels for {@link InsuranceType}. */
export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  life: "Life",
  health: "Health",
  vehicle: "Vehicle",
  property: "Property",
  term: "Term",
  other: "Other",
}

/** How often the insurance premium is paid. */
export type InsuranceFrequency = "monthly" | "quarterly" | "yearly"

/** Human-readable labels for {@link InsuranceFrequency}. */
export const INSURANCE_FREQUENCY_LABELS: Record<InsuranceFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

/**
 * An insurance policy held by the user.
 * Sensitive fields (`policyNumber`, `premium`, `coverageAmount`) are
 * encrypted at rest in Firestore.
 */
export type InsurancePolicy = {
  id: string
  userId: string
  name: string
  insurer: string
  type: InsuranceType
  policyNumber?: string
  premium: number
  coverageAmount: number
  startDate: string
  endDate?: string
  frequency: InsuranceFrequency
  notes?: string
  createdAt: string
  updatedAt: string
}
