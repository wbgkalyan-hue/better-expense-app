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
import { getProperties, addProperty } from "@/services/firestore"
import type { Property, PropertyType, PropertyCategory } from "@/types"
import { PROPERTY_TYPE_LABELS, PROPERTY_CATEGORY_LABELS } from "@/types"
import { CategoryChipPicker } from "@/components/category-chip-picker"

const CATEGORY_ICONS: Record<string, string> = {
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

export default function PropertiesScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<PropertyType | null>(null)
  const [formCategory, setFormCategory] = useState<PropertyCategory | null>(null)
  const [formCurrentValue, setFormCurrentValue] = useState("")
  const [formMonthlyRent, setFormMonthlyRent] = useState("")
  const [formMonthlyEmi, setFormMonthlyEmi] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getProperties()
      setItems(data)
    } catch (err) {
      console.error("Failed to load properties:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => { load() }, [load])

  const totalValue = items.reduce((s, i) => s + (i.currentValue ?? 0), 0)
  const ownedCount = items.filter((i) => i.type === "owned").length
  const rentedCount = items.filter((i) => i.type === "rented" || i.type === "leased").length

  async function handleAdd() {
    if (!user || !formName || !formType || !formCategory) return
    setSaving(true)
    try {
      await addProperty({
        userId: user.uid,
        name: formName,
        type: formType,
        category: formCategory,
        currentValue: formCurrentValue ? parseFloat(formCurrentValue) : undefined,
        monthlyRent: formMonthlyRent ? parseFloat(formMonthlyRent) : undefined,
        monthlyEmi: formMonthlyEmi ? parseFloat(formMonthlyEmi) : undefined,
      })
      setShowAdd(false)
      setFormName(""); setFormType(null); setFormCategory(null)
      setFormCurrentValue(""); setFormMonthlyRent(""); setFormMonthlyEmi("")
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
      <Text style={[styles.title, { color: colors.text }]}>Properties</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Portfolio Value</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatINR(totalValue)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Owned</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{ownedCount}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Rented</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{rentedCount}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>No properties tracked yet.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{CATEGORY_ICONS[item.category] ?? "📦"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.icon }]}>
                  {PROPERTY_TYPE_LABELS[item.type]} • {PROPERTY_CATEGORY_LABELS[item.category]}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {item.currentValue != null && (
                  <Text style={[styles.cardValue, { color: colors.text }]}>{formatINR(item.currentValue)}</Text>
                )}
                {item.monthlyRent != null && (
                  <Text style={[styles.cardSub, { color: "#22c55e" }]}>Rent: {formatINR(item.monthlyRent)}/mo</Text>
                )}
                {item.monthlyEmi != null && (
                  <Text style={[styles.cardSub, { color: "#ef4444" }]}>EMI: {formatINR(item.monthlyEmi)}/mo</Text>
                )}
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={() => setShowAdd(true)}>
        <Text style={styles.addButtonText}>+ Add Property</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Property</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Property Name" placeholderTextColor={colors.icon} value={formName} onChangeText={setFormName} />
            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([val, label]) => (
                <TouchableOpacity key={val} style={[styles.typeChip, { backgroundColor: formType === val ? colors.tint : cardBg, borderColor: formType === val ? "transparent" : colors.icon + "40" }]} onPress={() => setFormType(val as PropertyType)}>
                  <Text style={{ color: formType === val ? "#fff" : colors.text, fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.modalLabel, { color: colors.text }]}>Category</Text>
            <CategoryChipPicker group="property_category" labels={PROPERTY_CATEGORY_LABELS} value={formCategory} onValueChange={setFormCategory} colors={colors} cardBg={cardBg} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Current Value (₹, optional)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formCurrentValue} onChangeText={setFormCurrentValue} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Monthly Rent (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formMonthlyRent} onChangeText={setFormMonthlyRent} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]} placeholder="Monthly EMI (₹)" placeholderTextColor={colors.icon} keyboardType="numeric" value={formMonthlyEmi} onChangeText={setFormMonthlyEmi} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formType || !formCategory ? 0.5 : 1 }]} onPress={handleAdd} disabled={saving || !formName || !formType || !formCategory}>
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
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  typeScroll: { marginBottom: 16, maxHeight: 44 },
  typeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
