import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { useVetAuth } from "../../context/VetAuthContext";
import { COLORS, ymd, buildMonthGrid } from "./calendarUtils";
import CalendarCard from "./CalendarCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const formatTime = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const makeInitialTime = () => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
};

/** Parse "HH:mm" string back to a Date object */
const parseTime = (timeStr) => {
  const [h, m] = (timeStr ?? "09:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

/** Parse "YYYY-MM-DD" to the first of that month for the calendar cursor */
const parseCursor = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, mo] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, 1);
};

// ─── Screen ────────────────────────────────────────────────────────────────────

/**
 * route.params:
 *   task?: { id, title, date, time, isDone, userId }  — present when editing
 */
export default function CreateTaskScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { task } = route.params ?? {};
  const isEditing = !!task;

  // Both providers wrap root — safe to call both
  const { farmerProfile } = useFarmerAuth();
  const { vetProfile } = useVetAuth();
  const isVet = !!vetProfile?.uid;
  const currentUser = isVet ? vetProfile : farmerProfile;

  // Form fields
  const [title, setTitle] = useState(task?.title ?? "");
  const [cursor, setCursor] = useState(() => parseCursor(task?.date));
  const [selectedDate, setSelectedDate] = useState(
    () => task?.date ?? ymd(new Date()),
  );
  const rows = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Time picker
  const [timeDate, setTimeDate] = useState(() =>
    task?.time ? parseTime(task.time) : makeInitialTime(),
  );
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(task?.time ?? null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setSelectedDate(
        ymd(new Date(cursor.getFullYear(), cursor.getMonth(), day)),
      );
    },
    [cursor],
  );

  // ── Time picker handlers ──────────────────────────────────────────────────
  const handleTimeChange = useCallback((event, date) => {
    if (Platform.OS === "android") {
      setTimePickerOpen(false);
      if (event.type === "set" && date) {
        setTimeDate(date);
        setSelectedTime(formatTime(date));
      }
    } else {
      if (date) setTimeDate(date);
    }
  }, []);

  const confirmIOSTime = useCallback(() => {
    setSelectedTime(formatTime(timeDate));
    setTimePickerOpen(false);
  }, [timeDate]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const canSave =
    title.trim().length > 0 && !!selectedDate && !!selectedTime && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        date: selectedDate,
        time: selectedTime,
        userId: currentUser.uid,
      };
      if (isEditing) {
        await updateDoc(doc(db, "tasks", task.id), payload);
      } else {
        await addDoc(collection(db, "tasks"), {
          ...payload,
          isDone: false,
          createdAt: serverTimestamp(),
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error("Save task error:", err);
      Alert.alert("Hata", "Görev kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const onDelete = () => {
    Alert.alert(
      "Görevi Sil",
      "Bu görevi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDoc(doc(db, "tasks", task.id));
              navigation.goBack();
            } catch (err) {
              console.error("Delete task error:", err);
              Alert.alert("Hata", "Görev silinemedi.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEditing ? "Görevi Düzenle" : "Görev Oluştur"}
          </Text>

          {/* Delete button shown only when editing */}
          {isEditing ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.9}
              onPress={onDelete}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={COLORS.danger}
                />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Title input */}
        <SectionLabel title="Görev Başlığı" />
        <TextInput
          style={styles.titleInput}
          placeholder="Görev başlığını girin..."
          placeholderTextColor={COLORS.faint}
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
          maxLength={100}
        />

        {/* Date */}
        <SectionLabel title="Tarih Seçin" />
        <CalendarCard
          cursor={cursor}
          rows={rows}
          selected={selectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onPickDay={onPickDay}
        />

        {/* Time */}
        <SectionLabel title="Saat Seçin" />
        <View style={styles.timeRow}>
          <View style={styles.timeDisplay}>
            <Ionicons
              name="time-outline"
              size={18}
              color={selectedTime ? COLORS.text : COLORS.faint}
            />
            <Text
              style={[
                styles.timeDisplayText,
                !selectedTime && styles.timeDisplayPlaceholder,
              ]}
            >
              {selectedTime ?? "Saat seçilmedi"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.timePickBtn}
            activeOpacity={0.88}
            onPress={() => {
              if (Platform.OS === "ios" && timePickerOpen) {
                confirmIOSTime();
              } else {
                setTimePickerOpen(true);
              }
            }}
          >
            <Text style={styles.timePickBtnText}>
              {Platform.OS === "ios" && timePickerOpen ? "Tamam" : "Seç"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Android: native dialog */}
        {timePickerOpen && Platform.OS === "android" && (
          <DateTimePicker
            value={timeDate}
            mode="time"
            display="default"
            is24Hour
            onChange={handleTimeChange}
          />
        )}

        {/* iOS: inline spinner */}
        {timePickerOpen && Platform.OS === "ios" && (
          <View style={styles.iosPickerCard}>
            <DateTimePicker
              value={timeDate}
              mode="time"
              display="spinner"
              is24Hour
              onChange={handleTimeChange}
              themeVariant="dark"
              style={{ height: 160 }}
            />
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom save button */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) + 4 },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          activeOpacity={canSave ? 0.88 : 1}
          onPress={onSave}
        >
          {saving ? (
            <ActivityIndicator color="#0B1220" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? "Değişiklikleri Kaydet" : "Görevi Kaydet"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ title }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.2,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,93,115,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,93,115,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 12,
    marginTop: 4,
  },

  titleInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 20,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  timeDisplay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timeDisplayText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  timeDisplayPlaceholder: { color: COLORS.faint, fontWeight: "700", fontSize: 13 },
  timePickBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,204,114,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,204,114,0.55)",
  },
  timePickBtnText: { color: "#0B1220", fontWeight: "900", fontSize: 13 },

  iosPickerCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: "rgba(5,9,20,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,204,114,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  saveBtnDisabled: { backgroundColor: "rgba(255,204,114,0.28)" },
  saveBtnText: {
    color: "#0B1220",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
