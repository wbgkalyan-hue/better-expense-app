/**
 * Encrypted local database service.
 *
 * Wraps WatermelonDB with transparent encrypt-on-write / decrypt-on-read.
 * Sensitive fields (amounts, descriptions, merchants) are encrypted individually.
 * Non-sensitive fields (dates, categories, IDs) remain queryable.
 */

import { Q } from "@nozbe/watermelondb"
import { database } from "@/database"
import {
  TransactionModel,
  BrokerAccountModel,
  InvestmentTransactionModel,
  GoalModel,
  NotificationPatternModel,
  BankAccountModel,
  AssetModel,
  NetworthSnapshotModel,
} from "@/database/models"
import { encrypt, decryptValue, encryptValue } from "@/services/encryption"
import type {
  Transaction,
  BrokerAccount,
  InvestmentTransaction,
  Goal,
  NotificationPattern,
  BankAccount,
  Asset,
  NetworthSnapshot,
} from "@/types"

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

function decryptTransaction(model: TransactionModel): Transaction {
  return {
    id: model.id,
    userId: model.userId,
    amount: decryptValue<number>(model.encryptedAmount),
    type: model.type as Transaction["type"],
    category: model.category as Transaction["category"],
    description: decryptValue<string>(model.encryptedDescription),
    merchant: model.encryptedMerchant
      ? decryptValue<string>(model.encryptedMerchant)
      : undefined,
    date: model.dateStr,
    source: model.source as Transaction["source"],
    rawNotification: model.encryptedRawNotification
      ? decryptValue<string>(model.encryptedRawNotification)
      : undefined,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  }
}

export async function getLocalTransactions(
  userId: string,
): Promise<Transaction[]> {
  const collection = database.get<TransactionModel>("transactions")
  const models = await collection
    .query(Q.where("user_id", userId), Q.sortBy("date", Q.desc))
    .fetch()
  return models.map(decryptTransaction)
}

export async function addLocalTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const collection = database.get<TransactionModel>("transactions")
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.type = data.type
      rec.category = data.category
      rec.dateStr = data.date
      rec.source = data.source
      rec.encryptedAmount = encryptValue(data.amount)
      rec.encryptedDescription = encryptValue(data.description)
      rec.encryptedMerchant = data.merchant
        ? encryptValue(data.merchant)
        : ""
      rec.encryptedRawNotification = data.rawNotification
        ? encryptValue(data.rawNotification)
        : ""
      rec.isSynced = false
    })
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Broker Accounts
// ---------------------------------------------------------------------------

function decryptBrokerAccount(model: BrokerAccountModel): BrokerAccount {
  return {
    id: model.id,
    userId: model.userId,
    name: model.name,
    broker: model.broker,
    currentValue: decryptValue<number>(model.encryptedCurrentValue),
    totalInvested: decryptValue<number>(model.encryptedTotalInvested),
    returns: decryptValue<number>(model.encryptedReturns),
    returnsPercent: decryptValue<number>(model.encryptedReturnsPercent),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  }
}

export async function getLocalBrokerAccounts(
  userId: string,
): Promise<BrokerAccount[]> {
  const collection = database.get<BrokerAccountModel>("broker_accounts")
  const models = await collection
    .query(Q.where("user_id", userId), Q.sortBy("created_at", Q.desc))
    .fetch()
  return models.map(decryptBrokerAccount)
}

export async function addLocalBrokerAccount(
  data: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const collection = database.get<BrokerAccountModel>("broker_accounts")
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.name = data.name
      rec.broker = data.broker
      rec.encryptedCurrentValue = encryptValue(data.currentValue)
      rec.encryptedTotalInvested = encryptValue(data.totalInvested)
      rec.encryptedReturns = encryptValue(data.returns)
      rec.encryptedReturnsPercent = encryptValue(data.returnsPercent)
      rec.isSynced = false
    })
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Investment Transactions
// ---------------------------------------------------------------------------

function decryptInvestmentTransaction(
  model: InvestmentTransactionModel,
): InvestmentTransaction {
  return {
    id: model.id,
    userId: model.userId,
    brokerAccountId: model.brokerAccountId,
    amount: decryptValue<number>(model.encryptedAmount),
    type: model.type as InvestmentTransaction["type"],
    date: model.dateStr,
    source: model.source as InvestmentTransaction["source"],
    note: model.encryptedNote
      ? decryptValue<string>(model.encryptedNote)
      : undefined,
    rawNotification: model.encryptedRawNotification
      ? decryptValue<string>(model.encryptedRawNotification)
      : undefined,
    createdAt: model.createdAt.toISOString(),
  }
}

export async function getLocalInvestmentTransactions(
  userId: string,
  brokerAccountId?: string,
): Promise<InvestmentTransaction[]> {
  const collection = database.get<InvestmentTransactionModel>(
    "investment_transactions",
  )
  const conditions = [
    Q.where("user_id", userId),
    Q.sortBy("date", Q.desc),
  ]
  if (brokerAccountId) {
    conditions.push(Q.where("broker_account_id", brokerAccountId))
  }
  const models = await collection.query(...conditions).fetch()
  return models.map(decryptInvestmentTransaction)
}

