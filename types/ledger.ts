/** Direction of a friends ledger entry from the user's perspective. */
export type LedgerEntryType = "lent" | "borrowed"

/** Human-readable labels for {@link LedgerEntryType}. */
export const LEDGER_ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  lent: "Lent",
  borrowed: "Borrowed",
}

/**
 * A money-exchange record between the user and a {@link Friend}.
 * Financial fields (`amount`, `description`) are encrypted at rest in Firestore.
 */
export type FriendsLedgerEntry = {
  id: string
  userId: string
  friendId: string
  friendName?: string
  type: LedgerEntryType
  amount: number
  description: string
  date: string
  settled: boolean
  settledDate?: string
  createdAt: string
  updatedAt: string
}

/** Direction of a family ledger entry from the user's perspective. */
export type FamilyLedgerType = "paid" | "received" | "shared"

/** Human-readable labels for {@link FamilyLedgerType}. */
export const FAMILY_LEDGER_TYPE_LABELS: Record<FamilyLedgerType, string> = {
  paid: "Paid",
  received: "Received",
  shared: "Shared",
}

/**
 * A money-exchange record between the user and a {@link FamilyMember}.
 * Financial fields (`amount`, `description`) are encrypted at rest in Firestore.
 */
export type FamilyLedgerEntry = {
  id: string
  userId: string
  familyMemberId: string
  familyMemberName?: string
  type: FamilyLedgerType
  amount: number
  description: string
  date: string
  settled: boolean
  settledDate?: string
  createdAt: string
  updatedAt: string
}
