import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { useAuth } from "@/contexts/auth-context"
import { getLocalBrokerAccounts } from "@/services/database"
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
        onPress={() => Alert.alert("Add Broker", "Coming soon — add a new broker account")}
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
})
