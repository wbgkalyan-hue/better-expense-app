import { useState, useEffect } from "react"
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
  getLocalTransactions,
  getLocalNetworthSnapshots,
  getLocalBrokerAccounts,
} from "@/services/database"
import type { Transaction, NetworthSnapshot } from "@/types"

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 100000) return `₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `₹${(abs / 1000).toFixed(1)}K`
  return `₹${abs}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

export default function HomeScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [networth, setNetworth] = useState(0)
  const [totalInvestments, setTotalInvestments] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !encryptionReady) return
    loadData()
  }, [user, encryptionReady])

  async function loadData() {
    try {
      const [txs, snapshots, brokers] = await Promise.all([
        getLocalTransactions(user!.uid),
        getLocalNetworthSnapshots(user!.uid),
        getLocalBrokerAccounts(user!.uid),
      ])
      setTransactions(txs)
      if (snapshots.length > 0) {
        setNetworth(snapshots[0].networth)
      }
      setTotalInvestments(
        brokers.reduce((sum, b) => sum + b.currentValue, 0),
      )
    } catch (err) {
      console.error("Failed to load home data:", err)
    } finally {
      setLoading(false)
    }
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  const recentTransactions = transactions.slice(0, 5)

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
      <Text style={[styles.greeting, { color: colors.text }]}>
        Good morning 👋
      </Text>
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        Here's your financial overview
      </Text>

      {/* Summary Cards */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Networth
          </Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {formatCurrency(networth)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Investments
          </Text>
          <Text style={[styles.cardValue, { color: colors.tint }]}>
            {formatCurrency(totalInvestments)}
          </Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Income
          </Text>
          <Text style={[styles.cardValue, { color: "#22c55e" }]}>
            +{formatCurrency(income)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Expenses
          </Text>
          <Text style={[styles.cardValue, { color: "#ef4444" }]}>
            -{formatCurrency(expenses)}
          </Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Transactions
      </Text>
      {recentTransactions.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No transactions yet. Add one or sync from cloud.
          </Text>
        </View>
      ) : (
        <View style={[styles.transactionList, { backgroundColor: cardBg }]}>
          {recentTransactions.map((tx) => (
            <View key={tx.id} style={styles.transactionRow}>
              <View>
                <Text style={[styles.txDescription, { color: colors.text }]}>
                  {tx.description}
                </Text>
                <Text style={[styles.txDate, { color: colors.icon }]}>
                  {formatDate(tx.date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === "income" ? "#22c55e" : "#ef4444" },
                ]}
              >
                {tx.type === "income" ? "+" : "-"}₹
                {Math.abs(tx.amount).toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  transactionList: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txDescription: {
    fontSize: 15,
    fontWeight: "500",
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
})
