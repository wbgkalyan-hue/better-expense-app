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
  RealEstateInvestment,
  InsurancePolicy,
  CreditCard,
  Loan,
  Friend,
  FamilyMember,
  FriendsLedgerEntry,
  FamilyLedgerEntry,
  Property,
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
// New collection sensitive field definitions
// ---------------------------------------------------------------------------

const RE_INVESTMENT_SENSITIVE = ["purchasePrice", "currentValue", "monthlyRent", "notes"]
const INSURANCE_SENSITIVE = ["policyNumber", "premium", "coverageAmount"]
const CREDIT_CARD_SENSITIVE = ["last4", "creditLimit", "outstandingBalance", "minPayment", "interestRate"]
const LOAN_SENSITIVE = ["principalAmount", "outstandingAmount", "interestRate", "emiAmount"]
const FRIEND_SENSITIVE = ["name", "phone", "email", "address"]
const FAMILY_MEMBER_SENSITIVE = ["name", "phone", "email"]
const FRIENDS_LEDGER_SENSITIVE = ["amount", "description"]
const FAMILY_LEDGER_SENSITIVE = ["amount", "description"]
const PROPERTY_SENSITIVE = ["address", "currentValue", "purchasePrice", "monthlyRent", "monthlyEmi"]

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

// ---------------------------------------------------------------------------
// Real Estate Investments
// ---------------------------------------------------------------------------

export async function getRealEstateInvestments(): Promise<RealEstateInvestment[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("re_investments")
    .where("userId", "==", uid)
    .orderBy("purchaseDate", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<RealEstateInvestment>(rawDoc(doc), RE_INVESTMENT_SENSITIVE))
    .filter((r): r is RealEstateInvestment => r !== null)
}

