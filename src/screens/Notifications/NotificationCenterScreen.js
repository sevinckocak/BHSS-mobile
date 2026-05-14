import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotificationsList } from "../../hooks/useNotificationsList";
import { useAnimals } from "../../context/AnimalsContext";
import { useActivities } from "../../context/ActivitiesContext";
import { getAllUpcomingVaccines } from "../../utils/vaccineScheduler";
import { timeAgoTR } from "../../utils/timeAgo";

const C = {
  bg:      "#050914",
  bg2:     "#070B12",
  text:    "#EAF4FF",
  muted:   "rgba(234,244,255,0.55)",
  border:  "rgba(255,255,255,0.10)",
  card:    "rgba(255,255,255,0.04)",
  warm:    "#FFAA5A",
  danger:  "#FF6B6B",
  success: "#4ECDC4",
  accent:  "#7BBEFF",
  purple:  "#B794F6",
};

// Firestore data.screen → görsel konfigürasyon
function getNotifConfig(data = {}) {
  const screen = data?.screen || "";
  if (screen === "Calendar" || screen === "VetCalendar") {
    return { icon: "calendar-outline", color: C.warm, label: "Randevu" };
  }
  if (screen === "ChatRoom" || screen === "VetChatRoom") {
    return { icon: "chatbubble-ellipses-outline", color: C.accent, label: "Mesaj" };
  }
  if (screen === "VaccinesScreen") {
    return { icon: "bandage-outline", color: C.success, label: "Aşı" };
  }
  return { icon: "notifications-outline", color: C.muted, label: "Bildirim" };
}

