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
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from "@/services/notification-listener"
import { performSync } from "@/services/sync"
import { getUnsyncedCount } from "@/services/database"
import { isEncryptionReady } from "@/services/encryption"
import { useState, useEffect } from "react"

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

  useEffect(() => {
    hasNotificationPermission().then(setNotifPermission)
    if (user) {
      getUnsyncedCount(user.uid).then(setUnsyncedCount).catch(() => {})
    }
  }, [user])

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Coming Soon",
      items: [
        {
          title: "Income",
          subtitle: "Track salary, freelance, and other income",
          icon: "💰",
          comingSoon: true,
          onPress: () => Alert.alert("Coming Soon", "Income tracking will be available soon"),
        },
        {
          title: "Bank Accounts",
          subtitle: "Savings, FD, RD, and more",
          icon: "🏦",
          comingSoon: true,
          onPress: () => Alert.alert("Coming Soon", "Bank account tracking will be available soon"),
        },
        {
          title: "Assets",
          subtitle: "Property, vehicles, gold, electronics",
          icon: "📦",
          comingSoon: true,
          onPress: () => Alert.alert("Coming Soon", "Asset tracking will be available soon"),
        },
        {
          title: "Networth",
          subtitle: "Total financial overview and trends",
          icon: "📊",
          comingSoon: true,
          onPress: () => Alert.alert("Coming Soon", "Networth overview will be available soon"),
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Notification Access",
          subtitle: notifPermission ? "✅ Enabled" : "Grant permission to auto-log transactions",
          icon: "🔔",
          onPress: async () => {
            if (notifPermission) {
              Alert.alert("Notification Access", "Already enabled! Notifications are being monitored.")
            } else {
              await requestNotificationPermission()
              const status = await hasNotificationPermission()
              setNotifPermission(status)
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
