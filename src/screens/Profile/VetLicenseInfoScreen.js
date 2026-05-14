import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVetAuth } from "../../context/VetAuthContext";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF", warm: "#FFAA5A",
};

const SPECIALIZATIONS = [
  "Büyükbaş Hayvan", "Küçükbaş Hayvan", "Karma Pratisyen",
  "Cerrahi", "İç Hastalıklar", "Üreme ve Jinekoloji", "Diğer",
];

export default function VetLicenseInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vetProfile, updateVetProfile } = useVetAuth();

  const [specialization, setSpecialization] = useState(vetProfile?.specialization ?? "");
  const [licenseNo,      setLicenseNo]      = useState(vetProfile?.licenseNo ?? "");
  const [loading,        setLoading]        = useState(false);

  const isDirty =
    specialization.trim() !== (vetProfile?.specialization ?? "") ||
    licenseNo.trim()      !== (vetProfile?.licenseNo ?? "");

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateVetProfile({ specialization: specialization.trim(), licenseNo: licenseNo.trim() });
      Alert.alert("Kaydedildi", "Uzmanlık ve sicil bilgileri güncellendi.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Hata", "Bilgiler kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Uzmanlık ve Sicil</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
      >
        <Text style={styles.sLabel}>Uzmanlık Alanı</Text>
        <View style={styles.chipsWrap}>
          {SPECIALIZATIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, specialization === s && styles.chipSelected]}
              onPress={() => setSpecialization(s)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, specialization === s && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            value={specialization}
            onChangeText={setSpecialization}
            placeholder="Veya uzmanlık alanınızı yazın..."
            placeholderTextColor="rgba(234,244,255,0.25)"
            style={styles.input}
          />
        </View>

        <Text style={styles.sLabel}>Sicil / Lisans No</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={licenseNo}
            onChangeText={setLicenseNo}
            placeholder="TR-XXXX-XXXX"
            placeholderTextColor="rgba(234,244,255,0.25)"
            style={styles.input}
            autoCapitalize="characters"
          />
        </View>

        <Text style={styles.hint}>
          Sicil numaranız veteriner listesinde güven rozeti olarak gösterilir.
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
  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 10, marginTop: 20, letterSpacing: 0.2 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipSelected: { backgroundColor: "rgba(255,170,90,0.18)", borderColor: "rgba(255,170,90,0.45)" },
  chipText: { color: C.muted, fontWeight: "800", fontSize: 12 },
  chipTextSelected: { color: "#FFAA5A" },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, color: C.text, fontWeight: "800", fontSize: 14, paddingVertical: 0 },

  hint: { color: C.muted, fontSize: 11, fontWeight: "700", lineHeight: 17, marginTop: 14 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
