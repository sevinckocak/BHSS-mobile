import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
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
  query,
  where,
  getDocs,
  addDoc,
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

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function CreateAppointmentScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Both providers wrap the root — safe to call both hooks anywhere
  const { farmerProfile } = useFarmerAuth();
  const { vetProfile } = useVetAuth();

  // Vet takes precedence if (edge-case) both are truthy
  const isVet = !!vetProfile?.uid;
  const currentUser = isVet ? vetProfile : farmerProfile;

  // Other-party list (vets for farmer, farmers for vet)
  const [persons, setPersons] = useState([]);
  const [personsLoading, setPersonsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Calendar
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => ymd(new Date()));
  const rows = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Time picker
  const [timeDate, setTimeDate] = useState(makeInitialTime);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null); // "HH:mm" | null
  const [timeConflict, setTimeConflict] = useState(false);
  const [conflictChecking, setConflictChecking] = useState(false);

  const [saving, setSaving] = useState(false);

  // ── Fetch other-party list ────────────────────────────────────────────────
  useEffect(() => {
    const col = isVet ? "farmer_info" : "vet_info";
    getDocs(collection(db, col))
      .then((snap) =>
        setPersons(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
      )
      .catch((err) => console.error("Fetch persons error:", err))
      .finally(() => setPersonsLoading(false));
  }, [isVet]);

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
      setSelectedTime(null);
      setTimeConflict(false);
    },
    [cursor],
  );

  const onSelectPerson = useCallback((person) => {
    setSelectedPerson(person);
    setSelectedTime(null);
    setTimeConflict(false);
  }, []);

  // ── Conflict check ────────────────────────────────────────────────────────
  // NOTE: Requires composite index → appointments: vetId (ASC) + date (ASC) + time (ASC)
  // Firebase will print a clickable link in the console to create it automatically.
  const checkConflict = useCallback(
    async (time) => {
      if (!selectedPerson || !selectedDate || !currentUser?.uid) return;

      const vetId = isVet ? currentUser.uid : selectedPerson.uid;

      setConflictChecking(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("vetId", "==", vetId),
          where("date", "==", selectedDate),
          where("time", "==", time),
        );
        const snap = await getDocs(q);
        setTimeConflict(!snap.empty);
      } catch (err) {
        console.error("Conflict check error:", err);
      } finally {
        setConflictChecking(false);
      }
    },
    [selectedPerson, selectedDate, isVet, currentUser?.uid],
  );

  // ── Time picker handlers ──────────────────────────────────────────────────
  const handleTimeChange = useCallback(
    (event, date) => {
      if (Platform.OS === "android") {
        setTimePickerOpen(false);
        if (event.type === "set" && date) {
          const time = formatTime(date);
          setTimeDate(date);
          setSelectedTime(time);
          checkConflict(time);
        }
      } else {
        // iOS: picker stays open, user confirms via "Tamam" button
        if (date) setTimeDate(date);
      }
    },
    [checkConflict],
  );

  const confirmIOSTime = useCallback(() => {
    const time = formatTime(timeDate);
    setSelectedTime(time);
    setTimePickerOpen(false);
    checkConflict(time);
  }, [timeDate, checkConflict]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const canSave =
    !!selectedPerson &&
    !!selectedDate &&
    !!selectedTime &&
    !timeConflict &&
    !conflictChecking &&
    !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const farmerId = isVet ? selectedPerson.uid : currentUser.uid;
    const farmerName = isVet
      ? (selectedPerson.name ?? selectedPerson.fullName ?? "")
      : (currentUser.fullName ?? "");
    const vetId = isVet ? currentUser.uid : selectedPerson.uid;
    const vetName = isVet
      ? (currentUser.fullName ?? "")
      : (selectedPerson.name ?? selectedPerson.fullName ?? "");

    try {
      // Final race-condition guard: re-check conflict right before writing
      const conflictQ = query(
        collection(db, "appointments"),
        where("vetId", "==", vetId),
        where("date", "==", selectedDate),
        where("time", "==", selectedTime),
      );
      const conflictSnap = await getDocs(conflictQ);
      if (!conflictSnap.empty) {
        setTimeConflict(true);
        Alert.alert(
          "Saat Dolu",
          `${selectedTime} saati bu tarihte dolu. Lütfen başka bir saat seçin.`,
        );
        return;
      }

      await addDoc(collection(db, "appointments"), {
        farmerId,
        farmerName,
        vetId,
        vetName,
        senderId: currentUser.uid,
        receiverId: selectedPerson.uid,
        date: selectedDate,
        time: selectedTime,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Başarılı", "Randevunuz oluşturuldu.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Save appointment error:", err);
      Alert.alert("Hata", "Randevu oluşturulurken bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const personLabel = isVet ? "Çiftçi Seçin" : "Veteriner Seçin";
  const personEmptyMsg = isVet
    ? "Kayıtlı çiftçi bulunamadı."
    : "Kayıtlı veteriner bulunamadı.";

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
          <Text style={styles.headerTitle}>Randevu Oluştur</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Other-party selection */}
        <SectionLabel title={personLabel} />
        {personsLoading ? (
          <ActivityIndicator
            color={COLORS.warm}
            style={{ marginVertical: 16 }}
          />
        ) : persons.length === 0 ? (
          <Text style={styles.emptyText}>{personEmptyMsg}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
            style={{ marginBottom: 20 }}
          >
            {persons.map((person) => (
              <PersonCard
                key={person.uid}
                person={person}
                isVetCard={!isVet}
                selected={selectedPerson?.uid === person.uid}
                onSelect={() => onSelectPerson(person)}
              />
            ))}
          </ScrollView>
        )}

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

        {/* Time — visible only after person + date chosen */}
        {selectedPerson && selectedDate && (
          <>
            <SectionLabel title="Saat Seçin" />

            {/* Display + pick button */}
            <View style={styles.timeRow}>
              <View
                style={[
                  styles.timeDisplay,
                  timeConflict && styles.timeDisplayConflict,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={
                    timeConflict
                      ? COLORS.danger
                      : selectedTime
                        ? COLORS.text
                        : COLORS.faint
                  }
                />
                <Text
                  style={[
                    styles.timeDisplayText,
                    !selectedTime && styles.timeDisplayPlaceholder,
                    timeConflict && styles.timeDisplayConflictText,
                  ]}
                >
                  {selectedTime ?? "Saat seçilmedi"}
                </Text>
                {conflictChecking && (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.warm}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>

              {/* On iOS: toggles picker / confirms; on Android: opens dialog */}
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

            {/* Android: renders as native dialog, auto-dismisses */}
            {timePickerOpen && Platform.OS === "android" && (
              <DateTimePicker
                value={timeDate}
                mode="time"
                display="default"
                is24Hour
                onChange={handleTimeChange}
              />
            )}

            {/* iOS: inline spinner card */}
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

            {/* Conflict warning */}
            {timeConflict && selectedTime && (
              <View style={styles.conflictWarn}>
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color={COLORS.danger}
                />
                <Text style={styles.conflictWarnText}>
                  {selectedTime} saati bu tarihte dolu. Lütfen başka bir saat
                  seçin.
                </Text>
              </View>
            )}
          </>
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
            <Text style={styles.saveBtnText}>Randevuyu Kaydet</Text>
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

function PersonCard({ person, isVetCard, selected, onSelect }) {
  const name = (person.name ?? person.fullName ?? "").split(" ")[0];
  // Vets have clinic_name, farmers have farm_name
  const subtitle = isVetCard
    ? (person.clinic_name ?? person.clinicName ?? "")
    : (person.farm_name ?? person.farmName ?? "");

  return (
    <TouchableOpacity
      style={[styles.personCard, selected && styles.personCardSelected]}
      activeOpacity={0.88}
      onPress={onSelect}
    >
      <View style={styles.personAvatar}>
        <Ionicons
          name={isVetCard ? "medical" : "leaf"}
          size={20}
          color={selected ? "#0B1220" : COLORS.text}
        />
      </View>
      <Text
        style={[styles.personName, selected && styles.personNameSelected]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {!!subtitle && (
        <Text
          style={[styles.personSub, selected && styles.personSubSelected]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
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

  sectionLabel: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  emptyText: {
    color: COLORS.faint,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 16,
  },

  // Person cards (vet or farmer)
  personCard: {
    width: 110,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    gap: 8,
  },
  personCardSelected: {
    backgroundColor: "rgba(255,204,114,0.95)",
    borderColor: "rgba(255,204,114,0.55)",
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  personName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
  personNameSelected: { color: "#0B1220" },
  personSub: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 10,
    textAlign: "center",
  },
  personSubSelected: { color: "rgba(11,18,32,0.65)" },

  // Time section
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
  timeDisplayConflict: {
    borderColor: "rgba(255,93,115,0.40)",
    backgroundColor: "rgba(255,93,115,0.08)",
  },
  timeDisplayText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  timeDisplayPlaceholder: {
    color: COLORS.faint,
    fontWeight: "700",
    fontSize: 13,
  },
  timeDisplayConflictText: { color: COLORS.danger },

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

  conflictWarn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,93,115,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,93,115,0.25)",
    marginBottom: 12,
  },
  conflictWarnText: {
    color: COLORS.danger,
    fontWeight: "700",
    fontSize: 12,
    flex: 1,
  },

  // Bottom bar
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
