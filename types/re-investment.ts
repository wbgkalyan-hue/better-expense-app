/** Category of real-estate investment property. */
export type RealEstateInvestmentType = "residential" | "commercial" | "land" | "other" | (string & {})

/** Human-readable labels for {@link RealEstateInvestmentType}. */
export const RE_INVESTMENT_TYPE_LABELS: Record<RealEstateInvestmentType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  land: "Land",
  other: "Other",
}

/**
 * A real-estate investment owned by the user.
 * Financial fields (`purchasePrice`, `currentValue`, `monthlyRent`) are
 * encrypted at rest in Firestore.
 */
export type RealEstateInvestment = {
  id: string
  userId: string
  name: string
  location: string
  type: RealEstateInvestmentType
  purchasePrice: number
  currentValue: number
  monthlyRent?: number
  purchaseDate: string
  notes?: string
  createdAt: string
  updatedAt: string
}
