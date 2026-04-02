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
import { getFriends, addFriend } from "@/services/firestore"
import type { Friend, FriendRelationship } from "@/types"
import { FRIEND_RELATIONSHIP_LABELS } from "@/types"
import { CategoryChipPicker } from "@/components/category-chip-picker"

export default function FriendsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formRelationship, setFormRelationship] = useState<FriendRelationship | "">("")
  const [formTags, setFormTags] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getFriends()
      setItems(data)
    } catch (err) {
      console.error("Failed to load friends:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!user || !formName) return
    setSaving(true)
    try {
      const tags = formTags ? formTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined
      await addFriend({
        userId: user.uid,
        name: formName,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        relationship: formRelationship || undefined,
        tags: tags,
        address: formAddress || undefined,
      })
      setShowAdd(false)
      setFormName(""); setFormPhone(""); setFormEmail(""); setFormRelationship(""); setFormTags(""); setFormAddress("")
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
      <Text style={[styles.title, { color: colors.text }]}>Friends</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Total Friends</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>No friends added yet.</Text>
        </View>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: cardBg }]}
            onPress={() => router.push("/(tabs)/friends-ledger")}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.tint + "20" }]}>
                <Text style={[styles.avatarText, { color: colors.tint }]}>
                  {item.name[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>
                  {[item.relationship ? FRIEND_RELATIONSHIP_LABELS[item.relationship] : null, item.phone, item.email].filter(Boolean).join(" • ") || "No contact info"}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.icon }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={() => setShowAdd(true)}>
        <Text style={styles.addButtonText}>+ Add Friend</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Friend</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Name" placeholderTextColor={colors.icon} value={formName} onChangeText={setFormName} />
            <Text style={[styles.modalLabel, { color: colors.text }]}>Relationship</Text>
            <CategoryChipPicker group="friend_relationship" labels={FRIEND_RELATIONSHIP_LABELS} value={formRelationship} onValueChange={setFormRelationship} colors={colors} cardBg={cardBg} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Phone (optional)" placeholderTextColor={colors.icon} keyboardType="phone-pad" value={formPhone} onChangeText={setFormPhone} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Email (optional)" placeholderTextColor={colors.icon} keyboardType="email-address" value={formEmail} onChangeText={setFormEmail} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Tags (comma-separated, optional)" placeholderTextColor={colors.icon} value={formTags} onChangeText={setFormTags} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Address (optional)" placeholderTextColor={colors.icon} value={formAddress} onChangeText={setFormAddress} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName ? 0.5 : 1 }]} onPress={handleAdd} disabled={saving || !formName}>
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
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "bold" },
  cardName: { fontSize: 16, fontWeight: "600" },
  cardSub: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 22, fontWeight: "300" },
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
