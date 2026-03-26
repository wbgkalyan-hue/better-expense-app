/**
 * Manual sync engine: push local changes → Firestore, pull Firestore → local.
 *
 * Sync is triggered ONLY by user pressing the sync button.
 * Data is encrypted in WatermelonDB and stored as plaintext in Firestore
 * (so the dashboard can read it). On pull, plaintext is re-encrypted locally.
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
import { encryptValue, decryptValue } from "@/services/encryption"
import { firestore, auth } from "@/services/firebase"

export interface SyncResult {
  pushed: number
  pulled: number
  errors: string[]
}

function getUserId(): string {
  const user = auth().currentUser
  if (!user) throw new Error("Not authenticated")
  return user.uid
}

// ---------------------------------------------------------------------------
// PUSH: Local unsynced records → Firestore
// ---------------------------------------------------------------------------

async function pushTransactions(): Promise<{ count: number; errors: string[] }> {
  const uid = getUserId()
  const models = await database
    .get<TransactionModel>("transactions")
    .query(Q.where("user_id", uid), Q.where("is_synced", false))
    .fetch()

  let count = 0
  const errors: string[] = []

  for (const model of models) {
    try {
      const data = {
        userId: model.userId,
        amount: decryptValue<number>(model.encryptedAmount),
        type: model.type,
        category: model.category,
        date: model.dateStr,
        source: model.source,
        description: decryptValue<string>(model.encryptedDescription),
        merchant: model.encryptedMerchant
          ? decryptValue<string>(model.encryptedMerchant)
          : null,
        rawNotification: model.encryptedRawNotification
          ? decryptValue<string>(model.encryptedRawNotification)
          : null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }

      if (model.firestoreId) {
        await firestore()
          .collection("transactions")
          .doc(model.firestoreId)
          .set(data, { merge: true })
      } else {
        const ref = await firestore().collection("transactions").add(data)
        await database.write(async () => {
          await model.update((rec) => {
            rec.firestoreId = ref.id
          })
        })
      }

      await database.write(async () => {
        await model.update((rec) => {
          rec.isSynced = true
        })
      })
      count++
    } catch (err: any) {
      errors.push(`Transaction ${model.id}: ${err.message}`)
    }
  }
  return { count, errors }
}

async function pushBrokerAccounts(): Promise<{
  count: number
  errors: string[]
}> {
  const uid = getUserId()
  const models = await database
    .get<BrokerAccountModel>("broker_accounts")
    .query(Q.where("user_id", uid), Q.where("is_synced", false))
    .fetch()

  let count = 0
  const errors: string[] = []

  for (const model of models) {
    try {
      const data = {
        userId: model.userId,
        name: model.name,
        broker: model.broker,
        currentValue: decryptValue<number>(model.encryptedCurrentValue),
        totalInvested: decryptValue<number>(model.encryptedTotalInvested),
        returns: decryptValue<number>(model.encryptedReturns),
        returnsPercent: decryptValue<number>(model.encryptedReturnsPercent),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }

      if (model.firestoreId) {
        await firestore()
          .collection("broker_accounts")
          .doc(model.firestoreId)
          .set(data, { merge: true })
      } else {
        const ref = await firestore()
          .collection("broker_accounts")
          .add(data)
        await database.write(async () => {
          await model.update((rec) => {
            rec.firestoreId = ref.id
          })
        })
      }

      await database.write(async () => {
        await model.update((rec) => {
          rec.isSynced = true
        })
      })
      count++
    } catch (err: any) {
      errors.push(`BrokerAccount ${model.id}: ${err.message}`)
    }
  }
  return { count, errors }
}

async function pushInvestmentTransactions(): Promise<{
  count: number
  errors: string[]
}> {
  const uid = getUserId()
  const models = await database
    .get<InvestmentTransactionModel>("investment_transactions")
    .query(Q.where("user_id", uid), Q.where("is_synced", false))
    .fetch()

  let count = 0
  const errors: string[] = []

  for (const model of models) {
    try {
      const data = {
        userId: model.userId,
        brokerAccountId: model.brokerAccountId,
        amount: decryptValue<number>(model.encryptedAmount),
        type: model.type,
        date: model.dateStr,
        source: model.source,
        note: model.encryptedNote
          ? decryptValue<string>(model.encryptedNote)
          : null,
        rawNotification: model.encryptedRawNotification
          ? decryptValue<string>(model.encryptedRawNotification)
          : null,
        createdAt: firestore.FieldValue.serverTimestamp(),
      }

      if (model.firestoreId) {
        await firestore()
          .collection("investment_transactions")
          .doc(model.firestoreId)
          .set(data, { merge: true })
      } else {
        const ref = await firestore()
          .collection("investment_transactions")
          .add(data)
        await database.write(async () => {
          await model.update((rec) => {
            rec.firestoreId = ref.id
          })
        })
      }

      await database.write(async () => {
        await model.update((rec) => {
          rec.isSynced = true
        })
      })
      count++
    } catch (err: any) {
      errors.push(`InvestmentTransaction ${model.id}: ${err.message}`)
    }
  }
  return { count, errors }
}

async function pushGoals(): Promise<{ count: number; errors: string[] }> {
  const uid = getUserId()
  const models = await database
    .get<GoalModel>("goals")
    .query(Q.where("user_id", uid), Q.where("is_synced", false))
    .fetch()

  let count = 0
  const errors: string[] = []

  for (const model of models) {
    try {
      const data = {
        userId: model.userId,
        title: model.title,
        type: model.type,
        targetAmount: decryptValue<number>(model.encryptedTargetAmount),
        currentAmount: decryptValue<number>(model.encryptedCurrentAmount),
        priority: model.priority,
        deadline: model.deadline || null,
        isActive: model.isActive,
        deductsFromNetworth: model.deductsFromNetworth,
        description: model.encryptedDescription
          ? decryptValue<string>(model.encryptedDescription)
          : null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }

      if (model.firestoreId) {
        await firestore()
          .collection("goals")
          .doc(model.firestoreId)
          .set(data, { merge: true })
      } else {
        const ref = await firestore().collection("goals").add(data)
        await database.write(async () => {
          await model.update((rec) => {
            rec.firestoreId = ref.id
          })
        })
      }

      await database.write(async () => {
        await model.update((rec) => {
          rec.isSynced = true
        })
      })
      count++
    } catch (err: any) {
      errors.push(`Goal ${model.id}: ${err.message}`)
    }
  }
  return { count, errors }
}

// ---------------------------------------------------------------------------
// PULL: Firestore → Local (re-encrypt into WatermelonDB)
// ---------------------------------------------------------------------------

async function pullTransactions(): Promise<{
  count: number
  errors: string[]
}> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("transactions")
    .where("userId", "==", uid)
    .get()

  const collection = database.get<TransactionModel>("transactions")
  const existingModels = await collection
    .query(Q.where("user_id", uid))
    .fetch()
  const existingByFirestoreId = new Map(
    existingModels
      .filter((m) => m.firestoreId)
      .map((m) => [m.firestoreId, m]),
  )

  let count = 0
  const errors: string[] = []

  await database.write(async () => {
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data()
        const existing = existingByFirestoreId.get(doc.id)

        if (existing) {
          // Update existing record
          await existing.update((rec) => {
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
            rec.isSynced = true
          })
        } else {
          // Create new local record
          await collection.create((rec) => {
            rec.firestoreId = doc.id
            rec.userId = uid
            rec.type = data.type
            rec.category = data.category
            rec.dateStr = data.date
            rec.source = data.source ?? "manual"
            rec.encryptedAmount = encryptValue(data.amount)
            rec.encryptedDescription = encryptValue(
              data.description ?? "",
            )
            rec.encryptedMerchant = data.merchant
              ? encryptValue(data.merchant)
              : ""
            rec.encryptedRawNotification = data.rawNotification
              ? encryptValue(data.rawNotification)
              : ""
            rec.isSynced = true
          })
        }
        count++
      } catch (err: any) {
        errors.push(`Pull transaction ${doc.id}: ${err.message}`)
      }
    }
  })

  return { count, errors }
}

async function pullBrokerAccounts(): Promise<{
  count: number
  errors: string[]
}> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("broker_accounts")
    .where("userId", "==", uid)
    .get()

  const collection = database.get<BrokerAccountModel>("broker_accounts")
  const existingModels = await collection
    .query(Q.where("user_id", uid))
    .fetch()
  const existingByFirestoreId = new Map(
    existingModels
      .filter((m) => m.firestoreId)
      .map((m) => [m.firestoreId, m]),
  )

  let count = 0
  const errors: string[] = []

  await database.write(async () => {
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data()
        const existing = existingByFirestoreId.get(doc.id)

        if (existing) {
          await existing.update((rec) => {
            rec.name = data.name
            rec.broker = data.broker
            rec.encryptedCurrentValue = encryptValue(data.currentValue)
            rec.encryptedTotalInvested = encryptValue(data.totalInvested)
            rec.encryptedReturns = encryptValue(data.returns)
            rec.encryptedReturnsPercent = encryptValue(data.returnsPercent)
            rec.isSynced = true
          })
        } else {
          await collection.create((rec) => {
            rec.firestoreId = doc.id
            rec.userId = uid
            rec.name = data.name
            rec.broker = data.broker
            rec.encryptedCurrentValue = encryptValue(data.currentValue ?? 0)
            rec.encryptedTotalInvested = encryptValue(
              data.totalInvested ?? 0,
            )
            rec.encryptedReturns = encryptValue(data.returns ?? 0)
            rec.encryptedReturnsPercent = encryptValue(
              data.returnsPercent ?? 0,
            )
            rec.isSynced = true
          })
        }
        count++
      } catch (err: any) {
        errors.push(`Pull broker_account ${doc.id}: ${err.message}`)
      }
    }
  })

  return { count, errors }
}

async function pullGoals(): Promise<{ count: number; errors: string[] }> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("goals")
    .where("userId", "==", uid)
    .get()

  const collection = database.get<GoalModel>("goals")
  const existingModels = await collection
    .query(Q.where("user_id", uid))
    .fetch()
  const existingByFirestoreId = new Map(
    existingModels
      .filter((m) => m.firestoreId)
      .map((m) => [m.firestoreId, m]),
  )

  let count = 0
  const errors: string[] = []

  await database.write(async () => {
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data()
        const existing = existingByFirestoreId.get(doc.id)

        if (existing) {
          await existing.update((rec) => {
            rec.title = data.title
            rec.type = data.type
            rec.priority = data.priority
            rec.deadline = data.deadline ?? ""
            rec.isActive = data.isActive ?? true
            rec.deductsFromNetworth = data.deductsFromNetworth ?? false
            rec.encryptedTargetAmount = encryptValue(data.targetAmount)
            rec.encryptedCurrentAmount = encryptValue(data.currentAmount)
            rec.encryptedDescription = data.description
              ? encryptValue(data.description)
              : ""
            rec.isSynced = true
          })
        } else {
          await collection.create((rec) => {
            rec.firestoreId = doc.id
            rec.userId = uid
            rec.title = data.title
            rec.type = data.type
            rec.priority = data.priority ?? 99
            rec.deadline = data.deadline ?? ""
            rec.isActive = data.isActive ?? true
            rec.deductsFromNetworth = data.deductsFromNetworth ?? false
            rec.encryptedTargetAmount = encryptValue(data.targetAmount ?? 0)
            rec.encryptedCurrentAmount = encryptValue(
              data.currentAmount ?? 0,
            )
            rec.encryptedDescription = data.description
              ? encryptValue(data.description)
              : ""
            rec.isSynced = true
          })
        }
        count++
      } catch (err: any) {
        errors.push(`Pull goal ${doc.id}: ${err.message}`)
      }
    }
  })

  return { count, errors }
}

async function pullNetworthSnapshots(): Promise<{
  count: number
  errors: string[]
}> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("networth_snapshots")
    .where("userId", "==", uid)
    .get()

  const collection = database.get<NetworthSnapshotModel>("networth_snapshots")
  const existingModels = await collection
    .query(Q.where("user_id", uid))
    .fetch()
  const existingByFirestoreId = new Map(
    existingModels
      .filter((m) => m.firestoreId)
      .map((m) => [m.firestoreId, m]),
  )

  let count = 0
  const errors: string[] = []

  await database.write(async () => {
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data()
        if (existingByFirestoreId.has(doc.id)) continue // Snapshots are immutable

        await collection.create((rec) => {
          rec.firestoreId = doc.id
          rec.userId = uid
          rec.dateStr = data.date
          rec.encryptedTotalBank = encryptValue(data.totalBank ?? 0)
          rec.encryptedTotalInvestments = encryptValue(
            data.totalInvestments ?? 0,
          )
          rec.encryptedTotalAssets = encryptValue(data.totalAssets ?? 0)
          rec.encryptedTotalDebts = encryptValue(data.totalDebts ?? 0)
          rec.encryptedNetworth = encryptValue(data.networth ?? 0)
          rec.encryptedLiquidFunds = encryptValue(data.liquidFunds ?? 0)
          rec.isSynced = true
        })
        count++
      } catch (err: any) {
        errors.push(`Pull networth_snapshot ${doc.id}: ${err.message}`)
      }
    }
  })

  return { count, errors }
}

// ---------------------------------------------------------------------------
// Full sync (manual, triggered by button)
// ---------------------------------------------------------------------------

export async function performSync(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] }

  // Push local changes first
  const pushResults = await Promise.all([
    pushTransactions(),
    pushBrokerAccounts(),
    pushInvestmentTransactions(),
    pushGoals(),
  ])
  for (const r of pushResults) {
    result.pushed += r.count
    result.errors.push(...r.errors)
  }

  // Then pull remote data
  const pullResults = await Promise.all([
    pullTransactions(),
    pullBrokerAccounts(),
    pullGoals(),
    pullNetworthSnapshots(),
  ])
  for (const r of pullResults) {
    result.pulled += r.count
    result.errors.push(...r.errors)
  }

  return result
}
