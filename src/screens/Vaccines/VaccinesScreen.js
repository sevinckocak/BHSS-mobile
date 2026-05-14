import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { useAnimals } from "../../context/AnimalsContext";
import { doc, onSnapshot } from "firebase/firestore";

import { VACCINE_TYPES } from "../../data/vaccines";
import SimpleSelectModal from "../../components/Animals/SimpleSelectModal";
import DatePickerSheet from "../../components/Animals/DatePickerSheet";
import { formatTR, parseTRDate } from "../../utils/date";
import {
  computeNextDueDateStr,
  getVaccineStatus,
  getAllUpcomingVaccines,
  VACCINE_INTERVALS,
  getVaccineIdFromName,
} from "../../utils/vaccineScheduler";
import * as Notifications from "expo-notifications";

// 📌 Navigation:
//   animal detail → navigation.navigate("VaccinesScreen", { animalId })
//   home screen  → navigation.navigate("VaccinesScreen")  ← overview mode

const COLORS = {
  bg1: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  border: "rgba(255,255,255,0.14)",
  glass: "rgba(255,255,255,0.06)",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
  success: "#4ECDC4",
  gold: "#FFAA5A",
};

const EMPTY_FORM = { type: "", date: "", nextDate: "", note: "", _autoNext: false };

