import { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/types"

const DEMO_EXPENSES = [
  { id: "1", description: "Swiggy Order", amount: 450, category: ExpenseCategory.FOOD, date: "Mar 25", source: "auto" as const },
  { id: "2", description: "Uber Ride", amount: 230, category: ExpenseCategory.TRANSPORT, date: "Mar 24", source: "auto" as const },
  { id: "3", description: "Amazon Purchase", amount: 2499, category: ExpenseCategory.SHOPPING, date: "Mar 23", source: "manual" as const },
  { id: "4", description: "Netflix", amount: 649, category: ExpenseCategory.SUBSCRIPTIONS, date: "Mar 22", source: "auto" as const },
  { id: "5", description: "Electricity Bill", amount: 1800, category: ExpenseCategory.BILLS, date: "Mar 20", source: "auto" as const },
  { id: "6", description: "Groceries", amount: 1250, category: ExpenseCategory.GROCERIES, date: "Mar 19", source: "manual" as const },
  { id: "7", description: "Doctor Visit", amount: 500, category: ExpenseCategory.HEALTH, date: "Mar 18", source: "manual" as const },
  { id: "8", description: "Movie Tickets", amount: 600, category: ExpenseCategory.ENTERTAINMENT, date: "Mar 17", source: "auto" as const },
]

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
  const [search, setSearch] = useState("")

  const total = DEMO_EXPENSES.reduce((sum, e) => sum + e.amount, 0)
  const filtered = DEMO_EXPENSES.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()),
  )

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
                  {EXPENSE_CATEGORY_LABELS[expense.category]} • {expense.date}
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

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => Alert.alert("Add Expense", "Coming soon — manual expense entry form")}
      >
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>
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
})
