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

// 📌 Navigation: navigation.navigate("HeatDetection", { animalId })

const COLORS = {
  bg1: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  border: "rgba(255,255,255,0.14)",
  glass: "rgba(255,255,255,0.06)",
  glass2: "rgba(255,255,255,0.08)",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
  success: "#4ECDC4",
};

const SYMPTOMS = [
  { id: "jump_allow",  label: "Üzerine atlanmasına izin veriyor", points: 5 },
  { id: "jumps_other", label: "Diğer hayvanlara atlıyor",          points: 2 },
  { id: "restless",    label: "Huzursuz / hareketli",               points: 1 },
  { id: "bellowing",   label: "Sık böğürüyor",                      points: 1 },
  { id: "discharge",   label: "Vajinal akıntı var",                 points: 2 },
  { id: "milk_drop",   label: "Süt verimi düştü",                  points: 1 },
  { id: "appetite",    label: "İştah azaldı",                       points: 1 },
];

const MAX_SCORE = SYMPTOMS.reduce((s, x) => s + x.points, 0);

function calcResult(score) {
  if (score >= 6) return { label: "Kızgın",       tone: "success", icon: "checkmark-circle",  advice: "12 saat içinde tohumlama yapın.",     emoji: "✅" };
  if (score >= 3) return { label: "Şüpheli",      tone: "warm",    icon: "alert-circle",       advice: "24 saat içinde tekrar gözlem yapın.", emoji: "⚠️" };
  return          { label: "Kızgın Değil",         tone: "danger",  icon: "close-circle",       advice: "Belirtiler yetersiz, gözleme devam.",  emoji: "❌" };
}

function toneColor(tone) {
  if (tone === "success") return COLORS.success;
  if (tone === "warm")    return COLORS.warm;
  return COLORS.danger;
}

function toneBg(tone) {
  if (tone === "success") return "rgba(78,205,196,0.12)";
  if (tone === "warm")    return "rgba(255,170,90,0.12)";
  return "rgba(255,107,107,0.12)";
}

