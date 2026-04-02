/** Predefined relationship categories for a friend. */
export type FriendRelationship = "colleague" | "neighbor" | "classmate" | "other" | (string & {})

/** Human-readable labels for {@link FriendRelationship}. */
export const FRIEND_RELATIONSHIP_LABELS: Record<FriendRelationship, string> = {
  colleague: "Colleague",
  neighbor: "Neighbor",
  classmate: "Classmate",
  other: "Other",
}

/**
 * A friend contact stored in the user's address book.
 * PII fields (`name`, `phone`, `email`, `address`) are encrypted at rest in Firestore.
 */
export type Friend = {
  id: string
  userId: string
  name: string
  phone?: string
  email?: string
  relationship?: FriendRelationship
  tags?: string[]
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Predefined relationship types for a family member. */
export type FamilyRelationship =
  | "wife"
  | "husband"
  | "son"
  | "daughter"
  | "father"
  | "mother"
  | "brother"
  | "sister"
  | "other"
  | (string & {})

/** Human-readable labels for {@link FamilyRelationship}. */
export const FAMILY_RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  wife: "Wife",
  husband: "Husband",
  son: "Son",
  daughter: "Daughter",
  father: "Father",
  mother: "Mother",
  brother: "Brother",
  sister: "Sister",
  other: "Other",
}

/**
 * A family member contact stored in the user's address book.
 * PII fields (`name`, `phone`, `email`) are encrypted at rest in Firestore.
 */
export type FamilyMember = {
  id: string
  userId: string
  name: string
  relationship?: FamilyRelationship
  phone?: string
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
