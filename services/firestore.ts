import { firestore, auth } from "./firebase"
import { encryptValue, decryptValue, isEncryptionReady } from "@/services/encryption"
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import type {
  Transaction,
  BrokerAccount,
  InvestmentTransaction,
  Goal,
  BankAccount,
  Asset,
  NetworthSnapshot,
  NotificationPattern,
} from "@/types"

type FirestoreDoc = FirebaseFirestoreTypes.DocumentSnapshot

// ---------------------------------------------------------------------------
// Sensitive field definitions (mirror dashboard exactly)
// ---------------------------------------------------------------------------

const TRANSACTION_SENSITIVE = ["amount", "description", "merchant", "rawNotification"]
const BROKER_SENSITIVE = ["currentValue", "totalInvested", "returns", "returnsPercent"]
const INVESTMENT_TX_SENSITIVE = ["amount", "note", "rawNotification"]
const GOAL_SENSITIVE = ["targetAmount", "currentAmount", "description"]
const BANK_SENSITIVE = ["balance", "interestRate"]
const ASSET_SENSITIVE = ["currentValue", "purchaseValue", "description"]

// ---------------------------------------------------------------------------
// Generic encrypt / decrypt helpers
// ---------------------------------------------------------------------------

function encryptDoc(
  data: Record<string, unknown>,
  sensitiveFields: string[],
): Record<string, unknown> {
  if (!isEncryptionReady()) return data
  const result: Record<string, unknown> = { _encrypted: true }
  for (const [key, value] of Object.entries(data)) {
    result[key] = sensitiveFields.includes(key) && value != null
      ? encryptValue(value)
      : value
  }
  return result
}

function decryptDoc<T>(
  raw: Record<string, unknown>,
  sensitiveFields: string[],
): T | null {
  if (!raw._encrypted) return raw as T
  if (!isEncryptionReady()) return null
  const result = { ...raw }
  for (const field of sensitiveFields) {
    if (result[field] && typeof result[field] === "string") {
      try {
        result[field] = decryptValue(result[field] as string)
      } catch {
        return null
      }
    }
  }
  delete result._encrypted
  return result as T
}

function rawDoc<T>(doc: FirestoreDoc): Record<string, unknown> {
  return { id: doc.id, ...doc.data() } as Record<string, unknown>
}

function getUserId(): string {
  const user = auth().currentUser
  if (!user) throw new Error("Not authenticated")
  return user.uid
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function getTransactions(): Promise<Transaction[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("transactions")
    .where("userId", "==", uid)
    .orderBy("date", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<Transaction>(rawDoc(doc), TRANSACTION_SENSITIVE))
    .filter((r): r is Transaction => r !== null)
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, TRANSACTION_SENSITIVE)
  const ref = await firestore()
    .collection("transactions")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

// ---------------------------------------------------------------------------
// Broker Accounts
// ---------------------------------------------------------------------------

export async function getBrokerAccounts(): Promise<BrokerAccount[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("broker_accounts")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<BrokerAccount>(rawDoc(doc), BROKER_SENSITIVE))
    .filter((r): r is BrokerAccount => r !== null)
}

export async function addBrokerAccount(
  data: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, BROKER_SENSITIVE)
  const ref = await firestore()
    .collection("broker_accounts")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

// ---------------------------------------------------------------------------
// Investment Transactions
// ---------------------------------------------------------------------------

export async function getInvestmentTransactions(
  brokerAccountId?: string,
): Promise<InvestmentTransaction[]> {
  const uid = getUserId()
  let query = firestore()
    .collection("investment_transactions")
    .where("userId", "==", uid)
    .orderBy("date", "desc")

  if (brokerAccountId) {
    query = query.where("brokerAccountId", "==", brokerAccountId)
  }

  const snapshot = await query.get()
  return snapshot.docs
    .map((doc) => decryptDoc<InvestmentTransaction>(rawDoc(doc), INVESTMENT_TX_SENSITIVE))
    .filter((r): r is InvestmentTransaction => r !== null)
}

export async function addInvestmentTransaction(
  data: Omit<InvestmentTransaction, "id" | "createdAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, INVESTMENT_TX_SENSITIVE)
  const ref = await firestore()
    .collection("investment_transactions")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function getGoals(): Promise<Goal[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("goals")
    .where("userId", "==", uid)
    .orderBy("priority", "asc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<Goal>(rawDoc(doc), GOAL_SENSITIVE))
    .filter((r): r is Goal => r !== null)
}

export async function addGoal(
  data: Omit<Goal, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, GOAL_SENSITIVE)
  const ref = await firestore()
    .collection("goals")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateGoal(
  id: string,
  data: Partial<Goal>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, GOAL_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("goals")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

// ---------------------------------------------------------------------------
// Notification Patterns
// ---------------------------------------------------------------------------

export async function getNotificationPatterns(): Promise<NotificationPattern[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("notification_patterns")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs.map((doc) => rawDoc(doc) as NotificationPattern)
}

export async function addNotificationPattern(
  data: Omit<NotificationPattern, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await firestore()
    .collection("notification_patterns")
    .add({
      ...data,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

// ---------------------------------------------------------------------------
// Bank Accounts, Assets, Networth (read-only for now)
// ---------------------------------------------------------------------------

export async function getBankAccounts(): Promise<BankAccount[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("bank_accounts")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<BankAccount>(rawDoc(doc), BANK_SENSITIVE))
    .filter((r): r is BankAccount => r !== null)
}

export async function getAssets(): Promise<Asset[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("assets")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<Asset>(rawDoc(doc), ASSET_SENSITIVE))
    .filter((r): r is Asset => r !== null)
}

export async function getNetworthSnapshots(): Promise<NetworthSnapshot[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("networth_snapshots")
    .where("userId", "==", uid)
    .orderBy("date", "desc")
    .get()
  // NetworthSnapshots are written by the dashboard only — decrypt with its sensitive fields
  const NETWORTH_SENSITIVE = [
    "totalBank", "totalInvestments", "totalAssets", "totalDebts", "networth", "liquidFunds",
  ]
  return snapshot.docs
    .map((doc) => decryptDoc<NetworthSnapshot>(rawDoc(doc), NETWORTH_SENSITIVE))
    .filter((r): r is NetworthSnapshot => r !== null)
}
