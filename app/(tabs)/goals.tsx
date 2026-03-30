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
  Switch,
} from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { GoalType, GOAL_TYPE_LABELS } from "@/types"
import { calculateGoalAllocations } from "@/services/goal-engine"
import { useAuth } from "@/contexts/auth-context"
import {
  getLocalGoals,
  getLocalNetworthSnapshots,
  addLocalGoal,
} from "@/services/database"
import type { Goal } from "@/types"

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
  const { user, encryptionReady } = useAuth()

  const [goals, setGoals] = useState<Goal[]>([])
  const [networth, setNetworth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formType, setFormType] = useState<GoalType | null>(null)
  const [formTarget, setFormTarget] = useState("")
  const [formCurrent, setFormCurrent] = useState("")
  const [formPriority, setFormPriority] = useState("1")
  const [formDeducts, setFormDeducts] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const [goalsData, snapshots] = await Promise.all([
        getLocalGoals(user.uid),
        getLocalNetworthSnapshots(user.uid),
      ])
      setGoals(goalsData)
      if (snapshots.length > 0) {
        setNetworth(snapshots[0].networth)
      }
    } catch (err) {
      console.error("Failed to load goals:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAddGoal() {
    if (!user || !formTitle || !formType || !formTarget) return
    setSaving(true)
    try {
      await addLocalGoal({
        userId: user.uid,
        title: formTitle,
        type: formType,
        targetAmount: parseFloat(formTarget),
        currentAmount: formCurrent ? parseFloat(formCurrent) : 0,
        priority: parseInt(formPriority, 10) || 1,
        isActive: true,
        deductsFromNetworth: formDeducts,
      })
      setShowAdd(false)
      setFormTitle("")
      setFormType(null)
      setFormTarget("")
      setFormCurrent("")
      setFormPriority("1")
      setFormDeducts(false)
      await loadData()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add goal")
    } finally {
      setSaving(false)
    }
  }

  const goalsWithProgress = calculateGoalAllocations(goals, networth)
  const totalLocked = goals
    .filter((g) => g.isActive && g.deductsFromNetworth)
    .reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)

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
      <Text style={[styles.title, { color: colors.text }]}>Goals</Text>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Networth
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₹{networth >= 100000 ? (networth / 100000).toFixed(1) + "L" : networth.toLocaleString("en-IN")}
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
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Goal</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Goal Title (e.g. Europe Trip)"
              placeholderTextColor={colors.icon}
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.entries(GOAL_TYPE_LABELS).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: formType === val ? colors.tint : cardBg,
                      borderColor: formType === val ? "transparent" : colors.icon + "40",
                    },
                  ]}
                  onPress={() => setFormType(val as GoalType)}
                >
                  <Text style={{ color: formType === val ? "#fff" : colors.text, fontSize: 13 }}>
                    {GOAL_TYPE_ICONS[val as GoalType]} {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Target (₹)"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formTarget}
                onChangeText={setFormTarget}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Saved so far (₹)"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formCurrent}
                onChangeText={setFormCurrent}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput
                style={[styles.modalInput, { width: 80, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Priority"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formPriority}
                onChangeText={setFormPriority}
              />
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Switch value={formDeducts} onValueChange={setFormDeducts} />
                <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>Deduct from networth</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formTitle || !formType || !formTarget ? 0.5 : 1 }]}
                onPress={handleAddGoal}
                disabled={saving || !formTitle || !formType || !formTarget}
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
