import React, { useState, useEffect } from "react";
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

export default function VetPersonalInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vetProfile, authUser, updateVetProfile } = useVetAuth();

  const [fullName, setFullName] = useState(vetProfile?.fullName ?? "");
  const [phone,    setPhone]    = useState(String(vetProfile?.phone ?? ""));
  const [loading,  setLoading]  = useState(false);

  const email = vetProfile?.email || authUser?.email || "";

  const isDirty =
    fullName.trim() !== (vetProfile?.fullName ?? "") ||
    phone.trim()    !== String(vetProfile?.phone ?? "");

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert("Eksik", "Ad Soyad boş olamaz."); return; }
    try {
      setLoading(true);
      await updateVetProfile({ fullName: fullName.trim(), phone: phone.trim() });
      Alert.alert("Kaydedildi", "Kişisel bilgiler güncellendi.", [
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
        <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
      >
        <Text style={styles.sLabel}>Ad Soyad</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Adınız Soyadınız"
            placeholderTextColor="rgba(234,244,255,0.25)"
            style={styles.input}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.sLabel}>Telefon</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="05XX XXX XX XX"
            placeholderTextColor="rgba(234,244,255,0.25)"
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.sLabel}>E-posta (değiştirilemez)</Text>
        <View style={[styles.inputWrap, styles.inputReadonly]}>
          <TextInput
            value={email}
            editable={false}
            style={[styles.input, styles.inputDisabled]}
          />
          <Ionicons name="lock-closed-outline" size={15} color="rgba(234,244,255,0.30)" style={{ marginRight: 4 }} />
        </View>

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
  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 18, letterSpacing: 0.2 },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputReadonly: { backgroundColor: "rgba(255,255,255,0.02)" },
  input: { flex: 1, color: C.text, fontWeight: "800", fontSize: 14, paddingVertical: 0 },
  inputDisabled: { color: "rgba(234,244,255,0.35)" },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
    marginTop: 32,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
