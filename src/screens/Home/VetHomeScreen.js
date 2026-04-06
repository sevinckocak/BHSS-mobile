import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVetAuth } from "../../context/VetAuthContext";

const COLORS = {
  bg: "#070B12",
  bg2: "#0B1220",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.60)",
  soft: "rgba(234,244,255,0.35)",
  active: "#FFAA5A",
  accent: "#7BBEFF",
  success: "#32D583",
  danger: "#FF5D73",
  purple: "#A970FF",
  cyan: "#2DD4BF",
  warning: "#FDBA74",
  track: "rgba(255,255,255,0.08)",
};

export default function VetHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vetProfile } = useVetAuth();

  const vetName = vetProfile?.fullName || "Veteriner";

  const weeklyVisits = useMemo(
    () => [
      { day: "Pzt", value: 4 },
      { day: "Sal", value: 6 },
      { day: "Çar", value: 3 },
      { day: "Per", value: 8 },
      { day: "Cum", value: 5 },
      { day: "Cmt", value: 2 },
      { day: "Paz", value: 1 },
    ],
    [],
  );

  const monthStats = useMemo(
    () => ({
      totalFarmers: 94,
      totalAppointments: 38,
      completedAppointments: 29,
      pendingAppointments: 6,
      canceledAppointments: 3,
      pendingRequests: 5,
      acceptedRequests: 18,
      rejectedRequests: 4,
      unreadMessages: 7,
    }),
    [],
  );

  const todaySummary = useMemo(
    () => [
      {
        id: "1",
        title: "Bugünkü Randevu",
        value: "8",
        icon: "calendar-outline",
        color: COLORS.active,
      },
      {
        id: "2",
        title: "Bekleyen Talep",
        value: "5",
        icon: "person-add-outline",
        color: COLORS.accent,
      },
      {
        id: "3",
        title: "Okunmamış Mesaj",
        value: "7",
        icon: "chatbubble-ellipses-outline",
        color: COLORS.purple,
      },
    ],
    [],
  );

  const activities = useMemo(
    () => [
      "Hasan Çelik yeni randevu talebi gönderdi.",
      "Ayşe Demir ile saha görüşmesi tamamlandı.",
      "2 yeni mesaj alındı.",
    ],
    [],
  );

  const weeklyMax = Math.max(...weeklyVisits.map((i) => i.value), 1);

  const completionPct = Math.round(
    (monthStats.completedAppointments / monthStats.totalAppointments) * 100,
  );

  const requestTotal =
    monthStats.pendingRequests +
    monthStats.acceptedRequests +
    monthStats.rejectedRequests;

  const acceptedPct = Math.round(
    (monthStats.acceptedRequests / requestTotal) * 100,
  );
  const pendingPct = Math.round(
    (monthStats.pendingRequests / requestTotal) * 100,
  );
  const rejectedPct = Math.round(
    (monthStats.rejectedRequests / requestTotal) * 100,
  );

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 10) + 8 },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hoş geldin,</Text>
            <Text style={styles.name}>{vetName}</Text>
            <Text style={styles.sub}>
              Bugünkü panelin özet görünümü burada.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.9}
            onPress={() => navigation?.navigate?.("VetNotifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={COLORS.text}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* MINI SUMMARY */}
        <View style={styles.summaryRow}>
          {todaySummary.map((item) => (
            <View key={item.id} style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIconWrap,
                  { backgroundColor: `${item.color}22` },
                ]}
              >
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.title}</Text>
            </View>
          ))}
        </View>

        {/* MAIN CHART */}
        <Text style={styles.sectionTitle}>Haftalık Görüşme Grafiği</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Günlük Çiftçi Görüşmeleri</Text>
              <Text style={styles.chartSub}>Son 7 gün</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation?.navigate?.("VetCalendar")}
            >
              <Text style={styles.link}>Takvim</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.barChartWrap}>
            {weeklyVisits.map((item) => {
              const barHeight = Math.max((item.value / weeklyMax) * 120, 12);

              return (
                <View key={item.day} style={styles.barItem}>
                  <Text style={styles.barValue}>{item.value}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor:
                            item.value >= 6 ? COLORS.active : COLORS.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* TWO GRAPHIC CARDS */}
        <View style={styles.doubleRow}>
          {/* APPOINTMENT STATUS */}
          <View style={[styles.halfCard, { marginRight: 10 }]}>
            <Text style={styles.cardTitle}>Randevu Durumu</Text>
            <Text style={styles.cardSub}>Bu ay</Text>

            <View style={styles.ringWrap}>
              <View style={styles.ringOuter}>
                <View style={styles.ringInner}>
                  <Text style={styles.ringValue}>%{completionPct}</Text>
                  <Text style={styles.ringLabel}>Tamamlanan</Text>
                </View>
              </View>
            </View>

            <View style={styles.legendList}>
              <Legend
                color={COLORS.success}
                label="Tamamlanan"
                value={monthStats.completedAppointments}
              />
              <Legend
                color={COLORS.warning}
                label="Bekleyen"
                value={monthStats.pendingAppointments}
              />
              <Legend
                color={COLORS.danger}
                label="İptal"
                value={monthStats.canceledAppointments}
              />
            </View>
          </View>

          {/* REQUEST STATUS */}
          <View style={styles.halfCard}>
            <Text style={styles.cardTitle}>Farmer Talepleri</Text>
            <Text style={styles.cardSub}>Bu ay</Text>

            <View style={{ marginTop: 14 }}>
              <ProgressRow
                label="Kabul"
                value={acceptedPct}
                color={COLORS.success}
              />
              <ProgressRow
                label="Bekliyor"
                value={pendingPct}
                color={COLORS.warning}
              />
              <ProgressRow
                label="Reddedildi"
                value={rejectedPct}
                color={COLORS.danger}
              />
            </View>

            <View style={styles.requestMiniStats}>
              <MiniNumber label="Toplam" value={requestTotal} />
              <MiniNumber label="Aktif" value={monthStats.pendingRequests} />
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Hızlı Geçiş</Text>
        <View style={styles.quickRow}>
          <QuickButton
            icon="calendar-outline"
            label="Randevular"
            onPress={() => navigation?.navigate?.("VetCalendar")}
          />
          <QuickButton
            icon="chatbubble-ellipses-outline"
            label="Mesajlar"
            onPress={() => navigation?.navigate?.("VetMessages")}
          />
          <QuickButton
            icon="settings-outline"
            label="Ayarlar"
            onPress={() => navigation?.navigate?.("VetProfile")}
          />
        </View>

        {/* ACTIVITIES */}
        <Text style={styles.sectionTitle}>Kısa Aktiviteler</Text>
        <View style={styles.activityCard}>
          {activities.map((item, index) => (
            <View
              key={index}
              style={[
                styles.activityRow,
                index !== activities.length - 1 && styles.activityBorder,
              ]}
            >
              <View style={styles.activityDot} />
              <Text style={styles.activityText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: Platform.OS === "ios" ? 40 : 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function QuickButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickBtn}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={COLORS.text} />
      <Text style={styles.quickBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Legend({ color, label, value }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function ProgressRow({ label, value, color }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>%{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function MiniNumber({ label, value }) {
  return (
    <View style={styles.miniNumber}>
      <Text style={styles.miniNumberValue}>{value}</Text>
      <Text style={styles.miniNumberLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  greeting: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  name: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  sub: {
    color: COLORS.soft,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: 8,
    top: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  summaryCard: {
    width: "31.5%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  summaryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  link: {
    color: COLORS.accent,
    fontWeight: "800",
    fontSize: 13,
  },

  chartCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  chartTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  chartSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  barChartWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginTop: 6,
  },
  barItem: {
    alignItems: "center",
    width: 32,
  },
  barValue: {
    color: COLORS.soft,
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "700",
  },
  barTrack: {
    width: 22,
    height: 120,
    borderRadius: 14,
    backgroundColor: COLORS.track,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 14,
  },
  barLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },

  doubleRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  halfCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 14,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  cardSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  ringOuter: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 10,
    borderColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(50,213,131,0.06)",
  },
  ringInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.bg2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 22,
  },
  ringLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },

  legendList: {
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  legendValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  progressValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.track,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  requestMiniStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  miniNumber: {
    alignItems: "center",
    flex: 1,
  },
  miniNumberValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  miniNumberLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickBtn: {
    width: "31.5%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },

  activityCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 10,
  },
  activityText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});
