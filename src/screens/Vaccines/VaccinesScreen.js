import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.65)",
  warn: "#FFAA5A",
  success: "#4ECDC4",
};

const DUMMY_VACCINES = [
  { id: "v1", name: "Şap Aşısı", date: "25 Aralık", status: "upcoming" },
  { id: "v2", name: "Brucella", date: "10 Ocak", status: "upcoming" },
  { id: "v3", name: "Çiçek Aşısı", date: "12 Kasım", status: "done" },
];

export default function VaccinesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + 8,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <Text style={styles.title}>Aşılar</Text>
        <Text style={styles.subtitle}>Yaklaşan ve geçmiş aşılar</Text>

        <FlatList
          data={DUMMY_VACCINES}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <VaccineRow item={item} />}
        />
      </View>
    </LinearGradient>
  );
}

function VaccineRow({ item }) {
  const upcoming = item.status === "upcoming";

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSub}>{item.date}</Text>
      </View>

      <View
        style={[
          styles.badge,
          {
            backgroundColor: upcoming
              ? "rgba(255,170,90,0.18)"
              : "rgba(78,205,196,0.18)",
            borderColor: upcoming ? COLORS.warn : COLORS.success,
          },
        ]}
      >
        <Ionicons
          name={upcoming ? "time-outline" : "checkmark-circle-outline"}
          size={14}
          color={upcoming ? COLORS.warn : COLORS.success}
        />
        <Text
          style={[
            styles.badgeText,
            { color: upcoming ? COLORS.warn : COLORS.success },
          ]}
        >
          {upcoming ? "Yaklaşan" : "Yapıldı"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  cardSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
});