export default function NotificationCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { uid } = useActivities();
  const { items, unreadCount, markAsRead, markAllRead, loading } =
    useNotificationsList(uid);
  const { animals } = useAnimals();

  // ── Aşı hatırlatıcıları (local, animals state'inden) ─────────────────────
  const vaccineReminders = useMemo(() => {
    return getAllUpcomingVaccines(animals).filter(
      (v) => v.status === "overdue" || v.status === "today" || v.status === "upcoming",
    );
  }, [animals]);

  // ── Firestore bildirimine tıklama ─────────────────────────────────────────
  const handleItemPress = useCallback(
    async (item) => {
      if (!item.isRead) await markAsRead(item.id);

      const data = item.data || {};
      const screen = data.screen;
      if (!screen) return;

      try {
        switch (screen) {
          case "Calendar":
            navigation.navigate("Calendar");
            break;
          case "VetCalendar":
            navigation.navigate("VetCalendar");
            break;
          case "ChatRoom":
            if (data.chatId)
              navigation.navigate("ChatRoom", {
                chatId:      data.chatId,
                otherName:   data.otherName,
                otherUserId: data.otherUserId,
              });
            break;
          case "VetChatRoom":
            if (data.chatId)
              navigation.navigate("VetChatRoom", {
                chatId:      data.chatId,
                otherName:   data.otherName,
                otherUserId: data.otherUserId,
              });
            break;
          case "VaccinesScreen":
            navigation.navigate("VaccinesScreen", { animalId: data.animalId });
            break;
          default:
            break;
        }
      } catch (e) {
        console.warn("[NotificationCenter] navigation:", e?.message);
      }
    },
    [markAsRead, navigation],
  );

  // ── Aşı satırına tıklama ──────────────────────────────────────────────────
  const handleVaccinePress = useCallback(
    (item) => {
      navigation.navigate("VaccinesScreen", { animalId: item.animalId });
    },
    [navigation],
  );

  const isEmpty = !loading && items.length === 0 && vaccineReminders.length === 0;

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>

        {/* ── TOP BAR ────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.9}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>Bildirimler</Text>
            {unreadCount > 0 && (
              <Text style={styles.topSub}>{unreadCount} okunmamış</Text>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.readAllBtn}
              onPress={markAllRead}
              activeOpacity={0.85}
            >
              <Text style={styles.readAllText}>Tümünü oku</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── İÇERİK ─────────────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={C.warm} />
          </View>
        ) : isEmpty ? (
          <View style={styles.centered}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="rgba(234,244,255,0.15)"
            />
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptyDesc}>
              Mesaj, randevu veya aşı hatırlatıcısı geldiğinde burada görünecek
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 16) + 24,
              gap: 6,
            }}
          >
            {/* ── AŞI HATIRLATICI BÖLÜMÜ ─────────────────────────────────── */}
            {vaccineReminders.length > 0 && (
              <>
                <SectionHeader
                  icon="bandage-outline"
                  title="Aşı Hatırlatıcıları"
                  count={vaccineReminders.length}
                  color={C.success}
                />
                {vaccineReminders.map((v) => (
                  <VaccineRow
                    key={v.animalId + v.vaccineId}
                    item={v}
                    onPress={() => handleVaccinePress(v)}
                  />
                ))}
              </>
            )}

            {/* ── FİRESTORE BİLDİRİMLERİ ─────────────────────────────────── */}
            {items.length > 0 && (
              <>
                <SectionHeader
                  icon="notifications-outline"
                  title="Mesajlar & Randevular"
                  count={items.filter((i) => !i.isRead).length || null}
                  color={C.accent}
                  style={vaccineReminders.length > 0 ? { marginTop: 8 } : undefined}
                />
                {items.map((item) => (
                  <FirestoreRow
                    key={item.id}
                    item={item}
                    onPress={() => handleItemPress(item)}
                  />
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, color, style }) {
  return (
    <View style={[styles.sectionHead, style]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {!!count && (
        <View style={[styles.countBadge, { backgroundColor: color + "28" }]}>
          <Text style={[styles.countBadgeText, { color }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ── VaccineRow ────────────────────────────────────────────────────────────────

function VaccineRow({ item, onPress }) {
  const urgencyIcon =
    item.status === "overdue" ? "alert-circle" : "time-outline";

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <BlurView intensity={14} tint="dark" style={styles.row}>
        {/* Colored left stripe */}
        <View style={[styles.stripe, { backgroundColor: item.color }]} />

        <View style={[styles.rowIcon, { backgroundColor: item.color + "18", borderColor: item.color + "40" }]}>
          <Ionicons name="bandage-outline" size={18} color={item.color} />
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.animalName}
              {item.animalTag ? ` · ${item.animalTag}` : ""}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: item.color + "22" }]}>
              <Ionicons name={urgencyIcon} size={10} color={item.color} />
              <Text style={[styles.typeBadgeText, { color: item.color }]}>
                {item.label}
              </Text>
            </View>
          </View>
          <Text style={styles.rowBody} numberOfLines={1}>
            {item.vaccineType} · {item.nextDate}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={14} color="rgba(234,244,255,0.25)" />
      </BlurView>
    </TouchableOpacity>
  );
}

// ── FirestoreRow ──────────────────────────────────────────────────────────────

function FirestoreRow({ item, onPress }) {
  const cfg = getNotifConfig(item.data);
  const timeStr = item.createdAt ? timeAgoTR(item.createdAt.getTime()) : "";

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <BlurView
        intensity={14}
        tint="dark"
        style={[styles.row, !item.isRead && styles.rowUnread]}
      >
        {/* Unread dot stripe */}
        {!item.isRead && (
          <View style={[styles.stripe, { backgroundColor: cfg.color }]} />
        )}

        <View
          style={[
            styles.rowIcon,
            { backgroundColor: cfg.color + "18", borderColor: cfg.color + "40" },
          ]}
        >
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text
              style={[styles.rowTitle, !item.isRead && { color: "#EAF4FF" }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: cfg.color + "22" }]}>
              <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
                {cfg.label}
              </Text>
            </View>
          </View>
          <Text style={styles.rowBody} numberOfLines={2}>
            {item.body}
          </Text>
          {!!timeStr && <Text style={styles.rowTime}>{timeStr}</Text>}
        </View>

        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />
        )}
      </BlurView>
    </TouchableOpacity>
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
    marginBottom: 16,
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
  topTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  topSub: {
    color: C.warm,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 1,
  },
  readAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  readAllText: { color: C.muted, fontSize: 12, fontWeight: "800" },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { color: "rgba(234,244,255,0.40)", fontWeight: "900", fontSize: 15 },
  emptyDesc: {
    color: "rgba(234,244,255,0.25)",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionTitle: { fontWeight: "900", fontSize: 12, letterSpacing: 0.3 },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countBadgeText: { fontSize: 10, fontWeight: "900" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    overflow: "hidden",
    paddingVertical: 12,
    paddingRight: 14,
    gap: 10,
  },
  rowUnread: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  stripe: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    marginLeft: 10,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    color: "rgba(234,244,255,0.80)",
    fontWeight: "800",
    fontSize: 13,
  },
  rowBody: {
    color: "rgba(234,244,255,0.50)",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 17,
  },
  rowTime: {
    color: "rgba(234,244,255,0.30)",
    fontWeight: "700",
    fontSize: 11,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    flexShrink: 0,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "900" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
