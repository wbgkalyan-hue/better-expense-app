/** Ownership / tenure type of a property. */
export type PropertyType = "owned" | "rented" | "leased"

/** Human-readable labels for {@link PropertyType}. */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  owned: "Owned",
  rented: "Rented",
  leased: "Leased",
}

/** Usage category of a property. */
export type PropertyCategory = "residential" | "commercial" | "land" | "other"

/** Human-readable labels for {@link PropertyCategory}. */
export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  land: "Land",
  other: "Other",
}

/**
 * A property (real estate asset or rental) tracked by the user.
 * Financial and location fields (`address`, `currentValue`, `purchasePrice`,
 * `monthlyRent`, `monthlyEmi`) are encrypted at rest in Firestore.
 */
export type Property = {
  id: string
  userId: string
  name: string
  address?: string
  type: PropertyType
  category: PropertyCategory
  currentValue?: number
  purchasePrice?: number
  monthlyRent?: number
  monthlyEmi?: number
  purchaseDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
