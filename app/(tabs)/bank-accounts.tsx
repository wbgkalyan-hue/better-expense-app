import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { BankAccountType, BANK_ACCOUNT_TYPE_LABELS } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { getLocalBankAccounts, addLocalBankAccount } from "@/services/database"
import type { BankAccount } from "@/types"
import { CategoryChipPicker } from "@/components/category-chip-picker"

const TYPE_COLORS: Record<string, string> = {
  savings: "#22c55e",
  fd: "#3b82f6",
  rd: "#8b5cf6",
  current: "#f59e0b",
  other: "#94a3b8",
}

export default function BankAccountsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formBankName, setFormBankName] = useState("")
  const [formType, setFormType] = useState<BankAccountType | null>(null)
  const [formBalance, setFormBalance] = useState("")
  const [formRate, setFormRate] = useState("")
  const [saving, setSaving] = useState(false)

  const loadAccounts = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getLocalBankAccounts(user.uid)
      setAccounts(data)
    } catch (err) {
      console.error("Failed to load bank accounts:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  async function handleAdd() {
    if (!user || !formName || !formBankName || !formType || !formBalance) return
    setSaving(true)
    try {
      await addLocalBankAccount({
        userId: user.uid,
        name: formName,
        bankName: formBankName,
        type: formType,
        balance: parseFloat(formBalance),
        interestRate: formRate ? parseFloat(formRate) : undefined,
      })
      setShowAdd(false)
      setFormName("")
      setFormBankName("")
      setFormType(null)
      setFormBalance("")
      setFormRate("")
      await loadAccounts()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add account")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>Bank Accounts</Text>

      {/* Total Card */}
      <View style={[styles.totalCard, { backgroundColor: "#0ea5e9" }]}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalValue}>
          ₹{totalBalance.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.totalPeriod}>{accounts.length} accounts</Text>
      </View>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No bank accounts yet. Add one to start tracking.
          </Text>
        </View>
      ) : (
        accounts.map((account) => (
          <View key={account.id} style={[styles.accountCard, { backgroundColor: cardBg }]}>
            <View style={styles.accountHeader}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: (TYPE_COLORS[account.type] ?? "#94a3b8") + "20" },
                ]}
              >
                <Text style={{ color: TYPE_COLORS[account.type] ?? "#94a3b8", fontSize: 11, fontWeight: "600" }}>
                  {BANK_ACCOUNT_TYPE_LABELS[account.type]}
                </Text>
              </View>
              {account.interestRate && (
                <Text style={[styles.rate, { color: colors.icon }]}>{account.interestRate}% p.a.</Text>
              )}
            </View>
            <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
            <Text style={[styles.bankName, { color: colors.icon }]}>{account.bankName}</Text>
            <Text style={[styles.balance, { color: colors.text }]}>
              ₹{account.balance.toLocaleString("en-IN")}
            </Text>
            {account.maturityDate && (
              <Text style={[styles.maturity, { color: colors.icon }]}>
                Matures: {new Date(account.maturityDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </Text>
            )}
          </View>
        ))
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addButtonText}>+ Add Bank Account</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Bank Account</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Account Name (e.g. Main Savings)"
              placeholderTextColor={colors.icon}
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Bank Name (e.g. SBI, HDFC)"
              placeholderTextColor={colors.icon}
              value={formBankName}
              onChangeText={setFormBankName}
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <CategoryChipPicker group="bank_account_type" labels={BANK_ACCOUNT_TYPE_LABELS} value={formType} onValueChange={(val) => setFormType(val as BankAccountType)} colors={colors} cardBg={cardBg} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput
                style={[styles.modalInput, { flex: 2, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Balance (₹)"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formBalance}
                onChangeText={setFormBalance}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Rate %"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formRate}
                onChangeText={setFormRate}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formBankName || !formType || !formBalance ? 0.5 : 1 }]}
                onPress={handleAdd}
                disabled={saving || !formName || !formBankName || !formType || !formBalance}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{saving ? "Saving..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  totalCard: { borderRadius: 12, padding: 20, marginBottom: 16 },
  totalLabel: { color: "#fff", fontSize: 14, opacity: 0.8 },
  totalValue: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 4 },
  totalPeriod: { color: "#fff", fontSize: 12, opacity: 0.7, marginTop: 4 },
  accountCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  accountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rate: { fontSize: 12 },
  accountName: { fontSize: 16, fontWeight: "600" },
  bankName: { fontSize: 13, marginTop: 2 },
  balance: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  maturity: { fontSize: 12, marginTop: 4 },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  addButton: { height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 8 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalInput: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  typeScroll: { marginBottom: 16, maxHeight: 44 },
  typeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
