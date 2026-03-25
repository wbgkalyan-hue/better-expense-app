import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { GoalType, GOAL_TYPE_LABELS } from "@/types"
import { calculateGoalAllocations } from "@/services/goal-engine"
import type { Goal } from "@/types"

const DEMO_NETWORTH = 788000

const DEMO_GOALS: Goal[] = [
  {
    id: "1",
    userId: "demo",
    title: "Emergency Fund",
    type: GoalType.EMERGENCY_FUND,
    targetAmount: 200000,
    currentAmount: 150000,
    priority: 1,
    isActive: true,
    deductsFromNetworth: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    userId: "demo",
    title: "Goa Trip",
    type: GoalType.TRIP,
    targetAmount: 30000,
    currentAmount: 12000,
    priority: 2,
    deadline: "2026-06-15",
    isActive: true,
    deductsFromNetworth: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "3",
    userId: "demo",
    title: "MacBook Pro",
    type: GoalType.BIG_PURCHASE,
    targetAmount: 180000,
    currentAmount: 45000,
    priority: 3,
    isActive: true,
    deductsFromNetworth: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "4",
    userId: "demo",
    title: "Credit Card Payoff",
    type: GoalType.DEBT_PAYOFF,
    targetAmount: 25000,
    currentAmount: 18000,
    priority: 4,
    isActive: true,
    deductsFromNetworth: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "5",
    userId: "demo",
    title: "₹10L Portfolio",
    type: GoalType.INVESTMENT_TARGET,
    targetAmount: 1000000,
    currentAmount: 395000,
    priority: 5,
    isActive: true,
    deductsFromNetworth: false,
    createdAt: "",
    updatedAt: "",
  },
]

const GOAL_TYPE_ICONS: Record<GoalType, string> = {
  [GoalType.TRIP]: "✈️",
  [GoalType.EMERGENCY_FUND]: "🛡️",
  [GoalType.BIG_PURCHASE]: "🛍️",
  [GoalType.DEBT_PAYOFF]: "💳",
  [GoalType.INVESTMENT_TARGET]: "📈",
  [GoalType.CUSTOM]: "⭐",
}

export default function GoalsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"

  const goalsWithProgress = calculateGoalAllocations(DEMO_GOALS, DEMO_NETWORTH)
  const totalLocked = DEMO_GOALS.filter(
    (g) => g.isActive && g.deductsFromNetworth,
  ).reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = DEMO_GOALS.reduce((s, g) => s + g.currentAmount, 0)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>Goals</Text>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Networth
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₹{(DEMO_NETWORTH / 100000).toFixed(1)}L
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Locked
          </Text>
          <Text style={[styles.summaryValue, { color: "#f97316" }]}>
            ₹{(totalLocked / 100000).toFixed(1)}L
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Saved
          </Text>
          <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
            ₹{(totalSaved / 100000).toFixed(1)}L
          </Text>
        </View>
      </View>

      {/* Goal Cards */}
      {goalsWithProgress.map((goal) => (
        <View key={goal.id} style={[styles.goalCard, { backgroundColor: cardBg }]}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalIcon}>
              {GOAL_TYPE_ICONS[goal.type]}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalTitle, { color: colors.text }]}>
                {goal.title}
              </Text>
              <Text style={[styles.goalType, { color: colors.icon }]}>
                {GOAL_TYPE_LABELS[goal.type]} • Priority {goal.priority}
              </Text>
            </View>
            {goal.isFundingConflict && (
              <View style={styles.conflictBadge}>
                <Text style={styles.conflictText}>⚠️</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBg,
                { backgroundColor: colors.icon + "20" },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(goal.progressPercent, 100)}%`,
                    backgroundColor: goal.isFundingConflict
                      ? "#f97316"
                      : goal.progressPercent >= 100
                        ? "#22c55e"
                        : colors.tint,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.icon }]}>
              {goal.progressPercent.toFixed(0)}%
            </Text>
          </View>

          {/* Amount info */}
          <View style={styles.goalFooter}>
            <Text style={[styles.goalAmount, { color: colors.text }]}>
              ₹{goal.currentAmount.toLocaleString("en-IN")} / ₹
              {goal.targetAmount.toLocaleString("en-IN")}
            </Text>
            {goal.deadline && (
              <Text style={[styles.goalDeadline, { color: colors.icon }]}>
                Due: {new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </Text>
            )}
          </View>

          {goal.deductsFromNetworth && (
            <Text style={[styles.lockedNote, { color: "#f97316" }]}>
              🔒 Locks ₹{goal.targetAmount.toLocaleString("en-IN")} from networth
            </Text>
          )}
        </View>
      ))}

      {/* Add Goal Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => Alert.alert("Add Goal", "Coming soon — create a new financial goal")}
      >
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
  summaryLabel: { fontSize: 11, fontWeight: "500" },
  summaryValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  goalCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  goalIcon: { fontSize: 28 },
  goalTitle: { fontSize: 16, fontWeight: "600" },
  goalType: { fontSize: 12, marginTop: 2 },
  conflictBadge: { padding: 4 },
  conflictText: { fontSize: 18 },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  progressBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: { fontSize: 12, fontWeight: "600", width: 36, textAlign: "right" },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  goalAmount: { fontSize: 13, fontWeight: "500" },
  goalDeadline: { fontSize: 12 },
  lockedNote: { fontSize: 11, marginTop: 6 },
  addButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
})
