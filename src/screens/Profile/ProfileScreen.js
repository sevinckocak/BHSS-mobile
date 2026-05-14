import React, { useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommonActions } from "@react-navigation/native";
import { useFarmerAuth } from "../../context/FarmerAuthContext";

const C = {
  bg: "#050914", bg2: "#070B12", text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)", card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)", warm: "#FFB15A",
  icon: "#FFB15A", danger: "#FF8A8A",
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { authUser, farmerProfile, booting, farmerLogout } = useFarmerAuth();

  const uiUser = useMemo(() => {
    const name = farmerProfile?.fullName?.trim() || authUser?.displayName || "Kullanıcı";
    const business =
      farmerProfile?.farmName?.trim() ||
      [farmerProfile?.city, farmerProfile?.district].filter(Boolean).join(" / ") ||
      "İşletme";
    const email = (farmerProfile?.email || authUser?.email || "").trim();
    const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
    return { name, business, email, initials };
  }, [farmerProfile, authUser]);

  const onLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış Yap", style: "destructive",
        onPress: async () => {
          try { await farmerLogout(); } catch (e) { console.log("Logout:", e); }
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: "FarmerLogin" }] }),
          );
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={[C.bg, C.bg2]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: Math.max(insets.bottom, 18) + 10 },
        ]}
      >
        {booting && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={C.icon} />
          </View>
        )}

        {/* Profil kartı */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{uiUser.initials || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{uiUser.name}</Text>
            {!!uiUser.business && <Text style={styles.userBiz}>{uiUser.business}</Text>}
            {!!uiUser.email && <Text style={styles.userEmail}>{uiUser.email}</Text>}
          </View>
          <TouchableOpacity
            style={styles.editChip}
            onPress={() => navigation.navigate("PersonalInfo")}
            activeOpacity={0.88}
          >
            <Ionicons name="pencil-outline" size={13} color={C.icon} />
            <Text style={styles.editChipText}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        {!farmerProfile && !booting && (
          <View style={styles.warnCard}>
            <Ionicons name="information-circle-outline" size={18} color={C.icon} />
            <Text style={styles.warnText}>
              Profil bilgisi bulunamadı.
            </Text>
          </View>
        )}

        {/* Hesap ve İşletme */}
        <SectionTitle label="Hesap ve İşletme" />
        <Block>
          <Row icon="person-outline"   label="Kişisel Bilgiler"  onPress={() => navigation.navigate("PersonalInfo")} />
          <Divider />
          <Row icon="storefront-outline" label="İşletme Ayarları" onPress={() => navigation.navigate("BusinessSettings")} />
        </Block>

        {/* Veri ve Raporlar */}
        <SectionTitle label="Veri ve Raporlar" />
        <Block>
          <Row icon="time-outline"        label="Geçmiş Kayıtlar" onPress={() => navigation.navigate("ActivityHistory")} />
          <Divider />
          <Row icon="bar-chart-outline"   label="Rapor Arşivi"    onPress={() => navigation.navigate("Reports")} />
        </Block>

        {/* Ayarlar ve Destek */}
        <SectionTitle label="Ayarlar ve Destek" />
        <Block>
          <Row icon="notifications-outline"    label="Bildirimler"           onPress={() => navigation.navigate("Notifications")} />
          <Divider />
          <Row icon="shield-checkmark-outline" label="Güvenlik"              onPress={() => navigation.navigate("Security")} />
          <Divider />
          <Row icon="help-circle-outline"      label="Yardım ve Geri Bildirim" onPress={() => navigation.navigate("Support")} />
          <Divider />
          <Row icon="log-out-outline" label="Çıkış Yap" danger onPress={onLogout} />
        </Block>

        <View style={{ height: Platform.OS === "ios" ? 18 : 12 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function SectionTitle({ label }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function Block({ children }) {
  return <View style={styles.block}>{children}</View>;
}

function Row({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.92} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? C.danger : C.icon} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={danger ? "rgba(255,138,138,0.45)" : "rgba(234,244,255,0.25)"} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18 },

  loadingWrap: { alignItems: "center", paddingVertical: 8 },

  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 20, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, marginBottom: 18,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: "rgba(255,177,90,0.15)", borderWidth: 1,
    borderColor: "rgba(255,177,90,0.28)", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.text, fontWeight: "900", fontSize: 18 },
  userName:  { color: C.text, fontWeight: "900", fontSize: 16 },
  userBiz:   { color: C.muted, fontWeight: "800", fontSize: 12, marginTop: 3 },
  userEmail: { color: "rgba(234,244,255,0.40)", fontWeight: "700", fontSize: 11, marginTop: 3 },

  editChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "rgba(255,177,90,0.12)", borderWidth: 1,
    borderColor: "rgba(255,177,90,0.24)",
  },
  editChipText: { color: C.icon, fontWeight: "800", fontSize: 11 },

  warnCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 12, borderRadius: 16,
    backgroundColor: "rgba(255,177,90,0.10)", borderWidth: 1,
    borderColor: "rgba(255,177,90,0.22)", marginBottom: 14,
  },
  warnText: { flex: 1, color: "rgba(234,244,255,0.75)", fontWeight: "800", fontSize: 11, lineHeight: 16 },

  sectionTitle: {
    color: "rgba(234,244,255,0.70)", fontWeight: "900", fontSize: 12,
    marginBottom: 10, marginTop: 14, letterSpacing: 0.3,
  },
  block: {
    borderRadius: 18, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 14,
    backgroundColor: "rgba(255,177,90,0.14)", borderWidth: 1,
    borderColor: "rgba(255,177,90,0.28)", alignItems: "center", justifyContent: "center",
  },
  rowIconDanger: { backgroundColor: "rgba(255,138,138,0.14)", borderColor: "rgba(255,138,138,0.28)" },
  rowLabel: { flex: 1, color: C.text, fontWeight: "900", fontSize: 13 },
  rowLabelDanger: { color: "#FFD2D2" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 14 },
});
