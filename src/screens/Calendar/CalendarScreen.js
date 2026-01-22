import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * BHSS Calendar Screen (AI mock'a çok yakın)
 * - Home ile aynı gradient bg
 * - Üstte mini calendar kartı (rounded, glass)
 * - Aşağıda görev / etkinlik kartları (mavi->turuncu gradient şerit)
 * - Sağda checkbox veya "Bul" pill
 */

const COLORS = {
  // background (Home ile aynı)
  bg: "#050914",
  bg2: "#070B12",

  // surfaces
  card: "rgba(255,255,255,0.06)",
  cardStrong: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",

  // text
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.58)",
  faint: "rgba(234,244,255,0.38)",

  // accents
  warm: "#FFCC72",
  warm2: "#FFB04E",
  blue: "#2F78C8",
  blue2: "#1E4F8F",
};

const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const daysInMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
// Monday=0..Sunday=6
const mondayIndex = (jsDay) => (jsDay + 6) % 7;

function buildMonthGrid(date) {
  const first = startOfMonth(date);
  const total = daysInMonth(date);
  const offset = mondayIndex(first.getDay());

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function trMonthLabel(date) {
  const m = date.toLocaleString("tr-TR", { month: "long" });
  const cap = m.charAt(0).toUpperCase() + m.slice(1);
  return `${cap} ${date.getFullYear()}`;
}

export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [cursor, setCursor] = useState(() => new Date(2025, 11, 1)); // Aralık 2025 demo
  const [selected, setSelected] = useState(() => ymd(new Date(2025, 11, 8))); // seçili 8
  const [mode, setMode] = useState("tasks"); // tasks | events

  const rows = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Demo listeler (sen DB’den çekeceksin)
  const list = useMemo(() => {
    if (mode === "events") {
      return [
        {
          id: "e1",
          icon: "calendar-outline",
          title: "Randevu Oluştur",
          subtitle: "Veteriner ile görüşme",
          pill: "Bul",
        },
        {
          id: "e2",
          icon: "school-outline",
          title: "Eğitim Etkinliği",
          subtitle: "Takvime ekle",
          pill: "Bul",
        },
      ];
    }
    return [
      {
        id: "t1",
        icon: "medkit-outline",
        title: "Aşı Kontrolü",
        subtitle: "10:00",
        done: false,
      },
      {
        id: "t2",
        icon: "nutrition-outline",
        title: "Yem Kontrolü",
        subtitle: "12:30",
        done: true,
      },
      {
        id: "t3",
        icon: "barcode-outline",
        title: "Küpe No Güncelle",
        subtitle: "15:00",
        done: false,
      },
      {
        id: "t4",
        icon: "chatbubble-ellipses-outline",
        title: "Veteriner Mesajı",
        subtitle: "17:10",
        done: false,
      },
    ];
  }, [mode]);

  const prevMonth = () =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const onPickDay = (day) => {
    if (!day) return;
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    setSelected(ymd(d));
  };

  const onFab = () => {
    // navigation?.navigate?.("CreateTaskOrEvent");
  };

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: 110 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Takvim</Text>

          {/* ✅ Bildirim yerine + (daha karemsi) */}
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.9}
            onPress={onFab}
          >
            <Ionicons name="add" size={22} color="#0B1220" />
          </TouchableOpacity>
        </View>

        {/* Calendar Card */}
        <View style={styles.calOuter}>
          <View style={styles.calTopRow}>
            <TouchableOpacity
              style={styles.chevBtn}
              activeOpacity={0.9}
              onPress={prevMonth}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.monthText}>{trMonthLabel(cursor)}</Text>

            <TouchableOpacity
              style={styles.chevBtn}
              activeOpacity={0.9}
              onPress={nextMonth}
            >
              <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Weekdays */}
          <View style={styles.weekRow}>
            {WEEK.map((w) => (
              <Text key={w} style={styles.weekText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.grid}>
            {rows.map((r, ri) => (
              <View key={`r-${ri}`} style={styles.gridRow}>
                {r.map((day, ci) => {
                  const dateStr =
                    day != null
                      ? ymd(
                          new Date(cursor.getFullYear(), cursor.getMonth(), day)
                        )
                      : null;
                  const isSelected = dateStr && dateStr === selected;

                  return (
                    <TouchableOpacity
                      key={`c-${ri}-${ci}`}
                      activeOpacity={day ? 0.92 : 1}
                      onPress={() => onPickDay(day)}
                      style={[
                        styles.dayCell,
                        !day && styles.dayCellEmpty,
                        isSelected && styles.dayCellSelected,
                      ]}
                    >
                      {day ? (
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Section header + toggle pills (Görev / Etkinlik) */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {mode === "tasks" ? "Bugünün Görevleri" : "Yaklaşan Etkinlikler"}
          </Text>

          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                mode === "tasks" && styles.togglePillActive,
              ]}
              activeOpacity={0.92}
              onPress={() => setMode("tasks")}
            >
              <Ionicons
                name="checkbox-outline"
                size={16}
                color={mode === "tasks" ? "#0B1220" : COLORS.text}
              />
              <Text
                style={[
                  styles.toggleText,
                  mode === "tasks" && styles.toggleTextActive,
                ]}
              >
                Görev
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.togglePill,
                mode === "events" && styles.togglePillActive,
              ]}
              activeOpacity={0.92}
              onPress={() => setMode("events")}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={mode === "events" ? "#0B1220" : COLORS.text}
              />
              <Text
                style={[
                  styles.toggleText,
                  mode === "events" && styles.toggleTextActive,
                ]}
              >
                Etkinlik
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards list */}
        <View style={{ gap: 14 }}>
          {list.map((it) => (
            <GradientListCard
              key={it.id}
              icon={it.icon}
              title={it.title}
              subtitle={it.subtitle}
              mode={mode}
              done={it.done}
              pill={it.pill}
              onToggle={() => {}}
              onPill={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/* ---------------- Components ---------------- */

function GradientListCard({
  icon,
  title,
  subtitle,
  mode,
  done,
  pill,
  onToggle,
  onPill,
}) {
  return (
    <View style={styles.itemCard}>
      {/* Gradient stripe (mavi -> turuncu) */}
      <LinearGradient
        colors={["rgba(47,120,200,0.75)", "rgba(255,176,78,0.70)"]}
        start={{ x: 0.0, y: 0.2 }}
        end={{ x: 1.0, y: 0.8 }}
        style={styles.itemGradient}
      />

      <View style={styles.itemLeft}>
        <View style={styles.itemIcon}>
          <Ionicons name={icon} size={18} color={COLORS.text} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.itemSub}>{subtitle}</Text>
        </View>
      </View>

      {mode === "tasks" ? (
        <TouchableOpacity
          style={styles.rightArea}
          activeOpacity={0.92}
          onPress={onToggle}
        >
          <Ionicons
            name={done ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={done ? COLORS.warm : "rgba(234,244,255,0.55)"}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.findPill}
          activeOpacity={0.92}
          onPress={onPill}
        >
          <Text style={styles.findText}>{pill || "Bul"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.2,
  },

  // ✅ Header sağındaki + butonu (bildirim yerine) - daha karemsi
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,204,114,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,204,114,0.55)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },

  calOuter: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
  },
  calTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
    opacity: 0.95,
  },
  chevBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekText: {
    width: "14.28%",
    textAlign: "center",
    color: "rgba(234,244,255,0.42)",
    fontWeight: "800",
    fontSize: 11,
  },

  grid: { gap: 10 },
  gridRow: { flexDirection: "row", justifyContent: "space-between" },

  dayCell: {
    width: "14.28%",
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellEmpty: { backgroundColor: "transparent", borderColor: "transparent" },
  dayCellSelected: {
    backgroundColor: "rgba(255,204,114,0.95)",
    borderColor: "rgba(255,204,114,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  dayText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },
  dayTextSelected: { color: "#0B1220" },

  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 2,
  },
  sectionTitle: { color: COLORS.text, fontWeight: "900", fontSize: 14 },

  toggleWrap: { flexDirection: "row", gap: 10 },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  togglePillActive: {
    backgroundColor: "rgba(255,204,114,0.96)",
    borderColor: "rgba(255,204,114,0.55)",
  },
  toggleText: { color: COLORS.text, fontWeight: "900", fontSize: 11 },
  toggleTextActive: { color: "#0B1220" },

  itemCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemGradient: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 10,
    bottom: 10,
    borderRadius: 18,
    opacity: 0.55,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { color: COLORS.text, fontWeight: "900", fontSize: 12 },
  itemSub: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 11,
    marginTop: 4,
  },

  rightArea: { paddingLeft: 10, paddingVertical: 6 },

  findPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,204,114,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,204,114,0.55)",
  },
  findText: { color: "#0B1220", fontWeight: "900", fontSize: 11 },
});
