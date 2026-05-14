import React, { useState, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// react-native-maps opsiyonel — Expo Go'da olmayabilir
let MapView = null;
let Marker = null;
try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
} catch {
  // Expo Go veya dev build'siz ortam — haritasız fallback kullanılır
}

const TURKEY_CENTER = { latitude: 39.9334, longitude: 32.8597 };

export default function LocationPickerModal({
  visible,
  onConfirm,
  onClose,
  initialLocation,
}) {
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(initialLocation ?? TURKEY_CENTER);
  const [locating, setLocating] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");

  const mapsAvailable = MapView !== null;

  const handleMapPress = useCallback((e) => {
    setMarker(e.nativeEvent.coordinate);
  }, []);

  const handleDragEnd = useCallback((e) => {
    setMarker(e.nativeEvent.coordinate);
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Konum İzni Gerekli",
          "Konumunuzu kullanmak için lütfen izin verin.",
          [{ text: "Tamam" }],
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMarker(coords);
      if (mapsAvailable) {
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          500,
        );
      }
    } catch {
      Alert.alert(
        "Konum Alınamadı",
        "Cihaz konumu alınamadı. Lütfen koordinatları manuel girin.",
      );
    } finally {
      setLocating(false);
    }
  }, [mapsAvailable]);

  const handleConfirm = useCallback(() => {
    onConfirm(marker);
  }, [marker, onConfirm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={["#040716", "#050914"]}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Ionicons name="close" size={22} color="#EAF4FF" />
          </TouchableOpacity>
          <Text style={styles.title}>Konum Seç</Text>
          <View style={{ width: 42 }} />
        </View>

        {mapsAvailable ? (
          /* ── HARİTALI MOD ── */
          <>
            <Text style={styles.hint}>
              Haritaya dokun veya markeri sürükle
            </Text>

            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: marker.latitude,
                longitude: marker.longitude,
                latitudeDelta: initialLocation ? 0.05 : 5,
                longitudeDelta: initialLocation ? 0.05 : 5,
              }}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={handleDragEnd}
              />
            </MapView>

            <View style={styles.coordBar}>
              <Ionicons name="location" size={16} color="#7BBEFF" />
              <Text style={styles.coordText}>
                {marker.latitude.toFixed(6)},{" "}
                {marker.longitude.toFixed(6)}
              </Text>
            </View>
          </>
        ) : (
          /* ── HARİTASIZ FALLBACK MOD ── */
          <View style={styles.fallback}>
            <View style={styles.fallbackCard}>
              <Ionicons name="map-outline" size={40} color="rgba(234,244,255,0.2)" />
              <Text style={styles.fallbackTitle}>
                Harita bu ortamda kullanılamıyor
              </Text>
              <Text style={styles.fallbackSub}>
                Konumunuzu almak için aşağıdaki butonu kullanın
              </Text>
            </View>

            {/* Seçilen koordinatlar */}
            <View style={styles.coordBig}>
              <Ionicons name="location" size={20} color="#7BBEFF" />
              <View>
                <Text style={styles.coordLabel}>Seçilen Konum</Text>
                <Text style={styles.coordValue}>
                  {marker.latitude.toFixed(6)},{"  "}
                  {marker.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ORTAK BUTONLAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.locBtn}
            onPress={handleUseCurrentLocation}
            disabled={locating}
            activeOpacity={0.9}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#EAF4FF" />
            ) : (
              <>
                <Ionicons name="locate-outline" size={18} color="#EAF4FF" />
                <Text style={styles.locBtnText}>Konumumu Kullan</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmText}>Onayla</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === "android" && <View style={{ height: 16 }} />}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
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
  title: { color: "#EAF4FF", fontSize: 17, fontWeight: "900" },

  hint: {
    color: "rgba(234,244,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  map: { flex: 1 },

  coordBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  coordText: {
    color: "rgba(234,244,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Fallback */
  fallback: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },
  fallbackCard: {
    alignItems: "center",
    gap: 10,
    padding: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  fallbackTitle: {
    color: "#EAF4FF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  fallbackSub: {
    color: "rgba(234,244,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  coordBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(123,190,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.18)",
  },
  coordLabel: {
    color: "rgba(234,244,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  coordValue: {
    color: "#7BBEFF",
    fontSize: 13,
    fontWeight: "900",
  },

  /* Alt butonlar */
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  locBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  locBtnText: { color: "#EAF4FF", fontWeight: "800", fontSize: 13 },
  confirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "#EAF4FF",
  },
  confirmText: { color: "#050914", fontWeight: "900", fontSize: 14 },
});
