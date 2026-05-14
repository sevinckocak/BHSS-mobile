import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.50)", card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)", accent: "#7BBEFF", warm: "#FFAA5A",
};

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const FAQ = [
  {
    q: "Hayvan kaydı nasıl eklenir?",
    a: "Ana ekrandan 'Hayvanlar' bölümüne gidin, sağ alttaki + butonuna dokunun ve formu doldurun.",
  },
  {
    q: "Veteriner ile nasıl iletişime geçilir?",
    a: "'Veteriner Bul' butonuna basın, listeden bir veteriner seçin ve 'Mesaj Gönder' butonunu kullanın.",
  },
  {
    q: "Aşı hatırlatıcıları nasıl çalışır?",
    a: "Hayvan kaydederken veya düzenlerken aşı tarihi ekleyin. Uygulama 14 gün öncesinden sizi uyarır.",
  },
  {
    q: "Konum bilgisini nasıl güncellerim?",
    a: "Profil > İşletme Ayarları > Konum Seç bölümünden haritadan veya GPS ile konumunuzu güncelleyebilirsiniz.",
  },
  {
    q: "Şifremi unuttum, ne yapmalıyım?",
    a: "Giriş ekranındaki 'Şifremi Unuttum' bağlantısını kullanın veya destek ekibimize ulaşın.",
  },
];

export default function SupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [openFaq, setOpenFaq] = useState(null);

  const openEmail = () =>
    Linking.openURL("mailto:destek@bhss.app?subject=BHSS Destek").catch(() =>
      Alert.alert("Hata", "E-posta uygulaması açılamadı."),
    );

  const openWhatsApp = () =>
    Linking.openURL("https://wa.me/905000000000").catch(() =>
      Alert.alert("Hata", "WhatsApp açılamadı."),
    );

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yardım ve Destek</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
      >
        {/* İletişim */}
        <Text style={styles.sLabel}>İletişim</Text>
        <View style={styles.block}>
          <TouchableOpacity style={styles.row} onPress={openEmail} activeOpacity={0.88}>
            <View style={[styles.rowIcon, { backgroundColor: "rgba(123,190,255,0.12)", borderColor: "rgba(123,190,255,0.25)" }]}>
              <Ionicons name="mail-outline" size={17} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>E-posta Gönder</Text>
              <Text style={styles.rowDesc}>destek@bhss.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(234,244,255,0.28)" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={openWhatsApp} activeOpacity={0.88}>
            <View style={[styles.rowIcon, { backgroundColor: "rgba(50,213,131,0.12)", borderColor: "rgba(50,213,131,0.25)" }]}>
              <Ionicons name="logo-whatsapp" size={17} color="#32D583" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>WhatsApp Destek</Text>
              <Text style={styles.rowDesc}>Hafta içi 09:00 – 18:00</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(234,244,255,0.28)" />
          </TouchableOpacity>
        </View>

        {/* SSS */}
        <Text style={[styles.sLabel, { marginTop: 4 }]}>Sık Sorulan Sorular</Text>
        <View style={styles.block}>
          {FAQ.map((item, i) => (
            <React.Fragment key={i}>
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => setOpenFaq(openFaq === i ? null : i)}
                activeOpacity={0.88}
              >
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons
                  name={openFaq === i ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="rgba(234,244,255,0.35)"
                />
              </TouchableOpacity>
              {openFaq === i && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqA}>{item.a}</Text>
                </View>
              )}
              {i < FAQ.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Uygulama Hakkında */}
        <View style={styles.aboutCard}>
          <View style={styles.aboutIcon}>
            <Ionicons name="leaf-outline" size={22} color={C.warm} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutName}>BHSS</Text>
            <Text style={styles.aboutDesc}>Büyükbaş Hayvan Sağlık Sistemi</Text>
          </View>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>
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
  sLabel: { color: "rgba(234,244,255,0.6)", fontSize: 12, fontWeight: "800", marginBottom: 10, letterSpacing: 0.2 },

  block: {
    borderRadius: 18, backgroundColor: C.card, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 18,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rowLabel: { color: C.text, fontWeight: "800", fontSize: 13 },
  rowDesc: { color: C.muted, fontWeight: "700", fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  faqRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  faqQ: { flex: 1, color: C.text, fontWeight: "800", fontSize: 13 },
  faqAnswer: {
    paddingHorizontal: 14, paddingBottom: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  faqA: { color: C.muted, fontWeight: "700", fontSize: 12, lineHeight: 18 },

  aboutCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 18, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  aboutIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,170,90,0.12)", borderWidth: 1,
    borderColor: "rgba(255,170,90,0.22)", alignItems: "center", justifyContent: "center",
  },
  aboutName: { color: C.text, fontWeight: "900", fontSize: 15 },
  aboutDesc: { color: C.muted, fontWeight: "700", fontSize: 11, marginTop: 2 },
  versionBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: C.border,
  },
  versionText: { color: C.muted, fontWeight: "800", fontSize: 11 },
});
