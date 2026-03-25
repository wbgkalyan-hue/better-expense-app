import { View, Text, ScrollView, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"

// Demo data — will be replaced with Firestore queries
const DEMO_NETWORTH = 788000
const DEMO_INCOME = 85000
const DEMO_EXPENSES = 42300
const DEMO_INVESTMENTS = 350000

const RECENT_TRANSACTIONS = [
  { id: "1", description: "Swiggy", amount: -450, date: "Today" },
  { id: "2", description: "Salary", amount: 85000, date: "Yesterday" },
  { id: "3", description: "Amazon", amount: -2499, date: "Mar 23" },
  { id: "4", description: "Kite Deposit", amount: -10000, date: "Mar 22" },
  { id: "5", description: "Electricity Bill", amount: -1800, date: "Mar 20" },
]

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 100000) return `₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `₹${(abs / 1000).toFixed(1)}K`
  return `₹${abs}`
}

export default function HomeScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"

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
            {formatCurrency(DEMO_NETWORTH)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Investments
          </Text>
          <Text style={[styles.cardValue, { color: colors.tint }]}>
            {formatCurrency(DEMO_INVESTMENTS)}
          </Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Income
          </Text>
          <Text style={[styles.cardValue, { color: "#22c55e" }]}>
            +{formatCurrency(DEMO_INCOME)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardLabel, { color: colors.icon }]}>
            Expenses
          </Text>
          <Text style={[styles.cardValue, { color: "#ef4444" }]}>
            -{formatCurrency(DEMO_EXPENSES)}
          </Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Transactions
      </Text>
      <View style={[styles.transactionList, { backgroundColor: cardBg }]}>
        {RECENT_TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={styles.transactionRow}>
            <View>
              <Text style={[styles.txDescription, { color: colors.text }]}>
                {tx.description}
              </Text>
              <Text style={[styles.txDate, { color: colors.icon }]}>
                {tx.date}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: tx.amount > 0 ? "#22c55e" : "#ef4444" },
              ]}
            >
              {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString("en-IN")}
            </Text>
          </View>
        ))}
      </View>
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
})
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
