import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native"
import { useAuth } from "@/contexts/auth-context"
import { getCustomCategories, addCustomCategory } from "@/services/firestore"
import type { CategoryGroup, CustomCategory } from "@/types"

interface CategoryChipPickerProps {
  /** Which category group for fetching/saving custom options. */
  group: CategoryGroup
  /** Predefined options from the label map (Record<string, string>). */
  labels: Record<string, string>
  /** Current selected value. */
  value: string | null
  /** Called when the value changes. */
  onValueChange: (value: string) => void
  /** Active chip colour. Falls back to tintColor. */
  activeColor?: string
  /** Dynamic colour map for specific values (e.g. category colours). */
  colorMap?: Record<string, string>
  /** Theme colours from useColorScheme. */
  colors: { text: string; icon: string; tint: string }
  /** Background colour for unselected chips. */
  cardBg: string
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

export function CategoryChipPicker({
  group,
  labels,
  value,
  onValueChange,
  activeColor,
  colorMap,
  colors,
  cardBg,
}: CategoryChipPickerProps) {
  const { user } = useAuth()
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [customLabel, setCustomLabel] = useState("")
  const [saving, setSaving] = useState(false)

  const loadCustom = useCallback(async () => {
    if (!user) return
    try {
      const items = await getCustomCategories(user.uid, group)
      setCustomCategories(items)
    } catch {
      // silently ignore
    }
  }, [user, group])

  useEffect(() => {
    loadCustom()
  }, [loadCustom])

  async function handleAddCustom() {
    if (!user || !customLabel.trim()) return
    const slug = slugify(customLabel)

    const allValues = [
      ...Object.keys(labels),
      ...customCategories.map((c) => c.value),
    ]
    if (allValues.includes(slug)) {
      Alert.alert("Duplicate", "A category with this name already exists")
      return
    }

    setSaving(true)
    try {
      await addCustomCategory({
        userId: user.uid,
        group,
        label: customLabel.trim(),
        value: slug,
      })
      setShowModal(false)
      setCustomLabel("")
      onValueChange(slug)
      loadCustom()
    } catch {
      Alert.alert("Error", "Failed to add custom category")
    } finally {
      setSaving(false)
    }
  }

  function chipBg(val: string) {
    if (value !== val) return cardBg
    return colorMap?.[val] ?? activeColor ?? colors.tint
  }

  function chipBorder(val: string) {
    return value === val ? "transparent" : colors.icon + "40"
  }

  function chipTextColor(val: string) {
    return value === val ? "#fff" : colors.text
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {Object.entries(labels).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[
              styles.chip,
              { backgroundColor: chipBg(val), borderColor: chipBorder(val) },
            ]}
            onPress={() => onValueChange(val)}
          >
            <Text style={{ color: chipTextColor(val), fontSize: 13 }}>{label}</Text>
          </TouchableOpacity>
        ))}
        {customCategories.map((cc) => (
          <TouchableOpacity
            key={cc.id}
            style={[
              styles.chip,
              { backgroundColor: chipBg(cc.value), borderColor: chipBorder(cc.value) },
            ]}
            onPress={() => onValueChange(cc.value)}
          >
            <Text style={{ color: chipTextColor(cc.value), fontSize: 13 }}>{cc.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, styles.addChip, { borderColor: colors.tint }]}
          onPress={() => setShowModal(true)}
        >
          <Text style={{ color: colors.tint, fontSize: 13, fontWeight: "600" }}>+ Custom</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom Category</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon, backgroundColor: cardBg }]}
              placeholder="e.g. Pet Supplies"
              placeholderTextColor={colors.icon}
              value={customLabel}
              onChangeText={setCustomLabel}
              autoFocus
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.icon }]}
                onPress={() => { setShowModal(false); setCustomLabel("") }}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.tint, opacity: saving || !customLabel.trim() ? 0.5 : 1 }]}
                onPress={handleAddCustom}
                disabled={saving || !customLabel.trim()}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{saving ? "Saving..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  addChip: {
    borderStyle: "dashed",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
})