export async function addRealEstateInvestment(
  data: Omit<RealEstateInvestment, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, RE_INVESTMENT_SENSITIVE)
  const ref = await firestore()
    .collection("re_investments")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateRealEstateInvestment(
  id: string,
  data: Partial<RealEstateInvestment>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, RE_INVESTMENT_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("re_investments")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteRealEstateInvestment(id: string): Promise<void> {
  await firestore().collection("re_investments").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Insurance Policies
// ---------------------------------------------------------------------------

export async function getInsurancePolicies(): Promise<InsurancePolicy[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("insurance_policies")
    .where("userId", "==", uid)
    .orderBy("startDate", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<InsurancePolicy>(rawDoc(doc), INSURANCE_SENSITIVE))
    .filter((r): r is InsurancePolicy => r !== null)
}

export async function addInsurancePolicy(
  data: Omit<InsurancePolicy, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, INSURANCE_SENSITIVE)
  const ref = await firestore()
    .collection("insurance_policies")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateInsurancePolicy(
  id: string,
  data: Partial<InsurancePolicy>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, INSURANCE_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("insurance_policies")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteInsurancePolicy(id: string): Promise<void> {
  await firestore().collection("insurance_policies").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Credit Cards
// ---------------------------------------------------------------------------

export async function getCreditCards(): Promise<CreditCard[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("credit_cards")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<CreditCard>(rawDoc(doc), CREDIT_CARD_SENSITIVE))
    .filter((r): r is CreditCard => r !== null)
}

export async function addCreditCard(
  data: Omit<CreditCard, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, CREDIT_CARD_SENSITIVE)
  const ref = await firestore()
    .collection("credit_cards")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateCreditCard(
  id: string,
  data: Partial<CreditCard>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, CREDIT_CARD_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("credit_cards")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteCreditCard(id: string): Promise<void> {
  await firestore().collection("credit_cards").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------

export async function getLoans(): Promise<Loan[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("loans")
    .where("userId", "==", uid)
    .orderBy("startDate", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<Loan>(rawDoc(doc), LOAN_SENSITIVE))
    .filter((r): r is Loan => r !== null)
}

export async function addLoan(
  data: Omit<Loan, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, LOAN_SENSITIVE)
  const ref = await firestore()
    .collection("loans")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateLoan(
  id: string,
  data: Partial<Loan>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, LOAN_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("loans")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteLoan(id: string): Promise<void> {
  await firestore().collection("loans").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export async function getFriends(): Promise<Friend[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("friends")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<Friend>(rawDoc(doc), FRIEND_SENSITIVE))
    .filter((r): r is Friend => r !== null)
}

export async function addFriend(
  data: Omit<Friend, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FRIEND_SENSITIVE)
  const ref = await firestore()
    .collection("friends")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateFriend(
  id: string,
  data: Partial<Friend>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FRIEND_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("friends")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteFriend(id: string): Promise<void> {
  await firestore().collection("friends").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Family Members
// ---------------------------------------------------------------------------

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("family_members")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<FamilyMember>(rawDoc(doc), FAMILY_MEMBER_SENSITIVE))
    .filter((r): r is FamilyMember => r !== null)
}

export async function addFamilyMember(
  data: Omit<FamilyMember, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FAMILY_MEMBER_SENSITIVE)
  const ref = await firestore()
    .collection("family_members")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateFamilyMember(
  id: string,
  data: Partial<FamilyMember>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FAMILY_MEMBER_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("family_members")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteFamilyMember(id: string): Promise<void> {
  await firestore().collection("family_members").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Friends Ledger
// ---------------------------------------------------------------------------

export async function getFriendsLedger(): Promise<FriendsLedgerEntry[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("friends_ledger")
    .where("userId", "==", uid)
    .orderBy("date", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<FriendsLedgerEntry>(rawDoc(doc), FRIENDS_LEDGER_SENSITIVE))
    .filter((r): r is FriendsLedgerEntry => r !== null)
}

export async function addFriendsLedgerEntry(
  data: Omit<FriendsLedgerEntry, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FRIENDS_LEDGER_SENSITIVE)
  const ref = await firestore()
    .collection("friends_ledger")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateFriendsLedgerEntry(
  id: string,
  data: Partial<FriendsLedgerEntry>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FRIENDS_LEDGER_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("friends_ledger")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteFriendsLedgerEntry(id: string): Promise<void> {
  await firestore().collection("friends_ledger").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Family Ledger
// ---------------------------------------------------------------------------

export async function getFamilyLedger(): Promise<FamilyLedgerEntry[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("family_ledger")
    .where("userId", "==", uid)
    .orderBy("date", "desc")
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<FamilyLedgerEntry>(rawDoc(doc), FAMILY_LEDGER_SENSITIVE))
    .filter((r): r is FamilyLedgerEntry => r !== null)
}

export async function addFamilyLedgerEntry(
  data: Omit<FamilyLedgerEntry, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FAMILY_LEDGER_SENSITIVE)
  const ref = await firestore()
    .collection("family_ledger")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateFamilyLedgerEntry(
  id: string,
  data: Partial<FamilyLedgerEntry>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, FAMILY_LEDGER_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("family_ledger")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteFamilyLedgerEntry(id: string): Promise<void> {
  await firestore().collection("family_ledger").doc(id).delete()
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export async function getProperties(): Promise<Property[]> {
  const uid = getUserId()
  const snapshot = await firestore()
    .collection("properties")
    .where("userId", "==", uid)
    .get()
  return snapshot.docs
    .map((doc) => decryptDoc<Property>(rawDoc(doc), PROPERTY_SENSITIVE))
    .filter((r): r is Property => r !== null)
}

export async function addProperty(
  data: Omit<Property, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, PROPERTY_SENSITIVE)
  const ref = await firestore()
    .collection("properties")
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
  return ref.id
}

export async function updateProperty(
  id: string,
  data: Partial<Property>,
): Promise<void> {
  const payload = encryptDoc({ ...data } as Record<string, unknown>, PROPERTY_SENSITIVE)
  if (isEncryptionReady()) (payload as Record<string, unknown>)._encrypted = true
  await firestore()
    .collection("properties")
    .doc(id)
    .update({
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
}

export async function deleteProperty(id: string): Promise<void> {
  await firestore().collection("properties").doc(id).delete()
}
