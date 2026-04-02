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

/** Direction of a partners ledger entry from the user's perspective. */
export type PartnerLedgerType = "paid" | "received" | "shared"

/** Human-readable labels for {@link PartnerLedgerType}. */
export const PARTNER_LEDGER_TYPE_LABELS: Record<PartnerLedgerType, string> = {
  paid: "Paid",
  received: "Received",
  shared: "Shared",
}

/**
 * A money-exchange record between the user and a {@link Partner}.
 * Financial fields (`amount`, `description`) are encrypted at rest in Firestore.
 */
export type PartnersLedgerEntry = {
  id: string
  userId: string
  partnerId: string
  partnerName?: string
  type: PartnerLedgerType
  amount: number
  description: string
  date: string
  settled: boolean
  settledDate?: string
  createdAt: string
  updatedAt: string
}
