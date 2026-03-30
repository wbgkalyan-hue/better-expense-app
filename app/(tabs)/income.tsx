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
import { INCOME_CATEGORY_LABELS, IncomeCategory } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { getLocalTransactions, addLocalTransaction } from "@/services/database"
import type { Transaction } from "@/types"

const CATEGORY_COLORS: Record<string, string> = {
  salary: "#22c55e",
  freelance: "#3b82f6",
  business: "#8b5cf6",
  investments: "#f97316",
  rental: "#14b8a6",
  gift: "#ec4899",
  refund: "#6366f1",
  other: "#94a3b8",
}

export default function IncomeScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [incomes, setIncomes] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formDesc, setFormDesc] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategory, setFormCategory] = useState<IncomeCategory | null>(null)
  const [saving, setSaving] = useState(false)

  const loadIncomes = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const txs = await getLocalTransactions(user.uid)
      setIncomes(txs.filter((t) => t.type === "income"))
    } catch (err) {
      console.error("Failed to load income:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadIncomes()
  }, [loadIncomes])

  const total = incomes.reduce((sum, t) => sum + t.amount, 0)

  async function handleAddIncome() {
    if (!user || !formDesc || !formAmount || !formCategory) return
    setSaving(true)
    try {
      await addLocalTransaction({
        userId: user.uid,
        amount: parseFloat(formAmount),
        type: "income",
        category: formCategory,
        description: formDesc,
        date: new Date().toISOString().split("T")[0],
        source: "manual",
      })
      setShowAdd(false)
      setFormDesc("")
      setFormAmount("")
      setFormCategory(null)
      await loadIncomes()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add income")
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
      <Text style={[styles.title, { color: colors.text }]}>Income</Text>

      {/* Total Card */}
      <View style={[styles.totalCard, { backgroundColor: "#22c55e" }]}>
        <Text style={styles.totalLabel}>Total Income</Text>
        <Text style={styles.totalValue}>
          ₹{total.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.totalPeriod}>{incomes.length} transactions</Text>
      </View>

      {/* Income List */}
      {incomes.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No income recorded yet. Add one to start tracking.
          </Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: cardBg }]}>
          {incomes.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: CATEGORY_COLORS[tx.category] ?? "#94a3b8" },
                  ]}
                />
                <View>
                  <Text style={[styles.rowDesc, { color: colors.text }]}>
                    {tx.description}
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.icon }]}>
                    {INCOME_CATEGORY_LABELS[tx.category as IncomeCategory] ?? tx.category} •{" "}
                    {new Date(tx.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowAmount}>
                +₹{tx.amount.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addButtonText}>+ Add Income</Text>
      </TouchableOpacity>

      {/* Add Income Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Income</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Description (e.g. March Salary)"
              placeholderTextColor={colors.icon}
              value={formDesc}
              onChangeText={setFormDesc}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Amount (₹)"
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />
            <Text style={[styles.modalLabel, { color: colors.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {Object.entries(INCOME_CATEGORY_LABELS).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: formCategory === val ? (CATEGORY_COLORS[val] ?? colors.tint) : cardBg,
                      borderColor: formCategory === val ? "transparent" : colors.icon + "40",
                    },
                  ]}
                  onPress={() => setFormCategory(val as IncomeCategory)}
                >
                  <Text style={{ color: formCategory === val ? "#fff" : colors.text, fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formDesc || !formAmount || !formCategory ? 0.5 : 1 }]}
                onPress={handleAddIncome}
                disabled={saving || !formDesc || !formAmount || !formCategory}
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
  list: { borderRadius: 12, padding: 16, gap: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowDesc: { fontSize: 15, fontWeight: "500" },
  rowMeta: { fontSize: 12, marginTop: 2 },
  rowAmount: { fontSize: 16, fontWeight: "600", color: "#22c55e" },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  addButton: { height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 20 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalInput: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  categoryScroll: { marginBottom: 16, maxHeight: 44 },
  categoryChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
