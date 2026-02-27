import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnimals } from "../../context/AnimalsContext"; // ✅ yolu düzelt

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  card: "rgba(255,255,255,0.05)",
  card2: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  accent: "#7BBEFF",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
  success: "#4ECDC4",
  purple: "#B794F6",
};

export default function AnimalsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const { animals, loadingAnimals, animalsError } = useAnimals();

  const initialFilter = route?.params?.filter ?? "all";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    if (route?.params?.filter) setFilter(route.params.filter);
  }, [route?.params?.filter]);

  const chips = useMemo(
    () => [
      { key: "all", label: "Tümü", tone: "default" },
      { key: "female", label: "Dişi", tone: "accent" },
      { key: "male", label: "Erkek", tone: "default" },
      { key: "calf", label: "Buzağı", tone: "warn" },
      { key: "sick", label: "Hasta", tone: "danger" }, // sende healthStatus yoksa bu chip boş kalır
    ],
    [],
  );

  const filteredAnimals = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (animals || []).filter((a) => {
      const tag = String(a.tagNo || "").toLowerCase();
      const name = String(a.name || "").toLowerCase();

      const matchQuery = !q || tag.includes(q) || name.includes(q);

      const matchFilter =
        filter === "all" ||
        (filter === "female" && a.gender === "Dişi") ||
        (filter === "male" && a.gender === "Erkek") ||
        (filter === "calf" && a.status === "Buzağı") ||
        (filter === "sick" &&
          (a.healthStatus === "sick" || a.status === "Hasta"));

      return matchQuery && matchFilter;
    });
  }, [animals, query, filter]);

  const openAnimal = (item) => {
    navigation.navigate("AnimalDetail", { animalId: item.id });
    console.log("Open animal:", item.id);
  };

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + 8,
            paddingBottom: Math.max(insets.bottom, 10) + 12,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hayvanlar</Text>
            <Text style={styles.subtitle}>
              {loadingAnimals
                ? "Yükleniyor..."
                : `${filteredAnimals.length} kayıt`}
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Küpe no veya isim ile ara"
            placeholderTextColor="rgba(234,244,255,0.35)"
            style={styles.searchInput}
            autoCapitalize="characters"
          />
          {!!query && (
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.9}
              onPress={() => setQuery("")}
            >
              <Ionicons name="close" size={16} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER CHIPS */}
        <View style={styles.chipsRow}>
          {chips.map((c) => (
            <FilterChip
              key={c.key}
              label={c.label}
              tone={c.tone}
              active={filter === c.key}
              onPress={() => setFilter(c.key)}
            />
          ))}
        </View>

        {/* ERROR */}
        {!!animalsError && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={COLORS.danger}
            />
            <Text style={styles.errorText}>
              Hayvanlar yüklenemedi:{" "}
              {animalsError?.message || "Bilinmeyen hata"}
            </Text>
          </View>
        )}

        {/* LIST */}
        {loadingAnimals ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Hayvanlar getiriliyor...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAnimals}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 6, paddingBottom: 80 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <AnimalRow item={item} onPress={() => openAnimal(item)} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="barcode-outline"
                  size={30}
                  color={COLORS.muted}
                />
                <Text style={styles.emptyTitle}>Kayıt bulunamadı</Text>
                <Text style={styles.emptyDesc}>
                  Arama veya filtreyi değiştirip tekrar dene.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

function FilterChip({ label, tone, active, onPress }) {
  const toneStyle =
    tone === "warn"
      ? { borderColor: "rgba(255,170,90,0.30)" }
      : tone === "danger"
        ? { borderColor: "rgba(255,107,107,0.30)" }
        : tone === "accent"
          ? { borderColor: "rgba(123,190,255,0.30)" }
          : { borderColor: "rgba(255,255,255,0.12)" };

  const activeBg =
    tone === "warn"
      ? "rgba(255,170,90,0.20)"
      : tone === "danger"
        ? "rgba(255,107,107,0.20)"
        : tone === "accent"
          ? "rgba(123,190,255,0.18)"
          : "rgba(255,255,255,0.10)";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.chip, toneStyle, active && { backgroundColor: activeBg }]}
    >
      <Text style={[styles.chipText, active && { color: COLORS.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AnimalRow({ item, onPress }) {
  const tag = item.tagNo || "-";
  const name = item.name || "İsimsiz";

  const gender = item.gender || "—";
  const status = item.status || "—";
  const age = item.ageMonths != null ? `${item.ageMonths} ay` : item.age || "—";

  // hasta/sağlıklı pill (yoksa default “—”)
  const isSick = item.healthStatus === "sick" || item.status === "Hasta";
  const pill =
    item.healthStatus || item.status
      ? isSick
        ? {
            label: "Hasta",
            bg: "rgba(255,107,107,0.18)",
            border: "rgba(255,107,107,0.28)",
          }
        : {
            label: "Aktif",
            bg: "rgba(78,205,196,0.16)",
            border: "rgba(78,205,196,0.28)",
          }
      : {
          label: "—",
          bg: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.12)",
        };

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name="paw-outline" size={18} color={COLORS.text} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {name} • {tag}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {status} • {gender} • {age}
          </Text>
        </View>
      </View>

      <View style={styles.rowRight}>
        <View
          style={[
            styles.pill,
            { backgroundColor: pill.bg, borderColor: pill.border },
          ]}
        >
          <Text style={styles.pillText}>{pill.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: {
    color: COLORS.muted,
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },
  chipText: {
    color: "rgba(234,244,255,0.70)",
    fontWeight: "900",
    fontSize: 12,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.25)",
    backgroundColor: "rgba(255,107,107,0.10)",
    marginTop: 6,
    marginBottom: 6,
  },
  errorText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 30,
  },
  loadingText: { color: COLORS.muted, fontWeight: "800" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(183,148,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(183,148,246,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  rowSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  rowRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { color: COLORS.text, fontSize: 11, fontWeight: "900" },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
  },
  emptyDesc: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  fab: {
    position: "absolute",
    right: 16,
    bottom: Platform.OS === "ios" ? 22 : 18,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.warm,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
