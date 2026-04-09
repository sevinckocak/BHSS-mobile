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

// 📌 Navigation: navigation.navigate("PregnancyCheck", { animalId })

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

const GESTATION_DAYS = 280;

const METHODS = [
  { id: "vet",  label: "Veteriner Muayenesi", icon: "stethoscope-outline", tone: "success" },
  { id: "obs",  label: "Gözlem",              icon: "eye-outline",          tone: "warm"    },
  { id: "usg",  label: "Ultrason",            icon: "radio-outline",        tone: "default" },
  { id: "lab",  label: "Laboratuvar Testi",   icon: "flask-outline",        tone: "default" },
];

const OBS_SYMPTOMS = [
  { id: "no_heat",     label: "Kızgınlık belirtisi göstermedi",    points: 3 },
  { id: "belly",       label: "Karın büyümesi fark edildi",         points: 2 },
  { id: "calm",        label: "Huzurlu ve sakin davranıyor",        points: 1 },
  { id: "milk_change", label: "Süt verimi değişti",                 points: 1 },
  { id: "no_recycle",  label: "Tekrar kızgınlık olmadı (21+ gün)", points: 2 },
];

const MAX_OBS = OBS_SYMPTOMS.reduce((s, x) => s + x.points, 0);

function toneColor(tone) {
  if (tone === "success") return COLORS.success;
  if (tone === "warm")    return COLORS.warm;
  if (tone === "danger")  return COLORS.danger;
  return COLORS.muted;
}
function toneBg(tone) {
  if (tone === "success") return "rgba(78,205,196,0.12)";
  if (tone === "warm")    return "rgba(255,170,90,0.12)";
  if (tone === "danger")  return "rgba(255,107,107,0.12)";
  return "rgba(255,255,255,0.06)";
}
function toneBorder(tone) {
  if (tone === "success") return "rgba(78,205,196,0.28)";
  if (tone === "warm")    return "rgba(255,170,90,0.28)";
  if (tone === "danger")  return "rgba(255,107,107,0.28)";
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
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${dt.getFullYear()}`;
}
function addDays(dt, n) {
  const d = new Date(dt);
  d.setDate(d.getDate() + n);
  return d;
}
function daysDiff(a, b) {
  return Math.floor((b - a) / 86400000);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PregnancyCheckScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { animals, updateAnimal } = useAnimals();
  const animalId = route?.params?.animalId;

  const animal = useMemo(
    () => (animals || []).find((a) => a.id === animalId) || null,
    [animals, animalId],
  );

  const tagNo   = animal?.tagNo   || "—";
  const breed   = animal?.breed   || "—";
  const ageLabel = animal?.ageMonths != null ? `${animal.ageMonths} ay` : "—";
  const isHighRisk = (animal?.ageMonths ?? 0) > 84 || !animal?.isPregnant;

  // ── Persistent state ────────────────────────────────────────────────────────
  const [lastInsem, setLastInsem] = useState(""); // "DD/MM/YYYY"
  const [history,   setHistory]   = useState([]);

  const insemKey    = `last_insemination_${animalId}`;
  const historyKey  = `pregnancy_history_${animalId}`;

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(insemKey),
      AsyncStorage.getItem(historyKey),
    ]).then(([ins, hist]) => {
      if (ins)  setLastInsem(ins);
      if (hist) setHistory(JSON.parse(hist));
    }).catch(() => {});
  }, [insemKey, historyKey]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [method,       setMethod]      = useState(null);   // "vet"|"obs"|"usg"|"lab"
  const [obsSelected,  setObsSelected] = useState(new Set());
  const [manualResult, setManualResult]= useState(null);   // "Gebe"|"Şüpheli"|"Gebe Değil"
  const [twinExpected, setTwinExpected]= useState(false);
  const [result,       setResult]      = useState(null);   // computed
  const [insemInput,   setInsemInput]  = useState("");
  const [note,         setNote]        = useState("");
  const [saving,       setSaving]      = useState(false);

  // ── Animations ──────────────────────────────────────────────────────────────
  const obsAnim    = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const prevMethod = useRef(null);
  useEffect(() => {
    const wasObs = prevMethod.current === "obs";
    const isObs  = method === "obs";
    prevMethod.current = method;

    if (isObs && !wasObs) {
      Animated.spring(obsAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }).start();
    } else if (!isObs && wasObs) {
      Animated.timing(obsAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }

    // clear result when method changes
    setResult(null);
    setManualResult(null);
    setObsSelected(new Set());
    Animated.timing(resultAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  }, [method]);

  // ── Gestation progress ──────────────────────────────────────────────────────
  const gestationInfo = useMemo(() => {
    const dt = parseDMY(lastInsem);
    if (!dt) return null;
    const today = new Date();
    const days  = daysDiff(dt, today);
    if (days < 0 || days > GESTATION_DAYS + 30) return null;
    const pct  = Math.min(Math.round((days / GESTATION_DAYS) * 100), 100);
    const week = Math.floor(days / 7);
    const due  = addDays(dt, GESTATION_DAYS);
    const daysLeft = daysDiff(today, due);
    return { days, week, pct, due, daysLeft };
  }, [lastInsem]);

  // ── Toggle obs symptom ───────────────────────────────────────────────────────
  const toggleObs = useCallback((id) => {
    setObsSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
    Animated.timing(resultAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start();
  }, [resultAnim]);

  const obsScore = useMemo(
    () => OBS_SYMPTOMS.filter((s) => obsSelected.has(s.id)).reduce((acc, s) => acc + s.points, 0),
    [obsSelected],
  );

  // ── Calculate ────────────────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    let res;
    if (method === "obs") {
      if (obsScore >= 7)      res = { label: "Gebe",        tone: "success", icon: "checkmark-circle", emoji: "✅", confidence: Math.round((obsScore / MAX_OBS) * 100) };
      else if (obsScore >= 4) res = { label: "Şüpheli",     tone: "warm",    icon: "alert-circle",     emoji: "⚠️", confidence: Math.round((obsScore / MAX_OBS) * 100) };
      else                    res = { label: "Gebe Değil",  tone: "danger",  icon: "close-circle",     emoji: "❌", confidence: Math.round(((MAX_OBS - obsScore) / MAX_OBS) * 100) };
    } else {
      if (!manualResult) return Alert.alert("Eksik", "Lütfen bir sonuç seçin.");
      const tone = manualResult === "Gebe" ? "success" : manualResult === "Şüpheli" ? "warm" : "danger";
      const icon = manualResult === "Gebe" ? "checkmark-circle" : manualResult === "Şüpheli" ? "alert-circle" : "close-circle";
      const emoji = manualResult === "Gebe" ? "✅" : manualResult === "Şüpheli" ? "⚠️" : "❌";
      res = { label: manualResult, tone, icon, emoji, confidence: 90 };
    }
    setResult(res);
    Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  }, [method, obsScore, manualResult, resultAnim]);

  // ── Save insemination date ───────────────────────────────────────────────────
  const handleSaveInsem = useCallback(async () => {
    const dt = parseDMY(insemInput.trim());
    if (!dt) return Alert.alert("Geçersiz tarih", "GG/AA/YYYY formatında girin.");
    try {
      await AsyncStorage.setItem(insemKey, insemInput.trim());
      setLastInsem(insemInput.trim());
      await updateAnimal(animalId, { isPregnant: true });
      Alert.alert("Kaydedildi", "Tohumlama tarihi kaydedildi, hayvan gebe olarak işaretlendi.");
    } catch (e) {
      Alert.alert("Hata", e?.message || "Kaydedilemedi.");
    }
  }, [insemInput, insemKey, animalId, updateAnimal]);

  // ── Save full record ──────────────────────────────────────────────────────────
  const handleSaveRecord = useCallback(async () => {
    if (!result) return Alert.alert("Önce hesaplayın", "Kaydetmeden önce sonucu hesaplayın.");
    setSaving(true);
    try {
      const entry = {
        id:           Date.now().toString(),
        date:         new Date().toISOString(),
        method:       METHODS.find((m) => m.id === method)?.label || method,
        result:       result.label,
        tone:         result.tone,
        emoji:        result.emoji,
        confidence:   result.confidence,
        twinExpected: method === "usg" ? twinExpected : false,
        note:         note.trim(),
      };
      const next = [entry, ...history];
      setHistory(next);
      await AsyncStorage.setItem(historyKey, JSON.stringify(next));
      setNote("");
      Alert.alert("Kaydedildi", "Gebelik kontrolü geçmişe eklendi.");
    } catch (e) {
      Alert.alert("Hata", e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }, [result, method, twinExpected, note, history, historyKey]);

  // ── Advice & due date ────────────────────────────────────────────────────────
  const adviceText = useMemo(() => {
    if (!result) return "";
    if (result.label === "Gebe" && gestationInfo?.due) {
      return `Tahmini doğum: ${formatDMY(gestationInfo.due)}`;
    }
    if (result.label === "Şüpheli") return "21 gün sonra tekrar kontrol edin.";
    return "Kızgınlık takibine devam edin.";
  }, [result, gestationInfo]);

  const showDryWarning = gestationInfo && gestationInfo.daysLeft <= 60 && gestationInfo.daysLeft > 0;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={["rgba(78,205,196,0.10)", "rgba(5,9,20,0.94)", COLORS.bg2]}
      locations={[0, 0.28, 1]}
      style={styles.container}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.topTitle}>Gebelik Kontrolü</Text>
            <Text style={styles.topSub}>{tagNo}  ·  {breed}  ·  {ageLabel}</Text>
          </View>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        >
          {/* ── ÖZET KARTI ──────────────────────────────────────────────────── */}
          <BlurView intensity={18} tint="dark" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <SummaryCell icon="pricetag-outline"  label="Küpe"  value={tagNo} />
              <SummaryCell icon="leaf-outline"      label="Irk"   value={breed} />
              <SummaryCell icon="hourglass-outline" label="Yaş"   value={ageLabel} />
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryInsemRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
              <Text style={styles.summaryInsemLabel}>Son Tohumlama</Text>
              <Text style={styles.summaryInsemVal}>{lastInsem || "—"}</Text>
            </View>

            {animal?.isPregnant && (
              <View style={[styles.pregnantBadge, { backgroundColor: "rgba(255,170,90,0.12)", borderColor: "rgba(255,170,90,0.28)" }]}>
                <Ionicons name="flower-outline" size={13} color={COLORS.warm} />
                <Text style={[styles.pregnantBadgeText, { color: COLORS.warm }]}>
                  Mevcut Gebelik Devam Ediyor
                </Text>
              </View>
            )}

            {gestationInfo && (
              <View style={{ marginTop: 12 }}>
                <View style={styles.gestationLabelRow}>
                  <Text style={styles.gestationLabel}>
                    {gestationInfo.week}. hafta  ·  {gestationInfo.days}. gün
                  </Text>
                  <Text style={styles.gestationPct}>{gestationInfo.pct}%</Text>
                </View>
                <View style={styles.gestBarBg}>
                  <LinearGradient
                    colors={["#FFAA5A", "#4ECDC4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gestBarFill, { width: `${gestationInfo.pct}%` }]}
                  />
                </View>
                <Text style={styles.gestDue}>
                  Tahmini doğum: {formatDMY(gestationInfo.due)}
                </Text>
              </View>
            )}
          </BlurView>

          {/* ── YÖNTEM SEÇİMİ ───────────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>Kontrol Yöntemi</Text>
            <Text style={styles.sectionSub}>Uygulanan yöntemi seçin</Text>
          </View>

          <View style={styles.methodGrid}>
            {METHODS.map((m) => {
              const active = method === m.id;
              const mc = active ? toneColor(m.tone) : COLORS.muted;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.82}
                  onPress={() => setMethod(m.id)}
                  style={[
                    styles.methodCard,
                    active && {
                      borderColor: toneBorder(m.tone),
                      backgroundColor: toneBg(m.tone),
                    },
                  ]}
                >
                  <View style={[styles.methodIconWrap, active && { borderColor: toneBorder(m.tone), backgroundColor: "rgba(0,0,0,0.22)" }]}>
                    <Ionicons name={m.icon} size={20} color={mc} />
                  </View>
                  <Text style={[styles.methodLabel, { color: active ? COLORS.text : COLORS.muted }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── GÖZLEM BELİRTİLERİ (sadece "obs") ──────────────────────────── */}
          <Animated.View
            style={{
              opacity: obsAnim,
              transform: [{ translateY: obsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              overflow: "hidden",
              maxHeight: obsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }),
            }}
            pointerEvents={method === "obs" ? "auto" : "none"}
          >
            <View style={[styles.sectionHead, { marginTop: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.sectionTitle}>Gözlem Belirtileri</Text>
                {obsSelected.size > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{obsSelected.size}</Text>
                  </View>
                )}
              </View>
            </View>

            <BlurView intensity={16} tint="dark" style={styles.symptomCard}>
              {OBS_SYMPTOMS.map((s, idx) => {
                const active = obsSelected.has(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.82}
                    onPress={() => toggleObs(s.id)}
                    style={[
                      styles.symptomRow,
                      idx < OBS_SYMPTOMS.length - 1 && styles.symptomRowBorder,
                      active && styles.symptomRowActive,
                    ]}
                  >
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active && <Ionicons name="checkmark" size={13} color={COLORS.bg1} />}
                    </View>
                    <Text style={[styles.symptomLabel, active && { color: COLORS.text }]}>
                      {s.label}
                    </Text>
                    <View style={[styles.ptBadge, active && styles.ptBadgeActive]}>
                      <Text style={[styles.ptText, active && { color: COLORS.warm }]}>+{s.points}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </BlurView>
          </Animated.View>

          {/* ── MANUEL SONUÇ (vet / usg / lab) ─────────────────────────────── */}
          {method && method !== "obs" && (
            <>
              <View style={[styles.sectionHead, { marginTop: 16 }]}>
                <Text style={styles.sectionTitle}>Sonuç</Text>
                <Text style={styles.sectionSub}>Muayene / test sonucunu girin</Text>
              </View>

              <View style={styles.manualRow}>
                {[
                  { v: "Gebe",       tone: "success", icon: "checkmark-circle", emoji: "✅" },
                  { v: "Şüpheli",    tone: "warm",    icon: "alert-circle",     emoji: "⚠️" },
                  { v: "Gebe Değil", tone: "danger",  icon: "close-circle",     emoji: "❌" },
                ].map((opt) => {
                  const active = manualResult === opt.v;
                  return (
                    <TouchableOpacity
                      key={opt.v}
                      activeOpacity={0.82}
                      onPress={() => { setManualResult(opt.v); setResult(null); Animated.timing(resultAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(); }}
                      style={[
                        styles.manualCard,
                        { borderColor: active ? toneBorder(opt.tone) : "rgba(255,255,255,0.10)", backgroundColor: active ? toneBg(opt.tone) : "rgba(255,255,255,0.04)" },
                      ]}
                    >
                      <Ionicons name={opt.icon} size={22} color={active ? toneColor(opt.tone) : COLORS.muted} />
                      <Text style={[styles.manualLabel, { color: active ? toneColor(opt.tone) : COLORS.muted }]}>
                        {opt.v}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Ultrason → yavru sayısı */}
              {method === "usg" && (
                <View style={[styles.twinRow, { marginTop: 12 }]}>
                  <Text style={styles.twinLabel}>Yavru Sayısı</Text>
                  <View style={styles.twinToggle}>
                    <TouchableOpacity
                      onPress={() => setTwinExpected(false)}
                      style={[styles.twinBtn, !twinExpected && styles.twinBtnActive]}
                    >
                      <Text style={[styles.twinBtnText, !twinExpected && styles.twinBtnTextActive]}>
                        1 Yavru
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setTwinExpected(true)}
                      style={[styles.twinBtn, twinExpected && styles.twinBtnActive]}
                    >
                      <Text style={[styles.twinBtnText, twinExpected && styles.twinBtnTextActive]}>
                        İkiz
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── HESAPLA BUTONU ───────────────────────────────────────────────── */}
          {method && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleCalculate}
              style={{ marginTop: 16 }}
            >
              <LinearGradient
                colors={["#FFAA5A", "#FF8C2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.calcBtn}
              >
                <Ionicons name="shield-checkmark-outline" size={19} color={COLORS.bg1} />
                <Text style={styles.calcBtnText}>
                  {method === "obs" ? "Hesapla" : "Sonucu Onayla"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── SONUÇ KARTI ──────────────────────────────────────────────────── */}
          {result && (
            <Animated.View
              style={{
                opacity: resultAnim,
                transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                marginTop: 16,
              }}
            >
              <BlurView
                intensity={22}
                tint="dark"
                style={[styles.resultCard, { borderColor: toneBorder(result.tone) }]}
              >
                {/* Durum başlık */}
                <View style={styles.resultTop}>
                  <View style={[styles.resultIconWrap, { backgroundColor: toneBg(result.tone), borderColor: toneBorder(result.tone) }]}>
                    <Ionicons name={result.icon} size={26} color={toneColor(result.tone)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultLabel, { color: toneColor(result.tone) }]}>
                      {result.emoji}  {result.label}
                    </Text>
                    <Text style={styles.resultAdvice}>{adviceText}</Text>
                  </View>
                </View>

                {/* Güven */}
                <View style={styles.confRow}>
                  <View style={styles.confBarBg}>
                    <LinearGradient
                      colors={
                        result.tone === "success" ? ["#4ECDC4", "#1AB5AC"] :
                        result.tone === "warm"    ? ["#FFAA5A", "#FF8C2A"] :
                                                   ["#FF6B6B", "#E04545"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.confBarFill, { width: `${result.confidence}%` }]}
                    />
                  </View>
                  <Text style={styles.confText}>%{result.confidence}</Text>
                </View>

                {/* Ultrason ikiz */}
                {method === "usg" && (
                  <View style={styles.twinResultRow}>
                    <Ionicons name="git-branch-outline" size={13} color={COLORS.muted} />
                    <Text style={styles.twinResultText}>
                      {twinExpected ? "İkiz bekleniyor" : "Tekiz bekleniyor"}
                    </Text>
                  </View>
                )}

                {/* Risk bayrağı */}
                {isHighRisk && result.label !== "Gebe Değil" && (
                  <View style={styles.riskBanner}>
                    <Ionicons name="warning-outline" size={14} color={COLORS.danger} />
                    <Text style={styles.riskText}>⚠️ Yüksek Riskli Gebelik</Text>
                  </View>
                )}

                {/* Kuru dönem uyarısı */}
                {showDryWarning && result.label === "Gebe" && (
                  <View style={styles.dryBanner}>
                    <Ionicons name="notifications-outline" size={14} color={COLORS.warm} />
                    <Text style={styles.dryText}>
                      🔔 Kuru döneme geçiş zamanı yaklaşıyor ({gestationInfo.daysLeft} gün kaldı)
                    </Text>
                  </View>
                )}
              </BlurView>

              {/* ── TOHUMLAMA TARİHİ ──────────────────────────────────────── */}
              {(result.label === "Gebe" || result.label === "Şüpheli") && (
                <BlurView intensity={14} tint="dark" style={[styles.insemCard, { marginTop: 12 }]}>
                  <Text style={styles.insemTitle}>Son Tohumlama Tarihi</Text>
                  <View style={styles.insemRow}>
                    <TextInput
                      value={insemInput}
                      onChangeText={setInsemInput}
                      placeholder="GG/AA/YYYY"
                      placeholderTextColor="rgba(234,244,255,0.28)"
                      keyboardType="numeric"
                      style={styles.insemInput}
                    />
                    <TouchableOpacity
                      onPress={handleSaveInsem}
                      style={styles.insemBtn}
                    >
                      <LinearGradient
                        colors={["#4ECDC4", "#1AB5AC"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.insemBtnGrad}
                      >
                        <Text style={styles.insemBtnText}>Kaydet</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              )}

              {/* ── NOT + KAYIT ───────────────────────────────────────────── */}
              <BlurView intensity={14} tint="dark" style={[styles.saveCard, { marginTop: 12 }]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Not ekle (opsiyonel): Veteriner kontrol etti, ultrason yapıldı…"
                  placeholderTextColor="rgba(234,244,255,0.26)"
                  multiline
                  numberOfLines={2}
                  style={styles.noteInput}
                />
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSaveRecord}
                  disabled={saving}
                  style={{ marginTop: 10 }}
                >
                  <LinearGradient
                    colors={saving ? ["rgba(255,170,90,0.35)", "rgba(255,170,90,0.20)"] : ["#FFAA5A", "#FF8C2A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtn}
                  >
                    <Ionicons name="save-outline" size={17} color={COLORS.bg1} />
                    <Text style={styles.saveBtnText}>Kaydı Tamamla</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}

          {/* ── GEÇMİŞ TİMELINE ──────────────────────────────────────────── */}
          {history.length > 0 && (
            <>
              <View style={[styles.sectionHead, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Gebelik Geçmişi</Text>
                <Text style={styles.sectionSub}>{history.length} kayıt</Text>
              </View>

              <View style={styles.timeline}>
                {history.map((entry, idx) => (
                  <TimelineRow
                    key={entry.id}
                    entry={entry}
                    isLast={idx === history.length - 1}
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
      <Ionicons name={icon} size={13} color={COLORS.muted} />
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumVal} numberOfLines={1}>{value || "—"}</Text>
    </View>
  );
}

function TimelineRow({ entry, isLast }) {
  const dateLabel = new Date(entry.date).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const dotColor = toneColor(entry.tone);

  return (
    <View style={styles.tlRow}>
      {/* Line + dot */}
      <View style={styles.tlLineWrap}>
        <View style={[styles.tlDot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
        {!isLast && <View style={[styles.tlLine, { backgroundColor: dotColor + "44" }]} />}
      </View>

      {/* Content */}
      <View style={[styles.tlContent, isLast && { marginBottom: 0 }]}>
        <View style={styles.tlTopRow}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
          <Text style={styles.tlDate}>{dateLabel}</Text>
          <Text style={[styles.tlResult, { color: dotColor }]}>
            {entry.emoji} {entry.result}
          </Text>
          <Text style={styles.tlConf}>(%{entry.confidence})</Text>
        </View>
        <Text style={styles.tlMethod}>{entry.method}</Text>
        {entry.twinExpected && (
          <Text style={styles.tlTwin}>İkiz bekleniyor</Text>
        )}
        {!!entry.note && (
          <Text style={styles.tlNote} numberOfLines={2}>{entry.note}</Text>
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
  topTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  topSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
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
  sectionSub: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 3 },

  countBadge: {
    minWidth: 20, height: 20, borderRadius: 99,
    backgroundColor: COLORS.warm, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 5,
  },
  countBadgeText: { color: COLORS.bg1, fontSize: 11, fontWeight: "900" },

  // ── Summary card
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sumCell: { alignItems: "center", gap: 3, flex: 1 },
  sumLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  sumVal:   { color: COLORS.text,  fontSize: 13, fontWeight: "900" },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 12,
  },
  summaryInsemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  summaryInsemLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  summaryInsemVal:   { color: COLORS.text,  fontSize: 13, fontWeight: "900", marginLeft: "auto" },
  pregnantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pregnantBadgeText: { fontWeight: "900", fontSize: 12 },
  gestationLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  gestationLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  gestationPct:   { color: COLORS.warm,  fontSize: 12, fontWeight: "900" },
  gestBarBg: {
    height: 6,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  gestBarFill: { height: "100%", borderRadius: 99 },
  gestDue: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Method grid
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  methodCard: {
    width: "47.5%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  // ── Symptom list
  symptomCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  symptomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  symptomRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  symptomRowActive: { backgroundColor: "rgba(255,170,90,0.07)" },
  checkbox: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: COLORS.warm, borderColor: COLORS.warm },
  symptomLabel: { flex: 1, color: COLORS.muted, fontWeight: "800", fontSize: 13 },
  ptBadge: {
    paddingHorizontal: 8, height: 22, borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  ptBadgeActive: {
    borderColor: "rgba(255,170,90,0.35)",
    backgroundColor: "rgba(255,170,90,0.12)",
  },
  ptText:       { color: COLORS.muted, fontSize: 11, fontWeight: "900" },

  // ── Manual result
  manualRow: { flexDirection: "row", gap: 10 },
  manualCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
  },
  manualLabel: { fontSize: 11, fontWeight: "900", textAlign: "center" },

  // ── Twin toggle
  twinRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  twinLabel: { color: COLORS.muted, fontWeight: "800", fontSize: 13 },
  twinToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  twinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  twinBtnActive: { backgroundColor: "rgba(255,170,90,0.16)" },
  twinBtnText:       { color: COLORS.muted, fontWeight: "900", fontSize: 12 },
  twinBtnTextActive: { color: COLORS.warm },

  // ── Calc button
  calcBtn: {
    height: 54, borderRadius: 18,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9,
  },
  calcBtnText: { color: COLORS.bg1, fontWeight: "900", fontSize: 15 },

  // ── Result card
  resultCard: {
    borderRadius: 22, borderWidth: 1,
    padding: 16, overflow: "hidden", gap: 12,
  },
  resultTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  resultIconWrap: {
    width: 50, height: 50, borderRadius: 16,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  resultLabel:  { fontWeight: "900", fontSize: 18, letterSpacing: 0.3 },
  resultAdvice: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 4, lineHeight: 17 },
  confRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  confBarBg: {
    flex: 1, height: 6, borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden",
  },
  confBarFill: { height: "100%", borderRadius: 99 },
  confText: { color: COLORS.muted, fontWeight: "800", fontSize: 11, minWidth: 30, textAlign: "right" },
  twinResultRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  twinResultText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  riskBanner: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(255,107,107,0.10)",
    borderWidth: 1, borderColor: "rgba(255,107,107,0.24)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  riskText: { color: COLORS.danger, fontWeight: "900", fontSize: 12 },
  dryBanner: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(255,170,90,0.10)",
    borderWidth: 1, borderColor: "rgba(255,170,90,0.24)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  dryText: { color: COLORS.warm, fontWeight: "900", fontSize: 12, flex: 1, lineHeight: 17 },

  // ── Insem card
  insemCard: {
    borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, overflow: "hidden",
  },
  insemTitle: { color: COLORS.muted, fontWeight: "800", fontSize: 12, marginBottom: 10 },
  insemRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  insemInput: {
    flex: 1, height: 44, borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    color: COLORS.text, fontWeight: "800", fontSize: 14,
  },
  insemBtn: { borderRadius: 12, overflow: "hidden" },
  insemBtnGrad: { height: 44, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  insemBtnText: { color: COLORS.bg1, fontWeight: "900", fontSize: 13 },

  // ── Save card
  saveCard: {
    borderRadius: 18, borderWidth: 1,
    borderColor: COLORS.border, padding: 14, overflow: "hidden",
  },
  noteInput: {
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: 10,
    color: COLORS.text, fontWeight: "700", fontSize: 13,
    textAlignVertical: "top", minHeight: 64,
  },
  saveBtn: {
    height: 52, borderRadius: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  saveBtnText: { color: COLORS.bg1, fontWeight: "900", fontSize: 15 },

  // ── Timeline
  timeline: { paddingLeft: 4 },
  tlRow: { flexDirection: "row", gap: 14 },
  tlLineWrap: { alignItems: "center", width: 14 },
  tlDot: {
    width: 12, height: 12, borderRadius: 99,
    marginTop: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 5,
    elevation: 3,
  },
  tlLine: { width: 2, flex: 1, marginTop: 4, marginBottom: 0, borderRadius: 99 },
  tlContent: { flex: 1, paddingBottom: 18 },
  tlTopRow: {
    flexDirection: "row", alignItems: "center",
    gap: 6, flexWrap: "wrap",
  },
  tlDate:   { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  tlResult: { fontWeight: "900", fontSize: 13 },
  tlConf:   { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  tlMethod: { color: "rgba(234,244,255,0.45)", fontWeight: "700", fontSize: 11, marginTop: 3 },
  tlTwin:   { color: COLORS.muted, fontWeight: "700", fontSize: 11, marginTop: 2 },
  tlNote:   {
    color: "rgba(234,244,255,0.45)", fontWeight: "700",
    fontSize: 12, marginTop: 4, lineHeight: 17,
  },
});
