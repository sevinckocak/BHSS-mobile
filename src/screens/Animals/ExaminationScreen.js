import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAnimals } from "../../context/AnimalsContext";

// 📌 Navigation: navigation.navigate("Examination", { animalId })

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
};

const EXAM_TYPES = [
  { id: "general",    label: "Genel Muayene",           icon: "body-outline"              },
  { id: "disease",    label: "Hastalık Kontrolü",        icon: "bug-outline"               },
  { id: "pregnancy",  label: "Gebelik Muayenesi",        icon: "shield-checkmark-outline"  },
  { id: "pre_vacc",   label: "Aşılama Öncesi Kontrolü",  icon: "bandage-outline"           },
  { id: "emergency",  label: "Acil Durum",               icon: "warning-outline"           },
];

const SYMPTOM_LIST = [
  "Topallık", "İshal", "Öksürük", "Burun Akıntısı",
  "Meme Problemi", "Yaralanma", "Ateş",
];

const DOSE_UNITS = ["ml", "tablet", "cc"];

const QUICK_FOLLOW = [
  { label: "7 gün", days: 7 },
  { label: "21 gün", days: 21 },
];

function toneColor(t) {
  if (t === "success") return COLORS.success;
  if (t === "warm")    return COLORS.warm;
  if (t === "danger")  return COLORS.danger;
  return COLORS.muted;
}
function toneBg(t) {
  if (t === "success") return "rgba(78,205,196,0.12)";
  if (t === "warm")    return "rgba(255,170,90,0.12)";
  if (t === "danger")  return "rgba(255,107,107,0.12)";
  return "rgba(255,255,255,0.06)";
}
function toneBorder(t) {
  if (t === "success") return "rgba(78,205,196,0.28)";
  if (t === "warm")    return "rgba(255,170,90,0.28)";
  if (t === "danger")  return "rgba(255,107,107,0.28)";
  return "rgba(255,255,255,0.14)";
}

function parseDMY(str) {
  if (!str) return null;
  const p = str.split("/");
  if (p.length !== 3) return null;
  const [d, m, y] = p.map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function formatDMY(dt) {
  if (!dt) return "";
  return [
    String(dt.getDate()).padStart(2, "0"),
    String(dt.getMonth() + 1).padStart(2, "0"),
    dt.getFullYear(),
  ].join("/");
}
function addDays(dt, n) {
  const d = new Date(dt);
  d.setDate(d.getDate() + n);
  return d;
}

function tempTone(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "default";
  if (n <= 39.0) return "success";
  if (n <= 39.5) return "warm";
  return "danger";
}
function pulseTone(val) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return "default";
  return n >= 40 && n <= 80 ? "success" : "danger";
}
function respTone(val) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return "default";
  return n >= 12 && n <= 30 ? "success" : "danger";
}

// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  examinationType: null,
  temperature: "",
  pulse: "",
  respiration: "",
  appetite: "good",
  activity: "normal",
  stool: "normal",
  generalCondition: "good",
  symptoms: [],
  otherSymptom: "",
  diagnosis: "",
  treatmentRecommended: false,
  medicineName: "",
  medicineDose: "",
  medicineUnit: "ml",
  medicineDays: "",
  veterinarianName: "",
  followUpDate: "",
  notes: "",
};

