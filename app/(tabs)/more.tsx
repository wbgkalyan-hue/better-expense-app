import { Colors } from "@/constants/theme"
import { useAuth } from "@/contexts/auth-context"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { getUnsyncedCount } from "@/services/database"
import { isEncryptionReady } from "@/services/encryption"
import {
    hasNotificationPermission,
    requestNotificationPermission,
} from "@/services/notification-listener"
import { initNotificationProcessor } from "@/services/notification-processor"
import { performSync } from "@/services/sync"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Alert,
    AppState,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native"

interface MenuItem {
  title: string
  subtitle: string
  icon: string
  onPress: () => void
  comingSoon?: boolean
}

export default function MoreScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [notifPermission, setNotifPermission] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    checkNotificationStatus()
    if (user) {
      getUnsyncedCount(user.uid).then(setUnsyncedCount).catch(() => {})
    }
  }, [user])

  // Re-check notification permission when app comes back to foreground
  // (e.g. after user returns from Android Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        checkNotificationStatus()
      }
      appState.current = nextState
    })
    return () => subscription.remove()
  }, [checkNotificationStatus])

  const checkNotificationStatus = useCallback(async () => {
    if (Platform.OS === "android") {
      const status = await hasNotificationPermission()
      const wasDisabled = !notifPermission
      setNotifPermission(status)
      // If permission was just granted, re-initialize the processor
      if (status && wasDisabled && user) {
        initNotificationProcessor(user.uid).catch(() => {})
      }
    }
  }, [notifPermission, user])

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Finance",
      items: [
        {
          title: "Income",
          subtitle: "Track salary, freelance, and other income",
          icon: "💰",
          onPress: () => router.push("/(tabs)/income"),
        },
        {
          title: "Bank Accounts",
          subtitle: "Savings, FD, RD, and more",
          icon: "🏦",
          onPress: () => router.push("/(tabs)/bank-accounts"),
        },
        {
          title: "Assets",
          subtitle: "Property, vehicles, gold, electronics",
          icon: "📦",
          onPress: () => router.push("/(tabs)/assets"),
        },
        {
          title: "Networth",
          subtitle: "Total financial overview and trends",
          icon: "📊",
          onPress: () => router.push("/(tabs)/networth"),
        },
        {
          title: "RE Investments",
          subtitle: "Real estate investments and rental income",
          icon: "🏠",
          onPress: () => router.push("/(tabs)/re-investments"),
        },
        {
          title: "Insurance",
          subtitle: "Life, health, vehicle, and property policies",
          icon: "🛡️",
          onPress: () => router.push("/(tabs)/insurance"),
        },
        {
          title: "Credit Cards",
          subtitle: "Track limits, outstanding, and due dates",
          icon: "💳",
          onPress: () => router.push("/(tabs)/credit-cards"),
        },
        {
          title: "Loans",
          subtitle: "Home, car, personal, and other EMIs",
          icon: "🏦",
          onPress: () => router.push("/(tabs)/loans"),
        },
      ],
    },
    {
      title: "Ledger",
      items: [
        {
          title: "Friends Ledger",
          subtitle: "Track money lent to and borrowed from friends",
          icon: "📒",
          onPress: () => router.push("/(tabs)/friends-ledger"),
        },
        {
          title: "Family Ledger",
          subtitle: "Track payments and shares with family members",
          icon: "📓",
          onPress: () => router.push("/(tabs)/family-ledger"),
        },
      ],
    },
    {
      title: "Entities",
      items: [
        {
          title: "Friends",
          subtitle: "Manage your friends contact list",
          icon: "👥",
          onPress: () => router.push("/(tabs)/friends"),
        },
        {
          title: "Family",
          subtitle: "Manage your family members",
          icon: "👨‍👩‍👧‍👦",
          onPress: () => router.push("/(tabs)/family"),
        },
      ],
    },
    {
      title: "Other",
      items: [
        {
          title: "Properties",
          subtitle: "Owned, rented, and leased properties",
          icon: "🏘️",
          onPress: () => router.push("/(tabs)/properties"),
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Notification Access",
          subtitle: notifPermission
            ? "✅ Enabled — auto-logging transactions"
            : "⚠️ Disabled — tap to enable auto-logging",
          icon: "🔔",
          onPress: async () => {
            if (notifPermission) {
              Alert.alert(
                "Notification Access",
                "Auto-logging is active! BetterExpenses is monitoring notifications from banks, UPI apps, and brokers to automatically record your transactions.",
              )
            } else {
              Alert.alert(
                "Enable Notification Access",
                "BetterExpenses needs access to read your notifications to auto-log transactions from banking apps, UPI, and brokers.\n\n" +
                  "You will be taken to Settings → Notification access. Find BetterExpenses and enable the toggle.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Open Settings",
                    onPress: async () => {
                      await requestNotificationPermission()
                      // Permission status will be re-checked automatically
                      // via AppState listener when user returns from Settings
                    },
                  },
                ],
              )
            }
          },
        },
        {
          title: "Sync to Firebase",
          subtitle: syncing
            ? "Syncing..."
            : unsyncedCount > 0
              ? `${unsyncedCount} unsynced changes`
              : "All data synced",
          icon: "☁️",
          onPress: async () => {
            if (syncing) return
            if (!isEncryptionReady()) {
              Alert.alert("Encryption Required", "Please sign in again to enable encryption before syncing.")
              return
            }
            setSyncing(true)
            try {
              const result = await performSync()
              const messages = [
                `Pushed: ${result.pushed} records`,
                `Pulled: ${result.pulled} records`,
              ]
              if (result.errors.length > 0) {
                messages.push(`Errors: ${result.errors.length}`)
              }
              Alert.alert("Sync Complete", messages.join("\n"))
              if (user) {
                const count = await getUnsyncedCount(user.uid)
                setUnsyncedCount(count)
              }
            } catch (err: any) {
              Alert.alert("Sync Failed", err.message)
            } finally {
              setSyncing(false)
            }
          },
        },
        {
          title: "Encryption",
          subtitle: isEncryptionReady()
            ? "AES-256-GCM • Unlocked"
            : "AES-256-GCM • Locked (sign in to unlock)",
          icon: "🔐",
          onPress: () =>
            Alert.alert(
              "Encryption",
              "Your local data is encrypted with AES-256-GCM.\n\n" +
                "• Key derived from your password via PBKDF2 (600K iterations)\n" +
                "• Master key stored in Android Keystore\n" +
                "• On logout, the key is wiped — data becomes unreadable\n" +
                "• Same encryption format as the dashboard",
            ),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Sign Out",
          subtitle: user?.email ?? "Not signed in",
          icon: "🚪",
          onPress: () => {
            Alert.alert("Sign Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                  await signOut()
                  router.replace("/(auth)/login")
                },
              },
            ])
          },
        },
      ],
    },
  ]

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>More</Text>

      {/* Profile Card */}
      {user && (
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.tint + "20" },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.tint }]}>
              {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user.displayName ?? "User"}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.icon }]}>
              {user.email}
            </Text>
          </View>
        </View>
      )}

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>
            {section.title}
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.menuItem,
                  index < section.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.icon + "15",
                  },
                ]}
                onPress={item.onPress}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.menuTitleRow}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    {item.comingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.menuSubtitle, { color: colors.icon }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={[styles.menuChevron, { color: colors.icon }]}>
                  ›
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold" },
  profileName: { fontSize: 16, fontWeight: "600" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: { borderRadius: 12, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  menuIcon: { fontSize: 22 },
  menuTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  menuTitle: { fontSize: 15, fontWeight: "500" },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  menuChevron: { fontSize: 22, fontWeight: "300" },
  comingSoonBadge: {
    backgroundColor: "#f9731620",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: { fontSize: 10, color: "#f97316", fontWeight: "600" },
})
