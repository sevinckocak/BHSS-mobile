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
import { useVetAuth } from "../../context/VetAuthContext";

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
  accent: "#7BBEFF",
};

export default function VetProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { authUser, vetProfile, booting, vetLogout } = useVetAuth();

  const go = (route) => navigation?.navigate?.(route);

  const contentPaddingTop = Math.max(insets.top, 12) + 8;
  const contentPaddingBottom = Math.max(insets.bottom, 18) + 10;

  const uiUser = useMemo(() => {
    const name =
      vetProfile?.fullName?.trim() || authUser?.displayName || "Veteriner";

    const clinic =
      vetProfile?.clinicName?.trim() ||
      [vetProfile?.city, vetProfile?.district].filter(Boolean).join(" / ") ||
      "Klinik Bilgisi";

    const email = (vetProfile?.email || authUser?.email || "").trim();
    const specialization = (vetProfile?.specialization || "").trim();
    const licenseNo = (vetProfile?.licenseNo || "").trim();

    const premiumText = "Vet Pro Hesap - Aktif";

    return {
      name,
      clinic,
      email,
      specialization,
      licenseNo,
      premiumText,
    };
  }, [vetProfile, authUser]);

  const onLogout = async () => {
    try {
      await vetLogout();
    } catch (e) {
      console.log("Vet logout error:", e);
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
              <Ionicons name="medkit-outline" size={24} color={COLORS.text} />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{uiUser.name}</Text>
            <Text style={styles.userBiz}>{uiUser.clinic}</Text>

            {uiUser.specialization ? (
              <Text style={styles.userMeta}>
                Uzmanlık: {uiUser.specialization}
              </Text>
            ) : null}

            {uiUser.licenseNo ? (
              <Text style={styles.userMeta}>Sicil No: {uiUser.licenseNo}</Text>
            ) : null}

            {uiUser.email ? (
              <Text style={styles.userEmail}>{uiUser.email}</Text>
            ) : null}
          </View>
        </View>

        {/* Pro card */}
        <TouchableOpacity
          style={styles.premiumCard}
          activeOpacity={0.92}
          onPress={() => go("VetSubscription")}
        >
          <View style={styles.premiumLeft}>
            <View style={styles.premiumIcon}>
              <Ionicons name="star-outline" size={18} color="#0B1220" />
            </View>
            <Text style={styles.premiumText}>{uiUser.premiumText}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#0B1220" />
        </TouchableOpacity>

        {/* Profil yok uyarısı */}
        {!vetProfile && !booting ? (
          <View style={styles.warnCard}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.icon}
            />
            <Text style={styles.warnText}>
              Profil bilgisi bulunamadı. (vet_info/{authUser?.uid}) dokümanı yok
              olabilir.
            </Text>
          </View>
        ) : null}

        {/* Hesap ve Klinik */}
        <Text style={styles.sectionTitle}>Hesap ve Klinik</Text>
        <View style={styles.block}>
          <Row
            icon="person-outline"
            label="Kişisel Bilgiler"
            onPress={() => go("VetPersonalInfo")}
          />
          <Divider />
          <Row
            icon="business-outline"
            label="Klinik Bilgileri"
            onPress={() => go("VetClinicInfo")}
          />
          <Divider />
          <Row
            icon="ribbon-outline"
            label="Uzmanlık ve Sicil"
            onPress={() => go("VetLicenseInfo")}
          />
        </View>

        {/* Randevu ve Mesaj */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>İş Akışı</Text>
        <View style={styles.block}>
          <Row
            icon="calendar-outline"
            label="Randevularım"
            onPress={() => go("VetCalendar")}
          />
          <Divider />
          <Row
            icon="chatbubble-ellipses-outline"
            label="Mesajlar"
            onPress={() => go("VetMessages")}
          />
          <Divider />
          <Row
            icon="document-text-outline"
            label="Farmer Talepleri"
            onPress={() => go("VetRequests")}
          />
        </View>

        {/* Ayarlar ve Destek */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Ayarlar ve Destek
        </Text>
        <View style={styles.block}>
          <Row
            icon="notifications-outline"
            label="Bildirimler"
            onPress={() => go("VetNotifications")}
          />
          <Divider />
          <Row
            icon="shield-checkmark-outline"
            label="Güvenlik"
            onPress={() => go("VetSecurity")}
          />
          <Divider />
          <Row
            icon="help-circle-outline"
            label="Yardım ve Geri Bildirim"
            onPress={() => go("VetSupport")}
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
  userMeta: {
    color: COLORS.accent,
    fontWeight: "800",
    fontSize: 11,
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
