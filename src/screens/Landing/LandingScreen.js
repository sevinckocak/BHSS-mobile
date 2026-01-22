import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: W } = Dimensions.get("window");

export default function LandingScreen({ navigation }) {
  const onFarmer = () => navigation.navigate("FarmerLogin");
  const onVet = () => navigation.navigate("VetLogin");

  return (
    <LinearGradient
      colors={["#040716", "#050914", "#070B12"]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require("../../../assets/logo/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>BHSS</Text>
          <Text style={styles.tagline}>Büyükbaş Hayvan Sağlık Sistemi</Text>
        </View>

        {/* HERO */}
        <View style={styles.heroCard}>
          <Image
            source={require("../../../assets/landing/hero.png")}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["rgba(4,7,22,0.12)", "rgba(4,7,22,0.82)"]}
            style={styles.heroOverlay}
          />

          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>
              Sağlık takibi, aşı planı, hızlı destek
            </Text>
            <Text style={styles.heroSub}>
              Küpe no ile kayıtları görüntüle, yaklaşan aşıları kaçırma ve
              veterinerle anında iletişim kur.
            </Text>
          </View>
        </View>

        {/* ROLE BUTTONS */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onFarmer}
            style={[styles.roleBtn, styles.btnFarmer]}
          >
            <Text style={styles.roleBtnText}>ÇİFTÇİYİM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onVet}
            style={[styles.roleBtn, styles.btnVet]}
          >
            <Text style={styles.roleBtnText}>VETERİNERİM</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18 },

  header: { alignItems: "center", paddingTop: 6, paddingBottom: 8 },
  logo: { width: 110, height: 110, marginTop: 10 },
  appName: {
    color: "#EAF4FF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tagline: {
    marginTop: 4,
    color: "rgba(234,244,255,0.70)",
    fontSize: 12,
    fontWeight: "700",
  },

  heroCard: {
    marginTop: 12,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(7,11,18,0.35)",
  },
  heroImage: { width: "100%", height: Math.min(420, W * 1.05) },
  heroOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  heroTextWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(4,7,22,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroTitle: {
    color: "#EAF4FF",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
  },
  heroSub: { color: "rgba(234,244,255,0.75)", fontSize: 12, lineHeight: 18 },

  roleRow: {
    marginTop: 80,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.6,
    backgroundColor: "transparent",
  },
  btnFarmer: { marginRight: 14, borderColor: "rgba(123,190,255,0.95)" },
  btnVet: { borderColor: "rgba(255,170,90,0.95)" },
  roleBtnText: { color: "#EAF4FF", fontWeight: "900", letterSpacing: 1.1 },
});