export default function ExaminationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { animals, updateAnimal } = useAnimals();
  const animalId = route?.params?.animalId;

  const animal = useMemo(
    () => (animals || []).find((a) => a.id === animalId) || null,
    [animals, animalId],
  );

  const tagNo    = animal?.tagNo    || "—";
  const breed    = animal?.breed    || "—";
  const ageLabel = animal?.ageMonths != null ? `${animal.ageMonths} ay` : "—";
  const isSick   = animal?.healthStatus === "sick" || animal?.status === "Hasta";

  // ── Firestore state ─────────────────────────────────────────────────────────
  const [records,     setRecords]     = useState([]);
  const [lastRecord,  setLastRecord]  = useState(null);

  useEffect(() => {
    if (!animalId) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(`exam_history_${animalId}`);
        const rows = raw ? JSON.parse(raw) : [];
        setRecords(rows);
        setLastRecord(rows[0] || null);
      } catch (err) {
        console.log("ExaminationScreen load error:", err?.message);
      }
    })();
  }, [animalId]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [followQuick, setFollowQuick] = useState(null);

  const set = useCallback((key, val) => setForm((p) => ({ ...p, [key]: val })), []);

  // ── Animations ───────────────────────────────────────────────────────────────
  const treatAnim   = useRef(new Animated.Value(0)).current;
  const followAnim  = useRef(new Animated.Value(0)).current;
  const otherAnim   = useRef(new Animated.Value(0)).current;

  const animate = useCallback((anim, toValue) => {
    Animated.spring(anim, { toValue, useNativeDriver: false, tension: 55, friction: 9 }).start();
  }, []);

  useEffect(() => { animate(treatAnim, form.treatmentRecommended ? 1 : 0); }, [form.treatmentRecommended]);
  useEffect(() => { animate(followAnim, form.followUpDate !== "" || followQuick !== null ? 1 : 0); }, [form.followUpDate, followQuick]);
  useEffect(() => { animate(otherAnim, otherOpen ? 1 : 0); }, [otherOpen]);

  // ── Symptoms toggle ──────────────────────────────────────────────────────────
  const toggleSymptom = useCallback((s) => {
    setForm((p) => {
      const has = p.symptoms.includes(s);
      return { ...p, symptoms: has ? p.symptoms.filter((x) => x !== s) : [...p.symptoms, s] };
    });
  }, []);

  // ── Quick follow-up ──────────────────────────────────────────────────────────
  const applyQuickFollow = useCallback((days) => {
    const dt = formatDMY(addDays(new Date(), days));
    set("followUpDate", dt);
    setFollowQuick(days);
  }, [set]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const canSave = !!form.examinationType;

  const handleSave = useCallback(async () => {
    if (!form.examinationType) {
      return Alert.alert("Eksik", "Muayene türü seçilmedi.");
    }
    setSaving(true);
    try {
      const newRecord = {
        id:                   Date.now().toString(),
        animalId,
        examinationType:      form.examinationType,
        temperature:          parseFloat(form.temperature) || null,
        pulse:                parseInt(form.pulse, 10)     || null,
        respiration:          parseInt(form.respiration, 10) || null,
        appetite:             form.appetite,
        activity:             form.activity,
        stool:                form.stool,
        generalCondition:     form.generalCondition,
        symptoms:             form.symptoms,
        otherSymptom:         form.otherSymptom,
        diagnosis:            form.diagnosis,
        treatmentRecommended: form.treatmentRecommended,
        medicineName:         form.medicineName,
        medicineDose:         form.medicineDose,
        medicineUnit:         form.medicineUnit,
        medicineDays:         parseInt(form.medicineDays, 10) || null,
        veterinarianName:     form.veterinarianName,
        followUpDate:         form.followUpDate,
        notes:                form.notes,
        createdAt:            new Date().toISOString(),
      };
      const raw = await AsyncStorage.getItem(`exam_history_${animalId}`);
      const existing = raw ? JSON.parse(raw) : [];
      const updated = [newRecord, ...existing].slice(0, 50);
      await AsyncStorage.setItem(`exam_history_${animalId}`, JSON.stringify(updated));
      setRecords(updated);
      setLastRecord(updated[0]);

      const newHealth =
        form.generalCondition === "bad" ? "sick" : "healthy";
      await updateAnimal(animalId, { healthStatus: newHealth });

      setForm(EMPTY_FORM);
      setOtherOpen(false);
      setFollowQuick(null);
      Alert.alert("Kaydedildi", "Muayene kaydı oluşturuldu.");
    } catch (e) {
      Alert.alert("Hata", e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }, [form, animalId, updateAnimal]);

  // ── Last exam label ──────────────────────────────────────────────────────────
  const lastExamLabel = useMemo(() => {
    if (!lastRecord) return "—";
    const ts = lastRecord.createdAt;
    if (!ts) return EXAM_TYPES.find((e) => e.id === lastRecord.examinationType)?.label || "—";
    const dt = new Date(ts);
    const dateStr = dt.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    const typeStr = EXAM_TYPES.find((e) => e.id === lastRecord.examinationType)?.label || "";
    return `${dateStr} · ${typeStr}`;
  }, [lastRecord]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={["rgba(78,205,196,0.08)", "rgba(5,9,20,0.95)", COLORS.bg2]}
      locations={[0, 0.26, 1]}
      style={styles.container}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.topTitle}>Muayene</Text>
            <Text style={styles.topSub}>{tagNo}  ·  {breed}  ·  {ageLabel}</Text>
          </View>

          <TouchableOpacity
            style={[styles.iconBtn, canSave && { borderColor: "rgba(255,170,90,0.40)", backgroundColor: "rgba(255,170,90,0.10)" }]}
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={19}
              color={canSave ? COLORS.warm : "rgba(234,244,255,0.28)"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        >
          {/* ── ÖZET KARTI ──────────────────────────────────────────────────── */}
          <BlurView intensity={18} tint="dark" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <SummaryCell icon="pricetag-outline"  label="Küpe" value={tagNo} />
              <SummaryCell icon="person-outline"    label="İsim" value={animal?.name || "—"} />
              <SummaryCell icon="leaf-outline"      label="Irk"  value={breed} />
              <SummaryCell icon="hourglass-outline" label="Yaş"  value={ageLabel} />
            </View>

            <View style={styles.divider} />

            <View style={styles.lastExamRow}>
              <Ionicons name="medkit-outline" size={14} color={COLORS.muted} />
              <Text style={styles.lastExamLabel}>Son muayene</Text>
              <Text style={styles.lastExamVal}>{lastExamLabel}</Text>
            </View>

            {isSick && (
              <View style={styles.sickBadge}>
                <Ionicons name="alert-circle-outline" size={13} color={COLORS.danger} />
                <Text style={styles.sickBadgeText}>Hasta</Text>
              </View>
            )}
          </BlurView>

          {/* ── ACİL BANNER ─────────────────────────────────────────────────── */}
          {form.examinationType === "emergency" && (
            <View style={styles.emergencyBanner}>
              <Ionicons name="warning" size={16} color={COLORS.danger} />
              <Text style={styles.emergencyText}>🚨 Acil Durum Modu</Text>
            </View>
          )}

          {/* ── MUAYENE TÜRÜ ────────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Muayene Türü</Text>
            <Text style={styles.sectionSub}>Uygulanacak muayeneyi seçin</Text>
          </View>

          <View style={styles.examGrid}>
            {EXAM_TYPES.map((et) => {
              const active = form.examinationType === et.id;
              const tone = et.id === "emergency" ? "danger" : "warm";
              return (
                <TouchableOpacity
                  key={et.id}
                  activeOpacity={0.82}
                  onPress={() => set("examinationType", et.id)}
                  style={[
                    styles.examCard,
                    active && { borderColor: toneBorder(tone), backgroundColor: toneBg(tone) },
                  ]}
                >
                  <View style={[styles.examIconWrap, active && { borderColor: toneBorder(tone) }]}>
                    <Ionicons name={et.icon} size={20} color={active ? toneColor(tone) : COLORS.muted} />
                  </View>
                  <Text style={[styles.examLabel, { color: active ? COLORS.text : COLORS.muted }]}>
                    {et.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── TEMEL BULGULAR ──────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>Temel Bulgular</Text>
          </View>

          <BlurView intensity={16} tint="dark" style={styles.vitalsCard}>
            <VitalInput
              label="Vücut Sıcaklığı"
              unit="°C"
              value={form.temperature}
              onChangeText={(t) => set("temperature", t.replace(/[^0-9.]/g, ""))}
              tone={tempTone(form.temperature)}
              placeholder="38.5"
              keyboardType="decimal-pad"
              hint="Normal: 38.0–39.0°C"
            />
            <View style={styles.vitalsDivider} />
            <VitalInput
              label="Nabız"
              unit="bpm"
              value={form.pulse}
              onChangeText={(t) => set("pulse", t.replace(/[^0-9]/g, ""))}
              tone={pulseTone(form.pulse)}
              placeholder="65"
              keyboardType="numeric"
              hint="Normal: 40–80 bpm"
            />
            <View style={styles.vitalsDivider} />
            <VitalInput
              label="Solunum"
              unit="/dak"
              value={form.respiration}
              onChangeText={(t) => set("respiration", t.replace(/[^0-9]/g, ""))}
              tone={respTone(form.respiration)}
              placeholder="20"
              keyboardType="numeric"
              hint="Normal: 12–30 /dak"
            />
          </BlurView>

          {/* ── GÖZLEMSEL DURUMLAR ───────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>Gözlemsel Durum</Text>
          </View>

          <BlurView intensity={16} tint="dark" style={styles.observeCard}>
            <TriToggle
              label="İştah"
              options={[
                { val: "good",   label: "İyi"    },
                { val: "medium", label: "Orta"   },
                { val: "bad",    label: "Kötü"   },
              ]}
              value={form.appetite}
              onChange={(v) => set("appetite", v)}
            />
            <View style={styles.vitalsDivider} />
            <TriToggle
              label="Aktivite"
              options={[
                { val: "normal", label: "Normal" },
                { val: "low",    label: "Düşük"  },
                { val: "none",   label: "Yok"    },
              ]}
              value={form.activity}
              onChange={(v) => set("activity", v)}
            />
            <View style={styles.vitalsDivider} />
            <TriToggle
              label="Dışkı"
              options={[
                { val: "normal",   label: "Normal"  },
                { val: "soft",     label: "Yumuşak" },
                { val: "abnormal", label: "Anormal" },
              ]}
              value={form.stool}
              onChange={(v) => set("stool", v)}
            />
            <View style={styles.vitalsDivider} />
            <TriToggle
              label="Genel Durum"
              options={[
                { val: "good",   label: "İyi"  },
                { val: "medium", label: "Orta" },
                { val: "bad",    label: "Kötü" },
              ]}
              value={form.generalCondition}
              onChange={(v) => set("generalCondition", v)}
            />
          </BlurView>

          {/* ── BELİRTİLER ──────────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sectionTitle}>Belirtiler</Text>
              {form.symptoms.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{form.symptoms.length}</Text>
                </View>
              )}
            </View>
          </View>

          <BlurView intensity={16} tint="dark" style={styles.symptomCard}>
            {SYMPTOM_LIST.map((s, idx) => {
              const active = form.symptoms.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  activeOpacity={0.82}
                  onPress={() => toggleSymptom(s)}
                  style={[
                    styles.symptomRow,
                    idx < SYMPTOM_LIST.length && styles.symptomRowBorder,
                    active && styles.symptomRowActive,
                  ]}
                >
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && <Ionicons name="checkmark" size={13} color={COLORS.bg1} />}
                  </View>
                  <Text style={[styles.symptomLabel, active && { color: COLORS.text }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Diğer */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => {
                setOtherOpen((p) => !p);
                if (otherOpen) set("otherSymptom", "");
              }}
              style={[styles.symptomRow, otherOpen && styles.symptomRowActive]}
            >
              <View style={[styles.checkbox, otherOpen && styles.checkboxActive]}>
                {otherOpen && <Ionicons name="checkmark" size={13} color={COLORS.bg1} />}
              </View>
              <Text style={[styles.symptomLabel, otherOpen && { color: COLORS.text }]}>Diğer</Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                opacity: otherAnim,
                maxHeight: otherAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }),
                overflow: "hidden",
              }}
              pointerEvents={otherOpen ? "auto" : "none"}
            >
              <TextInput
                value={form.otherSymptom}
                onChangeText={(t) => set("otherSymptom", t)}
                placeholder="Diğer belirti açıklayın…"
                placeholderTextColor="rgba(234,244,255,0.28)"
                style={styles.otherInput}
              />
            </Animated.View>
          </BlurView>

          {/* ── TANI ────────────────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>Tanı</Text>
          </View>

          <View style={styles.diagnosisWrap}>
            <TextInput
              value={form.diagnosis}
              onChangeText={(t) => set("diagnosis", t)}
              placeholder="Şüpheli enfeksiyon, gebelik pozitif…"
              placeholderTextColor="rgba(234,244,255,0.28)"
              multiline
              numberOfLines={3}
              maxLength={400}
              style={styles.diagnosisInput}
            />
            <Text style={styles.charCount}>{form.diagnosis.length}/400</Text>
          </View>

          {/* ── TEDAVİ / ÖNERİ ──────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Tedavi / Öneri</Text>
              <TouchableOpacity
                onPress={() => set("treatmentRecommended", !form.treatmentRecommended)}
                style={[
                  styles.toggleChip,
                  form.treatmentRecommended && { backgroundColor: "rgba(255,170,90,0.14)", borderColor: "rgba(255,170,90,0.35)" },
                ]}
              >
                <Text style={[styles.toggleChipText, form.treatmentRecommended && { color: COLORS.warm }]}>
                  {form.treatmentRecommended ? "Aktif" : "Ekle"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={{
              opacity: treatAnim,
              maxHeight: treatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }),
              overflow: "hidden",
            }}
            pointerEvents={form.treatmentRecommended ? "auto" : "none"}
          >
            <BlurView intensity={16} tint="dark" style={styles.treatCard}>
              <FieldInput
                label="İlaç Adı"
                value={form.medicineName}
                onChangeText={(t) => set("medicineName", t)}
                placeholder="Enrofloksasin…"
              />

              <View style={styles.doseRow}>
                <View style={{ flex: 1 }}>
                  <FieldInput
                    label="Doz"
                    value={form.medicineDose}
                    onChangeText={(t) => set("medicineDose", t.replace(/[^0-9.]/g, ""))}
                    placeholder="5"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.unitRow}>
                  {DOSE_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => set("medicineUnit", u)}
                      style={[
                        styles.unitChip,
                        form.medicineUnit === u && styles.unitChipActive,
                      ]}
                    >
                      <Text style={[styles.unitChipText, form.medicineUnit === u && { color: COLORS.warm }]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FieldInput
                label="Gün Sayısı"
                value={form.medicineDays}
                onChangeText={(t) => set("medicineDays", t.replace(/[^0-9]/g, ""))}
                placeholder="5"
                keyboardType="numeric"
              />

              <FieldInput
                label="Veteriner Adı"
                value={form.veterinarianName}
                onChangeText={(t) => set("veterinarianName", t)}
                placeholder="Dr. Ahmet Yılmaz"
              />
            </BlurView>
          </Animated.View>

          {/* ── TAKİP PLANI ─────────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Takip Planı</Text>
              <TouchableOpacity
                onPress={() => {
                  if (form.followUpDate) {
                    set("followUpDate", "");
                    setFollowQuick(null);
                  } else {
                    set("followUpDate", " ");
                  }
                }}
                style={[
                  styles.toggleChip,
                  form.followUpDate && { backgroundColor: "rgba(78,205,196,0.12)", borderColor: "rgba(78,205,196,0.30)" },
                ]}
              >
                <Text style={[styles.toggleChipText, form.followUpDate && { color: COLORS.success }]}>
                  {form.followUpDate ? "Aktif" : "Ekle"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={{
              opacity: followAnim,
              maxHeight: followAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
              overflow: "hidden",
            }}
            pointerEvents={form.followUpDate !== "" ? "auto" : "none"}
          >
            <BlurView intensity={16} tint="dark" style={styles.followCard}>
              <View style={styles.quickRow}>
                {QUICK_FOLLOW.map((q) => (
                  <TouchableOpacity
                    key={q.days}
                    onPress={() => applyQuickFollow(q.days)}
                    style={[
                      styles.quickChip,
                      followQuick === q.days && styles.quickChipActive,
                    ]}
                  >
                    <Text style={[styles.quickChipText, followQuick === q.days && { color: COLORS.warm }]}>
                      {q.label} sonra
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => { setFollowQuick("custom"); set("followUpDate", ""); }}
                  style={[styles.quickChip, followQuick === "custom" && styles.quickChipActive]}
                >
                  <Text style={[styles.quickChipText, followQuick === "custom" && { color: COLORS.warm }]}>
                    Özel
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={form.followUpDate.trim()}
                onChangeText={(t) => { set("followUpDate", t); setFollowQuick("custom"); }}
                placeholder="GG/AA/YYYY"
                placeholderTextColor="rgba(234,244,255,0.28)"
                keyboardType="numeric"
                style={styles.followInput}
              />

              <TouchableOpacity
                onPress={() => {
                  const dt = parseDMY(form.followUpDate.trim());
                  const label = dt
                    ? dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
                    : form.followUpDate;
                  Alert.alert("Hatırlatıcı Kuruldu", `Kontrol tarihi: ${label}`);
                }}
                style={styles.reminderBtn}
              >
                <Ionicons name="notifications-outline" size={15} color={COLORS.muted} />
                <Text style={styles.reminderText}>Hatırlatıcı Oluştur</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {/* ── NOTLAR ──────────────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>Notlar</Text>
          </View>

          <TextInput
            value={form.notes}
            onChangeText={(t) => set("notes", t)}
            placeholder="Veteriner geldi, antibiyotik başlandı…"
            placeholderTextColor="rgba(234,244,255,0.28)"
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />

          {/* ── KAYDET BUTONU ───────────────────────────────────────────────── */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={!canSave || saving}
            style={{ marginTop: 20 }}
          >
            <LinearGradient
              colors={
                !canSave || saving
                  ? ["rgba(255,170,90,0.35)", "rgba(255,170,90,0.20)"]
                  : ["#FFAA5A", "#FF8C2A"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Ionicons name="save-outline" size={18} color={COLORS.bg1} />
              <Text style={styles.saveBtnText}>
                {saving ? "Kaydediliyor…" : "Muayeneyi Kaydet"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── GEÇMİŞ ──────────────────────────────────────────────────────── */}
          {records.length > 0 && (
            <>
              <View style={[styles.sectionHead, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Muayene Geçmişi</Text>
                <Text style={styles.sectionSub}>{records.length} kayıt</Text>
              </View>

              <View style={styles.timeline}>
                {records.map((rec, idx) => (
                  <ExamTimelineRow
                    key={rec.id}
                    record={rec}
                    isLast={idx === records.length - 1}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCell({ icon, label, value }) {
  return (
    <View style={styles.sumCell}>
      <Ionicons name={icon} size={12} color={COLORS.muted} />
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumVal} numberOfLines={1}>{value || "—"}</Text>
    </View>
  );
}

function VitalInput({ label, unit, value, onChangeText, tone, placeholder, keyboardType, hint }) {
  const color  = toneColor(tone);
  const border = tone === "default" ? "rgba(255,255,255,0.10)" : toneBorder(tone);
  return (
    <View style={styles.vitalRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.vitalLabel}>{label}</Text>
        {!!hint && <Text style={styles.vitalHint}>{hint}</Text>}
      </View>
      <View style={[styles.vitalInputWrap, { borderColor: border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(234,244,255,0.28)"
          keyboardType={keyboardType ?? "default"}
          style={[styles.vitalInput, { color: tone === "default" ? COLORS.text : color }]}
        />
        <Text style={[styles.vitalUnit, { color: tone === "default" ? COLORS.muted : color }]}>{unit}</Text>
        {tone !== "default" && (
          <Ionicons
            name={tone === "success" ? "checkmark-circle" : tone === "warn" ? "alert-circle" : "alert-circle"}
            size={14}
            color={color}
            style={{ marginLeft: 4 }}
          />
        )}
      </View>
    </View>
  );
}

function TriToggle({ label, options, value, onChange }) {
  return (
    <View style={styles.triRow}>
      <Text style={styles.triLabel}>{label}</Text>
      <View style={styles.triWrap}>
        {options.map((opt) => {
          const active = value === opt.val;
          const tone =
            opt.val === "good" || opt.val === "normal" ? "success" :
            opt.val === "medium" || opt.val === "low" || opt.val === "soft" ? "warm" :
            "danger";
          return (
            <TouchableOpacity
              key={opt.val}
              onPress={() => onChange(opt.val)}
              style={[
                styles.triBtn,
                active && { backgroundColor: toneBg(tone), borderColor: toneBorder(tone) },
              ]}
            >
              <Text style={[styles.triBtnText, { color: active ? toneColor(tone) : COLORS.muted }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(234,244,255,0.28)"
        keyboardType={keyboardType ?? "default"}
        style={styles.fieldInput}
      />
    </View>
  );
}

function ExamTimelineRow({ record, isLast }) {
  const cond = record.generalCondition;
  const tone = cond === "good" ? "success" : cond === "medium" ? "warm" : "danger";
  const dotColor = toneColor(tone);
  const typeLabel = EXAM_TYPES.find((e) => e.id === record.examinationType)?.label || record.examinationType || "—";

  const ts = record.createdAt;
  const dateLabel = ts ? new Date(ts).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "—";

  return (
    <View style={styles.tlRow}>
      <View style={styles.tlLineWrap}>
        <View style={[styles.tlDot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={[styles.tlLine, { backgroundColor: dotColor + "44" }]} />}
      </View>

      <View style={[styles.tlContent, isLast && { paddingBottom: 0 }]}>
        <View style={styles.tlTopRow}>
          <Text style={[styles.tlType, { color: dotColor }]}>{typeLabel}</Text>
          <Text style={styles.tlDate}>{dateLabel}</Text>
        </View>

        {(record.temperature || record.pulse) && (
          <Text style={styles.tlVitals}>
            {record.temperature ? `Sıcaklık: ${record.temperature}°C` : ""}
            {record.temperature && record.pulse ? "  ·  " : ""}
            {record.pulse ? `Nabız: ${record.pulse} bpm` : ""}
          </Text>
        )}

        {record.symptoms?.length > 0 && (
          <Text style={styles.tlSymptoms}>
            Belirti: {record.symptoms.join(", ")}
            {record.otherSymptom ? `, ${record.otherSymptom}` : ""}
          </Text>
        )}

        {!!record.diagnosis && (
          <Text style={styles.tlDiag} numberOfLines={2}>Tanı: {record.diagnosis}</Text>
        )}

        {record.treatmentRecommended && !!record.medicineName && (
          <Text style={styles.tlMed}>
            İlaç: {record.medicineName}
            {record.medicineDose ? ` ${record.medicineDose}${record.medicineUnit}` : ""}
            {record.medicineDays ? ` · ${record.medicineDays} gün` : ""}
          </Text>
        )}

        {!!record.veterinarianName && (
          <Text style={styles.tlVet}>Veteriner: {record.veterinarianName}</Text>
        )}
      </View>
    </View>
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
  topTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900", letterSpacing: 0.4 },
  topSub:   { color: COLORS.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },

  sectionHead: { marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontWeight: "950", fontSize: 14 },
  sectionSub:   { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 3 },

  countBadge: {
    minWidth: 20, height: 20, borderRadius: 99,
    backgroundColor: COLORS.warm,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 5,
  },
  countBadgeText: { color: COLORS.bg1, fontSize: 11, fontWeight: "900" },

  // ── Summary
  summaryCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, overflow: "hidden",
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  sumCell:    { alignItems: "center", gap: 3, flex: 1 },
  sumLabel:   { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  sumVal:     { color: COLORS.text,  fontSize: 12, fontWeight: "900" },
  divider:    { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 12 },
  lastExamRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  lastExamLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  lastExamVal:   { color: COLORS.text, fontSize: 12, fontWeight: "900", marginLeft: "auto" },
  sickBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 99, alignSelf: "flex-start",
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1, borderColor: "rgba(255,107,107,0.28)",
  },
  sickBadgeText: { color: COLORS.danger, fontWeight: "900", fontSize: 12 },

  // ── Emergency
  emergencyBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, backgroundColor: "rgba(255,107,107,0.14)",
    borderWidth: 1, borderColor: "rgba(255,107,107,0.30)",
  },
  emergencyText: { color: COLORS.danger, fontWeight: "900", fontSize: 13 },

  // ── Exam type grid
  examGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  examCard: {
    width: "30.5%", borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12, alignItems: "center", gap: 7,
  },
  examIconWrap: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  examLabel: { fontSize: 11, fontWeight: "900", textAlign: "center" },

  // ── Vitals
  vitalsCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, overflow: "hidden",
  },
  vitalsDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginVertical: 12 },
  vitalRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  vitalLabel: { color: COLORS.text, fontWeight: "900", fontSize: 13 },
  vitalHint:  { color: COLORS.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
  vitalInputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 10, height: 42,
    backgroundColor: "rgba(0,0,0,0.24)", minWidth: 110,
  },
  vitalInput: {
    flex: 1, fontWeight: "900", fontSize: 15,
    padding: 0,
  },
  vitalUnit: { fontWeight: "800", fontSize: 12, marginLeft: 4 },

  // ── Observe
  observeCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, overflow: "hidden",
  },
  triRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  triLabel: { color: COLORS.text, fontWeight: "900", fontSize: 13, flex: 1 },
  triWrap: { flexDirection: "row", gap: 6 },
  triBtn: {
    paddingHorizontal: 11, height: 32, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  triBtnText: { fontSize: 11, fontWeight: "900" },

  // ── Symptoms
  symptomCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, overflow: "hidden",
  },
  symptomRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  symptomRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  symptomRowActive:  { backgroundColor: "rgba(78,205,196,0.07)" },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  symptomLabel: { flex: 1, color: COLORS.muted, fontWeight: "800", fontSize: 13 },
  otherInput: {
    margin: 12, marginTop: 0,
    height: 44, borderRadius: 12,
    paddingHorizontal: 12, color: COLORS.text,
    fontWeight: "800", fontSize: 13,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },

  // ── Diagnosis
  diagnosisWrap: { position: "relative" },
  diagnosisInput: {
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    paddingBottom: 28,
    color: COLORS.text, fontWeight: "800", fontSize: 14,
    textAlignVertical: "top", minHeight: 90,
  },
  charCount: {
    position: "absolute", bottom: 10, right: 14,
    color: "rgba(234,244,255,0.30)", fontSize: 10, fontWeight: "700",
  },

  // ── Treatment
  toggleChip: {
    paddingHorizontal: 12, height: 28, borderRadius: 99,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  toggleChipText: { color: COLORS.muted, fontWeight: "900", fontSize: 12 },
  treatCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 14,
    overflow: "hidden", gap: 12,
  },
  doseRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  unitRow: { flexDirection: "row", gap: 6, paddingBottom: 2 },
  unitChip: {
    width: 48, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  unitChipActive: { borderColor: "rgba(255,170,90,0.35)", backgroundColor: "rgba(255,170,90,0.12)" },
  unitChipText: { color: COLORS.muted, fontWeight: "900", fontSize: 12 },
  fieldWrap: { gap: 5 },
  fieldLabel: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },
  fieldInput: {
    height: 44, borderRadius: 12, paddingHorizontal: 12,
    color: COLORS.text, fontWeight: "800", fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },

  // ── Follow-up
  followCard: {
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 14,
    overflow: "hidden", gap: 12,
  },
  quickRow: { flexDirection: "row", gap: 8 },
  quickChip: {
    paddingHorizontal: 12, height: 32, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  quickChipActive: { borderColor: "rgba(255,170,90,0.35)", backgroundColor: "rgba(255,170,90,0.12)" },
  quickChipText: { color: COLORS.muted, fontWeight: "900", fontSize: 12 },
  followInput: {
    height: 44, borderRadius: 12, paddingHorizontal: 12,
    color: COLORS.text, fontWeight: "800", fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  reminderBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
  },
  reminderText: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },

  // ── Notes
  notesInput: {
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    paddingBottom: 12,
    color: COLORS.text, fontWeight: "700", fontSize: 14,
    textAlignVertical: "top", minHeight: 100,
  },

  // ── Save
  saveBtn: {
    height: 54, borderRadius: 18,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9,
  },
  saveBtnText: { color: COLORS.bg1, fontWeight: "900", fontSize: 15 },

  // ── Timeline
  timeline: { paddingLeft: 4 },
  tlRow: { flexDirection: "row", gap: 14 },
  tlLineWrap: { alignItems: "center", width: 14 },
  tlDot: {
    width: 12, height: 12, borderRadius: 99, marginTop: 3,
    elevation: 2,
  },
  tlLine: { width: 2, flex: 1, marginTop: 4, borderRadius: 99 },
  tlContent: { flex: 1, paddingBottom: 18 },
  tlTopRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  tlType:    { fontWeight: "900", fontSize: 13 },
  tlDate:    { color: COLORS.muted, fontWeight: "700", fontSize: 11, marginLeft: "auto" },
  tlVitals:  { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 2 },
  tlSymptoms:{ color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 2 },
  tlDiag:    { color: "rgba(234,244,255,0.55)", fontWeight: "700", fontSize: 12, marginTop: 3, lineHeight: 17 },
  tlMed:     { color: COLORS.warm, fontWeight: "800", fontSize: 12, marginTop: 3 },
  tlVet:     { color: "rgba(234,244,255,0.40)", fontWeight: "700", fontSize: 11, marginTop: 2 },
});
