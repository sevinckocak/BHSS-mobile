import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";

// ─── Haversine ────────────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtKm(km) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Module-level cache (3 dakika TTL) ───────────────────────────────────────
const RAW_CACHE = { docs: null, ts: 0 };
const CACHE_TTL_MS = 3 * 60 * 1000;

function isCacheValid() {
  return RAW_CACHE.docs !== null && Date.now() - RAW_CACHE.ts < CACHE_TTL_MS;
}

function buildVetList(rawDocs, coords) {
  return rawDocs
    .map((d) => {
      const data = d.data ? d.data() : d; // cache'den geliyorsa .data yok
      const loc = data.location;
      const hasLoc =
        loc &&
        typeof loc.latitude === "number" &&
        typeof loc.longitude === "number";
      const distance =
        coords && hasLoc
          ? haversineKm(coords.latitude, coords.longitude, loc.latitude, loc.longitude)
          : null;
      return {
        uid: d.id ?? data.uid,
        fullName: (data.name || "").trim(),
        clinicName: (data.clinic_name || "").trim(),
        specialization: (data.specialization || "").trim(),
        phone: String(data.phone ?? ""),
        city: (data.city || "").trim(),
        district: (data.district || "").trim(),
        location: hasLoc ? loc : null,
        distance,
      };
    })
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return (a.fullName || "").localeCompare(b.fullName || "", "tr");
    });
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function VetFinderScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile, updateFarmerProfile } = useFarmerAuth();

  const [loading, setLoading] = useState(!isCacheValid());
  const [refreshing, setRefreshing] = useState(false);
  const [vets, setVets] = useState(() =>
    isCacheValid() ? buildVetList(RAW_CACHE.docs, null) : [],
  );
  const [permDenied, setPermDenied] = useState(false);
  const [hasCoords, setHasCoords] = useState(false);
  const farmerCoordsRef = useRef(null);

  // ── Koordinatları uygula (cache varsa anında, yoksa fetch'i bekle) ──────────
  const applyCoords = useCallback((coords) => {
    farmerCoordsRef.current = coords;
    setHasCoords(true);
    setVets((prev) => {
      if (prev.length === 0) return prev;
      return buildVetList(
        RAW_CACHE.docs ?? prev.map((v) => ({ id: v.uid, data: () => v })),
        coords,
      );
    });
  }, []);

  // ── Ana yükleme (paralel GPS + Firestore) ─────────────────────────────────
  const load = useCallback(
    async (opts = {}) => {
      const isManualRefresh = opts.manual === true;

      if (isManualRefresh) {
        setRefreshing(true);
      } else if (!isCacheValid()) {
        setLoading(true);
      }

      // ── Anlık GPS: son bilinen konum (0 ms) ─────────────────────────────
      const permCheck = await Location.getForegroundPermissionsAsync();
      if (permCheck.status === "granted") {
        const last = await Location.getLastKnownPositionAsync({
          maxAge: 10 * 60 * 1000, // 10 dk'dan yeni ise kullan
          requiredAccuracy: 5000,  // 5 km tolerans
        });
        if (last) {
          const c = { latitude: last.coords.latitude, longitude: last.coords.longitude };
          // Cache varsa hemen sıralı liste göster
          if (isCacheValid()) {
            farmerCoordsRef.current = c;
            setHasCoords(true);
            setVets(buildVetList(RAW_CACHE.docs, c));
            if (!isManualRefresh) setLoading(false);
          }
        }
      }

      // ── Paralel: taze GPS + Firestore ────────────────────────────────────
      const [locResult, docsResult] = await Promise.allSettled([
        // GPS: izin iste, taze konum al (Accuracy.Low ≈ 100-500ms)
        Location.requestForegroundPermissionsAsync().then(({ status }) => {
          if (status !== "granted") return Promise.reject(new Error("denied"));
          return Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        }),
        // Firestore: cache varsa atla
        isCacheValid() && !isManualRefresh
          ? Promise.resolve(null)
          : getDocs(collection(db, "vet_info")),
      ]);

      // ── Firestore sonucu işle ─────────────────────────────────────────────
      if (docsResult.status === "fulfilled" && docsResult.value !== null) {
        RAW_CACHE.docs = docsResult.value.docs;
        RAW_CACHE.ts = Date.now();
      }

      // ── GPS sonucu işle ───────────────────────────────────────────────────
      let coords = farmerCoordsRef.current; // last-known fallback
      if (locResult.status === "fulfilled") {
        const { latitude, longitude } = locResult.value.coords;
        coords = { latitude, longitude };
        farmerCoordsRef.current = coords;
        setHasCoords(true);
        setPermDenied(false);
        if (!farmerProfile?.location?.latitude) {
          updateFarmerProfile({ location: coords }).catch(() => {});
        }
      } else if (locResult.reason?.message === "denied") {
        setPermDenied(true);
      }

      // ── Final liste ───────────────────────────────────────────────────────
      const rawDocs = RAW_CACHE.docs ?? [];
      setVets(buildVetList(rawDocs, coords));
      setLoading(false);
      setRefreshing(false);
    },
    [farmerProfile, updateFarmerProfile],
  );

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Veteriner detay sayfasına git ─────────────────────────────────────────
  const handleDetail = useCallback(
    (vet) => {
      navigation.navigate("VetDetail", {
        vet,
        farmerCoords: farmerCoordsRef.current,
      });
    },
    [navigation],
  );

  // ── Mesaj gönder ──────────────────────────────────────────────────────────
  const handleMessage = useCallback(
    (vet) => {
      if (!farmerProfile?.uid) return;
      const chatId = [farmerProfile.uid, vet.uid].sort().join("_");
      navigation.navigate("ChatRoom", {
        chatId,
        otherName: vet.fullName || vet.clinicName || "Veteriner",
        otherUserId: vet.uid,
      });
    },
    [farmerProfile, navigation],
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={["#050914", "#070B12"]} style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.9}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Yakındaki Veterinerler</Text>
          <Text style={styles.headerSub}>
            {hasCoords
              ? "Konumunuza göre sıralandı"
              : "Konum alınıyor..."}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.iconBtn, refreshing && { opacity: 0.5 }]}
          activeOpacity={0.9}
          onPress={() => load({ manual: true })}
          disabled={refreshing}
        >
          <Ionicons
            name={refreshing ? "sync" : "refresh-outline"}
            size={20}
            color="#EAF4FF"
          />
        </TouchableOpacity>
      </View>

      {/* İZİN UYARISI */}
      {permDenied && (
        <View style={styles.permBanner}>
          <Ionicons name="warning-outline" size={16} color="#FFAA5A" />
          <Text style={styles.permText}>
            Konum izni verilmedi. Mesafe hesaplanamıyor.
          </Text>
          <TouchableOpacity onPress={() => load({ manual: true })} style={styles.retryBtn}>
            <Text style={styles.retryText}>Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* İÇERİK */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7BBEFF" size="large" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : vets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color="rgba(234,244,255,0.2)" />
          <Text style={styles.emptyText}>Kayıtlı veteriner bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={vets}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          windowSize={7}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          renderItem={({ item, index }) => (
            <VetCard
              vet={item}
              rank={index + 1}
              onPress={handleDetail}
              onMessage={handleMessage}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={
            <View style={{ height: Platform.OS === "ios" ? 36 : 22 }} />
          }
        />
      )}
    </LinearGradient>
  );
}