export async function addLocalInvestmentTransaction(
  data: Omit<InvestmentTransaction, "id" | "createdAt">,
): Promise<string> {
  const collection = database.get<InvestmentTransactionModel>(
    "investment_transactions",
  )
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.brokerAccountId = data.brokerAccountId
      rec.type = data.type
      rec.dateStr = data.date
      rec.source = data.source
      rec.encryptedAmount = encryptValue(data.amount)
      rec.encryptedNote = data.note ? encryptValue(data.note) : ""
      rec.encryptedRawNotification = data.rawNotification
        ? encryptValue(data.rawNotification)
        : ""
      rec.isSynced = false
    })
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

function decryptGoal(model: GoalModel): Goal {
  return {
    id: model.id,
    userId: model.userId,
    title: model.title,
    type: model.type as Goal["type"],
    targetAmount: decryptValue<number>(model.encryptedTargetAmount),
    currentAmount: decryptValue<number>(model.encryptedCurrentAmount),
    priority: model.priority,
    deadline: model.deadline || undefined,
    isActive: model.isActive,
    deductsFromNetworth: model.deductsFromNetworth,
    description: model.encryptedDescription
      ? decryptValue<string>(model.encryptedDescription)
      : undefined,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  }
}

export async function getLocalGoals(userId: string): Promise<Goal[]> {
  const collection = database.get<GoalModel>("goals")
  const models = await collection
    .query(Q.where("user_id", userId), Q.sortBy("priority", Q.asc))
    .fetch()
  return models.map(decryptGoal)
}

export async function addLocalGoal(
  data: Omit<Goal, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const collection = database.get<GoalModel>("goals")
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.title = data.title
      rec.type = data.type
      rec.priority = data.priority
      rec.deadline = data.deadline ?? ""
      rec.isActive = data.isActive
      rec.deductsFromNetworth = data.deductsFromNetworth
      rec.encryptedTargetAmount = encryptValue(data.targetAmount)
      rec.encryptedCurrentAmount = encryptValue(data.currentAmount)
      rec.encryptedDescription = data.description
        ? encryptValue(data.description)
        : ""
      rec.isSynced = false
    })
  })
  return record.id
}

export async function updateLocalGoal(
  id: string,
  data: Partial<Goal>,
): Promise<void> {
  const collection = database.get<GoalModel>("goals")
  const record = await collection.find(id)
  await database.write(async () => {
    await record.update((rec) => {
      if (data.title !== undefined) rec.title = data.title
      if (data.type !== undefined) rec.type = data.type
      if (data.priority !== undefined) rec.priority = data.priority
      if (data.deadline !== undefined) rec.deadline = data.deadline ?? ""
      if (data.isActive !== undefined) rec.isActive = data.isActive
      if (data.deductsFromNetworth !== undefined)
        rec.deductsFromNetworth = data.deductsFromNetworth
      if (data.targetAmount !== undefined)
        rec.encryptedTargetAmount = encryptValue(data.targetAmount)
      if (data.currentAmount !== undefined)
        rec.encryptedCurrentAmount = encryptValue(data.currentAmount)
      if (data.description !== undefined)
        rec.encryptedDescription = data.description
          ? encryptValue(data.description)
          : ""
      rec.isSynced = false
    })
  })
}

// ---------------------------------------------------------------------------
// Notification Patterns
// ---------------------------------------------------------------------------

function decryptNotificationPattern(
  model: NotificationPatternModel,
): NotificationPattern {
  return {
    id: model.id,
    userId: model.userId,
    name: model.name,
    brokerOrBank: model.brokerOrBank,
    regexPattern: decryptValue<string>(model.encryptedRegexPattern),
    isTemplate: model.isTemplate,
    exampleNotification: model.encryptedExampleNotification
      ? decryptValue<string>(model.encryptedExampleNotification)
      : undefined,
    extractionFields: JSON.parse(model.extractionFields),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  }
}

export async function getLocalNotificationPatterns(
  userId: string,
): Promise<NotificationPattern[]> {
  const collection = database.get<NotificationPatternModel>(
    "notification_patterns",
  )
  const models = await collection
    .query(Q.where("user_id", userId))
    .fetch()
  return models.map(decryptNotificationPattern)
}

export async function addLocalNotificationPattern(
  data: Omit<NotificationPattern, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const collection = database.get<NotificationPatternModel>(
    "notification_patterns",
  )
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.name = data.name
      rec.brokerOrBank = data.brokerOrBank
      rec.isTemplate = data.isTemplate
      rec.extractionFields = JSON.stringify(data.extractionFields)
      rec.encryptedRegexPattern = encryptValue(data.regexPattern)
      rec.encryptedExampleNotification = data.exampleNotification
        ? encryptValue(data.exampleNotification)
        : ""
      rec.isSynced = false
    })
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Bank Accounts
// ---------------------------------------------------------------------------

