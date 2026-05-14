import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVetAuth } from "../../context/VetAuthContext";
import LocationPickerModal from "../../components/LocationPicker/LocationPickerModal";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF", warm: "#FFAA5A",
};

export default function VetClinicInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vetProfile, updateVetProfile } = useVetAuth();

  const [clinicName,   setClinicName]   = useState(vetProfile?.clinicName ?? "");
  const [city,         setCity]         = useState(vetProfile?.city ?? "");
  const [district,     setDistrict]     = useState(vetProfile?.district ?? "");
  const [location,     setLocation]     = useState(vetProfile?.location ?? null);
  const [showPicker,   setShowPicker]   = useState(false);
  const [loading,      setLoading]      = useState(false);

  const isDirty =
    clinicName.trim() !== (vetProfile?.clinicName ?? "") ||
    city.trim()       !== (vetProfile?.city ?? "")       ||
    district.trim()   !== (vetProfile?.district ?? "")   ||
    JSON.stringify(location) !== JSON.stringify(vetProfile?.location ?? null);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateVetProfile({
        clinicName: clinicName.trim(),
        city: city.trim(),
        district: district.trim(),
        ...(location ? { location } : {}),
      });
      Alert.alert("Kaydedildi", "Klinik bilgileri güncellendi.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Hata", "Bilgiler kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const locationLabel = location
    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    : null;

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Klinik Bilgileri</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
      >
        <Text style={styles.sLabel}>Klinik Adı</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="Klinik / Muayenehane adı"
            placeholderTextColor="rgba(234,244,255,0.25)"
            style={styles.input}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.sLabel}>Konum</Text>
        <View style={styles.row}>
          <View style={[styles.inputWrap, { flex: 1 }]}>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="İl"
              placeholderTextColor="rgba(234,244,255,0.25)"
              style={styles.input}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.inputWrap, { flex: 1 }]}>
            <TextInput
              value={district}
              onChangeText={setDistrict}
              placeholder="İlçe"
              placeholderTextColor="rgba(234,244,255,0.25)"
              style={styles.input}
              autoCapitalize="words"
            />
          </View>
        </View>

        <Text style={[styles.sLabel, { marginTop: 18 }]}>Klinik Konumu (Harita)</Text>
        <TouchableOpacity
          style={[styles.locationBtn, location && styles.locationBtnSelected]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.88}
        >
          <Ionicons
            name={location ? "location" : "location-outline"}
            size={17}
            color={location ? C.warm : C.muted}
          />
          <Text style={[styles.locationBtnText, location && styles.locationBtnTextSelected]}>
            {locationLabel ?? "Klinik Konumunu Seç"}
          </Text>
          {location && (
            <TouchableOpacity
              onPress={() => setLocation(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="rgba(255,170,90,0.6)" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>
          Konumunuz çiftçilerin sizi mesafe ile bulmasını sağlar.
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, (!isDirty || loading) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isDirty || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color="#050914" /> : (
            <>
              <Ionicons name="checkmark" size={18} color="#050914" />
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <LocationPickerModal
        visible={showPicker}
        initialLocation={location}
        onConfirm={(coords) => { setLocation(coords); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, color: C.text, fontSize: 16, fontWeight: "900", textAlign: "center" },

  scroll: { paddingHorizontal: 16 },
  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 18, letterSpacing: 0.2 },

  row: { flexDirection: "row", gap: 10 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, color: C.text, fontWeight: "800", fontSize: 14, paddingVertical: 0 },

  locationBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  locationBtnSelected: {
    backgroundColor: "rgba(255,170,90,0.10)",
    borderColor: "rgba(255,170,90,0.35)",
  },
  locationBtnText: { flex: 1, color: C.muted, fontWeight: "800", fontSize: 13 },
  locationBtnTextSelected: { color: C.warm },

  hint: { color: C.muted, fontSize: 11, fontWeight: "700", lineHeight: 17, marginTop: 10 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
