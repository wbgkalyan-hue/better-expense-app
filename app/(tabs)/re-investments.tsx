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
  getRealEstateInvestments,
  addRealEstateInvestment,
} from "@/services/firestore"
import type { RealEstateInvestment, RealEstateInvestmentType } from "@/types"
import { RE_INVESTMENT_TYPE_LABELS } from "@/types"
import { CategoryChipPicker } from "@/components/category-chip-picker"

const TYPE_COLORS: Record<string, string> = {
  residential: "#3b82f6",
  commercial: "#f59e0b",
  land: "#22c55e",
  other: "#94a3b8",
}

const TYPE_ICONS: Record<string, string> = {
  residential: "🏠",
  commercial: "🏢",
  land: "🌳",
  other: "📦",
}

function formatINR(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr"
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L"
  return "₹" + n.toLocaleString("en-IN")
}

export default function REInvestmentsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [items, setItems] = useState<RealEstateInvestment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formType, setFormType] = useState<RealEstateInvestmentType | null>(null)
  const [formPurchasePrice, setFormPurchasePrice] = useState("")
  const [formCurrentValue, setFormCurrentValue] = useState("")
  const [formMonthlyRent, setFormMonthlyRent] = useState("")
  const [formPurchaseDate, setFormPurchaseDate] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getRealEstateInvestments()
      setItems(data)
    } catch (err) {
      console.error("Failed to load RE investments:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => { load() }, [load])

  const totalInvested = items.reduce((s, i) => s + i.purchasePrice, 0)
  const totalCurrent = items.reduce((s, i) => s + i.currentValue, 0)
  const totalGain = totalCurrent - totalInvested
  const totalRent = items.reduce((s, i) => s + (i.monthlyRent ?? 0), 0)

  async function handleAdd() {
    if (!user || !formName || !formType || !formPurchasePrice || !formCurrentValue || !formPurchaseDate) return
    setSaving(true)
    try {
      await addRealEstateInvestment({
        userId: user.uid,
        name: formName,
        location: formLocation,
        type: formType,
        purchasePrice: parseFloat(formPurchasePrice),
        currentValue: parseFloat(formCurrentValue),
        monthlyRent: formMonthlyRent ? parseFloat(formMonthlyRent) : undefined,
        purchaseDate: formPurchaseDate,
        notes: formNotes || undefined,
      })
      setShowAdd(false)
      setFormName(""); setFormLocation(""); setFormType(null)
      setFormPurchasePrice(""); setFormCurrentValue("")
      setFormMonthlyRent(""); setFormPurchaseDate(""); setFormNotes("")
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>RE Investments</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Total Invested</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalInvested)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Current Value</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalCurrent)}</Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Gain/Loss</Text>
          <Text style={[styles.summaryValue, { color: totalGain >= 0 ? "#22c55e" : "#ef4444" }]}>
            {totalGain >= 0 ? "+" : ""}{formatINR(Math.abs(totalGain))}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Monthly Rent</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalRent)}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No RE investments tracked yet.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{TYPE_ICONS[item.type] ?? "📦"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>
                  {item.location} • {RE_INVESTMENT_TYPE_LABELS[item.type]}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.cardValue, { color: colors.text }]}>{formatINR(item.currentValue)}</Text>
                {item.monthlyRent ? (
                  <Text style={[styles.cardSub, { color: "#22c55e" }]}>
                    +{formatINR(item.monthlyRent)}/mo
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addButtonText}>+ Add RE Investment</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add RE Investment</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Property Name" placeholderTextColor={colors.icon} value={formName} onChangeText={setFormName} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Location" placeholderTextColor={colors.icon} value={formLocation} onChangeText={setFormLocation} />
            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <CategoryChipPicker group="re_investment_type" labels={RE_INVESTMENT_TYPE_LABELS} value={formType} onValueChange={(val) => setFormType(val as RealEstateInvestmentType)} colors={colors} cardBg={cardBg} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Purchase Price (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formPurchasePrice} onChangeText={setFormPurchasePrice} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Current Value (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formCurrentValue} onChangeText={setFormCurrentValue} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Monthly Rent (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formMonthlyRent} onChangeText={setFormMonthlyRent} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Purchase Date (YYYY-MM-DD)" placeholderTextColor={colors.icon} value={formPurchaseDate} onChangeText={setFormPurchaseDate} />
            </View>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Notes (optional)" placeholderTextColor={colors.icon} value={formNotes} onChangeText={setFormNotes} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formType || !formPurchasePrice || !formCurrentValue || !formPurchaseDate ? 0.5 : 1 }]} onPress={handleAdd} disabled={saving || !formName || !formType || !formPurchasePrice || !formCurrentValue || !formPurchaseDate}>
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
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: 16, fontWeight: "600" },
  cardSub: { fontSize: 12, marginTop: 2 },
  cardValue: { fontSize: 16, fontWeight: "600" },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  addButton: { height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 8 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  typeScroll: { marginBottom: 16, maxHeight: 44 },
  typeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
