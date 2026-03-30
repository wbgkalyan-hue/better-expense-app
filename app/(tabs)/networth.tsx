import { useState, useEffect, useCallback, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { useAuth } from "@/contexts/auth-context"
import {
  getLocalNetworthSnapshots,
  getLocalBankAccounts,
  getLocalBrokerAccounts,
  getLocalAssets,
} from "@/services/database"
import type { NetworthSnapshot } from "@/types"

function formatLakhs(amount: number): string {
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  return `₹${amount.toLocaleString("en-IN")}`
}

export default function NetworthScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [snapshots, setSnapshots] = useState<NetworthSnapshot[]>([])
  const [liveData, setLiveData] = useState({
    bank: 0,
    investments: 0,
    assets: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const [snaps, banks, brokers, assetsData] = await Promise.all([
        getLocalNetworthSnapshots(user.uid),
        getLocalBankAccounts(user.uid),
        getLocalBrokerAccounts(user.uid),
        getLocalAssets(user.uid),
      ])
      setSnapshots(snaps)
      setLiveData({
        bank: banks.reduce((s, b) => s + b.balance, 0),
        investments: brokers.reduce((s, b) => s + b.currentValue, 0),
        assets: assetsData.reduce((s, a) => s + a.currentValue, 0),
      })
    } catch (err) {
      console.error("Failed to load networth:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadData()
  }, [loadData])

  const liveNetworth = liveData.bank + liveData.investments + liveData.assets
  const lastSnapshot = snapshots[0]
  const prevSnapshot = snapshots[1]
  const change = lastSnapshot && prevSnapshot ? lastSnapshot.networth - prevSnapshot.networth : 0

  const breakdownItems = useMemo(() => [
    { label: "Bank Accounts", value: liveData.bank, color: "#0ea5e9", icon: "🏦" },
    { label: "Investments", value: liveData.investments, color: "#22c55e", icon: "📈" },
    { label: "Assets", value: liveData.assets, color: "#f59e0b", icon: "📦" },
  ], [liveData])

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
      <Text style={[styles.title, { color: colors.text }]}>Networth</Text>

      {/* Networth Card */}
      <View style={[styles.networthCard, { backgroundColor: colors.tint }]}>
        <Text style={styles.networthLabel}>Total Networth</Text>
        <Text style={styles.networthValue}>{formatLakhs(liveNetworth)}</Text>
        {change !== 0 && (
          <Text style={styles.networthChange}>
            {change > 0 ? "▲" : "▼"} {formatLakhs(Math.abs(change))} since last snapshot
          </Text>
        )}
      </View>

      {/* Breakdown */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Breakdown</Text>
      {breakdownItems.map((item) => (
        <View key={item.label} style={[styles.breakdownCard, { backgroundColor: cardBg }]}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>{item.label}</Text>
              <View style={[styles.bar, { backgroundColor: colors.icon + "15" }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: item.color,
                      width: liveNetworth > 0 ? `${(item.value / liveNetworth) * 100}%` : "0%",
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {formatLakhs(item.value)}
            </Text>
          </View>
        </View>
      ))}

      {/* Snapshot History */}
      {snapshots.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            History
          </Text>
          {snapshots.slice(0, 10).map((snap) => (
            <View key={snap.id} style={[styles.historyRow, { backgroundColor: cardBg }]}>
              <Text style={[styles.historyDate, { color: colors.icon }]}>
                {new Date(snap.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
              <Text style={[styles.historyValue, { color: colors.text }]}>
                {formatLakhs(snap.networth)}
              </Text>
            </View>
          ))}
        </>
      )}

      {snapshots.length === 0 && liveNetworth === 0 && (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Add bank accounts, investments, and assets to see your networth.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  networthCard: { borderRadius: 12, padding: 24, marginBottom: 24, alignItems: "center" },
  networthLabel: { color: "#fff", fontSize: 14, opacity: 0.8 },
  networthValue: { color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 4 },
  networthChange: { color: "#fff", fontSize: 13, opacity: 0.75, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  breakdownCard: { borderRadius: 12, padding: 16, marginBottom: 10 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  breakdownIcon: { fontSize: 24 },
  breakdownLabel: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  breakdownValue: { fontSize: 16, fontWeight: "bold", minWidth: 80, textAlign: "right" },
  bar: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  historyDate: { fontSize: 13 },
  historyValue: { fontSize: 15, fontWeight: "600" },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  center: { justifyContent: "center", alignItems: "center" },
})