export default function VaccinesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { authUser } = useFarmerAuth();
  const uid = authUser?.uid;
  const { addVaccine, deleteVaccine, updateVaccineNextDate, animals } = useAnimals();

  const animalId = route?.params?.animalId;
  // Overview mode: no animalId → show all animals' vaccine schedule
  const isOverview = !animalId;

  const [vaccines, setVaccines] = useState([]);
  const [animalName, setAnimalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  // ── Edit nextDate modal ──────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState({ open: false, vaccine: null });
  const [editNextDate, setEditNextDate] = useState("");
  const [editDatePicker, setEditDatePicker] = useState({
    open: false,
    value: new Date(),
  });

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [typeModal, setTypeModal] = useState(false);
  const [datePicker, setDatePicker] = useState({
    open: false,
    field: null, // "date" | "nextDate" | "editDate"
    value: new Date(),
  });

  // ── Firestore listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !animalId) {
      setLoading(false);
      return;
    }

    const animalRef = doc(db, "farmer_info", uid, "animals", animalId);

    const unsub = onSnapshot(
      animalRef,
      (snap) => {
        const data = snap.data();
        setVaccines(Array.isArray(data?.vaccines) ? data.vaccines : []);
        setAnimalName(data?.name || data?.tagNo || "");
        setLoading(false);
      },
      (err) => {
        console.log("VaccinesScreen onSnapshot error:", err?.code, err?.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [uid, animalId]);

  // ── Auto-suggest nextDate when type + date are both filled ──────────────────
  useEffect(() => {
    if (!form.type || !form.date) return;
    // Only auto-fill if the user hasn't manually overridden it
    if (form.nextDate && !form._autoNext) return;

    const suggested = computeNextDueDateStr(form.type, form.date);
    if (suggested) {
      setForm((p) => ({ ...p, nextDate: suggested, _autoNext: true }));
    } else if (form._autoNext) {
      // One-time vaccine: clear the auto-filled value
      setForm((p) => ({ ...p, nextDate: "", _autoNext: false }));
    }
  }, [form.type, form.date]);

  // ── DatePicker handlers (form) ───────────────────────────────────────────────
  const openDatePicker = useCallback(
    (field) => {
      let current;
      if (field === "date") current = parseTRDate(form.date) || new Date();
      else if (field === "nextDate") current = parseTRDate(form.nextDate) || new Date();
      else if (field === "editDate") current = parseTRDate(editNextDate) || new Date();
      else current = new Date();
      setDatePicker({ open: true, field, value: current });
    },
    [form.date, form.nextDate, editNextDate],
  );

  const onChangeDate = useCallback(
    (event, selectedDate) => {
      if (Platform.OS === "android" && event?.type === "dismissed") {
        setDatePicker((p) => ({ ...p, open: false }));
        return;
      }

      const date = selectedDate || datePicker.value;
      setDatePicker((p) => ({ ...p, value: date }));

      if (Platform.OS === "android") {
        setDatePicker((p) => ({ ...p, open: false }));
      }

      const dateStr = formatTR(date);
      if (datePicker.field === "date") {
        setForm((p) => ({ ...p, date: dateStr }));
      } else if (datePicker.field === "nextDate") {
        // Manual pick → clear auto flag
        setForm((p) => ({ ...p, nextDate: dateStr, _autoNext: false }));
      } else if (datePicker.field === "editDate") {
        setEditNextDate(dateStr);
      }
    },
    [datePicker.field, datePicker.value],
  );

  const closeIOSDatePicker = useCallback(() => {
    setDatePicker((p) => ({ ...p, open: false }));
  }, []);

  // ── Kaydet ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.type.trim()) return Alert.alert("Eksik bilgi", "Aşı tipi seçilmedi.");
    if (!form.date.trim()) return Alert.alert("Eksik bilgi", "Aşı tarihi seçilmedi.");

    try {
      setBusy(true);
      await addVaccine(animalId, form);
      setForm(EMPTY_FORM);
    } catch (e) {
      Alert.alert("Hata", e?.message || "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }, [form, animalId, addVaccine]);

  // ── Sil ─────────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (vaccine) => {
      Alert.alert(
        "Aşı kaydını sil?",
        `"${vaccine.type || "Bu kayıt"}" kalıcı olarak silinecek.`,
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: async () => {
              try {
                setBusy(true);
                await deleteVaccine(animalId, vaccine.id);
              } catch (e) {
                Alert.alert("Hata", e?.message || "Silinemedi.");
              } finally {
                setBusy(false);
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [animalId, deleteVaccine],
  );

  // ── Edit nextDate ───────────────────────────────────────────────────────────
  const openEditModal = useCallback((vaccine) => {
    setEditNextDate(vaccine.nextDate || "");
    setEditModal({ open: true, vaccine });
  }, []);

  const handleSaveEditNextDate = useCallback(async () => {
    if (!editNextDate.trim()) {
      return Alert.alert("Tarih giriniz", "Sonraki aşı tarihini seçin.");
    }
    try {
      setBusy(true);
      await updateVaccineNextDate(animalId, editModal.vaccine.id, editNextDate);
      setEditModal({ open: false, vaccine: null });
    } catch (e) {
      Alert.alert("Hata", e?.message || "Güncellenemedi.");
    } finally {
      setBusy(false);
    }
  }, [editNextDate, animalId, editModal.vaccine, updateVaccineNextDate]);

  // ── Test bildirimi (geliştirme kolaylığı) ───────────────────────────────────
  const [testBusy, setTestBusy] = useState(false);

  const handleTestNotification = useCallback(async () => {
    setTestBusy(true);
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: asked } = await Notifications.requestPermissionsAsync();
        if (asked !== "granted") {
          Alert.alert("İzin gerekli", "Bildirim izni verilmedi.");
          return;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💉 Aşı Hatırlatıcısı (TEST)",
          body: `${animalName || "Karabaş"} isimli hayvanın Şap aşı zamanı geldi.`,
          data: { screen: "VaccinesScreen", animalId },
          sound: "default",
        },
        // SDK 53+: TIME_INTERVAL trigger with seconds
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          repeats: false,
        },
      });

      Alert.alert(
        "✅ Test bildirimi planlandı",
        "10 saniye sonra bildirim gelecek.\n\nUygulamayı arka plana alabilir veya açık bırakabilirsin — her iki durumda da çalışır.",
      );
    } catch (e) {
      console.error("[TEST notif] hata:", e);
      Alert.alert("Hata", e?.message || "Bildirim planlanamadı.");
    } finally {
      setTestBusy(false);
    }
  }, [animalName, animalId]);

  // ── Stats for summary bar ────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    let overdue = 0, upcoming = 0, ok = 0;
    for (const v of vaccines) {
      if (!v.nextDate) continue;
      const { status } = getVaccineStatus(v.nextDate);
      if (status === "overdue") overdue++;
      else if (status === "upcoming" || status === "today") upcoming++;
      else if (status === "ok") ok++;
    }
    return { overdue, upcoming, ok };
  }, [vaccines]);

  // ── Auto-suggestion label ────────────────────────────────────────────────────
  const autoSuggestionInterval = useMemo(() => {
    if (!form.type) return null;
    const id = getVaccineIdFromName(form.type);
    const days = id ? VACCINE_INTERVALS[id] : null;
    if (!days) return null;
    if (days === 180) return "6 ay";
    if (days === 365) return "1 yıl";
    return `${days} gün`;
  }, [form.type]);

  // ── Overview mode data ────────────────────────────────────────────────────────
  const overviewData = useMemo(() => {
    if (!isOverview) return null;

    const scheduled = getAllUpcomingVaccines(animals); // has nextDate, sorted soonest first

    // Past records: all administered vaccines (have a `date`) across all animals,
    // sorted most recent first
    const past = [];
    for (const animal of animals) {
      const list = Array.isArray(animal.vaccines) ? animal.vaccines : [];
      for (const v of list) {
        if (!v.date) continue;
        past.push({
          animalId: animal.id,
          animalName: animal.name || animal.tagNo || "—",
          animalTag: animal.tagNo || "",
          vaccineId: v.id,
          vaccineType: v.type || "—",
          date: v.date,
          nextDate: v.nextDate || null,
          note: v.note || "",
        });
      }
    }
    // Sort by most recent administered date first
    past.sort((a, b) => {
      const da = parseTRDate(a.date);
      const db_ = parseTRDate(b.date);
      if (!da || !db_) return 0;
      return db_ - da;
    });

    return { scheduled, past };
  }, [isOverview, animals]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={["rgba(255,170,90,0.12)", "rgba(5,9,20,0.95)", COLORS.bg2]}
      locations={[0, 0.25, 1]}
      style={styles.container}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
            disabled={busy}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>
              {isOverview ? "Aşı Takvimi" : "Aşı Takibi"}
            </Text>
            {!isOverview && !!animalName && (
              <Text style={styles.topSub}>{animalName}</Text>
            )}
            {isOverview && (
              <Text style={styles.topSub}>Tüm Hayvanlar</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.iconBtn, testBusy && { opacity: 0.5 }]}
            activeOpacity={0.85}
            onPress={handleTestNotification}
            disabled={testBusy}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {testBusy
              ? <ActivityIndicator size="small" color={COLORS.warm} />
              : <Ionicons name="notifications-outline" size={18} color={COLORS.warm} />
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
        >
          {/* ════════════════════════════════════════════════════════════════════
              OVERVIEW MODE — tüm hayvanların aşı takvimi
              ════════════════════════════════════════════════════════════════════ */}
          {isOverview && overviewData && (
            <OverviewContent
              data={overviewData}
              navigation={navigation}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════════
              SINGLE ANIMAL MODE
              ════════════════════════════════════════════════════════════════════ */}
          {!isOverview && (
            <>
          {/* ── DURUM ÖZETİ ──────────────────────────────────────────────────── */}
          {!loading && vaccines.length > 0 && (
            <View style={styles.summaryRow}>
              {summaryStats.overdue > 0 && (
                <SummaryChip
                  count={summaryStats.overdue}
                  label="Gecikmiş"
                  color={COLORS.danger}
                  icon="alert-circle"
                />
              )}
              {summaryStats.upcoming > 0 && (
                <SummaryChip
                  count={summaryStats.upcoming}
                  label="Yaklaşan"
                  color={COLORS.warm}
                  icon="time-outline"
                />
              )}
              {summaryStats.ok > 0 && (
                <SummaryChip
                  count={summaryStats.ok}
                  label="Planlandı"
                  color={COLORS.success}
                  icon="checkmark-circle-outline"
                />
              )}
            </View>
          )}

          {/* ── KAYITLAR ─────────────────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Kayıtlar</Text>
            <Text style={styles.sectionSub}>
              {loading
                ? "Yükleniyor…"
                : vaccines.length > 0
                  ? `${vaccines.length} aşı kaydı`
                  : "Henüz kayıt yok"}
            </Text>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={COLORS.warm} />
            </View>
          ) : vaccines.length === 0 ? (
            <BlurView intensity={18} tint="dark" style={styles.emptyCard}>
              <Ionicons name="bandage-outline" size={34} color="rgba(234,244,255,0.22)" />
              <Text style={styles.emptyText}>Henüz aşı kaydı yok</Text>
              <Text style={styles.emptySubText}>
                Aşağıdaki formu kullanarak ilk kaydı ekle
              </Text>
            </BlurView>
          ) : (
            <View style={styles.list}>
              {vaccines.map((v) => (
                <VaccineCard
                  key={v.id}
                  vaccine={v}
                  onDelete={() => handleDelete(v)}
                  onEditDate={() => openEditModal(v)}
                  disabled={busy}
                />
              ))}
            </View>
          )}

          {/* ── YENİ AŞI EKLE FORMU ──────────────────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Yeni Aşı Ekle</Text>
            <Text style={styles.sectionSub}>Formu doldurun ve kaydedin</Text>
          </View>

          <BlurView intensity={18} tint="dark" style={styles.formCard}>

            {/* Aşı Tipi */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Aşı Tipi</Text>
                <Text style={styles.fieldRequired}> *</Text>
              </View>
              <Pressable onPress={() => setTypeModal(true)} style={styles.selectRow}>
                <Text style={[styles.selectText, !form.type && styles.selectPlaceholder]}>
                  {form.type || "Seç…"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
              </Pressable>
            </View>

            {/* Aşı Tarihi */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Aşı Tarihi</Text>
                <Text style={styles.fieldRequired}> *</Text>
              </View>
              <Pressable onPress={() => openDatePicker("date")} style={styles.selectRow}>
                <Text style={[styles.selectText, !form.date && styles.selectPlaceholder]}>
                  {form.date || "GG/AA/YYYY"}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={COLORS.muted} />
              </Pressable>
            </View>

            {/* Sonraki Aşı Tarihi */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Sonraki Aşı Tarihi</Text>
                {form._autoNext && autoSuggestionInterval ? (
                  <View style={styles.autoBadge}>
                    <Text style={styles.autoBadgeText}>Otomatik · {autoSuggestionInterval}</Text>
                  </View>
                ) : (
                  <Text style={styles.fieldOptional}> (opsiyonel)</Text>
                )}
              </View>
              <Pressable
                onPress={() => openDatePicker("nextDate")}
                style={[
                  styles.selectRow,
                  form._autoNext && styles.selectRowAuto,
                ]}
              >
                <Text
                  style={[
                    styles.selectText,
                    !form.nextDate && styles.selectPlaceholder,
                    form._autoNext && { color: COLORS.success },
                  ]}
                >
                  {form.nextDate || "GG/AA/YYYY"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={form._autoNext ? COLORS.success : COLORS.muted}
                />
              </Pressable>
              {form._autoNext && (
                <Text style={styles.autoHint}>
                  Otomatik hesaplandı. Değiştirmek için tarihe dokun.
                </Text>
              )}
            </View>

            {/* Not */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Not</Text>
                <Text style={styles.fieldOptional}> (opsiyonel)</Text>
              </View>
              <TextInput
                value={form.note}
                onChangeText={(t) => setForm((p) => ({ ...p, note: t }))}
                placeholder="Açıklama veya not"
                placeholderTextColor="rgba(234,244,255,0.30)"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.inputMultiline]}
              />
            </View>

            {/* Kaydet */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={busy}
              style={{ marginTop: 6 }}
            >
              <LinearGradient
                colors={
                  busy
                    ? ["rgba(255,170,90,0.35)", "rgba(255,170,90,0.20)"]
                    : ["#FFAA5A", "#FF8C2A"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.bg1} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={COLORS.bg1} />
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
            </>
          )}
        </ScrollView>

        {/* DatePickerSheet */}
        <DatePickerSheet
          styles={styles}
          COLORS={COLORS}
          open={datePicker.open}
          value={datePicker.value}
          onChange={onChangeDate}
          onClose={closeIOSDatePicker}
        />
      </View>

      {/* SimpleSelectModal — Aşı Tipi */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={typeModal}
        title="Aşı Tipi Seç"
        items={VACCINE_TYPES}
        onClose={() => setTypeModal(false)}
        onSelect={(it) => {
          setForm((p) => ({ ...p, type: it.name, _autoNext: false, nextDate: "" }));
          setTypeModal(false);
        }}
      />

      {/* Edit nextDate Modal */}
      <EditNextDateModal
        visible={editModal.open}
        vaccine={editModal.vaccine}
        nextDate={editNextDate}
        onChangeDatePress={() => openDatePicker("editDate")}
        onSave={handleSaveEditNextDate}
        onClose={() => setEditModal({ open: false, vaccine: null })}
        busy={busy}
      />
    </LinearGradient>
  );
}

// ── VaccineCard ───────────────────────────────────────────────────────────────

// ── OverviewContent ───────────────────────────────────────────────────────────

function OverviewContent({ data, navigation }) {
  const { scheduled, past } = data;

  const overdue   = scheduled.filter((v) => v.status === "overdue");
  const today_    = scheduled.filter((v) => v.status === "today");
  const upcoming  = scheduled.filter((v) => v.status === "upcoming");
  const future    = scheduled.filter((v) => v.status === "ok");

  const goAnimalVaccines = (animalId) =>
    navigation.navigate("VaccinesScreen", { animalId });

  return (
    <>
      {/* ── ÖZET CHIPS ─────────────────────────────────────────────────────── */}
      {scheduled.length > 0 && (
        <View style={styles.summaryRow}>
          {overdue.length > 0 && (
            <SummaryChip count={overdue.length} label="Gecikmiş" color="#FF6B6B" icon="alert-circle" />
          )}
          {(today_.length + upcoming.length) > 0 && (
            <SummaryChip count={today_.length + upcoming.length} label="Yaklaşan" color="#FFAA5A" icon="time-outline" />
          )}
          {future.length > 0 && (
            <SummaryChip count={future.length} label="Planlandı" color="#4ECDC4" icon="checkmark-circle-outline" />
          )}
        </View>
      )}

      {/* ── GECİKMİŞ ───────────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: "#FF6B6B" }]}>Gecikmiş Aşılar</Text>
            <Text style={styles.sectionSub}>{overdue.length} aşı geçti</Text>
          </View>
          <View style={styles.list}>
            {overdue.map((item) => (
              <OverviewRow
                key={item.vaccineId}
                item={item}
                onPress={() => goAnimalVaccines(item.animalId)}
              />
            ))}
          </View>
        </>
      )}

      {/* ── BUGÜN + YAKLAŞAN ────────────────────────────────────────────────── */}
      {(today_.length + upcoming.length) > 0 && (
        <>
          <View style={[styles.sectionHead, overdue.length > 0 && { marginTop: 18 }]}>
            <Text style={[styles.sectionTitle, { color: "#FFAA5A" }]}>Yaklaşan Aşılar</Text>
            <Text style={styles.sectionSub}>{today_.length + upcoming.length} aşı yaklaşıyor</Text>
          </View>
          <View style={styles.list}>
            {[...today_, ...upcoming].map((item) => (
              <OverviewRow
                key={item.vaccineId}
                item={item}
                onPress={() => goAnimalVaccines(item.animalId)}
              />
            ))}
          </View>
        </>
      )}

      {/* ── İLERİ TARİHLİ ───────────────────────────────────────────────────── */}
      {future.length > 0 && (
        <>
          <View style={[styles.sectionHead, { marginTop: 18 }]}>
            <Text style={styles.sectionTitle}>Planlı Aşılar</Text>
            <Text style={styles.sectionSub}>{future.length} aşı planlandı</Text>
          </View>
          <View style={styles.list}>
            {future.map((item) => (
              <OverviewRow
                key={item.vaccineId}
                item={item}
                onPress={() => goAnimalVaccines(item.animalId)}
              />
            ))}
          </View>
        </>
      )}

      {/* ── BOŞSA ───────────────────────────────────────────────────────────── */}
      {scheduled.length === 0 && (
        <BlurView intensity={18} tint="dark" style={[styles.emptyCard, { marginBottom: 20 }]}>
          <Ionicons name="calendar-outline" size={34} color="rgba(234,244,255,0.22)" />
          <Text style={styles.emptyText}>Planlanmış aşı yok</Text>
          <Text style={styles.emptySubText}>
            Hayvanlarınıza aşı kaydı ekledikçe burada görünecek
          </Text>
        </BlurView>
      )}

      {/* ── GEÇMİŞ UYGULAMALAR ──────────────────────────────────────────────── */}
      {past.length > 0 && (
        <>
          <View style={[styles.sectionHead, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Geçmiş Aşılar</Text>
            <Text style={styles.sectionSub}>Uygulanan {past.length} kayıt</Text>
          </View>
          <View style={styles.list}>
            {past.map((item) => (
              <BlurView
                key={item.vaccineId + item.animalId}
                intensity={12}
                tint="dark"
                style={styles.card}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="checkmark-done-outline" size={16} color="#4ECDC4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{item.vaccineType}</Text>
                    <Text style={[styles.cardMeta, { marginTop: 3 }]}>
                      {item.animalName}{item.animalTag ? ` · ${item.animalTag}` : ""}
                    </Text>
                    <View style={styles.cardRow}>
                      <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
                      <Text style={styles.cardMeta}>Uygulandı: {item.date}</Text>
                    </View>
                    {!!item.nextDate && (
                      <View style={styles.cardRow}>
                        <Ionicons name="arrow-forward-circle-outline" size={12} color="#4ECDC4" />
                        <Text style={[styles.cardMeta, { color: "#4ECDC4" }]}>
                          Sonraki: {item.nextDate}
                        </Text>
                      </View>
                    )}
                    {!!item.note && (
                      <Text style={styles.cardNote} numberOfLines={1}>{item.note}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => goAnimalVaccines(item.animalId)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={15} color={COLORS.muted} />
                </TouchableOpacity>
              </BlurView>
            ))}
          </View>
        </>
      )}
    </>
  );
}

// ── OverviewRow ───────────────────────────────────────────────────────────────

function OverviewRow({ item, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <BlurView intensity={12} tint="dark" style={[styles.card, { paddingLeft: 10 }]}>
        <View style={[styles.statusStripe, { backgroundColor: item.color }]} />
        <View style={styles.cardLeft}>
          <View style={[styles.cardIconWrap, { backgroundColor: item.color + "18", borderColor: item.color + "44" }]}>
            <Ionicons name="bandage-outline" size={16} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.animalName}{item.animalTag ? ` · ${item.animalTag}` : ""}
            </Text>
            <Text style={[styles.cardMeta, { marginTop: 2 }]}>{item.vaccineType}</Text>
            <View style={styles.cardRow}>
              <Ionicons name="calendar-outline" size={11} color={item.color} />
              <Text style={[styles.cardMeta, { color: item.color }]}>{item.nextDate}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.color + "22", alignSelf: "center", marginLeft: 8 }]}>
          <Text style={[styles.statusBadgeText, { color: item.color }]}>{item.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={COLORS.muted} style={{ marginLeft: 6, alignSelf: "center" }} />
      </BlurView>
    </TouchableOpacity>
  );
}

// ── VaccineCard ───────────────────────────────────────────────────────────────

function VaccineCard({ vaccine, onDelete, onEditDate, disabled }) {
  const label = vaccine.type || vaccine.name || "—";
  const statusInfo = vaccine.nextDate ? getVaccineStatus(vaccine.nextDate) : null;

  return (
    <BlurView intensity={14} tint="dark" style={styles.card}>
      {/* Status indicator stripe */}
      {statusInfo && statusInfo.status !== "none" && (
        <View style={[styles.statusStripe, { backgroundColor: statusInfo.color }]} />
      )}

      <View style={styles.cardLeft}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="bandage-outline" size={17} color={COLORS.warm} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{label}</Text>

          {!!vaccine.date && (
            <View style={styles.cardRow}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
              <Text style={styles.cardMeta}>Uygulandı: {vaccine.date}</Text>
            </View>
          )}

          {!!vaccine.nextDate && statusInfo && (
            <View style={styles.cardRow}>
              <Ionicons name="arrow-forward-circle-outline" size={12} color={statusInfo.color} />
              <Text style={[styles.cardMeta, { color: statusInfo.color }]}>
                Sonraki: {vaccine.nextDate}
              </Text>
              {statusInfo.label && (
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "22" }]}>
                  <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!vaccine.nextDate && (
            <View style={styles.cardRow}>
              <Ionicons name="remove-circle-outline" size={12} color="rgba(234,244,255,0.30)" />
              <Text style={[styles.cardMeta, { color: "rgba(234,244,255,0.30)" }]}>
                Sonraki tarih belirsiz
              </Text>
            </View>
          )}

          {!!vaccine.note && (
            <Text style={styles.cardNote} numberOfLines={2}>{vaccine.note}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={onEditDate}
          disabled={disabled}
          style={styles.editBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="calendar-outline" size={15} color={COLORS.success} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          disabled={disabled}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

// ── SummaryChip ───────────────────────────────────────────────────────────────

function SummaryChip({ count, label, color, icon }) {
  return (
    <View style={[styles.summaryChip, { borderColor: color + "44", backgroundColor: color + "18" }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.summaryChipCount, { color }]}>{count}</Text>
      <Text style={[styles.summaryChipLabel, { color: color + "CC" }]}>{label}</Text>
    </View>
  );
}

// ── EditNextDateModal ─────────────────────────────────────────────────────────

function EditNextDateModal({ visible, vaccine, nextDate, onChangeDatePress, onSave, onClose, busy }) {
  if (!vaccine) return null;
  const statusInfo = nextDate ? getVaccineStatus(nextDate) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.editModalCard}>
          <Text style={styles.editModalTitle}>Sonraki Aşı Tarihi</Text>
          <Text style={styles.editModalSub}>{vaccine.type}</Text>

          <Pressable onPress={onChangeDatePress} style={styles.editDateRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={statusInfo ? statusInfo.color : COLORS.warm}
            />
            <Text
              style={[
                styles.editDateText,
                !nextDate && styles.selectPlaceholder,
                statusInfo && { color: statusInfo.color },
              ]}
            >
              {nextDate || "Tarih seçin"}
            </Text>
            {statusInfo?.label && (
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "22" }]}>
                <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.editModalHint}>
            Tarihi değiştirirseniz eski hatırlatıcılar iptal edilir, yeni tarih için yeni hatırlatıcılar planlanır.
          </Text>

          <View style={styles.editModalActions}>
            <TouchableOpacity
              style={styles.editCancelBtn}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.editCancelText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={busy || !nextDate}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={["#FFAA5A", "#FF8C2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.editSaveBtn, (!nextDate || busy) && { opacity: 0.5 }]}
              >
                {busy ? (
                  <ActivityIndicator color="#050914" size="small" />
                ) : (
                  <Text style={styles.editSaveText}>Kaydet & Hatırlatıcıları Güncelle</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    marginBottom: 14,
  },
  topTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  topSub: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
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

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryChipCount: { fontWeight: "900", fontSize: 13 },
  summaryChipLabel: { fontWeight: "700", fontSize: 12 },

  sectionHead: { marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontWeight: "950", fontSize: 14 },
  sectionSub: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginTop: 3 },

  centered: { paddingVertical: 40, alignItems: "center" },

  emptyCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  emptyText: { color: "rgba(234,244,255,0.55)", fontWeight: "900", fontSize: 14 },
  emptySubText: {
    color: "rgba(234,244,255,0.32)",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },

  list: { gap: 10 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    paddingLeft: 10,
    overflow: "hidden",
  },
  statusStripe: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 4,
    marginRight: 8,
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,170,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.24)",
    marginTop: 1,
  },
  cardName: { color: COLORS.text, fontWeight: "900", fontSize: 15, marginBottom: 4 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
    flexWrap: "wrap",
  },
  cardMeta: { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  cardNote: {
    color: "rgba(234,244,255,0.50)",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "900" },

  cardActions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(78,205,196,0.10)",
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.22)",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,107,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.22)",
  },

  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
    overflow: "hidden",
  },

  fieldWrap: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center" },
  fieldLabel: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },
  fieldRequired: { color: COLORS.warm, fontWeight: "900", fontSize: 13 },
  fieldOptional: { color: "rgba(234,244,255,0.35)", fontWeight: "700", fontSize: 11 },

  autoBadge: {
    marginLeft: 6,
    backgroundColor: "rgba(78,205,196,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(78,205,196,0.30)",
  },
  autoBadgeText: { color: COLORS.success, fontSize: 10, fontWeight: "900" },
  autoHint: { color: "rgba(78,205,196,0.55)", fontSize: 11, fontWeight: "700", marginTop: -2 },

  selectRow: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  selectRowAuto: {
    borderColor: "rgba(78,205,196,0.30)",
    backgroundColor: "rgba(78,205,196,0.06)",
  },
  selectText: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  selectPlaceholder: { color: "rgba(234,244,255,0.30)" },

  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  inputMultiline: {
    height: 80,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    textAlignVertical: "top",
  },

  saveBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: COLORS.bg1, fontWeight: "900", fontSize: 15 },

  // ── DatePickerSheet stiller ──────────────────────────────────────────────────
  pickerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B1026",
  },
  iosPickerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  iosDoneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  iosDoneText: { color: COLORS.warm, fontWeight: "900" },

  // ── SimpleSelectModal stiller ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 18,
  },
  modalPortal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    maxHeight: "70%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0D1220",
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { color: COLORS.warm, fontWeight: "900", fontSize: 14 },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalItemText: { color: COLORS.text, fontWeight: "800" },
  modalItemSub: { color: COLORS.muted, marginTop: 4, fontSize: 12 },

  // ── EditNextDateModal stiller ────────────────────────────────────────────────
  editModalCard: {
    backgroundColor: "#0D1220",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 20,
    gap: 14,
  },
  editModalTitle: { color: COLORS.text, fontWeight: "900", fontSize: 16 },
  editModalSub: { color: COLORS.warm, fontWeight: "800", fontSize: 13, marginTop: -8 },
  editModalHint: {
    color: "rgba(234,244,255,0.40)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  editDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  editDateText: { flex: 1, color: COLORS.text, fontWeight: "800", fontSize: 15 },
  editModalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  editCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  editCancelText: { color: COLORS.muted, fontWeight: "800", fontSize: 13 },
  editSaveBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  editSaveText: { color: "#050914", fontWeight: "900", fontSize: 13, textAlign: "center" },
});
