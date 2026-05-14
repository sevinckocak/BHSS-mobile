import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, ActivityIndicator, Alert, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@bhss_notif_prefs";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF",
  warm: "#FFAA5A", success: "#32D583", purple: "#B794F6",
};

const ITEMS = [
  { key: "appointments", icon: "calendar-outline",         color: C.warm,    label: "Randevu Bildirimleri",     desc: "Yaklaşan randevular için hatırlatıcı" },
  { key: "vaccines",     icon: "shield-checkmark-outline", color: C.success, label: "Aşı Hatırlatıcıları",      desc: "14 gün içindeki aşılar için uyarı" },
  { key: "chat",         icon: "chatbubble-outline",       color: C.accent,  label: "Mesaj Bildirimleri",       desc: "Yeni mesajlar geldiğinde bildir" },
  { key: "health",       icon: "medical-outline",          color: "#FF6B6B", label: "Sağlık Uyarıları",         desc: "Hasta hayvan durumu değişince bildir" },
  { key: "births",       icon: "egg-outline",              color: C.purple,  label: "Doğum Hatırlatıcıları",   desc: "Beklenen doğum tarihleri yaklaşınca" },
];

const DEFAULT_PREFS = Object.fromEntries(ITEMS.map((i) => [i.key, true]));

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs]   = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      Alert.alert("Kaydedildi", "Bildirim tercihleri güncellendi.");
    } catch {
      Alert.alert("Hata", "Tercihler kaydedilemedi.");
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
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={{ width: 42 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        >
          <Text style={styles.sLabel}>Bildirim Türleri</Text>
          <View style={styles.block}>
            {ITEMS.map((item, i) => (
              <React.Fragment key={item.key}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: `${item.color}18`, borderColor: `${item.color}30` }]}>
                    <Ionicons name={item.icon} size={17} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={prefs[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: "rgba(255,255,255,0.12)", true: `${item.color}60` }}
                    thumbColor={prefs[item.key] ? item.color : "rgba(234,244,255,0.5)"}
                    ios_backgroundColor="rgba(255,255,255,0.12)"
                  />
                </View>
                {i < ITEMS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.hint}>
            Bu ayarlar yalnızca bu cihaz için geçerlidir. Sistem bildirim ayarlarından uygulama izni vermeyi unutmayın.
          </Text>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
            {saving ? <ActivityIndicator color="#050914" /> : (
              <>
                <Ionicons name="checkmark" size={18} color="#050914" />
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  scroll: { paddingHorizontal: 16 },
  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 10, letterSpacing: 0.2 },

  block: {
    borderRadius: 18, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 16,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 11,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  rowLabel: { color: C.text, fontWeight: "800", fontSize: 13 },
  rowDesc: { color: C.muted, fontWeight: "700", fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  hint: { color: C.muted, fontSize: 11, fontWeight: "700", lineHeight: 17, marginBottom: 20 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: C.text,
  },
  saveBtnText: { color: "#050914", fontWeight: "900", fontSize: 15 },
});
