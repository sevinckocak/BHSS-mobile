import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF",
  warm: "#FFAA5A", danger: "#FF6B6B",
};

export default function SecurityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile, authUser } = useFarmerAuth();

  const [currentPass,  setCurrentPass]  = useState("");
  const [newPass,      setNewPass]      = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);

  const strength = newPass.length === 0 ? null
    : newPass.length < 6  ? "weak"
    : newPass.length < 10 ? "medium"
    : "strong";

  const strengthColor = { weak: C.danger, medium: C.warm, strong: "#32D583" }[strength] ?? "transparent";
  const strengthLabel = { weak: "Zayıf", medium: "Orta", strong: "Güçlü" }[strength] ?? "";

  const handleChange = async () => {
    if (!currentPass) { Alert.alert("Eksik", "Mevcut şifrenizi girin."); return; }
    if (newPass.length < 6) { Alert.alert("Zayıf Şifre", "Yeni şifre en az 6 karakter olmalı."); return; }
    if (newPass !== confirmPass) { Alert.alert("Eşleşmiyor", "Yeni şifreler birbiriyle uyuşmuyor."); return; }
    if (newPass === currentPass) { Alert.alert("Aynı Şifre", "Yeni şifre eskiyle aynı olamaz."); return; }

    const email = farmerProfile?.email || authUser?.email;
    if (!email) { Alert.alert("Hata", "Kullanıcı e-postası bulunamadı."); return; }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPass);

      Alert.alert("Başarılı", "Şifreniz güncellendi.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg =
        e.code === "auth/wrong-password"   ? "Mevcut şifreniz yanlış." :
        e.code === "auth/too-many-requests" ? "Çok fazla deneme. Lütfen bekleyin." :
        e.code === "auth/requires-recent-login" ? "Oturumunuz süresi dolmuş. Yeniden giriş yapın." :
        "Şifre güncellenemedi. Tekrar deneyin.";
      Alert.alert("Hata", msg);
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
        <Text style={styles.headerTitle}>Güvenlik</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 48 }]}
      >
        {/* Hesap bilgisi */}
        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={C.accent} />
          </View>
          <View>
            <Text style={styles.accountLabel}>Hesap</Text>
            <Text style={styles.accountEmail}>{farmerProfile?.email || authUser?.email || "—"}</Text>
          </View>
        </View>

        <Text style={styles.sLabel}>Şifre Değiştir</Text>
        <View style={styles.block}>
          <PassField
            label="Mevcut Şifre"
            value={currentPass}
            onChange={setCurrentPass}
            show={showCurrent}
            onToggle={() => setShowCurrent(p => !p)}
          />
          <View style={styles.divider} />
          <PassField
            label="Yeni Şifre"
            value={newPass}
            onChange={setNewPass}
            show={showNew}
            onToggle={() => setShowNew(p => !p)}
          />
          {strength && (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthBar, { backgroundColor: strengthColor, width: strength === "weak" ? "30%" : strength === "medium" ? "60%" : "100%" }]} />
              <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <PassField
            label="Yeni Şifre (Tekrar)"
            value={confirmPass}
            onChange={setConfirmPass}
            show={showConfirm}
            onToggle={() => setShowConfirm(p => !p)}
            error={confirmPass.length > 0 && newPass !== confirmPass}
          />
        </View>

        <Text style={styles.hint}>
          Güvenli bir şifre için büyük/küçük harf, rakam ve özel karakter kullanın.
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleChange}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color="#050914" /> : (
            <>
              <Ionicons name="lock-closed-outline" size={18} color="#050914" />
              <Text style={styles.saveBtnText}>Şifreyi Güncelle</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

function PassField({ label, value, onChange, show, onToggle, error }) {
  return (
    <View style={[styles.fieldWrap, error && styles.fieldError]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor="rgba(234,244,255,0.25)"
          style={styles.fieldInput}
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.eyeBtn}>
        <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={18} color={C.muted} />
      </TouchableOpacity>
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

  accountCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, backgroundColor: "rgba(123,190,255,0.07)",
    borderWidth: 1, borderColor: "rgba(123,190,255,0.18)", marginBottom: 22,
  },
  accountIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(123,190,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  accountLabel: { color: C.muted, fontSize: 10, fontWeight: "800", marginBottom: 2 },
  accountEmail: { color: C.text, fontWeight: "800", fontSize: 13 },

  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 10, letterSpacing: 0.2 },

  block: {
    borderRadius: 16, backgroundColor: C.card, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 14,
  },
  fieldWrap: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 13,
  },
  fieldError: { backgroundColor: "rgba(255,107,107,0.06)" },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: "800", marginBottom: 3 },
  fieldInput: { color: C.text, fontWeight: "800", fontSize: 14, paddingVertical: 0 },
  eyeBtn: { padding: 6 },
  divider: { height: 1, backgroundColor: C.border },

  strengthRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  strengthBar: { height: 3, borderRadius: 2, backgroundColor: "#32D583" },
  strengthLabel: { fontSize: 10, fontWeight: "800" },

  hint: { color: C.muted, fontSize: 11, fontWeight: "700", lineHeight: 17, marginBottom: 20 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