function decryptBankAccount(model: BankAccountModel): BankAccount {
  return {
    id: model.id,
    userId: model.userId,
    name: model.name,
    bankName: model.bankName,
    type: model.type as BankAccount["type"],
    balance: decryptValue<number>(model.encryptedBalance),
    interestRate: model.encryptedInterestRate
      ? decryptValue<number>(model.encryptedInterestRate)
      : undefined,
    maturityDate: model.maturityDate || undefined,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  }
}

export async function getLocalBankAccounts(
  userId: string,
): Promise<BankAccount[]> {
  const collection = database.get<BankAccountModel>("bank_accounts")
  const models = await collection
    .query(Q.where("user_id", userId))
    .fetch()
  return models.map(decryptBankAccount)
}

export async function addLocalBankAccount(
  data: Omit<BankAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const collection = database.get<BankAccountModel>("bank_accounts")
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.name = data.name
      rec.bankName = data.bankName
      rec.type = data.type
      rec.maturityDate = data.maturityDate ?? ""
      rec.encryptedBalance = encryptValue(data.balance)
      rec.encryptedInterestRate = data.interestRate
        ? encryptValue(data.interestRate)
        : ""
      rec.isSynced = false
    })
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

function decryptAsset(model: AssetModel): Asset {
  return {
    id: model.id,
    userId: model.userId,
    name: model.name,
    type: model.type as Asset["type"],
    currentValue: decryptValue<number>(model.encryptedCurrentValue),
    purchaseValue: decryptValue<number>(model.encryptedPurchaseValue),
    purchaseDate: model.purchaseDate || undefined,
    description: model.encryptedDescription
      ? decryptValue<string>(model.encryptedDescription)
      : undefined,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  }
}

export async function getLocalAssets(userId: string): Promise<Asset[]> {
  const collection = database.get<AssetModel>("assets")
  const models = await collection
    .query(Q.where("user_id", userId))
    .fetch()
  return models.map(decryptAsset)
}

export async function addLocalAsset(
  data: Omit<Asset, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const collection = database.get<AssetModel>("assets")
  const record = await database.write(async () => {
    return collection.create((rec) => {
      rec.userId = data.userId
      rec.name = data.name
      rec.type = data.type
      rec.purchaseDate = data.purchaseDate ?? ""
      rec.encryptedCurrentValue = encryptValue(data.currentValue)
      rec.encryptedPurchaseValue = encryptValue(data.purchaseValue)
      rec.encryptedDescription = data.description
        ? encryptValue(data.description)
        : ""
      rec.isSynced = false
    })
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Networth Snapshots
// ---------------------------------------------------------------------------

function decryptNetworthSnapshot(
  model: NetworthSnapshotModel,
): NetworthSnapshot {
  return {
    id: model.id,
    userId: model.userId,
    date: model.dateStr,
    totalBank: decryptValue<number>(model.encryptedTotalBank),
    totalInvestments: decryptValue<number>(model.encryptedTotalInvestments),
    totalAssets: decryptValue<number>(model.encryptedTotalAssets),
    totalDebts: decryptValue<number>(model.encryptedTotalDebts),
    networth: decryptValue<number>(model.encryptedNetworth),
    liquidFunds: decryptValue<number>(model.encryptedLiquidFunds),
    createdAt: model.createdAt.toISOString(),
  }
}

export async function getLocalNetworthSnapshots(
  userId: string,
): Promise<NetworthSnapshot[]> {
  const collection = database.get<NetworthSnapshotModel>("networth_snapshots")
  const models = await collection
    .query(Q.where("user_id", userId), Q.sortBy("date", Q.desc))
    .fetch()
  return models.map(decryptNetworthSnapshot)
}

// ---------------------------------------------------------------------------
// Utility: mark records as synced
// ---------------------------------------------------------------------------

export async function markAsSynced(
  tableName: string,
  ids: string[],
): Promise<void> {
  await database.write(async () => {
    const collection = database.get<any>(tableName)
    const records = await Promise.all(
      ids.map((id) => collection.find(id)),
    )
    await database.batch(
      ...records.map((rec: any) =>
        rec.prepareUpdate((r: any) => {
          r.isSynced = true
        }),
      ),
    )
  })
}

// ---------------------------------------------------------------------------
// Utility: get unsynced records count
// ---------------------------------------------------------------------------

export async function getUnsyncedCount(userId: string): Promise<number> {
  const tables = [
    "transactions",
    "broker_accounts",
    "investment_transactions",
    "goals",
    "notification_patterns",
    "bank_accounts",
    "assets",
    "networth_snapshots",
  ]
  let total = 0
  for (const table of tables) {
    const count = await database
      .get(table)
      .query(Q.where("user_id", userId), Q.where("is_synced", false))
      .fetchCount()
    total += count
  }
  return total
}
