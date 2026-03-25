import { AssetType } from "./categories"

export interface Asset {
  id: string
  userId: string
  name: string
  type: AssetType
  currentValue: number
  purchaseValue: number
  purchaseDate?: string
  description?: string
  createdAt: string
  updatedAt: string
}