// ─── VetCard ──────────────────────────────────────────────────────────────────
function VetCard({ vet, rank, onPress, onMessage }) {
  const initials = (vet.fullName || "VT")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <TouchableOpacity
      style={cardStyles.card}
      activeOpacity={0.85}
      onPress={() => onPress(vet)}
    >
      <View style={cardStyles.left}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>{initials}</Text>
        </View>
        <Text style={cardStyles.rank}>#{rank}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={cardStyles.name} numberOfLines={1}>
          {vet.fullName || "Veteriner"}
        </Text>
        {!!vet.clinicName && (
          <Text style={cardStyles.clinic} numberOfLines={1}>
            {vet.clinicName}
          </Text>
        )}
        <View style={cardStyles.tagsRow}>
          {!!vet.specialization && (
            <View style={cardStyles.tag}>
              <Text style={cardStyles.tagText}>{vet.specialization}</Text>
            </View>
          )}
          {!!(vet.city || vet.district) && (
            <View style={[cardStyles.tag, cardStyles.tagGeo]}>
              <Ionicons name="location-outline" size={10} color="rgba(234,244,255,0.6)" />
              <Text style={cardStyles.tagText}>
                {[vet.district, vet.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={cardStyles.right}>
        {vet.distance !== null ? (
          <View style={cardStyles.distBadge}>
            <Ionicons name="navigate" size={11} color="#7BBEFF" />
            <Text style={cardStyles.distText}>{fmtKm(vet.distance)}</Text>
          </View>
        ) : (
          <View style={[cardStyles.distBadge, cardStyles.distBadgeGray]}>
            <Text style={[cardStyles.distText, { color: "rgba(234,244,255,0.3)" }]}>—</Text>
          </View>
        )}

        <TouchableOpacity
          style={cardStyles.msgBtn}
          activeOpacity={0.9}
          onPress={(e) => {
            e.stopPropagation?.();
            onMessage(vet);
          }}
        >
          <Ionicons name="chatbubble-outline" size={14} color="#0B1220" />
          <Text style={cardStyles.msgText}>Mesaj</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  headerTitle: { color: "#EAF4FF", fontSize: 16, fontWeight: "900" },
  headerSub: { color: "rgba(234,244,255,0.45)", fontSize: 11, fontWeight: "700", marginTop: 1 },

  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,170,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.25)",
  },
  permText: { flex: 1, color: "rgba(234,244,255,0.75)", fontSize: 12, fontWeight: "700" },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(255,170,90,0.18)" },
  retryText: { color: "#FFAA5A", fontSize: 11, fontWeight: "800" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "rgba(234,244,255,0.5)", fontSize: 13, fontWeight: "700", marginTop: 8 },
  emptyText: { color: "rgba(234,244,255,0.4)", fontSize: 14, fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingTop: 4 },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  left: { alignItems: "center", gap: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(123,190,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#EAF4FF", fontWeight: "900", fontSize: 15 },
  rank: { color: "rgba(234,244,255,0.35)", fontSize: 10, fontWeight: "800" },

  name: { color: "#EAF4FF", fontSize: 14, fontWeight: "900" },
  clinic: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "700", marginTop: 1 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  tagGeo: { backgroundColor: "rgba(123,190,255,0.07)" },
  tagText: { color: "rgba(234,244,255,0.65)", fontSize: 10, fontWeight: "700" },

  right: { alignItems: "center", gap: 8 },
  distBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(123,190,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.22)",
  },
  distBadgeGray: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  distText: { color: "#7BBEFF", fontSize: 11, fontWeight: "900" },
  msgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#EAF4FF",
  },
  msgText: { color: "#0B1220", fontSize: 11, fontWeight: "900" },
});
