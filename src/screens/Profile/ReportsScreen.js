import React, { useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAnimals } from "../../context/AnimalsContext";
import { getAnimalAgeMonths, formatAgeMonths } from "../../utils/animalAge";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF",
  warm: "#FFAA5A", danger: "#FF6B6B", success: "#32D583", purple: "#B794F6",
};

function parseDateFlexible(val) {
  if (!val) return null;
  if (typeof val === "object" && typeof val?.toDate === "function") {
    const d = val.toDate(); return isNaN(d) ? null : d;
  }
  const s = String(val).trim();
  let d = new Date(s);
  if (!isNaN(d)) return d;
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) { d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])); return isNaN(d) ? null : d; }
  return null;
}

export default function ReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { animals, loadingAnimals } = useAnimals();

  const report = useMemo(() => {
    const list = Array.isArray(animals) ? animals : [];
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 86400000);

    let sick = [], pregnant = [], vacUpcoming = [], healthy = 0;

    for (const a of list) {
      const isSick = a.isSick === true || /hasta|sick/i.test(a.healthStatus ?? a.status ?? "");
      const isPreg = a.isPregnant === true || /gebe|pregnant/i.test(a.healthStatus ?? a.status ?? "");
      const hasVac = (a.vaccines ?? []).some((v) => {
        const d = parseDateFlexible(v?.date);
        return d && d >= now && d <= in14;
      });

      if (isSick) sick.push(a);
      else if (isPreg) pregnant.push(a);
      else healthy++;
      if (hasVac) vacUpcoming.push(a);
    }

    return {
      total: list.length, sick, pregnant, healthy,
      vacUpcoming, attention: [...sick, ...vacUpcoming.filter(a => !sick.includes(a))],
    };
  }, [animals]);

  const stats = [
    { label: "Toplam",     value: report.total,           color: C.accent,   icon: "paw-outline" },
    { label: "Sağlıklı",   value: report.healthy,         color: C.success,  icon: "heart-outline" },
    { label: "Hasta",      value: report.sick.length,     color: C.danger,   icon: "medical-outline" },
    { label: "Gebe",       value: report.pregnant.length, color: C.warm,     icon: "egg-outline" },
    { label: "Aşı Yakın",  value: report.vacUpcoming.length, color: C.purple, icon: "shield-checkmark-outline" },
  ];

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rapor Arşivi</Text>
        <View style={{ width: 42 }} />
      </View>

      {loadingAnimals ? (
        <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === "ios" ? 36 : 22 }]}
        >
          {/* Özet kartlar */}
          <Text style={styles.sLabel}>Sürü Özeti</Text>
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.statCard, { borderColor: `${s.color}30` }]}>
                <View style={[styles.statIcon, { backgroundColor: `${s.color}18` }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Dikkat gerektiren hayvanlar */}
          {report.attention.length > 0 && (
            <>
              <Text style={[styles.sLabel, { marginTop: 4 }]}>Dikkat Gerektiren Hayvanlar</Text>
              <View style={styles.attentionList}>
                {report.attention.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.animalRow}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate("AnimalDetail", { animalId: a.id })}
                  >
                    <View style={styles.animalIcon}>
                      <Ionicons name="paw-outline" size={16} color={C.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.animalName}>
                        {a.name || "İsimsiz"} • {a.tagNo || "—"}
                      </Text>
                      <Text style={styles.animalSub}>
                        {formatAgeMonths(getAnimalAgeMonths(a.birthDate))} • {a.gender ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.pillWrap}>
                      {(a.isSick || /hasta|sick/i.test(a.healthStatus ?? "")) && (
                        <View style={[styles.pill, { backgroundColor: "rgba(255,107,107,0.18)", borderColor: "rgba(255,107,107,0.3)" }]}>
                          <Text style={[styles.pillText, { color: C.danger }]}>Hasta</Text>
                        </View>
                      )}
                      {report.vacUpcoming.includes(a) && (
                        <View style={[styles.pill, { backgroundColor: "rgba(183,148,246,0.15)", borderColor: "rgba(183,148,246,0.3)" }]}>
                          <Text style={[styles.pillText, { color: C.purple }]}>Aşı</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(234,244,255,0.28)" />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {report.attention.length === 0 && report.total > 0 && (
            <View style={styles.allGoodCard}>
              <Ionicons name="checkmark-circle" size={32} color={C.success} />
              <Text style={styles.allGoodText}>Sürünüzde dikkat gerektiren hayvan yok.</Text>
            </View>
          )}

          {report.total === 0 && (
            <View style={styles.center}>
              <Ionicons name="paw-outline" size={44} color="rgba(234,244,255,0.15)" />
              <Text style={styles.emptyText}>Henüz hayvan kaydı yok.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, color: C.text, fontSize: 16, fontWeight: "900", textAlign: "center" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: C.muted, fontSize: 13, fontWeight: "700" },

  scroll: { paddingHorizontal: 16 },
  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 10, letterSpacing: 0.2 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  statCard: {
    width: "30%", flexGrow: 1, padding: 14, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, alignItems: "center", gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: "800" },

  attentionList: {
    borderRadius: 16, backgroundColor: C.card, borderWidth: 1,
    borderColor: C.border, overflow: "hidden",
  },
  animalRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: C.border,
  },
  animalIcon: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(183,148,246,0.14)", alignItems: "center", justifyContent: "center",
  },
  animalName: { color: C.text, fontWeight: "800", fontSize: 13 },
  animalSub: { color: C.muted, fontWeight: "700", fontSize: 11, marginTop: 1 },
  pillWrap: { flexDirection: "row", gap: 5 },
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  pillText: { fontSize: 10, fontWeight: "800" },

  allGoodCard: {
    alignItems: "center", gap: 10, padding: 24,
    borderRadius: 16, backgroundColor: "rgba(50,213,131,0.07)",
    borderWidth: 1, borderColor: "rgba(50,213,131,0.18)",
  },
  allGoodText: { color: C.text, fontWeight: "800", fontSize: 13, textAlign: "center", lineHeight: 20 },
});
