import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActivities } from "../../context/ActivitiesContext";
import { useAnimals } from "../../context/AnimalsContext";

import { COLORS } from "./constants/colors";
import { CHIP_ICONS } from "./constants/chipIcons";
import { styles } from "./styles/home.styles";

import HerdChip from "./components/HerdChip";
import QuickCard from "./components/QuickCard";
import DonutChart from "./components/DonutChart";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tagQuery, setTagQuery] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

  const { animals, loadingAnimals } = useAnimals();

  const {
    activities,
    loadingActivities,
    activitiesError,
    logActivity,
    uid,
    booting,
  } = useActivities();

  // -------------------------
  // Text helpers
  // -------------------------
  const toText = (v) => (v == null ? "" : String(v)).toLowerCase().trim();
  const normalizeTr = (s) =>
    toText(s)
      .replaceAll("ı", "i")
      .replaceAll("ğ", "g")
      .replaceAll("ş", "s")
      .replaceAll("ö", "o")
      .replaceAll("ü", "u")
      .replaceAll("ç", "c");
  const hasWordTr = (text, words) => {
    const t = normalizeTr(text);
    return words.some((w) => t.includes(normalizeTr(w)));
  };

  // -------------------------
  // Status detectors (senin schema'ya göre)
  // -------------------------
  const isSick = useCallback((a) => {
    if (a?.isSick === true) return true;
    const status = a?.healthStatus || a?.status || a?.condition || a?.state;
    return hasWordTr(status, ["hasta", "sick"]);
  }, []);

  const isPregnant = useCallback((a) => {
    if (a?.isPregnant === true) return true;
    if (a?.pregnant === true) return true;
    const status = a?.healthStatus || a?.status || a?.condition || a?.state;
    return hasWordTr(status, ["gebe", "pregnant"]);
  }, []);

  // ✅ kesin: lactationStatus: "lactating" | "dry"
  const isLactating = useCallback((a) => {
    const s = toText(a?.lactationStatus);
    return s === "lactating";
  }, []);

  const isDry = useCallback((a) => {
    const s = toText(a?.lactationStatus);
    return s === "dry";
  }, []);

  // -------------------------
  // Vaccine upcoming detector (14 gün)
  // -------------------------
  const parseDateFlexible = (val) => {
    if (!val) return null;

    // Firestore Timestamp
    if (typeof val === "object" && typeof val?.toDate === "function") {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    }

    const s = String(val).trim();

    // ISO / YYYY-MM-DD gibi
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  };

  const hasUpcomingVaccine = useCallback((a, days = 14) => {
    const list = Array.isArray(a?.vaccines) ? a.vaccines : [];
    if (list.length === 0) return false;

    const now = new Date();
    const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return list.some((v) => {
      const dt = parseDateFlexible(v?.date);
      if (!dt) return false;
      return dt >= now && dt <= limit;
    });
  }, []);

  // -------------------------
  // Stats for chips + donut (no mock)
  // -------------------------
  const herdStats = useMemo(() => {
    const list = Array.isArray(animals) ? animals : [];

    let sick = 0;
    let pregnant = 0;
    let lactating = 0;
    let dry = 0;
    let vaccineUpcoming = 0;

    for (const a of list) {
      if (isSick(a)) sick += 1;
      if (isPregnant(a)) pregnant += 1;
      if (isLactating(a)) lactating += 1;
      if (isDry(a)) dry += 1;
      if (hasUpcomingVaccine(a, 14)) vaccineUpcoming += 1;
    }

    const total = list.length;

    // Donut sadece 3 kategori: hasta/gebe/sağlıklı
    // Öncelik: hasta > gebe > sağlıklı
    let healthy = 0;
    for (const a of list) {
      if (isSick(a)) continue;
      if (isPregnant(a)) continue;
      healthy += 1;
    }

    const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);

    return {
      total,
      sick,
      pregnant,
      healthy,
      lactating,
      dry,
      vaccineUpcoming,
      pctHealthy: pct(healthy),
      pctPregnant: pct(pregnant),
      pctSick: pct(sick),
    };
  }, [animals, isSick, isPregnant, isLactating, isDry, hasUpcomingVaccine]);

  const healthDistribution = useMemo(
    () => [
      {
        label: "Sağlıklı",
        value: herdStats.healthy,
        color: COLORS.success,
        percentage: herdStats.pctHealthy,
      },
      {
        label: "Gebe",
        value: herdStats.pregnant,
        color: COLORS.warm,
        percentage: herdStats.pctPregnant,
      },
      {
        label: "Hasta",
        value: herdStats.sick,
        color: COLORS.danger,
        percentage: herdStats.pctSick,
      },
    ],
    [herdStats],
  );

  // -------------------------
  // Activities (3 / all)
  // -------------------------
  const visibleActivities = useMemo(() => {
    if (showAllActivities) return activities;
    return activities.slice(0, 3);
  }, [activities, showAllActivities]);

  const safeLog = useCallback(
    async (payload) => {
      try {
        await logActivity(payload);
      } catch (e) {
        console.log("HOME safeLog ERROR:", e?.code, e?.message);
      }
    },
    [logActivity],
  );

  const onFindByTag = () =>
    navigation?.navigate?.("AnimalSearch", { tag: tagQuery });

  const onVetFinder = async () => {
    await safeLog({
      type: "general",
      title: "Veteriner Bul",
      meta: "Yakındaki veteriner ekranı açıldı",
      route: "VetFinder",
    });
    navigation?.navigate?.("VetFinder");
  };

  const onCreateAppointment = async () => {
    await safeLog({
      type: "appointment",
      title: "Takvim",
      meta: "Randevu & hatırlatma",
      route: "TabCalendar",
    });
    navigation?.navigate?.("TabCalendar");
  };

  const onMessages = async () => {
    await safeLog({
      type: "chat",
      title: "Mesaj",
      meta: "Veterinerle mesajlaşma",
      route: "Messages",
    });
    navigation?.navigate?.("Messages");
  };

  const onGoAnimals = async () => {
    await safeLog({
      type: "animal",
      title: "Hayvanlar",
      meta: "Hayvan listesi açıldı",
      route: "AnimalsScreen",
    });
    navigation?.navigate?.("AnimalsScreen");
  };

  const onGoVaccines = async () => {
    await safeLog({
      type: "vaccine",
      title: "Aşılar",
      meta: "Aşı ekranı açıldı",
      route: "VaccinesScreen",
    });
    navigation?.navigate?.("VaccinesScreen");
  };

  // -------------------------
  // Herd chips: orijinal 6 chip + gerçek değer
  // -------------------------
  const herdChips = useMemo(
    () => [
      {
        key: "sick",
        label: "Hasta",
        value: herdStats.sick,
        img: CHIP_ICONS.sick,
        tone: "danger",
        onPress: () => navigation?.navigate?.("Animals", { filter: "sick" }),
      },
      {
        key: "pregnant",
        label: "Gebe",
        value: herdStats.pregnant,
        img: CHIP_ICONS.pregnant,
        tone: "warn",
        onPress: () =>
          navigation?.navigate?.("Animals", { filter: "pregnant" }),
      },
      {
        key: "lactating",
        label: "Sağımda",
        value: herdStats.lactating,
        img: CHIP_ICONS.lactating,
        tone: "default",
        onPress: () =>
          navigation?.navigate?.("Animals", { filter: "lactating" }),
      },
      {
        key: "dry",
        label: "Kuru",
        value: herdStats.dry,
        img: CHIP_ICONS.dry,
        tone: "default",
        onPress: () => navigation?.navigate?.("Animals", { filter: "dry" }),
      },
      {
        key: "vaccine",
        label: "Aşı Yakın",
        value: herdStats.vaccineUpcoming,
        img: CHIP_ICONS.vaccine,
        tone: "warn",
        onPress: () =>
          navigation?.navigate?.("Vaccines", { filter: "upcoming" }),
      },
      {
        key: "total",
        label: "Toplam",
        value: herdStats.total,
        img: CHIP_ICONS.total,
        tone: "accent",
        onPress: () => navigation?.navigate?.("Animals"),
      },
    ],
    [navigation, herdStats],
  );

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 10) + 10 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* DEBUG (istersen kaldır) */}
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
          uid: {uid ? "OK" : "YOK"} | booting: {String(booting)}
        </Text>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require("../../../assets/logo/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>BHSS</Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.9}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.text}
            />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>4</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={tagQuery}
            onChangeText={setTagQuery}
            placeholder="Küpe no ile ara (örn: TR-123456)"
            placeholderTextColor="rgba(234,244,255,0.35)"
            style={styles.searchInput}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={onFindByTag}
          />
          <TouchableOpacity
            style={styles.searchGo}
            onPress={onFindByTag}
            activeOpacity={0.9}
          >
            <Text style={styles.searchGoText}>Bul</Text>
          </TouchableOpacity>
        </View>

        {/* VETERİNER BUL */}
        <View style={styles.vetCard}>
          <View style={styles.vetBgWrap} pointerEvents="none">
            <Image
              source={require("../../../assets/images/vet-bg.jpeg")}
              style={styles.vetBgImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(5,9,20,0.20)", "rgba(5,9,20,0.92)"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.vetTitle}>Veteriner Bul</Text>
            <Text style={styles.vetDesc}>
              Yakındaki veterinerleri gör, iletişime geç veya randevu oluştur.
            </Text>

            <View style={styles.vetActions}>
              <TouchableOpacity
                style={styles.vetPrimary}
                onPress={onVetFinder}
                activeOpacity={0.9}
              >
                <Ionicons name="location-outline" size={18} color="#0B1220" />
                <Text style={styles.vetPrimaryText}>
                  Yakındaki Veterinerler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.vetSecondary}
                onPress={onCreateAppointment}
                activeOpacity={0.9}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.text} />
                <Text style={styles.vetSecondaryText}>Takvim</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.vetIconWrap}
            activeOpacity={0.9}
            onPress={onVetFinder}
          >
            <Ionicons name="add" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* SÜRÜ DURUMU */}
        <View style={styles.rowHeader}>
          <Text style={styles.sectionTitle}>Sürü Durumu</Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate?.("AnimalsScreen")}
            activeOpacity={0.9}
          >
            <Text style={styles.link}>Detay</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={herdChips}
          horizontal
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsList}
          renderItem={({ item }) => (
            <HerdChip
              img={item.img}
              label={item.label}
              value={loadingAnimals ? "…" : item.value}
              tone={item.tone}
              onPress={item.onPress}
            />
          )}
        />

        {/* HIZLI İŞLEMLER */}
        <Text style={[styles.sectionTitle, { marginTop: 2 }]}>
          Hızlı İşlemler
        </Text>

        <View style={styles.grid}>
          <QuickCard
            icon="chatbubble-ellipses-outline"
            title="Mesaj"
            subtitle="Veterinerle mesajlaşma"
            gradient={["rgba(123,190,255,0.15)", "rgba(123,190,255,0.05)"]}
            iconBg="rgba(123,190,255,0.20)"
            iconBorder="rgba(123,190,255,0.30)"
            onPress={onMessages}
          />

          <QuickCard
            icon="calendar-outline"
            title="Takvim"
            subtitle="Randevu & hatırlatma"
            gradient={["rgba(255,170,90,0.15)", "rgba(255,170,90,0.05)"]}
            iconBg="rgba(255,170,90,0.20)"
            iconBorder="rgba(255,170,90,0.30)"
            onPress={onCreateAppointment}
          />

          <QuickCard
            icon="barcode-outline"
            title="Hayvanlar"
            subtitle="Kayıt & filtreleme"
            gradient={["rgba(183,148,246,0.15)", "rgba(183,148,246,0.05)"]}
            iconBg="rgba(183,148,246,0.20)"
            iconBorder="rgba(183,148,246,0.30)"
            onPress={onGoAnimals}
          />

          <QuickCard
            icon="shield-checkmark-outline"
            title="Aşılar"
            subtitle="Takvim & geçmiş"
            gradient={["rgba(78,205,196,0.15)", "rgba(78,205,196,0.05)"]}
            iconBg="rgba(78,205,196,0.20)"
            iconBorder="rgba(78,205,196,0.30)"
            onPress={onGoVaccines}
          />
        </View>

        {/* HAYVAN SAĞLIK DURUMU (SADECE: SAĞLIKLI / GEBE / HASTA) */}
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View>
              <Text style={styles.healthTitle}>Hayvan Sağlık Durumu</Text>
              <Text style={styles.healthSubtitle}>
                {loadingAnimals
                  ? "Yükleniyor…"
                  : `Toplam ${herdStats.total} hayvan`}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation?.navigate?.("AnimalsScreen")}
            >
              <Text style={styles.link}>Detay</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.donutContainer}>
            <DonutChart data={healthDistribution} />
            <View style={styles.donutLegend}>
              {healthDistribution.map((item, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <View style={styles.legendInfo}>
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <View style={styles.legendValueRow}>
                      <Text style={styles.legendValue}>{item.value}</Text>
                      <Text style={styles.legendPercentage}>
                        ({item.percentage}%)
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SON AKTİVİTELER */}
        <View style={styles.activitiesCard}>
          <View style={styles.activitiesHeader}>
            <Text style={styles.activitiesTitle}>Son Aktiviteler</Text>
          </View>

          {!!activitiesError && (
            <Text style={[styles.activityMeta, { color: COLORS.danger }]}>
              Hata: {activitiesError?.code || ""}{" "}
              {activitiesError?.message || ""}
            </Text>
          )}

          {loadingActivities ? (
            <Text style={styles.activityMeta}>Yükleniyor…</Text>
          ) : activities.length === 0 ? (
            <Text style={styles.activityMeta}>Henüz aktivite yok.</Text>
          ) : (
            <>
              {visibleActivities.map((a) => {
                const ui = (() => {
                  switch (a.type) {
                    case "chat":
                      return {
                        icon: "chatbubble-ellipses-outline",
                        color: COLORS.accent,
                      };
                    case "appointment":
                      return { icon: "calendar-outline", color: COLORS.warm };
                    case "vaccine":
                      return {
                        icon: "shield-checkmark-outline",
                        color: COLORS.success,
                      };
                    case "animal":
                      return {
                        icon: "barcode-outline",
                        color: "rgba(183,148,246,1)",
                      };
                    default:
                      return {
                        icon: "flash-outline",
                        color: "rgba(255,255,255,0.22)",
                      };
                  }
                })();

                return (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.activityRow}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (a.route)
                        navigation?.navigate?.(a.route, a.routeParams || {});
                    }}
                  >
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: ui.color },
                      ]}
                    >
                      <Ionicons name={ui.icon} size={18} color="#FFF" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle}>{a.title}</Text>
                      <Text style={styles.activityMeta}>{a.meta}</Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.muted}
                    />
                  </TouchableOpacity>
                );
              })}

              {activities.length > 3 && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.moreBtn}
                  onPress={() => setShowAllActivities((p) => !p)}
                >
                  <Text style={styles.moreBtnText}>
                    {showAllActivities
                      ? "Daha az göster"
                      : `Daha fazla göster (${activities.length - 3})`}
                  </Text>
                  <Ionicons
                    name={showAllActivities ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ height: Platform.OS === "ios" ? 36 : 22 }} />
      </ScrollView>
    </LinearGradient>
  );
}
