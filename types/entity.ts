/**
 * A friend contact stored in the user's address book.
 * PII fields (`name`, `phone`, `email`) are encrypted at rest in Firestore.
 */
export type Friend = {
  id: string
  userId: string
  name: string
  phone?: string
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * A business partner contact stored in the user's address book.
 * PII fields (`name`, `company`, `phone`, `email`) are encrypted at rest in Firestore.
 */
export type Partner = {
  id: string
  userId: string
  name: string
  company?: string
  phone?: string
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
