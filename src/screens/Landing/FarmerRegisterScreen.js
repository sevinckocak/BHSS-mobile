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
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmerAuth } from "../../context/FarmerAuthContext";

export default function FarmerRegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerRegister, farmerLogout } = useFarmerAuth();

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [farmName, setFarmName] = useState("");
  const [herdSize, setHerdSize] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [secure, setSecure] = useState(true);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Landing");
  };

  const onRegister = async () => {
    // Zorunlu alanlar
    if (
      !fullName ||
      !phone ||
      !city ||
      !district ||
      !farmName ||
      !email ||
      !pass
    ) {
      Alert.alert("Eksik Bilgi", "Lütfen zorunlu alanları doldurun.");
      return;
    }
    if (pass.length < 6) {
      Alert.alert("Zayıf Şifre", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);

      const user = await farmerRegister({
        email,
        password: pass,
        fullName,
        phone,
        city,
        district,
        farmName,
        herdSize,
      });

      console.log("REGISTER OK uid:", user?.uid);

      // Kayıt işleminden sonra kullanıcı login ekranından giriş yapsın istiyorsun:
      // Firebase otomatik login yapacağı için çıkış yaptırıyoruz.
      await farmerLogout();

      Alert.alert(
        "Kayıt Başarılı 🎉",
        "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
        [
          {
            text: "Giriş Yap",
            onPress: () => navigation.replace("FarmerLogin"),
          },
        ]
      );
    } catch (e) {
      console.log("REGISTER ERROR:", e?.code, e?.message);

      if (e?.code === "auth/email-already-in-use") {
        Alert.alert(
          "Bu hesap zaten var",
          "Bu e-posta ile daha önce kayıt olunmuş. Lütfen giriş yapın."
        );
      } else if (e?.code === "auth/invalid-email") {
        Alert.alert("Geçersiz e-posta", "Lütfen geçerli bir e-posta girin.");
      } else if (e?.code === "auth/weak-password") {
        Alert.alert("Zayıf şifre", "Şifre en az 6 karakter olmalıdır.");
      } else if (e?.code === "permission-denied") {
        Alert.alert(
          "Firestore İzin Hatası",
          "Firestore rules yazmaya izin vermiyor (permission-denied). Rules'u kontrol et."
        );
      } else {
        Alert.alert("Kayıt Başarısız", "Bir hata oluştu. Tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#040716", "#050914", "#070B12"]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
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
            <Image
              source={require("../../../assets/landing/farmer.png")}
              style={styles.hero}
              resizeMode="contain"
            />

            <Text style={styles.title}>Çiftçi Kayıt</Text>
            <Text style={styles.subTitle}>
              İşletme bilgilerini gir, hayvanlarını takip etmeye başla.
            </Text>

            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ad Soyad"
            />
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="Telefon (05xx...)"
              keyboardType="phone-pad"
            />

            <View style={styles.row2}>
              <View style={[styles.inputWrap, styles.flex1, styles.mr10]}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="İl"
                  placeholderTextColor="rgba(234,244,255,0.45)"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputWrap, styles.flex1]}>
                <TextInput
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="İlçe"
                  placeholderTextColor="rgba(234,244,255,0.45)"
                  style={styles.input}
                />
              </View>
            </View>

            <Input
              value={farmName}
              onChangeText={setFarmName}
              placeholder="İşletme / Çiftlik Adı"
            />
            <Input
              value={herdSize}
              onChangeText={setHerdSize}
              placeholder="Yaklaşık Hayvan Sayısı"
              keyboardType="numeric"
            />
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta"
              autoCapitalize="none"
              keyboardType="email-address"
            />

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

            <TouchableOpacity
              onPress={onRegister}
              activeOpacity={0.9}
              style={styles.primaryBtn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.primaryText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.muted}>Zaten hesabın var mı? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("FarmerLogin")}
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

function Input(props) {
  return (
    <View style={styles.inputWrap}>
      <TextInput
        {...props}
        placeholderTextColor="rgba(234,244,255,0.45)"
        style={styles.input}
      />
    </View>
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

  scrollContent: { paddingTop: 70, alignItems: "center" },
  hero: { width: "100%", height: 260, marginBottom: 6 },

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
  eyeBtn: { position: "absolute", right: 10, top: 10, padding: 6 },

  row2: { width: "100%", maxWidth: 420, flexDirection: "row" },
  flex1: { flex: 1 },
  mr10: { marginRight: 10 },

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
