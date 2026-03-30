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
import { AssetType, ASSET_TYPE_LABELS } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { getLocalAssets, addLocalAsset } from "@/services/database"
import type { Asset } from "@/types"

const TYPE_COLORS: Record<string, string> = {
  property: "#3b82f6",
  vehicle: "#f59e0b",
  gold: "#eab308",
  electronics: "#8b5cf6",
  other: "#94a3b8",
}

const TYPE_ICONS: Record<string, string> = {
  property: "🏠",
  vehicle: "🚗",
  gold: "🪙",
  electronics: "📱",
  other: "📦",
}

export default function AssetsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const cardBg = colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5"
  const { user, encryptionReady } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<AssetType | null>(null)
  const [formPurchaseValue, setFormPurchaseValue] = useState("")
  const [formCurrentValue, setFormCurrentValue] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const loadAssets = useCallback(async () => {
    if (!user || !encryptionReady) return
    try {
      const data = await getLocalAssets(user.uid)
      setAssets(data)
    } catch (err) {
      console.error("Failed to load assets:", err)
    } finally {
      setLoading(false)
    }
  }, [user, encryptionReady])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const totalCurrent = assets.reduce((sum, a) => sum + a.currentValue, 0)
  const totalPurchase = assets.reduce((sum, a) => sum + a.purchaseValue, 0)
  const totalGain = totalCurrent - totalPurchase

  async function handleAdd() {
    if (!user || !formName || !formType || !formPurchaseValue || !formCurrentValue) return
    setSaving(true)
    try {
      await addLocalAsset({
        userId: user.uid,
        name: formName,
        type: formType,
        purchaseValue: parseFloat(formPurchaseValue),
        currentValue: parseFloat(formCurrentValue),
        description: formDescription || undefined,
      })
      setShowAdd(false)
      setFormName("")
      setFormType(null)
      setFormPurchaseValue("")
      setFormCurrentValue("")
      setFormDescription("")
      await loadAssets()
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add asset")
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
      <Text style={[styles.title, { color: colors.text }]}>Assets</Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Total Value</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₹{totalCurrent >= 100000 ? (totalCurrent / 100000).toFixed(1) + "L" : totalCurrent.toLocaleString("en-IN")}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Invested</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₹{totalPurchase >= 100000 ? (totalPurchase / 100000).toFixed(1) + "L" : totalPurchase.toLocaleString("en-IN")}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>Gain</Text>
          <Text style={[styles.summaryValue, { color: totalGain >= 0 ? "#22c55e" : "#ef4444" }]}>
            {totalGain >= 0 ? "+" : ""}₹{Math.abs(totalGain) >= 100000 ? (Math.abs(totalGain) / 100000).toFixed(1) + "L" : Math.abs(totalGain).toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Asset Cards */}
      {assets.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No assets tracked yet. Add one to see your portfolio.
          </Text>
        </View>
      ) : (
        assets.map((asset) => {
          const gain = asset.currentValue - asset.purchaseValue
          const pct = asset.purchaseValue > 0 ? ((gain / asset.purchaseValue) * 100).toFixed(1) : "0.0"
          return (
            <View key={asset.id} style={[styles.assetCard, { backgroundColor: cardBg }]}>
              <View style={styles.assetHeader}>
                <Text style={styles.assetIcon}>{TYPE_ICONS[asset.type] ?? "📦"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assetName, { color: colors.text }]}>{asset.name}</Text>
                  <Text style={[styles.assetType, { color: colors.icon }]}>
                    {ASSET_TYPE_LABELS[asset.type]}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.assetValue, { color: colors.text }]}>
                    ₹{asset.currentValue.toLocaleString("en-IN")}
                  </Text>
                  <Text style={{ fontSize: 12, color: gain >= 0 ? "#22c55e" : "#ef4444" }}>
                    {gain >= 0 ? "+" : ""}{pct}%
                  </Text>
                </View>
              </View>
              {asset.description && (
                <Text style={[styles.assetDesc, { color: colors.icon }]}>{asset.description}</Text>
              )}
            </View>
          )
        })
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addButtonText}>+ Add Asset</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Asset</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Asset Name (e.g. Gold Chain)"
              placeholderTextColor={colors.icon}
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {Object.entries(ASSET_TYPE_LABELS).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: formType === val ? (TYPE_COLORS[val] ?? colors.tint) : cardBg,
                      borderColor: formType === val ? "transparent" : colors.icon + "40",
                    },
                  ]}
                  onPress={() => setFormType(val as AssetType)}
                >
                  <Text style={{ color: formType === val ? "#fff" : colors.text, fontSize: 13 }}>
                    {TYPE_ICONS[val] ?? "📦"} {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Purchase Value (₹)"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formPurchaseValue}
                onChangeText={setFormPurchaseValue}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
                placeholder="Current Value (₹)"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={formCurrentValue}
                onChangeText={setFormCurrentValue}
              />
            </View>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.icon}
              value={formDescription}
              onChangeText={setFormDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.icon }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !formName || !formType || !formPurchaseValue || !formCurrentValue ? 0.5 : 1 }]}
                onPress={handleAdd}
                disabled={saving || !formName || !formType || !formPurchaseValue || !formCurrentValue}
              >
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
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
  summaryLabel: { fontSize: 11, fontWeight: "500" },
  summaryValue: { fontSize: 18, fontWeight: "bold", marginTop: 4 },
  assetCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  assetHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  assetIcon: { fontSize: 28 },
  assetName: { fontSize: 16, fontWeight: "600" },
  assetType: { fontSize: 12, marginTop: 2 },
  assetValue: { fontSize: 16, fontWeight: "600" },
  assetDesc: { fontSize: 12, marginTop: 8 },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  addButton: { height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 8 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  center: { justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalInput: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  typeScroll: { marginBottom: 16, maxHeight: 44 },
  typeChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  modalSave: { flex: 2, height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
})
