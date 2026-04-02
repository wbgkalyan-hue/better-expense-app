/** Identifies which category group a custom option belongs to. */
export type CategoryGroup =
  | "expense_category"
  | "income_category"
  | "bank_account_type"
  | "asset_type"
  | "insurance_type"
  | "loan_type"
  | "re_investment_type"
  | "property_category"
  | "friend_relationship"
  | "family_relationship"

/** Human-readable labels for {@link CategoryGroup}. */
export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  expense_category: "Expense Category",
  income_category: "Income Category",
  bank_account_type: "Bank Account Type",
  asset_type: "Asset Type",
  insurance_type: "Insurance Type",
  loan_type: "Loan Type",
  re_investment_type: "Real Estate Investment Type",
  property_category: "Property Category",
  friend_relationship: "Friend Relationship",
  family_relationship: "Family Relationship",
}

/**
 * A user-defined category option stored in Firestore.
 * Allows users to extend predefined category dropdowns with custom options.
 */
export type CustomCategory = {
  id: string
  userId: string
  /** Which dropdown / category group this belongs to. */
  group: CategoryGroup
  /** Human-readable label displayed in the UI. */
  label: string
  /** Slug value stored as the entity field value (e.g. "pet_supplies"). */
  value: string
  createdAt: string
  updatedAt: string
}
