import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmerAuth } from "../../context/FarmerAuthContext";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF", warm: "#FFAA5A",
};

export default function PersonalInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile, updateFarmerProfile } = useFarmerAuth();

  const [fullName, setFullName] = useState(farmerProfile?.fullName ?? "");
  const [phone, setPhone]       = useState(String(farmerProfile?.phone ?? ""));
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);

  const mark = (fn) => { fn(); setDirty(true); };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Eksik Bilgi", "Ad Soyad boş olamaz.");
      return;
    }
    try {
      setSaving(true);
      await updateFarmerProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setDirty(false);
      Alert.alert("Kaydedildi", "Kişisel bilgileriniz güncellendi.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
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
        <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
      >
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(fullName.trim() || "K").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("")}
            </Text>
          </View>
          <View>
            <Text style={styles.avatarName}>{fullName || "—"}</Text>
            <Text style={styles.avatarRole}>Çiftçi</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Field
            label="Ad Soyad"
            icon="person-outline"
            value={fullName}
            onChangeText={(v) => mark(() => setFullName(v))}
            placeholder="Adınızı girin"
          />
          <Field
            label="Telefon"
            icon="call-outline"
            value={phone}
            onChangeText={(v) => mark(() => setPhone(v))}
            placeholder="05xx..."
            keyboardType="phone-pad"
          />
        </View>

        {/* E-posta (salt okunur) */}
        <View style={styles.section}>
          <View style={styles.fieldWrap}>
            <View style={styles.fieldIcon}>
              <Ionicons name="mail-outline" size={16} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <Text style={styles.fieldReadonly}>{farmerProfile?.email || "—"}</Text>
            </View>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed-outline" size={12} color={C.muted} />
              <Text style={styles.lockText}>Sabit</Text>
            </View>
          </View>
        </View>

        <Text style={styles.hint}>
          E-posta adresi güvenlik nedeniyle bu ekrandan değiştirilemez.
        </Text>

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
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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

  avatarRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 18, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, marginBottom: 18,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: "rgba(123,190,255,0.15)", borderWidth: 1,
    borderColor: "rgba(123,190,255,0.25)", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.text, fontWeight: "900", fontSize: 20 },
  avatarName: { color: C.text, fontWeight: "900", fontSize: 16 },
  avatarRole: { color: C.muted, fontWeight: "700", fontSize: 12, marginTop: 2 },

  section: {
    borderRadius: 16, backgroundColor: C.card, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 14,
  },
  fieldWrap: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderColor: C.border,
  },
  fieldIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(123,190,255,0.09)", alignItems: "center", justifyContent: "center",
  },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: "800", marginBottom: 3 },
  fieldInput: { color: C.text, fontWeight: "800", fontSize: 14, paddingVertical: 0 },
  fieldReadonly: { color: "rgba(234,244,255,0.45)", fontWeight: "700", fontSize: 13 },

  lockBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  lockText: { color: C.muted, fontSize: 10, fontWeight: "700" },

  hint: { color: C.muted, fontSize: 11, fontWeight: "700", marginBottom: 20, lineHeight: 16 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
