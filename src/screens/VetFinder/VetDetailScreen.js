import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { fmtKm } from "./VetFinderScreen";

// react-native-maps opsiyonel
let MapView = null;
let Marker = null;
let Polyline = null;
try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
} catch {
  // Expo Go'da harita yok
}

const MAP_HEIGHT = 260;

export default function VetDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile } = useFarmerAuth();

  const { vet, farmerCoords } = route.params ?? {};

  const initials = useMemo(
    () =>
      (vet?.fullName || "VT")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join(""),
    [vet?.fullName],
  );

  const hasVetLocation =
    vet?.location?.latitude !== undefined &&
    vet?.location?.longitude !== undefined;

  // Orta nokta: haritayı her iki konumu kapsayacak şekilde ayarla
  const mapRegion = useMemo(() => {
    if (!hasVetLocation) return null;
    const vLat = vet.location.latitude;
    const vLon = vet.location.longitude;

    if (!farmerCoords) {
      return { latitude: vLat, longitude: vLon, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }

    const fLat = farmerCoords.latitude;
    const fLon = farmerCoords.longitude;
    const midLat = (vLat + fLat) / 2;
    const midLon = (vLon + fLon) / 2;
    const deltaLat = Math.abs(vLat - fLat) * 1.6 + 0.01;
    const deltaLon = Math.abs(vLon - fLon) * 1.6 + 0.01;
    return {
      latitude: midLat,
      longitude: midLon,
      latitudeDelta: Math.max(deltaLat, 0.02),
      longitudeDelta: Math.max(deltaLon, 0.02),
    };
  }, [vet, farmerCoords, hasVetLocation]);

  const handleMessage = () => {
    if (!farmerProfile?.uid || !vet?.uid) return;
    const chatId = [farmerProfile.uid, vet.uid].sort().join("_");
    navigation.navigate("ChatRoom", {
      chatId,
      otherName: vet.fullName || vet.clinicName || "Veteriner",
      otherUserId: vet.uid,
    });
  };

  const handleCall = () => {
    const phone = String(vet?.phone ?? "").trim();
    if (!phone || phone === "0") {
      Alert.alert("Telefon Yok", "Bu veterinerin telefon numarası kayıtlı değil.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Hata", "Arama başlatılamadı."),
    );
  };

  const handleOpenMaps = () => {
    if (!hasVetLocation) return;
    const { latitude, longitude } = vet.location;
    const label = encodeURIComponent(vet.clinicName || vet.fullName || "Veteriner");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url).catch(() =>
      Alert.alert("Hata", "Harita uygulaması açılamadı."),
    );
  };

  if (!vet) return null;

  return (
    <LinearGradient colors={["#050914", "#070B12"]} style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {vet.fullName || "Veteriner"}
        </Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      >
        {/* HARİTA */}
        {hasVetLocation && MapView ? (
          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
            >
              {/* Veteriner konumu */}
              <Marker
                coordinate={vet.location}
                title={vet.clinicName || vet.fullName}
                pinColor="#7BBEFF"
              />
              {/* Çiftçi konumu */}
              {farmerCoords && (
                <Marker
                  coordinate={farmerCoords}
                  title="Konumunuz"
                  pinColor="#32D583"
                />
              )}
              {/* Aralarındaki çizgi */}
              {farmerCoords && Polyline && (
                <Polyline
                  coordinates={[farmerCoords, vet.location]}
                  strokeColor="rgba(123,190,255,0.5)"
                  strokeWidth={2}
                  lineDashPattern={[6, 4]}
                />
              )}
            </MapView>

            {/* Haritayı aç butonu */}
            <TouchableOpacity
              style={styles.openMapBtn}
              onPress={handleOpenMaps}
              activeOpacity={0.9}
            >
              <Ionicons name="navigate-outline" size={14} color="#EAF4FF" />
              <Text style={styles.openMapText}>Haritada Aç</Text>
            </TouchableOpacity>
          </View>
        ) : hasVetLocation && !MapView ? (
          /* Harita yok ama konum var — fallback banner */
          <TouchableOpacity
            style={styles.mapFallback}
            onPress={handleOpenMaps}
            activeOpacity={0.9}
          >
            <Ionicons name="map-outline" size={28} color="#7BBEFF" />
            <View>
              <Text style={styles.mapFallbackTitle}>Konuma Git</Text>
              <Text style={styles.mapFallbackSub}>
                {vet.location.latitude.toFixed(5)}, {vet.location.longitude.toFixed(5)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(234,244,255,0.4)" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        ) : (
          <View style={styles.noLocationBanner}>
            <Ionicons name="location-outline" size={20} color="rgba(234,244,255,0.25)" />
            <Text style={styles.noLocationText}>
              Bu veteriner konum bilgisi paylaşmamış.
            </Text>
          </View>
        )}

        {/* BİLGİ KARTI */}
        <View style={styles.card}>
          {/* Avatar + isim satırı */}
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vetName}>{vet.fullName || "Veteriner"}</Text>
              {!!vet.clinicName && (
                <Text style={styles.clinicName}>{vet.clinicName}</Text>
              )}
            </View>
            {vet.distance !== null && (
              <View style={styles.distBadge}>
                <Ionicons name="navigate" size={12} color="#7BBEFF" />
                <Text style={styles.distText}>{fmtKm(vet.distance)}</Text>
              </View>
            )}
          </View>

          {/* Detay satırları */}
          {!!vet.specialization && (
            <InfoRow icon="medal-outline" label="Uzmanlık" value={vet.specialization} />
          )}
          {!!(vet.city || vet.district) && (
            <InfoRow
              icon="location-outline"
              label="Konum"
              value={[vet.district, vet.city].filter(Boolean).join(", ")}
            />
          )}
          {!!vet.phone && vet.phone !== "0" && (
            <InfoRow icon="call-outline" label="Telefon" value={vet.phone} />
          )}
        </View>

        {/* AKSİYON BUTONLARI */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleMessage}
            activeOpacity={0.9}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0B1220" />
            <Text style={styles.primaryBtnText}>Mesaj Gönder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleCall}
            activeOpacity={0.9}
          >
            <Ionicons name="call-outline" size={18} color="#EAF4FF" />
            <Text style={styles.secondaryBtnText}>Ara</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name={icon} size={16} color="#7BBEFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  headerTitle: { flex: 1, color: "#EAF4FF", fontSize: 16, fontWeight: "900" },

  /* Harita */
  mapWrap: { position: "relative", marginBottom: 14 },
  map: { width: "100%", height: MAP_HEIGHT },
  openMapBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(11,18,32,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  openMapText: { color: "#EAF4FF", fontSize: 12, fontWeight: "800" },

  mapFallback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(123,190,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.2)",
  },
  mapFallbackTitle: { color: "#EAF4FF", fontWeight: "900", fontSize: 14 },
  mapFallbackSub: { color: "rgba(234,244,255,0.5)", fontSize: 11, fontWeight: "700", marginTop: 2 },

  noLocationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  noLocationText: { color: "rgba(234,244,255,0.4)", fontSize: 12, fontWeight: "700" },

  /* Bilgi kartı */
  card: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(123,190,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#EAF4FF", fontWeight: "900", fontSize: 18 },
  vetName: { color: "#EAF4FF", fontSize: 16, fontWeight: "900" },
  clinicName: { color: "rgba(234,244,255,0.55)", fontSize: 13, fontWeight: "700", marginTop: 2 },
  distBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(123,190,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.22)",
  },
  distText: { color: "#7BBEFF", fontSize: 12, fontWeight: "900" },

  /* Aksiyon butonları */
  actions: { flexDirection: "row", gap: 10, marginHorizontal: 16 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#EAF4FF",
  },
  primaryBtnText: { color: "#0B1220", fontWeight: "900", fontSize: 14 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  secondaryBtnText: { color: "#EAF4FF", fontWeight: "800", fontSize: 14 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(123,190,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: "rgba(234,244,255,0.45)", fontSize: 11, fontWeight: "700" },
  value: { color: "#EAF4FF", fontSize: 13, fontWeight: "800", marginTop: 1 },
});
