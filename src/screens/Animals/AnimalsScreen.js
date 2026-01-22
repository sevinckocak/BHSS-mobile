import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  // HomeScreen’den filter ile gelebilirsin: navigation.navigate("TabAnimals", { filter: "sick" })
  const initialFilter = route?.params?.filter ?? "all";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  // ✅ Dummy hayvan listesi (Firestore’dan çekince bunu değiştirirsin)
  const animals = useMemo(
    () => [
      {
        id: "a1",
        tag: "TR-123456",
        name: "Sarı Kız",
        status: "healthy",
        group: "lactating",
        age: "3 yaş",
      },
      {
        id: "a2",
        tag: "TR-987654",
        name: "Boncuk",
        status: "sick",
        group: "dry",
        age: "4 yaş",
      },
      {
        id: "a3",
        tag: "TR-456789",
        name: "Kara",
        status: "healthy",
        group: "pregnant",
        age: "2 yaş",
      },
      {
        id: "a4",
        tag: "TR-222333",
        name: "Maviş",
        status: "healthy",
        group: "lactating",
        age: "5 yaş",
      },
      {
        id: "a5",
        tag: "TR-111222",
        name: "Papatya",
        status: "sick",
        group: "pregnant",
        age: "3 yaş",
      },
    ],
    []
  );

  const chips = useMemo(
    () => [
      { key: "all", label: "Tümü", tone: "default" },
      { key: "sick", label: "Hasta", tone: "danger" },
      { key: "pregnant", label: "Gebe", tone: "warn" },
      { key: "lactating", label: "Sağımda", tone: "accent" },
      { key: "dry", label: "Kuru", tone: "default" },
    ],
    []
  );

  const filteredAnimals = useMemo(() => {
    const q = query.trim().toLowerCase();

    return animals.filter((a) => {
      const matchQuery =
        !q ||
        a.tag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q);

      const matchFilter =
        filter === "all" ||
        (filter === "sick" && a.status === "sick") ||
        (filter === "pregnant" && a.group === "pregnant") ||
        (filter === "lactating" && a.group === "lactating") ||
        (filter === "dry" && a.group === "dry");

      return matchQuery && matchFilter;
    });
  }, [animals, query, filter]);

  const openAnimal = (item) => {
    // Detay ekranın varsa:
    // navigation.navigate("AnimalDetail", { animalId: item.id });
    // Şimdilik alert yerine console:
    console.log("Open animal:", item.id);
  };

  const goAddAnimal = () => {
    // Ekleme ekranın varsa:
    // navigation.navigate("AddAnimal");
    console.log("Add animal");
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
              {filteredAnimals.length} kayıt gösteriliyor
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={goAddAnimal}
          >
            <Ionicons name="add" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Küpe no veya isim ile ara (örn: TR-123456)"
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

        {/* LIST */}
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
              <Ionicons name="barcode-outline" size={30} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Kayıt bulunamadı</Text>
              <Text style={styles.emptyDesc}>
                Arama veya filtreyi değiştirip tekrar dene.
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={goAddAnimal}
        >
          <Ionicons name="add" size={24} color="#0B1220" />
        </TouchableOpacity>
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
  const statusPill =
    item.status === "sick"
      ? {
          label: "Hasta",
          bg: "rgba(255,107,107,0.18)",
          border: "rgba(255,107,107,0.28)",
        }
      : {
          label: "Sağlıklı",
          bg: "rgba(78,205,196,0.16)",
          border: "rgba(78,205,196,0.28)",
        };

  const groupLabel =
    item.group === "pregnant"
      ? "Gebe"
      : item.group === "lactating"
      ? "Sağımda"
      : item.group === "dry"
      ? "Kuru"
      : "—";

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name="paw-outline" size={18} color={COLORS.text} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.name} • {item.tag}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {groupLabel} • {item.age}
          </Text>
        </View>
      </View>

      <View style={styles.rowRight}>
        <View
          style={[
            styles.pill,
            { backgroundColor: statusPill.bg, borderColor: statusPill.border },
          ]}
        >
          <Text style={styles.pillText}>{statusPill.label}</Text>
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
