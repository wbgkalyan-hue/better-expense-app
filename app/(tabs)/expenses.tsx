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
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { getLocalTransactions, addLocalTransaction } from "@/services/database"
import { CategoryChipPicker } from "@/components/category-chip-picker"
import type { Transaction } from "@/types"

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  shopping: "#ec4899",
  entertainment: "#8b5cf6",
  bills: "#ef4444",
  health: "#22c55e",
  groceries: "#14b8a6",
  subscriptions: "#6366f1",
  rent: "#f59e0b",
  education: "#06b6d4",
  travel: "#d946ef",
  personal: "#64748b",
  other: "#94a3b8",
}

export default function ExpensesScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [search, setSearch] = useState("")
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formDesc, setFormDesc] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategory, setFormCategory] = useState<ExpenseCategory | null>(null)
  const [saving, setSaving] = useState(false)

  const loadExpenses = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const txs = await getLocalTransactions(user.uid)
      setExpenses(txs.filter((t) => t.type === "expense"))
    } catch (err) {
      console.error("Failed to load expenses:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleAddExpense() {
    if (!user || !formDesc || !formAmount || !formCategory) return
    setSaving(true)
    try {
      await addLocalTransaction({
        userId: user.uid,
        amount: parseFloat(formAmount),
        type: "expense",
        category: formCategory,
        description: formDesc,
        date: new Date().toISOString().split("T")[0],
        source: "manual",
      })
      setShowAdd(false)
      setFormDesc("")
      setFormAmount("")
      setFormCategory(null)
      await loadExpenses()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add expense")
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
      <Text style={[styles.title, { color: colors.text }]}>Expenses</Text>

      {/* Total Card */}
      <View style={[styles.totalCard, { backgroundColor: "#ef4444" }]}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalValue}>
          ₹{total.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.totalPeriod}>This month</Text>
      </View>

      {/* Search */}
      <TextInput
        style={[
          styles.searchInput,
          {
            color: colors.text,
            borderColor: colors.icon,
            backgroundColor: cardBg,
          },
        ]}
        placeholder="Search expenses..."
        placeholderTextColor={colors.icon}
        value={search}
        onChangeText={setSearch}
      />

      {/* Expense List */}
      {filtered.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            {search ? "No matching expenses" : "No expenses yet. Add one or sync from cloud."}
          </Text>
        </View>
      ) : (
      <View style={[styles.list, { backgroundColor: cardBg }]}>
        {filtered.map((expense) => (
          <View key={expense.id} style={styles.expenseRow}>
            <View style={styles.expenseLeft}>
              <View
                style={[
                  styles.categoryDot,
                  {
                    backgroundColor:
                      CATEGORY_COLORS[expense.category] ?? "#94a3b8",
                  },
                ]}
              />
              <View>
                <Text style={[styles.expenseDesc, { color: colors.text }]}>
                  {expense.description}
                </Text>
                <Text style={[styles.expenseMeta, { color: colors.icon }]}>
                  {EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategory] ?? expense.category} • {new Date(expense.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  {expense.source === "auto" ? " • 🔔" : ""}
                </Text>
              </View>
            </View>
            <Text style={styles.expenseAmount}>
              -₹{expense.amount.toLocaleString("en-IN")}
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
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Description (e.g. Swiggy Order)"
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
            <CategoryChipPicker
              group="expense_category"
              labels={EXPENSE_CATEGORY_LABELS}
              value={formCategory}
              onValueChange={(val) => setFormCategory(val as ExpenseCategory)}
              colorMap={CATEGORY_COLORS}
              colors={colors}
              cardBg={cardBg}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formDesc || !formAmount || !formCategory ? 0.5 : 1 }]}
                onPress={handleAddExpense}
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
  totalCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  totalLabel: { color: "#fff", fontSize: 14, opacity: 0.8 },
  totalValue: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 4 },
  totalPeriod: { color: "#fff", fontSize: 12, opacity: 0.7, marginTop: 4 },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
  },
  list: { borderRadius: 12, padding: 16, gap: 16 },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  expenseDesc: { fontSize: 15, fontWeight: "500" },
  expenseMeta: { fontSize: 12, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: "600", color: "#ef4444" },
  addButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
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