function toneBorder(tone) {
  if (tone === "success") return "rgba(78,205,196,0.28)";
  if (tone === "warm")    return "rgba(255,170,90,0.28)";
  return "rgba(255,107,107,0.28)";
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HeatDetectionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { animals } = useAnimals();
  const animalId = route?.params?.animalId;

  const animal = useMemo(
    () => (animals || []).find((a) => a.id === animalId) || null,
    [animals, animalId],
  );
  const tagNo = animal?.tagNo || animalId || "—";

  const [selected, setSelected] = useState(new Set());
  const [result, setResult]     = useState(null);
  const [note, setNote]         = useState("");
  const [history, setHistory]   = useState([]);
  const [showNote, setShowNote] = useState(false);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const storageKey = `estrus_history_${animalId}`;

  // ── Load history ─────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (raw) setHistory(JSON.parse(raw));
      })
      .catch(() => {});
  }, [storageKey]);

  // ── Toggle symptom ───────────────────────────────────────────────────────────
  const toggleSymptom = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // Clear result on change
    setResult(null);
    Animated.timing(resultAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  }, [resultAnim]);

  const score = useMemo(
    () => SYMPTOMS.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + s.points, 0),
    [selected],
  );

  // ── Calculate ────────────────────────────────────────────────────────────────
  const handleCalculate = useCallback(() => {
    const res = calcResult(score);
    setResult(res);
    setShowNote(false);
    Animated.spring(resultAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [score, resultAnim]);

  // ── Save record ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!result) return;
    const entry = {
      id:        Date.now().toString(),
      date:      new Date().toISOString(),
      score,
      result:    result.label,
      tone:      result.tone,
      emoji:     result.emoji,
      pct:       Math.round((score / MAX_SCORE) * 100),
      symptoms:  Array.from(selected),
      note:      note.trim(),
    };
    const next = [entry, ...history];
    setHistory(next);
    await AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
    setNote("");
    setShowNote(false);
    Alert.alert("Kaydedildi", "Kızgınlık tespiti geçmişe eklendi.");
  }, [result, score, selected, note, history, storageKey]);

  // ── Reminder ─────────────────────────────────────────────────────────────────
  const handleReminder = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    const label = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    Alert.alert("Hatırlatıcı Kuruldu", `21 gün sonra: ${label}`);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={["rgba(255,170,90,0.14)", "rgba(5,9,20,0.94)", COLORS.bg2]}
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
            <Text style={styles.topTitle} numberOfLines={1}>
              Kızgınlık Tespiti
            </Text>
            <Text style={styles.topSub}>{tagNo}</Text>
          </View>

          <View style={{ width: 42 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
        >
          {/* ── SEMPTOMlar ─────────────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sectionTitle}>Belirti Seçimi</Text>
              {selected.size > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selected.size}</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionSub}>
              Gözlemlediğiniz belirtileri işaretleyin
            </Text>
          </View>

          <BlurView intensity={16} tint="dark" style={styles.symptomCard}>
            {SYMPTOMS.map((s, idx) => {
              const active = selected.has(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.82}
                  onPress={() => toggleSymptom(s.id)}
                  style={[
                    styles.symptomRow,
                    idx < SYMPTOMS.length - 1 && styles.symptomRowBorder,
                    active && styles.symptomRowActive,
                  ]}
                >
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && (
                      <Ionicons name="checkmark" size={14} color={COLORS.bg1} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.symptomLabel,
                      active && styles.symptomLabelActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                  <View style={[styles.pointsBadge, active && styles.pointsBadgeActive]}>
                    <Text
                      style={[
                        styles.pointsText,
                        active && styles.pointsTextActive,
                      ]}
                    >
                      +{s.points}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </BlurView>

          {/* ── HESAPLA BUTONU ─────────────────────────────────────────────── */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleCalculate}
            style={{ marginTop: 14 }}
          >
            <LinearGradient
              colors={["#FFAA5A", "#FF8C2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.calcBtn}
            >
              <Ionicons name="pulse-outline" size={19} color={COLORS.bg1} />
              <Text style={styles.calcBtnText}>Kızgınlık Durumunu Hesapla</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── SONUÇ KARTI ────────────────────────────────────────────────── */}
          {result && (
            <Animated.View
              style={{
                opacity: resultAnim,
                transform: [
                  {
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
                marginTop: 16,
              }}
            >
              <BlurView intensity={20} tint="dark" style={[
                styles.resultCard,
                { borderColor: toneBorder(result.tone) },
              ]}>
                {/* Durum başlık */}
                <View style={styles.resultTop}>
                  <View style={[styles.resultIconWrap, { backgroundColor: toneBg(result.tone), borderColor: toneBorder(result.tone) }]}>
                    <Ionicons
                      name={result.icon}
                      size={26}
                      color={toneColor(result.tone)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultLabel, { color: toneColor(result.tone) }]}>
                      {result.emoji}  {result.label}
                    </Text>
                    <Text style={styles.resultAdvice}>{result.advice}</Text>
                  </View>
                </View>

                {/* Güven + Zaman */}
                <View style={styles.resultMeta}>
                  <View style={styles.resultMetaItem}>
                    <Ionicons name="analytics-outline" size={13} color={COLORS.muted} />
                    <Text style={styles.resultMetaText}>
                      Güven: %{Math.round((score / MAX_SCORE) * 100)}
                    </Text>
                  </View>
                  <View style={styles.resultMetaItem}>
                    <Ionicons name="time-outline" size={13} color={COLORS.muted} />
                    <Text style={styles.resultMetaText}>
                      {new Date().toLocaleString("tr-TR", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Skor bar */}
                <View style={styles.scoreBarWrap}>
                  <View style={styles.scoreBarBg}>
                    <LinearGradient
                      colors={
                        result.tone === "success"
                          ? ["#4ECDC4", "#1AB5AC"]
                          : result.tone === "warm"
                            ? ["#FFAA5A", "#FF8C2A"]
                            : ["#FF6B6B", "#E04545"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.scoreBarFill,
                        { width: `${Math.round((score / MAX_SCORE) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreText}>{score}/{MAX_SCORE}</Text>
                </View>

                {/* Not alanı */}
                {showNote ? (
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Not ekle (opsiyonel)…"
                    placeholderTextColor="rgba(234,244,255,0.28)"
                    multiline
                    numberOfLines={2}
                    style={styles.noteInput}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowNote(true)}
                    style={styles.addNoteBtn}
                  >
                    <Ionicons name="create-outline" size={14} color={COLORS.muted} />
                    <Text style={styles.addNoteText}>Not ekle</Text>
                  </TouchableOpacity>
                )}

                {/* Alt butonlar */}
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.resultActionBtn, { flex: 1, borderColor: toneBorder(result.tone), backgroundColor: toneBg(result.tone) }]}
                  >
                    <Ionicons name="save-outline" size={15} color={toneColor(result.tone)} />
                    <Text style={[styles.resultActionText, { color: toneColor(result.tone) }]}>
                      Kaydet
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleReminder}
                    style={[styles.resultActionBtn, styles.reminderBtn]}
                  >
                    <Ionicons name="notifications-outline" size={15} color={COLORS.muted} />
                    <Text style={styles.reminderText}>21 Gün Sonra Hatırlat</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          )}

          {/* ── GEÇMİŞ ─────────────────────────────────────────────────────── */}
          {history.length > 0 && (
            <>
              <View style={[styles.sectionHead, { marginTop: 22 }]}>
                <Text style={styles.sectionTitle}>Geçmiş Kayıtlar</Text>
                <Text style={styles.sectionSub}>{history.length} tespit</Text>
              </View>

              <View style={styles.historyList}>
                {history.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

// ── HistoryRow ────────────────────────────────────────────────────────────────

function HistoryRow({ entry }) {
  const dateLabel = new Date(entry.date).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <View style={[styles.historyRow, { borderLeftColor: toneColor(entry.tone) }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.historyTop}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
          <Text style={styles.historyDate}>{dateLabel}</Text>
          <Text style={[styles.historyResult, { color: toneColor(entry.tone) }]}>
            {entry.emoji} {entry.result}
          </Text>
          <Text style={styles.historyPct}>(%{entry.pct})</Text>
        </View>
        {!!entry.note && (
          <Text style={styles.historyNote} numberOfLines={2}>
            Not: {entry.note}
          </Text>
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
    marginTop: 1,
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

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 99,
    backgroundColor: COLORS.warm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: COLORS.bg1, fontSize: 11, fontWeight: "900" },

  // ── Symptom card
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
    paddingVertical: 14,
  },
  symptomRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  symptomRowActive: {
    backgroundColor: "rgba(255,170,90,0.07)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.warm,
    borderColor: COLORS.warm,
  },
  symptomLabel: {
    flex: 1,
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 13,
  },
  symptomLabelActive: { color: COLORS.text },
  pointsBadge: {
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsBadgeActive: {
    borderColor: "rgba(255,170,90,0.35)",
    backgroundColor: "rgba(255,170,90,0.12)",
  },
  pointsText: { color: COLORS.muted, fontSize: 11, fontWeight: "900" },
  pointsTextActive: { color: COLORS.warm },

  // ── Calc button
  calcBtn: {
    height: 54,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  calcBtnText: {
    color: COLORS.bg1,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // ── Result card
  resultCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    gap: 12,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  resultIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: {
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.3,
  },
  resultAdvice: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  resultMeta: {
    flexDirection: "row",
    gap: 16,
  },
  resultMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  resultMetaText: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  // ── Score bar
  scoreBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scoreBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 99,
  },
  scoreText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 11,
    minWidth: 28,
    textAlign: "right",
  },

  // ── Note
  noteInput: {
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: 10,
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 13,
    textAlignVertical: "top",
    minHeight: 64,
  },
  addNoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  addNoteText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
  },

  // ── Result action buttons
  resultActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  resultActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  resultActionText: {
    fontWeight: "900",
    fontSize: 13,
  },
  reminderBtn: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  reminderText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
  },

  // ── History
  historyList: { gap: 10 },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  historyDate: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  historyResult: {
    fontWeight: "900",
    fontSize: 13,
  },
  historyPct: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  historyNote: {
    color: "rgba(234,244,255,0.45)",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
});
