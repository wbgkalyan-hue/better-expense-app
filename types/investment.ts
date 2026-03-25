export interface BrokerAccount {
  id: string
  userId: string
  name: string
  broker: string
  currentValue: number
  totalInvested: number
  returns: number
  returnsPercent: number
  createdAt: string
  updatedAt: string
}

export type InvestmentTransactionType = "deposit" | "withdrawal"

export interface InvestmentTransaction {
  id: string
  userId: string
  brokerAccountId: string
  amount: number
  type: InvestmentTransactionType
  date: string
  source: "manual" | "auto"
  note?: string
  rawNotification?: string
  createdAt: string
}

export interface NotificationPattern {
  id: string
  userId: string
  name: string
  brokerOrBank: string
  regexPattern: string
  isTemplate: boolean
  exampleNotification?: string
  extractionFields: string[]
  createdAt: string
  updatedAt: string
}
