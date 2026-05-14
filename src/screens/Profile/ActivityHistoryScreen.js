import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivities } from "../../context/ActivitiesContext";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF", warm: "#FFAA5A",
  success: "#32D583", danger: "#FF6B6B", purple: "#B794F6",
};

const TYPE_META = {
  chat:        { icon: "chatbubble-ellipses-outline", color: C.accent,   label: "Mesaj" },
  appointment: { icon: "calendar-outline",            color: C.warm,     label: "Randevu" },
  vaccine:     { icon: "shield-checkmark-outline",    color: C.success,  label: "Aşı" },
  animal:      { icon: "paw-outline",                 color: C.purple,   label: "Hayvan" },
  general:     { icon: "flash-outline",               color: "rgba(234,244,255,0.3)", label: "Genel" },
};

const FILTERS = [
  { key: "all",         label: "Tümü" },
  { key: "animal",      label: "Hayvan" },
  { key: "vaccine",     label: "Aşı" },
  { key: "appointment", label: "Randevu" },
  { key: "chat",        label: "Mesaj" },
];

function fmtDate(val) {
  if (!val) return "";
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d)) return "";
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)   return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function ActivityHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { activities, loadingActivities } = useActivities();
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    if (activeFilter === "all") return activities;
    return activities.filter((a) => a.type === activeFilter);
  }, [activities, activeFilter]);

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Geçmiş Kayıtlar</Text>
          {!loadingActivities && (
            <Text style={styles.headerSub}>{filtered.length} aktivite</Text>
          )}
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* Filtre chips */}
      <View style={styles.filtersWrap}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilter === f.key && styles.chipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingActivities ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={44} color="rgba(234,244,255,0.15)" />
          <Text style={styles.emptyText}>Aktivite bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListFooterComponent={<View style={{ height: Platform.OS === "ios" ? 32 : 20 }} />}
          renderItem={({ item }) => <ActivityItem item={item} navigation={navigation} />}
        />
      )}
    </LinearGradient>
  );
}

function ActivityItem({ item, navigation }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.general;
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.88}
      onPress={() => item.route && navigation.navigate(item.route, item.routeParams ?? {})}
    >
      <View style={[styles.itemIcon, { backgroundColor: `${meta.color}20` }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        {!!item.meta && <Text style={styles.itemMeta} numberOfLines={1}>{item.meta}</Text>}
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTime}>{fmtDate(item.createdAt)}</Text>
        {!!item.route && (
          <Ionicons name="chevron-forward" size={14} color="rgba(234,244,255,0.28)" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: "900" },
  headerSub: { color: C.muted, fontSize: 11, fontWeight: "700", marginTop: 1 },

  filtersWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: "rgba(123,190,255,0.15)", borderColor: "rgba(123,190,255,0.35)" },
  chipText: { color: C.muted, fontWeight: "800", fontSize: 12 },
  chipTextActive: { color: C.accent },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: C.muted, fontSize: 13, fontWeight: "700" },

  list: { paddingHorizontal: 16 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderRadius: 16, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  itemIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: C.text, fontWeight: "800", fontSize: 13 },
  itemMeta: { color: C.muted, fontWeight: "700", fontSize: 11, marginTop: 2 },
  itemRight: { alignItems: "flex-end", gap: 3 },
  itemTime: { color: "rgba(234,244,255,0.3)", fontSize: 10, fontWeight: "700" },
});
