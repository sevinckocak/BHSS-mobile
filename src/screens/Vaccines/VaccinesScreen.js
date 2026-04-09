import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { useAnimals } from "../../context/AnimalsContext";
import { doc, onSnapshot } from "firebase/firestore";

import { VACCINE_TYPES } from "../../data/vaccines";
import SimpleSelectModal from "../../components/Animals/SimpleSelectModal";
import DatePickerSheet from "../../components/Animals/DatePickerSheet";
import { formatTR, parseTRDate } from "../../utils/date";

// 📌 Navigation: Bu ekrana ulaşmak için:
// navigation.navigate("VaccinesScreen", { animalId: animal.id })
// RootNavigator'da "VaccinesScreen" adıyla kayıtlıdır.

const COLORS = {
  bg1: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  border: "rgba(255,255,255,0.14)",
  glass: "rgba(255,255,255,0.06)",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
  success: "#4ECDC4",
  gold: "#FFAA5A",
};

const EMPTY_FORM = { type: "", date: "", nextDate: "", note: "" };

export default function VaccinesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { authUser } = useFarmerAuth();
  const uid = authUser?.uid;
  const { addVaccine, deleteVaccine } = useAnimals();

  const animalId = route?.params?.animalId;

  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [typeModal, setTypeModal] = useState(false);
  const [datePicker, setDatePicker] = useState({
    open: false,
    field: null, // "date" | "nextDate"
    value: new Date(),
  });

  // ── Firestore: animal doc dinle, data.vaccines array'ini al ─────────────────
  useEffect(() => {
    if (!uid || !animalId) {
      setLoading(false);
      return;
    }

    const animalRef = doc(db, "farmer_info", uid, "animals", animalId);

    const unsub = onSnapshot(
      animalRef,
      (snap) => {
        const data = snap.data();
        setVaccines(Array.isArray(data?.vaccines) ? data.vaccines : []);
        setLoading(false);
      },
      (err) => {
        console.log("VaccinesScreen onSnapshot error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [uid, animalId]);

  // ── DatePicker handlers ─────────────────────────────────────────────────────
  const openDatePicker = useCallback(
    (field) => {
      const current =
        field === "date"
          ? parseTRDate(form.date) || new Date()
          : parseTRDate(form.nextDate) || new Date();
      setDatePicker({ open: true, field, value: current });
    },
    [form.date, form.nextDate],
  );

  const onChangeDate = useCallback(
    (event, selectedDate) => {
      if (Platform.OS === "android" && event?.type === "dismissed") {
        setDatePicker((p) => ({ ...p, open: false }));
        return;
      }

      const date = selectedDate || datePicker.value;
      setDatePicker((p) => ({ ...p, value: date }));

      if (Platform.OS === "android") {
        setDatePicker((p) => ({ ...p, open: false }));
      }

      const dateStr = formatTR(date);
      if (datePicker.field === "date") {
        setForm((p) => ({ ...p, date: dateStr }));
      } else if (datePicker.field === "nextDate") {
        setForm((p) => ({ ...p, nextDate: dateStr }));
      }
    },
    [datePicker.field, datePicker.value],
  );

  const closeIOSDatePicker = useCallback(() => {
    setDatePicker((p) => ({ ...p, open: false }));
  }, []);

  // ── Kaydet ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.type.trim()) {
      return Alert.alert("Eksik bilgi", "Aşı tipi seçilmedi.");
    }
    if (!form.date.trim()) {
      return Alert.alert("Eksik bilgi", "Aşı tarihi seçilmedi.");
    }

    try {
      setBusy(true);
      await addVaccine(animalId, form);
      setForm(EMPTY_FORM);
    } catch (e) {
      Alert.alert("Hata", e?.message || "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }, [form, animalId, addVaccine]);

  // ── Sil ─────────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (vaccine) => {
      Alert.alert(
        "Aşı kaydını sil?",
        `"${vaccine.type || vaccine.name || "Bu kayıt"}" kalıcı olarak silinecek.`,
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: async () => {
              try {
                setBusy(true);
                await deleteVaccine(animalId, vaccine.id);
              } catch (e) {
                Alert.alert("Hata", e?.message || "Silinemedi.");
              } finally {
                setBusy(false);
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [animalId, deleteVaccine],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={["rgba(255,170,90,0.12)", "rgba(5,9,20,0.95)", COLORS.bg2]}
      locations={[0, 0.25, 1]}
      style={styles.container}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
            disabled={busy}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Aşı Geçmişi</Text>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
        >
          {/* ── KAYITLAR ─────────────────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Kayıtlar</Text>
            <Text style={styles.sectionSub}>
              {loading
                ? "Yükleniyor…"
                : vaccines.length > 0
                  ? `${vaccines.length} aşı kaydı`
                  : "Henüz kayıt yok"}
            </Text>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={COLORS.warm} />
            </View>
          ) : vaccines.length === 0 ? (
            <BlurView intensity={18} tint="dark" style={styles.emptyCard}>
              <Ionicons
                name="bandage-outline"
                size={34}
                color="rgba(234,244,255,0.22)"
              />
              <Text style={styles.emptyText}>Henüz aşı kaydı yok</Text>
              <Text style={styles.emptySubText}>
                Aşağıdaki formu kullanarak ilk kaydı ekle
              </Text>
            </BlurView>
          ) : (
            <View style={styles.list}>
              {vaccines.map((v) => (
                <VaccineCard
                  key={v.id}
                  vaccine={v}
                  onDelete={() => handleDelete(v)}
                  disabled={busy}
                />
              ))}
            </View>
          )}

          {/* ── YENİ AŞI EKLE FORMU ──────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Yeni Aşı Ekle</Text>
            <Text style={styles.sectionSub}>Formu doldurun ve kaydedin</Text>
          </View>

          <BlurView intensity={18} tint="dark" style={styles.formCard}>

            {/* Aşı Tipi — SimpleSelectModal */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Aşı Tipi</Text>
                <Text style={styles.fieldRequired}> *</Text>
              </View>
              <Pressable
                onPress={() => setTypeModal(true)}
                style={styles.selectRow}
              >
                <Text
                  style={[
                    styles.selectText,
                    !form.type && styles.selectPlaceholder,
                  ]}
                >
                  {form.type || "Seç…"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {/* Aşı Tarihi — DatePickerSheet */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Aşı Tarihi</Text>
                <Text style={styles.fieldRequired}> *</Text>
              </View>
              <Pressable
                onPress={() => openDatePicker("date")}
                style={styles.selectRow}
              >
                <Text
                  style={[
                    styles.selectText,
                    !form.date && styles.selectPlaceholder,
                  ]}
                >
                  {form.date || "GG/AA/YYYY"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {/* Sonraki Aşı Tarihi — DatePickerSheet */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Sonraki Aşı Tarihi</Text>
                <Text style={styles.fieldOptional}> (opsiyonel)</Text>
              </View>
              <Pressable
                onPress={() => openDatePicker("nextDate")}
                style={styles.selectRow}
              >
                <Text
                  style={[
                    styles.selectText,
                    !form.nextDate && styles.selectPlaceholder,
                  ]}
                >
                  {form.nextDate || "GG/AA/YYYY"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {/* Not — TextInput */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Not</Text>
                <Text style={styles.fieldOptional}> (opsiyonel)</Text>
              </View>
              <TextInput
                value={form.note}
                onChangeText={(t) => setForm((p) => ({ ...p, note: t }))}
                placeholder="Açıklama veya not"
                placeholderTextColor="rgba(234,244,255,0.30)"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.inputMultiline]}
              />
            </View>

            {/* Kaydet */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={busy}
              style={{ marginTop: 6 }}
            >
              <LinearGradient
                colors={
                  busy
                    ? ["rgba(255,170,90,0.35)", "rgba(255,170,90,0.20)"]
                    : ["#FFAA5A", "#FF8C2A"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.bg1} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={COLORS.bg1} />
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>

        {/* DatePickerSheet — ScrollView dışında, absolute konumlanır */}
        <DatePickerSheet
          styles={styles}
          COLORS={COLORS}
          open={datePicker.open}
          value={datePicker.value}
          onChange={onChangeDate}
          onClose={closeIOSDatePicker}
        />
      </View>

      {/* SimpleSelectModal — Aşı Tipi */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={typeModal}
        title="Aşı Tipi Seç"
        items={VACCINE_TYPES}
        onClose={() => setTypeModal(false)}
        onSelect={(it) => {
          setForm((p) => ({ ...p, type: it.name }));
          setTypeModal(false);
        }}
      />
    </LinearGradient>
  );
}

// ── VaccineCard ───────────────────────────────────────────────────────────────

function VaccineCard({ vaccine, onDelete, disabled }) {
  const label = vaccine.type || vaccine.name || "—";

  return (
    <BlurView intensity={14} tint="dark" style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="bandage-outline" size={17} color={COLORS.warm} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{label}</Text>

          {!!vaccine.date && (
            <View style={styles.cardRow}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
              <Text style={styles.cardMeta}>{vaccine.date}</Text>
            </View>
          )}

          {!!vaccine.nextDate && (
            <View style={styles.cardRow}>
              <Ionicons
                name="arrow-forward-circle-outline"
                size={12}
                color={COLORS.success}
              />
              <Text style={[styles.cardMeta, { color: COLORS.success }]}>
                Sonraki: {vaccine.nextDate}
              </Text>
            </View>
          )}

          {!!vaccine.note && (
            <Text style={styles.cardNote} numberOfLines={2}>
              {vaccine.note}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={onDelete}
        disabled={disabled}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
      </TouchableOpacity>
    </BlurView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  topTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHead: { marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontWeight: "950", fontSize: 14 },
  sectionSub: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 3,
  },

  centered: { paddingVertical: 40, alignItems: "center" },

  emptyCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  emptyText: {
    color: "rgba(234,244,255,0.55)",
    fontWeight: "900",
    fontSize: 14,
  },
  emptySubText: {
    color: "rgba(234,244,255,0.32)",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },

  list: { gap: 10 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    overflow: "hidden",
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,170,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.24)",
    marginTop: 1,
  },
  cardName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  cardMeta: { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  cardNote: {
    color: "rgba(234,244,255,0.50)",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,107,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.22)",
    marginLeft: 8,
  },

  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
    overflow: "hidden",
  },

  fieldWrap: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center" },
  fieldLabel: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },
  fieldRequired: { color: COLORS.warm, fontWeight: "900", fontSize: 13 },
  fieldOptional: {
    color: "rgba(234,244,255,0.35)",
    fontWeight: "700",
    fontSize: 11,
  },

  selectRow: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  selectText: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  selectPlaceholder: { color: "rgba(234,244,255,0.30)" },

  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  inputMultiline: {
    height: 80,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    textAlignVertical: "top",
  },

  saveBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: COLORS.bg1, fontWeight: "900", fontSize: 15 },

  // ── DatePickerSheet için gerekli stiller ────────────────────────────────────
  pickerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B1026",
  },
  iosPickerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  iosDoneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  iosDoneText: { color: COLORS.warm, fontWeight: "900" },

  // ── SimpleSelectModal için gerekli stiller ──────────────────────────────────
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalPortal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    maxHeight: "70%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0D1220",
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { color: COLORS.warm, fontWeight: "900", fontSize: 14 },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalItemText: { color: COLORS.text, fontWeight: "800" },
  modalItemSub: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 12,
  },
});
