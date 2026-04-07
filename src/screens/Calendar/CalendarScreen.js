import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { COLORS, ymd, buildMonthGrid } from "./calendarUtils";
import CalendarCard from "./CalendarCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: "Bekliyor", color: COLORS.warm },
  confirmed: { label: "Onaylandı", color: COLORS.success },
  rejected: { label: "Reddedildi", color: COLORS.danger },
};

const MODE_OPTIONS = [
  { key: "appointments", icon: "time-outline", label: "Randevu" },
  { key: "tasks", icon: "checkmark-circle-outline", label: "Görevler" },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile } = useFarmerAuth();

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const [mode, setMode] = useState("appointments");

  // Real appointments from Firestore
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Tasks for selected date
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const rows = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // ── Listener: appointments for selected date ──────────────────────────────
  // NOTE: Requires composite index → appointments: farmerId (ASC) + date (ASC)
  useEffect(() => {
    if (!farmerProfile?.uid) return;

    setAppointmentsLoading(true);

    const q = query(
      collection(db, "appointments"),
      where("farmerId", "==", farmerProfile.uid),
      where("date", "==", selected),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.time.localeCompare(b.time));
        setAppointments(data);
        setAppointmentsLoading(false);
      },
      (err) => {
        console.error("Appointments listener error:", err);
        setAppointmentsLoading(false);
      },
    );

    return unsub;
  }, [farmerProfile?.uid, selected]);

  // ── Listener: tasks for selected date ────────────────────────────────────
  // NOTE: Requires composite index → tasks: userId (ASC) + date (ASC)
  useEffect(() => {
    if (!farmerProfile?.uid) return;

    setTasksLoading(true);

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", farmerProfile.uid),
      where("date", "==", selected),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.time.localeCompare(b.time));
        setTasks(data);
        setTasksLoading(false);
      },
      (err) => {
        console.error("Tasks listener error:", err);
        setTasksLoading(false);
      },
    );

    return unsub;
  }, [farmerProfile?.uid, selected]);

  // ── Calendar handlers ─────────────────────────────────────────────────────
  const prevMonth = useCallback(
    () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    [],
  );
  const nextMonth = useCallback(
    () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
    [],
  );
  const onPickDay = useCallback(
    (day) => {
      if (!day) return;
      setSelected(ymd(new Date(cursor.getFullYear(), cursor.getMonth(), day)));
    },
    [cursor],
  );

  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: newStatus });
    } catch (err) {
      console.error("Update status error:", err);
    }
  }, []);

  const toggleTaskDone = useCallback(async (id, current) => {
    try {
      await updateDoc(doc(db, "tasks", id), { isDone: !current });
    } catch (err) {
      console.error("Toggle task error:", err);
    }
  }, []);

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
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.9}
            onPress={() =>
              mode === "tasks"
                ? navigation.navigate("CreateTask")
                : navigation.navigate("CreateAppointment")
            }
          >
            <Ionicons name="add" size={22} color="#0B1220" />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <CalendarCard
          cursor={cursor}
          rows={rows}
          selected={selected}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onPickDay={onPickDay}
        />

        {/* Section header + mode toggle */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {mode === "appointments" ? "Randevularım" : "Görevlerim"}
          </Text>
          <ModeToggle
            mode={mode}
            options={MODE_OPTIONS}
            onChangeMode={setMode}
          />
        </View>

        {/* List */}
        {mode === "appointments" ? (
          appointmentsLoading ? (
            <ActivityIndicator
              color={COLORS.warm}
              style={{ marginTop: 24 }}
            />
          ) : appointments.length === 0 ? (
            <EmptyState label="Bu gün için randevu bulunmuyor." />
          ) : (
            <View style={{ gap: 14 }}>
              {appointments.map((item) => {
                // Prefer receiverId; fall back to senderId for older docs
                const isReceiver = item.receiverId
                  ? item.receiverId === farmerProfile.uid
                  : item.senderId !== farmerProfile.uid;
                return (
                  <AppointmentCard
                    key={item.id}
                    appointment={item}
                    isReceiver={isReceiver}
                    onApprove={() => updateStatus(item.id, "confirmed")}
                    onReject={() => updateStatus(item.id, "rejected")}
                  />
                );
              })}
            </View>
          )
        ) : tasksLoading ? (
          <ActivityIndicator color={COLORS.warm} style={{ marginTop: 24 }} />
        ) : tasks.length === 0 ? (
          <EmptyState label="Bu gün için görev bulunmuyor." />
        ) : (
          <View style={{ gap: 14 }}>
            {tasks.map((item) => (
              <TaskCard
                key={item.id}
                task={item}
                onToggle={() => toggleTaskDone(item.id, item.isDone)}
                onEdit={() => navigation.navigate("CreateTask", { task: item })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ModeToggle({ mode, options, onChangeMode }) {
  return (
    <View style={styles.toggleWrap}>
      {options.map(({ key, icon, label }) => {
        const isActive = mode === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.togglePill, isActive && styles.togglePillActive]}
            activeOpacity={0.92}
            onPress={() => onChangeMode(key)}
          >
            <Ionicons
              name={icon}
              size={16}
              color={isActive ? "#0B1220" : COLORS.text}
            />
            <Text
              style={[styles.toggleText, isActive && styles.toggleTextActive]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppointmentCard({ appointment, isReceiver, onApprove, onReject }) {
  const { vetName, time, status } = appointment;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  // Show actions only when farmer is the receiver AND appointment is pending
  const showActions = status === "pending" && isReceiver;

  return (
    <View style={styles.itemCard}>
      <LinearGradient
        colors={["rgba(47,120,200,0.75)", "rgba(255,176,78,0.70)"]}
        start={{ x: 0.0, y: 0.2 }}
        end={{ x: 1.0, y: 0.8 }}
        style={styles.itemGradient}
      />
      <View style={[styles.itemLeft, showActions && styles.itemLeftTop]}>
        <View style={[styles.itemIcon, showActions && styles.itemIconTop]}>
          <Ionicons name="person-outline" size={18} color={COLORS.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {vetName || "Veteriner"}
          </Text>
          <Text style={styles.itemSub}>{time}</Text>
          {showActions && (
            <View style={styles.actionRow}>
              <ActionButton
                label="Onayla"
                color={COLORS.success}
                onPress={onApprove}
              />
              <ActionButton
                label="Reddet"
                color={COLORS.danger}
                onPress={onReject}
              />
            </View>
          )}
        </View>
      </View>
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: `${cfg.color}22`,
            borderColor: `${cfg.color}55`,
          },
        ]}
      >
        <Text style={[styles.statusText, { color: cfg.color }]}>
          {cfg.label}
        </Text>
      </View>
    </View>
  );
}

function ActionButton({ label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TaskCard({ task, onToggle, onEdit }) {
  const { title, time, isDone } = task;
  return (
    <TouchableOpacity
      style={[styles.itemCard, isDone && styles.itemCardDone]}
      activeOpacity={0.88}
      onPress={onEdit}
    >
      <View style={styles.itemLeft}>
        <TouchableOpacity
          style={[styles.taskCheck, isDone && styles.taskCheckDone]}
          activeOpacity={0.8}
          onPress={onToggle}
        >
          {isDone && (
            <Ionicons name="checkmark" size={14} color="#0B1220" />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.itemTitle, isDone && styles.itemTitleDone]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text style={styles.itemSub}>{time}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.faint} />
    </TouchableOpacity>
  );
}

function EmptyState({ label }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="calendar-outline" size={32} color={COLORS.faint} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
  itemLeftTop: { alignItems: "flex-start" },
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
  itemIconTop: { alignSelf: "flex-start" },
  itemTitle: { color: COLORS.text, fontWeight: "900", fontSize: 12 },
  itemSub: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 11,
    marginTop: 4,
  },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: { fontWeight: "900", fontSize: 11 },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontWeight: "900", fontSize: 11 },

  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { color: COLORS.faint, fontWeight: "700", fontSize: 13 },

  itemCardDone: { opacity: 0.55 },
  itemTitleDone: {
    textDecorationLine: "line-through",
    color: COLORS.faint,
  },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
});
