import { firestore, auth } from "./firebase"
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

function docToData<T>(doc: FirestoreDoc): T {
  return { id: doc.id, ...doc.data() } as T
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
  return snapshot.docs.map(docToData<Transaction>)
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await firestore()
    .collection("transactions")
    .add({
      ...data,
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
  return snapshot.docs.map(docToData<BrokerAccount>)
}

export async function addBrokerAccount(
  data: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await firestore()
    .collection("broker_accounts")
    .add({
      ...data,
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
  return snapshot.docs.map(docToData<InvestmentTransaction>)
}

export async function addInvestmentTransaction(
  data: Omit<InvestmentTransaction, "id" | "createdAt">,
): Promise<string> {
  const ref = await firestore()
    .collection("investment_transactions")
    .add({
      ...data,
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
  return snapshot.docs.map(docToData<Goal>)
}

export async function addGoal(
  data: Omit<Goal, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await firestore()
    .collection("goals")
    .add({
      ...data,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateGoal(
  id: string,
  data: Partial<Goal>,
): Promise<void> {
  await firestore()
    .collection("goals")
    .doc(id)
    .update({
      ...data,
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
  return snapshot.docs.map(docToData<NotificationPattern>)
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
  return snapshot.docs.map(docToData<BankAccount>)
}

export async function getAssets(): Promise<Asset[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("assets")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs.map(docToData<Asset>)
}

export async function getNetworthSnapshots(): Promise<NetworthSnapshot[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("networth_snapshots")
    .where("userId", "==", uid)
    .orderBy("date", "desc")
    .get()
  return snapshot.docs.map(docToData<NetworthSnapshot>)
}
