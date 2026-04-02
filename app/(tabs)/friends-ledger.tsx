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
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import { useAuth } from "@/contexts/auth-context"
import {
  getFriendsLedger,
  addFriendsLedgerEntry,
  updateFriendsLedgerEntry,
  getFriends,
} from "@/services/firestore"
import type { FriendsLedgerEntry, LedgerEntryType, Friend } from "@/types"
import { LEDGER_ENTRY_TYPE_LABELS } from "@/types"

function formatINR(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr"
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L"
  return "₹" + n.toLocaleString("en-IN")
}

export default function FriendsLedgerScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [items, setItems] = useState<FriendsLedgerEntry[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formFriendId, setFormFriendId] = useState("")
  const [formType, setFormType] = useState<LedgerEntryType>("lent")
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDate, setFormDate] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const [ledger, friendsList] = await Promise.all([
        getFriendsLedger(),
        getFriends(),
      ])
      setItems(ledger)
      setFriends(friendsList)
    } catch (err) {
      console.error("Failed to load friends ledger:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => { load() }, [load])

  const unsettled = items.filter((i) => !i.settled)
  const lent = unsettled.filter((i) => i.type === "lent").reduce((s, i) => s + i.amount, 0)
  const borrowed = unsettled.filter((i) => i.type === "borrowed").reduce((s, i) => s + i.amount, 0)
  const netPosition = lent - borrowed
  const unsettledTotal = lent + borrowed

  async function handleSettle(entry: FriendsLedgerEntry) {
    Alert.alert("Settle", `Mark ₹${entry.amount.toLocaleString("en-IN")} as settled?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Settle",
        onPress: async () => {
          try {
            await updateFriendsLedgerEntry(entry.id, {
              settled: true,
              settledDate: new Date().toISOString().split("T")[0],
            })
            await load()
          } catch (err: any) {
            Alert.alert("Error", err.message)
          }
        },
      },
    ])
  }

  async function handleAdd() {
    if (!user || !formFriendId || !formAmount || !formDescription || !formDate) return
    setSaving(true)
    try {
      const friend = friends.find((f) => f.id === formFriendId)
      await addFriendsLedgerEntry({
        userId: user.uid,
        friendId: formFriendId,
        friendName: friend?.name,
        type: formType,
        amount: parseFloat(formAmount),
        description: formDescription,
        date: formDate,
        settled: false,
      })
      setShowAdd(false)
      setFormFriendId(""); setFormAmount(""); setFormDescription(""); setFormDate("")
      await load()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Friends Ledger</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Net Position</Text>
          <Text style={[styles.summaryValue, { color: netPosition >= 0 ? "#22c55e" : "#ef4444" }]}>
            {netPosition >= 0 ? "+" : ""}{formatINR(Math.abs(netPosition))}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Unsettled</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(unsettledTotal)}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>No ledger entries yet.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: cardBg, opacity: item.settled ? 0.5 : 1 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{item.type === "lent" ? "🔺" : "🔻"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>
                  {item.friendName ?? "Unknown"} — {LEDGER_ENTRY_TYPE_LABELS[item.type]}
                </Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>
                  {item.description} • {item.date}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.cardValue, { color: item.type === "lent" ? "#22c55e" : "#ef4444" }]}>
                  {formatINR(item.amount)}
                </Text>
                {item.settled ? (
                  <Text style={[styles.cardSub, { color: "#22c55e" }]}>Settled</Text>
                ) : (
                  <TouchableOpacity onPress={() => handleSettle(item)}>
                    <Text style={[styles.settleBtn, { color: colors.tint }]}>Settle</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={() => setShowAdd(true)}>
        <Text style={styles.addButtonText}>+ Add Entry</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Ledger Entry</Text>
            <Text style={[styles.modalLabel, { color: colors.text }]}>Friend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {friends.map((f) => (
                <TouchableOpacity key={f.id} style={[styles.typeChip, { backgroundColor: formFriendId === f.id ? colors.tint : cardBg, borderColor: formFriendId === f.id ? "transparent" : colors.icon + "40" }]} onPress={() => setFormFriendId(f.id)}>
                  <Text style={{ color: formFriendId === f.id ? "#fff" : colors.text, fontSize: 13 }}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.entries(LEDGER_ENTRY_TYPE_LABELS).map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.typeChip, { backgroundColor: formType === val ? colors.tint : cardBg, borderColor: formType === val ? "transparent" : colors.icon + "40" }]} onPress={() => setFormType(val as LedgerEntryType)}>
                  <Text style={{ color: formType === val ? "#fff" : colors.text, fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Amount (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formAmount} onChangeText={setFormAmount} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Description" placeholderTextColor={colors.icon} value={formDescription} onChangeText={setFormDescription} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.icon} value={formDate} onChangeText={setFormDate} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formFriendId || !formAmount || !formDescription || !formDate ? 0.5 : 1 }]} onPress={handleAdd} disabled={saving || !formFriendId || !formAmount || !formDescription || !formDate}>
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
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
  summaryLabel: { fontSize: 11, fontWeight: "500" },
  summaryValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { fontSize: 20 },
  cardName: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 12, marginTop: 2 },
  cardValue: { fontSize: 16, fontWeight: "600" },
  settleBtn: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  addButton: { height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 8 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  typeScroll: { marginBottom: 16, maxHeight: 44 },
  typeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
