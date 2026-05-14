import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import LocationPickerModal from "../../components/LocationPicker/LocationPickerModal";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF", warm: "#FFAA5A",
};

export default function BusinessSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile, updateFarmerProfile } = useFarmerAuth();

  const [farmName, setFarmName]   = useState(farmerProfile?.farmName ?? "");
  const [city, setCity]           = useState(farmerProfile?.city ?? "");
  const [district, setDistrict]   = useState(farmerProfile?.district ?? "");
  const [herdSize, setHerdSize]   = useState(String(farmerProfile?.herdSize ?? ""));
  const [location, setLocation]   = useState(farmerProfile?.location ?? null);
  const [showMap, setShowMap]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);

  const mark = (fn) => { fn(); setDirty(true); };

  const handleSave = async () => {
    if (!farmName.trim()) {
      Alert.alert("Eksik Bilgi", "İşletme adı boş olamaz.");
      return;
    }
    try {
      setSaving(true);
      await updateFarmerProfile({
        farmName: farmName.trim(),
        city: city.trim(),
        district: district.trim(),
        herdSize: herdSize ? Number(herdSize) : 0,
        ...(location ? { location } : {}),
      });
      setDirty(false);
      Alert.alert("Kaydedildi", "İşletme bilgileri güncellendi.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Hata", "Bilgiler kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İşletme Ayarları</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
      >
        {/* İşletme Bilgileri */}
        <Text style={styles.sectionLabel}>İşletme Bilgileri</Text>
        <View style={styles.section}>
          <Field
            label="İşletme / Çiftlik Adı"
            icon="storefront-outline"
            value={farmName}
            onChangeText={(v) => mark(() => setFarmName(v))}
            placeholder="Örn: Yılmaz Çiftliği"
          />
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <MiniField
                label="İl"
                value={city}
                onChangeText={(v) => mark(() => setCity(v))}
                placeholder="İstanbul"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={{ flex: 1 }}>
              <MiniField
                label="İlçe"
                value={district}
                onChangeText={(v) => mark(() => setDistrict(v))}
                placeholder="Kadıköy"
              />
            </View>
          </View>
          <Field
            label="Yaklaşık Hayvan Sayısı"
            icon="analytics-outline"
            value={herdSize}
            onChangeText={(v) => mark(() => setHerdSize(v.replace(/[^0-9]/g, "")))}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        {/* Konum */}
        <Text style={styles.sectionLabel}>Çiftlik Konumu</Text>
        <TouchableOpacity
          style={[styles.locationBtn, location && styles.locationBtnActive]}
          onPress={() => setShowMap(true)}
          activeOpacity={0.88}
        >
          <View style={styles.locationIcon}>
            <Ionicons name={location ? "location" : "location-outline"} size={18} color={location ? C.accent : C.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>
              {location ? "Konum Seçildi" : "Konum Seç"}
            </Text>
            {location ? (
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(5)},  {location.longitude.toFixed(5)}
              </Text>
            ) : (
              <Text style={styles.locationHint}>Haritadan seçin veya mevcut konumunuzu kullanın</Text>
            )}
          </View>
          {location ? (
            <TouchableOpacity
              onPress={() => { setLocation(null); setDirty(true); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={18} color="rgba(234,244,255,0.35)" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="rgba(234,244,255,0.28)" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator color="#050914" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#050914" />
              <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <LocationPickerModal
        visible={showMap}
        initialLocation={location}
        onConfirm={(coords) => { setLocation(coords); setShowMap(false); setDirty(true); }}
        onClose={() => setShowMap(false)}
      />
    </LinearGradient>
  );
}

function Field({ label, icon, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color={C.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(234,244,255,0.28)"
          style={styles.fieldInput}
          keyboardType={keyboardType ?? "default"}
        />
      </View>
    </View>
  );
}

function MiniField({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.miniField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(234,244,255,0.28)"
        style={styles.fieldInput}
      />
    </View>
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

  sectionLabel: {
    color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800",
    marginBottom: 8, marginTop: 4, letterSpacing: 0.3,
  },

  section: {
    borderRadius: 16, backgroundColor: C.card, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 18,
  },
  fieldWrap: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderColor: C.border,
  },
  rowFields: { flexDirection: "row", borderBottomWidth: 1, borderColor: C.border },
  rowDivider: { width: 1, backgroundColor: C.border },
  miniField: { paddingHorizontal: 14, paddingVertical: 13 },
  fieldIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(123,190,255,0.09)", alignItems: "center", justifyContent: "center",
  },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: "800", marginBottom: 3 },
  fieldInput: { color: C.text, fontWeight: "800", fontSize: 14, paddingVertical: 0 },

  locationBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  locationBtnActive: { borderColor: "rgba(123,190,255,0.3)", backgroundColor: "rgba(123,190,255,0.06)" },
  locationIcon: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(123,190,255,0.09)", alignItems: "center", justifyContent: "center",
  },
  locationLabel: { color: C.text, fontWeight: "800", fontSize: 13 },
  locationCoords: { color: C.accent, fontWeight: "700", fontSize: 11, marginTop: 2 },
  locationHint: { color: C.muted, fontWeight: "700", fontSize: 11, marginTop: 2 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
