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
import { getInsurancePolicies, addInsurancePolicy } from "@/services/firestore"
import type { InsurancePolicy, InsuranceType, InsuranceFrequency } from "@/types"
import { INSURANCE_TYPE_LABELS, INSURANCE_FREQUENCY_LABELS } from "@/types"

const TYPE_COLORS: Record<string, string> = {
  life: "#3b82f6",
  health: "#22c55e",
  vehicle: "#f59e0b",
  property: "#8b5cf6",
  term: "#06b6d4",
  other: "#94a3b8",
}

const TYPE_ICONS: Record<string, string> = {
  life: "🛡️",
  health: "🏥",
  vehicle: "🚗",
  property: "🏠",
  term: "📋",
  other: "📦",
}

function formatINR(n: number): string {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr"
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L"
  return "₹" + n.toLocaleString("en-IN")
}

export default function InsuranceScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [items, setItems] = useState<InsurancePolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formInsurer, setFormInsurer] = useState("")
  const [formType, setFormType] = useState<InsuranceType | null>(null)
  const [formPremium, setFormPremium] = useState("")
  const [formCoverage, setFormCoverage] = useState("")
  const [formFrequency, setFormFrequency] = useState<InsuranceFrequency>("yearly")
  const [formStartDate, setFormStartDate] = useState("")
  const [formEndDate, setFormEndDate] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getInsurancePolicies()
      setItems(data)
    } catch (err) {
      console.error("Failed to load insurance:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => { load() }, [load])

  const totalPolicies = items.length
  const totalPremium = items.reduce((s, i) => {
    const mult = i.frequency === "monthly" ? 12 : i.frequency === "quarterly" ? 4 : 1
    return s + i.premium * mult
  }, 0)
  const totalCoverage = items.reduce((s, i) => s + i.coverageAmount, 0)

  async function handleAdd() {
    if (!user || !formName || !formInsurer || !formType || !formPremium || !formCoverage || !formStartDate) return
    setSaving(true)
    try {
      await addInsurancePolicy({
        userId: user.uid,
        name: formName,
        insurer: formInsurer,
        type: formType,
        premium: parseFloat(formPremium),
        coverageAmount: parseFloat(formCoverage),
        frequency: formFrequency,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
      })
      setShowAdd(false)
      setFormName(""); setFormInsurer(""); setFormType(null)
      setFormPremium(""); setFormCoverage("")
      setFormFrequency("yearly"); setFormStartDate(""); setFormEndDate("")
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
      <Text style={[styles.title, { color: colors.text }]}>Insurance</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Total Policies</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{totalPolicies}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Annual Premium</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalPremium)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Total Coverage</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalCoverage)}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>No insurance policies tracked yet.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{TYPE_ICONS[item.type] ?? "📦"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>
                  {item.insurer} • {INSURANCE_TYPE_LABELS[item.type]}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.cardValue, { color: colors.text }]}>{formatINR(item.premium)}/{item.frequency === "monthly" ? "mo" : item.frequency === "quarterly" ? "qtr" : "yr"}</Text>
                {item.endDate && <Text style={[styles.cardSub, { color: colors.icon }]}>Exp: {item.endDate}</Text>}
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={() => setShowAdd(true)}>
        <Text style={styles.addButtonText}>+ Add Policy</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Insurance Policy</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Policy Name" placeholderTextColor={colors.icon} value={formName} onChangeText={setFormName} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Insurer" placeholderTextColor={colors.icon} value={formInsurer} onChangeText={setFormInsurer} />
            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.entries(INSURANCE_TYPE_LABELS).map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.typeChip, { backgroundColor: formType === val ? (TYPE_COLORS[val] ?? colors.tint) : cardBg, borderColor: formType === val ? "transparent" : colors.icon + "40" }]} onPress={() => setFormType(val as InsuranceType)}>
                  <Text style={{ color: formType === val ? "#fff" : colors.text, fontSize: 13 }}>{TYPE_ICONS[val] ?? "📦"} {label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.modalLabel, { color: colors.text }]}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.entries(INSURANCE_FREQUENCY_LABELS).map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.typeChip, { backgroundColor: formFrequency === val ? colors.tint : cardBg, borderColor: formFrequency === val ? "transparent" : colors.icon + "40" }]} onPress={() => setFormFrequency(val as InsuranceFrequency)}>
                  <Text style={{ color: formFrequency === val ? "#fff" : colors.text, fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Premium (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formPremium} onChangeText={setFormPremium} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Coverage Amount (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formCoverage} onChangeText={setFormCoverage} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Start Date (YYYY-MM-DD)" placeholderTextColor={colors.icon} value={formStartDate} onChangeText={setFormStartDate} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="End Date (optional)" placeholderTextColor={colors.icon} value={formEndDate} onChangeText={setFormEndDate} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formInsurer || !formType || !formPremium || !formCoverage || !formStartDate ? 0.5 : 1 }]} onPress={handleAdd} disabled={saving || !formName || !formInsurer || !formType || !formPremium || !formCoverage || !formStartDate}>
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
