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
import { getLoans, addLoan } from "@/services/firestore"
import type { Loan, LoanType } from "@/types"
import { LOAN_TYPE_LABELS } from "@/types"
import { CategoryChipPicker } from "@/components/category-chip-picker"

const TYPE_COLORS: Record<string, string> = {
  home: "#3b82f6",
  car: "#f59e0b",
  personal: "#8b5cf6",
  education: "#06b6d4",
  business: "#22c55e",
  other: "#94a3b8",
}

const TYPE_ICONS: Record<string, string> = {
  home: "🏠",
  car: "🚗",
  personal: "💰",
  education: "🎓",
  business: "🏢",
  other: "📦",
}

function formatINR(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr"
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L"
  return "₹" + n.toLocaleString("en-IN")
}

export default function LoansScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [items, setItems] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formLender, setFormLender] = useState("")
  const [formType, setFormType] = useState<LoanType | null>(null)
  const [formPrincipal, setFormPrincipal] = useState("")
  const [formOutstanding, setFormOutstanding] = useState("")
  const [formRate, setFormRate] = useState("")
  const [formEmi, setFormEmi] = useState("")
  const [formStartDate, setFormStartDate] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getLoans()
      setItems(data)
    } catch (err) {
      console.error("Failed to load loans:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => { load() }, [load])

  const totalPrincipal = items.reduce((s, i) => s + i.principalAmount, 0)
  const totalOutstanding = items.reduce((s, i) => s + i.outstandingAmount, 0)
  const totalEmi = items.reduce((s, i) => s + i.emiAmount, 0)

  async function handleAdd() {
    if (!user || !formName || !formLender || !formType || !formPrincipal || !formOutstanding || !formRate || !formEmi || !formStartDate) return
    setSaving(true)
    try {
      await addLoan({
        userId: user.uid,
        name: formName,
        lender: formLender,
        type: formType,
        principalAmount: parseFloat(formPrincipal),
        outstandingAmount: parseFloat(formOutstanding),
        interestRate: parseFloat(formRate),
        emiAmount: parseFloat(formEmi),
        startDate: formStartDate,
      })
      setShowAdd(false)
      setFormName(""); setFormLender(""); setFormType(null)
      setFormPrincipal(""); setFormOutstanding(""); setFormRate(""); setFormEmi(""); setFormStartDate("")
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
      <Text style={[styles.title, { color: colors.text }]}>Loans</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Total Principal</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalPrincipal)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Outstanding</Text>
          <Text style={[styles.summaryValue, { color: "#ef4444" }]}>{formatINR(totalOutstanding)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>EMI/month</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalEmi)}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>No loans tracked yet.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{TYPE_ICONS[item.type] ?? "📦"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>
                  {item.lender} • {LOAN_TYPE_LABELS[item.type]} • {item.interestRate}%
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.cardValue, { color: "#ef4444" }]}>{formatINR(item.outstandingAmount)}</Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>EMI: {formatINR(item.emiAmount)}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={() => setShowAdd(true)}>
        <Text style={styles.addButtonText}>+ Add Loan</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Loan</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Loan Name" placeholderTextColor={colors.icon} value={formName} onChangeText={setFormName} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Lender" placeholderTextColor={colors.icon} value={formLender} onChangeText={setFormLender} />
            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <CategoryChipPicker group="loan_type" labels={LOAN_TYPE_LABELS} value={formType} onValueChange={(val) => setFormType(val as LoanType)} colors={colors} cardBg={cardBg} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Principal (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formPrincipal} onChangeText={setFormPrincipal} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Outstanding (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formOutstanding} onChangeText={setFormOutstanding} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Interest Rate (%)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formRate} onChangeText={setFormRate} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="EMI Amount (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formEmi} onChangeText={setFormEmi} />
            </View>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Start Date (YYYY-MM-DD)" placeholderTextColor={colors.icon} value={formStartDate} onChangeText={setFormStartDate} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formLender || !formType || !formPrincipal || !formOutstanding || !formRate || !formEmi || !formStartDate ? 0.5 : 1 }]} onPress={handleAdd} disabled={saving || !formName || !formLender || !formType || !formPrincipal || !formOutstanding || !formRate || !formEmi || !formStartDate}>
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
