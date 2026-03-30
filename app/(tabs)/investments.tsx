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
import { useRouter } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { useAuth } from "@/contexts/auth-context"
import { getLocalBrokerAccounts, addLocalBrokerAccount } from "@/services/database"
import type { BrokerAccount } from "@/types"

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

export default function InvestmentsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [brokers, setBrokers] = useState<BrokerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formBroker, setFormBroker] = useState("")
  const [formInvested, setFormInvested] = useState("")
  const [formCurrent, setFormCurrent] = useState("")
  const [saving, setSaving] = useState(false)

  const loadBrokers = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getLocalBrokerAccounts(user.uid)
      setBrokers(data)
    } catch (err) {
      console.error("Failed to load brokers:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadBrokers()
  }, [loadBrokers])

  async function handleAddBroker() {
    if (!user || !formName || !formBroker || !formInvested || !formCurrent) return
    setSaving(true)
    try {
      const invested = parseFloat(formInvested)
      const current = parseFloat(formCurrent)
      const returns = current - invested
      const returnsPercent = invested > 0 ? parseFloat(((returns / invested) * 100).toFixed(2)) : 0
      await addLocalBrokerAccount({
        userId: user.uid,
        name: formName,
        broker: formBroker,
        totalInvested: invested,
        currentValue: current,
        returns,
        returnsPercent,
      })
      setShowAdd(false)
      setFormName("")
      setFormBroker("")
      setFormInvested("")
      setFormCurrent("")
      await loadBrokers()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add broker")
    } finally {
      setSaving(false)
    }
  }

  const totalInvested = brokers.reduce((s, b) => s + b.totalInvested, 0)
  const totalCurrent = brokers.reduce((s, b) => s + b.currentValue, 0)
  const totalReturns = totalCurrent - totalInvested
  const totalPercent =
    totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0.0"

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
      <Text style={[styles.title, { color: colors.text }]}>Investments</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Invested
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrency(totalInvested)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Current
          </Text>
          <Text style={[styles.summaryValue, { color: colors.tint }]}>
            {formatCurrency(totalCurrent)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Returns
          </Text>
          <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
            +{totalPercent}%
          </Text>
        </View>
      </View>

      {/* Broker Accounts */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Broker Accounts
      </Text>
      {brokers.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No broker accounts yet. Add one or sync from cloud.
          </Text>
        </View>
      ) : (
      brokers.map((broker) => (
        <TouchableOpacity
          key={broker.id}
          style={[styles.brokerCard, { backgroundColor: cardBg }]}
          onPress={() =>
            Alert.alert(broker.name, `Invested: ₹${broker.totalInvested.toLocaleString("en-IN")}\nCurrent: ₹${broker.currentValue.toLocaleString("en-IN")}\nReturns: +${broker.returnsPercent}%`)
          }
        >
          <View style={styles.brokerHeader}>
            <View
              style={[
                styles.brokerAvatar,
                { backgroundColor: colors.tint + "20" },
              ]}
            >
              <Text style={[styles.brokerInitial, { color: colors.tint }]}>
                {broker.broker[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brokerName, { color: colors.text }]}>
                {broker.name}
              </Text>
              <Text style={[styles.brokerMeta, { color: colors.icon }]}>
                {broker.broker}
              </Text>
            </View>
            <View style={styles.brokerReturns}>
              <Text style={[styles.brokerValue, { color: colors.text }]}>
                {formatCurrency(broker.currentValue)}
              </Text>
              <Text style={styles.brokerPercent}>
                +{broker.returnsPercent}%
              </Text>
            </View>
          </View>

          {/* Simple bar showing invested vs current */}
          <View style={styles.barContainer}>
            <View
              style={[
                styles.barInvested,
                {
                  flex: broker.totalInvested,
                  backgroundColor: colors.icon + "40",
                },
              ]}
            />
            <View
              style={[
                styles.barReturns,
                { flex: broker.returns, backgroundColor: "#22c55e" },
              ]}
            />
          </View>
        </TouchableOpacity>
      ))
      )}

      {/* Add Broker Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addButtonText}>+ Add Broker Account</Text>
      </TouchableOpacity>

      {/* Notification Patterns Link */}
      <TouchableOpacity
        style={[styles.patternsButton, { borderColor: colors.tint }]}
        onPress={() => Alert.alert("Notification Patterns", "Coming soon — manage notification matching patterns for auto-logging broker deposits")}
      >
        <Text style={[styles.patternsButtonText, { color: colors.tint }]}>
          🔔 Manage Notification Patterns
        </Text>
      </TouchableOpacity>

      {/* Add Broker Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Broker Account</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Account Name (e.g. Zerodha MF)"
              placeholderTextColor={colors.icon}
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Broker (e.g. Zerodha, Groww)"
              placeholderTextColor={colors.icon}
              value={formBroker}
              onChangeText={setFormBroker}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Total Invested (₹)"
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
              value={formInvested}
              onChangeText={setFormInvested}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Current Value (₹)"
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
              value={formCurrent}
              onChangeText={setFormCurrent}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formBroker || !formInvested || !formCurrent ? 0.5 : 1 }]}
                onPress={handleAddBroker}
                disabled={saving || !formName || !formBroker || !formInvested || !formCurrent}
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
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  brokerCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  brokerHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  brokerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  brokerInitial: { fontSize: 18, fontWeight: "bold" },
  brokerName: { fontSize: 15, fontWeight: "600" },
  brokerMeta: { fontSize: 12, marginTop: 2 },
  brokerReturns: { alignItems: "flex-end" },
  brokerValue: { fontSize: 16, fontWeight: "600" },
  brokerPercent: { fontSize: 12, color: "#22c55e", marginTop: 2 },
  barContainer: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 12,
  },
  barInvested: { borderRadius: 3 },
  barReturns: { borderRadius: 3 },
  addButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  patternsButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  patternsButtonText: { fontSize: 15, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalInput: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
