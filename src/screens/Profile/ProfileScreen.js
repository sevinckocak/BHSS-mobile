import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmerAuth } from "../../context/FarmerAuthContext";

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  warm: "#FFB15A",
  icon: "#FFB15A",
  danger: "#FF8A8A",
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // ✅ user yerine authUser
  const { authUser, farmerProfile, booting, farmerLogout } = useFarmerAuth();

  const go = (route) => navigation?.navigate?.(route);

  const contentPaddingTop = Math.max(insets.top, 12) + 8;
  const contentPaddingBottom = Math.max(insets.bottom, 18) + 10;

  const uiUser = useMemo(() => {
    const name =
      farmerProfile?.fullName?.trim() || authUser?.displayName || "Kullanıcı";

    const business =
      farmerProfile?.farmName?.trim() ||
      [farmerProfile?.city, farmerProfile?.district]
        .filter(Boolean)
        .join(" / ") ||
      "İşletme";

    const email = (farmerProfile?.email || authUser?.email || "").trim();

    const premiumText = "Premium Üyelik - Aktif";

    return { name, business, email, premiumText };
  }, [farmerProfile, authUser]);

  const onLogout = async () => {
    try {
      await farmerLogout();
    } catch (e) {
      console.log("Logout error:", e);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: contentPaddingTop,
            paddingBottom: contentPaddingBottom,
          },
        ]}
      >
        {booting ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.icon} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : null}

        {/* Header */}
        <View style={styles.userRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={26} color={COLORS.text} />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{uiUser.name}</Text>
            <Text style={styles.userBiz}>{uiUser.business}</Text>

            {uiUser.email ? (
              <Text style={styles.userEmail}>{uiUser.email}</Text>
            ) : null}
          </View>
        </View>

        {/* Premium */}
        <TouchableOpacity
          style={styles.premiumCard}
          activeOpacity={0.92}
          onPress={() => go("Premium")}
        >
          <View style={styles.premiumLeft}>
            <View style={styles.premiumIcon}>
              <Ionicons name="heart-outline" size={18} color="#0B1220" />
            </View>
            <Text style={styles.premiumText}>{uiUser.premiumText}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#0B1220" />
        </TouchableOpacity>

        {/* Profil yok uyarısı */}
        {!farmerProfile && !booting ? (
          <View style={styles.warnCard}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.icon}
            />
            <Text style={styles.warnText}>
              Profil bilgisi bulunamadı. (farmer_info/{authUser?.uid}) dokümanı
              yok olabilir.
            </Text>
          </View>
        ) : null}

        {/* ... senin Row/Divider bölümlerin aynı kalabilir ... */}
        <Text style={styles.sectionTitle}>Hesap ve İşletme</Text>
        <View style={styles.block}>
          <Row
            icon="person-outline"
            label="Kişisel Bilgiler"
            onPress={() => go("PersonalInfo")}
          />
          <Divider />
          <Row
            icon="settings-outline"
            label="İşletme Ayarları"
            onPress={() => go("BusinessSettings")}
          />
          <Divider />
          <Row
            icon="card-outline"
            label="Ödeme Yöntemleri"
            onPress={() => go("Payments")}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Veri ve Raporlar
        </Text>
        <View style={styles.block}>
          <Row
            icon="time-outline"
            label="Geçmiş Kayıtlar"
            onPress={() => go("History")}
          />
          <Divider />
          <Row
            icon="folder-open-outline"
            label="Rapor Arşivi"
            onPress={() => go("ReportsArchive")}
          />
          <Divider />
          <Row
            icon="phone-portrait-outline"
            label="Cihaz Yönetimi"
            onPress={() => go("Devices")}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Ayarlar ve Destek
        </Text>
        <View style={styles.block}>
          <Row
            icon="notifications-outline"
            label="Bildirimler"
            onPress={() => go("Notifications")}
          />
          <Divider />
          <Row
            icon="shield-checkmark-outline"
            label="Güvenlik"
            onPress={() => go("Security")}
          />
          <Divider />
          <Row
            icon="help-circle-outline"
            label="Yardım ve Geri Bildirim"
            onPress={() => go("Support")}
          />
          <Divider />
          <Row
            icon="log-out-outline"
            label="Çıkış Yap"
            danger
            onPress={onLogout}
          />
        </View>

        <View style={{ height: Platform.OS === "ios" ? 18 : 12 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function Row({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.92} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? COLORS.danger : COLORS.icon}
        />
      </View>

      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? "rgba(255,138,138,0.55)" : "rgba(234,244,255,0.28)"}
      />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18 },

  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: "rgba(234,244,255,0.7)",
    fontWeight: "800",
    fontSize: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  userBiz: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
    marginTop: 4,
  },
  userEmail: {
    color: "rgba(234,244,255,0.45)",
    fontWeight: "800",
    fontSize: 11,
    marginTop: 4,
  },

  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.warm,
    marginBottom: 16,
  },
  premiumLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  premiumIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumText: { color: "#0B1220", fontWeight: "900", fontSize: 12 },

  warnCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,177,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,177,90,0.22)",
    marginBottom: 14,
  },
  warnText: {
    flex: 1,
    color: "rgba(234,244,255,0.75)",
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 16,
  },

  sectionTitle: {
    color: "rgba(234,244,255,0.75)",
    fontWeight: "900",
    fontSize: 13,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  block: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,177,90,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,177,90,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: {
    backgroundColor: "rgba(255,138,138,0.14)",
    borderColor: "rgba(255,138,138,0.28)",
  },

  rowLabel: {
    flex: 1,
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12,
  },
  rowLabelDanger: { color: "#FFD2D2" },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 14,
    marginRight: 14,
  },
});
