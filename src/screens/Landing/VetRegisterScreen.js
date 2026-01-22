import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VetRegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [secure, setSecure] = useState(true);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Landing");
  };

  const onRegister = () => {
    console.log("Vet register:", {
      fullName,
      phone,
      licenseNo,
      clinicName,
      city,
      email,
    });
    navigation.navigate("VetLogin");
  };

  return (
    <LinearGradient
      colors={["#040716", "#050914", "#070B12"]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        {/* Back */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color="rgba(234,244,255,0.9)"
          />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Üst görsel */}
            <Image
              source={require("../../../assets/landing/vet.png")}
              style={styles.hero}
              resizeMode="contain"
            />

            <Text style={styles.title}>Veteriner Kayıt</Text>
            <Text style={styles.subTitle}>
              Bilgilerini gir, çiftçilerle randevu ve mesajlaşmayı yönet.
            </Text>

            {/* Form */}
            <View style={styles.inputWrap}>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Telefon (05xx...)"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={licenseNo}
                onChangeText={setLicenseNo}
                placeholder="Veteriner Sicil / Diploma No"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={clinicName}
                onChangeText={setClinicName}
                placeholder="Klinik / Çalıştığınız Yer"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Şehir"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                value={pass}
                onChangeText={setPass}
                placeholder="Şifre"
                placeholderTextColor="rgba(234,244,255,0.45)"
                style={[styles.input, { paddingRight: 46 }]}
                secureTextEntry={secure}
              />
              <TouchableOpacity
                onPress={() => setSecure((s) => !s)}
                style={styles.eyeBtn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={secure ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="rgba(234,244,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={onRegister}
              activeOpacity={0.9}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>Kayıt Ol</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.muted}>Zaten hesabın var mı? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("VetLogin")}
                activeOpacity={0.85}
              >
                <Text style={styles.linkStrong}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 22 + insets.bottom }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18 },
  flex: { flex: 1 },

  backBtn: {
    position: "absolute",
    left: 18,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  backText: {
    color: "rgba(234,244,255,0.9)",
    fontWeight: "800",
    marginLeft: 2,
  },

  scrollContent: {
    paddingTop: 70,
    alignItems: "center",
  },

  hero: { width: "100%", height: 300, marginBottom: 6 },

  title: {
    color: "#EAF4FF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },
  subTitle: {
    marginTop: 6,
    marginBottom: 10,
    color: "rgba(234,244,255,0.65)",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 18,
  },

  inputWrap: {
    width: "100%",
    maxWidth: 420,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#EAF4FF",
    fontWeight: "700",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 6,
  },

  primaryBtn: {
    width: "100%",
    maxWidth: 420,
    marginTop: 18,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#EAF4FF",
  },
  primaryText: { color: "#050914", fontWeight: "900" },

  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  muted: { color: "rgba(234,244,255,0.6)", fontWeight: "700" },
  linkStrong: { color: "#7BBEFF", fontWeight: "900" },
});
