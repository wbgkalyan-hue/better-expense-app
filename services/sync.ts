/**
 * Manual sync engine: push local changes → Firestore, pull Firestore → local.
 *
 * Sync is triggered ONLY by user pressing the sync button.
 * Data is encrypted in both WatermelonDB and Firestore using the same shared
 * per-user salt, so encrypted values can be pushed/pulled directly.
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
import { encryptValue } from "@/services/encryption"
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
        amount: model.encryptedAmount,
        type: model.type,
        category: model.category,
        date: model.dateStr,
        source: model.source,
        description: model.encryptedDescription,
        merchant: model.encryptedMerchant || null,
        rawNotification: model.encryptedRawNotification || null,
        _encrypted: true,
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
        currentValue: model.encryptedCurrentValue,
        totalInvested: model.encryptedTotalInvested,
        returns: model.encryptedReturns,
        returnsPercent: model.encryptedReturnsPercent,
        _encrypted: true,
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
        amount: model.encryptedAmount,
        type: model.type,
        date: model.dateStr,
        source: model.source,
        note: model.encryptedNote || null,
        rawNotification: model.encryptedRawNotification || null,
        _encrypted: true,
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
        targetAmount: model.encryptedTargetAmount,
        currentAmount: model.encryptedCurrentAmount,
        priority: model.priority,
        deadline: model.deadline || null,
        isActive: model.isActive,
        deductsFromNetworth: model.deductsFromNetworth,
        description: model.encryptedDescription || null,
        _encrypted: true,
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

        const enc = data._encrypted === true
        if (existing) {
          // Update existing record
          await existing.update((rec) => {
            rec.type = data.type
            rec.category = data.category
            rec.dateStr = data.date
            rec.source = data.source
            rec.encryptedAmount = enc ? data.amount : encryptValue(data.amount)
            rec.encryptedDescription = enc ? data.description : encryptValue(data.description)
            rec.encryptedMerchant = data.merchant
              ? (enc ? data.merchant : encryptValue(data.merchant))
              : ""
            rec.encryptedRawNotification = data.rawNotification
              ? (enc ? data.rawNotification : encryptValue(data.rawNotification))
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
            rec.encryptedAmount = enc ? data.amount : encryptValue(data.amount)
            rec.encryptedDescription = enc
              ? (data.description ?? "")
              : encryptValue(data.description ?? "")
            rec.encryptedMerchant = data.merchant
              ? (enc ? data.merchant : encryptValue(data.merchant))
              : ""
            rec.encryptedRawNotification = data.rawNotification
              ? (enc ? data.rawNotification : encryptValue(data.rawNotification))
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

        const enc = data._encrypted === true
        if (existing) {
          await existing.update((rec) => {
            rec.name = data.name
            rec.broker = data.broker
            rec.encryptedCurrentValue = enc ? data.currentValue : encryptValue(data.currentValue)
            rec.encryptedTotalInvested = enc ? data.totalInvested : encryptValue(data.totalInvested)
            rec.encryptedReturns = enc ? data.returns : encryptValue(data.returns)
            rec.encryptedReturnsPercent = enc ? data.returnsPercent : encryptValue(data.returnsPercent)
            rec.isSynced = true
          })
        } else {
          await collection.create((rec) => {
            rec.firestoreId = doc.id
            rec.userId = uid
            rec.name = data.name
            rec.broker = data.broker
            rec.encryptedCurrentValue = enc ? data.currentValue : encryptValue(data.currentValue ?? 0)
            rec.encryptedTotalInvested = enc ? data.totalInvested : encryptValue(data.totalInvested ?? 0)
            rec.encryptedReturns = enc ? data.returns : encryptValue(data.returns ?? 0)
            rec.encryptedReturnsPercent = enc ? data.returnsPercent : encryptValue(data.returnsPercent ?? 0)
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

        const enc = data._encrypted === true
        if (existing) {
          await existing.update((rec) => {
            rec.title = data.title
            rec.type = data.type
            rec.priority = data.priority
            rec.deadline = data.deadline ?? ""
            rec.isActive = data.isActive ?? true
            rec.deductsFromNetworth = data.deductsFromNetworth ?? false
            rec.encryptedTargetAmount = enc ? data.targetAmount : encryptValue(data.targetAmount)
            rec.encryptedCurrentAmount = enc ? data.currentAmount : encryptValue(data.currentAmount)
            rec.encryptedDescription = data.description
              ? (enc ? data.description : encryptValue(data.description))
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
            rec.encryptedTargetAmount = enc ? data.targetAmount : encryptValue(data.targetAmount ?? 0)
            rec.encryptedCurrentAmount = enc
              ? data.currentAmount
              : encryptValue(data.currentAmount ?? 0)
            rec.encryptedDescription = data.description
              ? (enc ? data.description : encryptValue(data.description))
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

        const enc = data._encrypted === true
        await collection.create((rec) => {
          rec.firestoreId = doc.id
          rec.userId = uid
          rec.dateStr = data.date
          rec.encryptedTotalBank = enc ? data.totalBank : encryptValue(data.totalBank ?? 0)
          rec.encryptedTotalInvestments = enc ? data.totalInvestments : encryptValue(data.totalInvestments ?? 0)
          rec.encryptedTotalAssets = enc ? data.totalAssets : encryptValue(data.totalAssets ?? 0)
          rec.encryptedTotalDebts = enc ? data.totalDebts : encryptValue(data.totalDebts ?? 0)
          rec.encryptedNetworth = enc ? data.networth : encryptValue(data.networth ?? 0)
          rec.encryptedLiquidFunds = enc ? data.liquidFunds : encryptValue(data.liquidFunds ?? 0)
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
