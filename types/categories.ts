export enum ExpenseCategory {
  FOOD = "food",
  TRANSPORT = "transport",
  SHOPPING = "shopping",
  ENTERTAINMENT = "entertainment",
  BILLS = "bills",
  HEALTH = "health",
  EDUCATION = "education",
  RENT = "rent",
  GROCERIES = "groceries",
  SUBSCRIPTIONS = "subscriptions",
  TRAVEL = "travel",
  PERSONAL = "personal",
  OTHER = "other",
}

export enum IncomeCategory {
  SALARY = "salary",
  FREELANCE = "freelance",
  BUSINESS = "business",
  INVESTMENTS = "investments",
  RENTAL = "rental",
  GIFT = "gift",
  REFUND = "refund",
  OTHER = "other",
}

export enum GoalType {
  TRIP = "trip",
  EMERGENCY_FUND = "emergency_fund",
  BIG_PURCHASE = "big_purchase",
  DEBT_PAYOFF = "debt_payoff",
  INVESTMENT_TARGET = "investment_target",
  CUSTOM = "custom",
}

export enum BankAccountType {
  SAVINGS = "savings",
  FD = "fd",
  RD = "rd",
  CURRENT = "current",
  OTHER = "other",
}

export enum AssetType {
  PROPERTY = "property",
  VEHICLE = "vehicle",
  GOLD = "gold",
  ELECTRONICS = "electronics",
  OTHER = "other",
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FOOD]: "Food & Dining",
  [ExpenseCategory.TRANSPORT]: "Transport",
  [ExpenseCategory.SHOPPING]: "Shopping",
  [ExpenseCategory.ENTERTAINMENT]: "Entertainment",
  [ExpenseCategory.BILLS]: "Bills & Utilities",
  [ExpenseCategory.HEALTH]: "Health & Medical",
  [ExpenseCategory.EDUCATION]: "Education",
  [ExpenseCategory.RENT]: "Rent",
  [ExpenseCategory.GROCERIES]: "Groceries",
  [ExpenseCategory.SUBSCRIPTIONS]: "Subscriptions",
  [ExpenseCategory.TRAVEL]: "Travel",
  [ExpenseCategory.PERSONAL]: "Personal",
  [ExpenseCategory.OTHER]: "Other",
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  [IncomeCategory.SALARY]: "Salary",
  [IncomeCategory.FREELANCE]: "Freelance",
  [IncomeCategory.BUSINESS]: "Business",
  [IncomeCategory.INVESTMENTS]: "Investments",
  [IncomeCategory.RENTAL]: "Rental Income",
  [IncomeCategory.GIFT]: "Gift",
  [IncomeCategory.REFUND]: "Refund",
  [IncomeCategory.OTHER]: "Other",
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  [GoalType.TRIP]: "Trip / Vacation",
  [GoalType.EMERGENCY_FUND]: "Emergency Fund",
  [GoalType.BIG_PURCHASE]: "Big Purchase",
  [GoalType.DEBT_PAYOFF]: "Debt Payoff",
  [GoalType.INVESTMENT_TARGET]: "Investment Target",
  [GoalType.CUSTOM]: "Custom",
}

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  [BankAccountType.SAVINGS]: "Savings",
  [BankAccountType.FD]: "Fixed Deposit",
  [BankAccountType.RD]: "Recurring Deposit",
  [BankAccountType.CURRENT]: "Current",
  [BankAccountType.OTHER]: "Other",
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  [AssetType.PROPERTY]: "Property",
  [AssetType.VEHICLE]: "Vehicle",
  [AssetType.GOLD]: "Gold",
  [AssetType.ELECTRONICS]: "Electronics",
  [AssetType.OTHER]: "Other",
}
