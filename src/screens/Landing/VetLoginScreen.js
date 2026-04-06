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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVetAuth } from "../../context/VetAuthContext";

export default function VetLoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [secure, setSecure] = useState(true);

  const { vetLogin } = useVetAuth();

  const onLogin = async () => {
    try {
      await vetLogin({ email, password: pass });

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "VetTabs",
            state: {
              routes: [{ name: "VetHome" }],
            },
          },
        ],
      });
    } catch (e) {
      console.log("VET LOGIN ERROR:", e);

      if (e.message === "Bu hesap veteriner hesabı değil.") {
        Alert.alert(
          "Yanlış Hesap Türü",
          "Bu hesap veteriner hesabı olarak kayıtlı değil.",
        );
      } else if (e.code === "auth/invalid-credential") {
        Alert.alert("Giriş Başarısız", "E-posta veya şifre yanlış.");
      } else if (e.code === "auth/user-not-found") {
        Alert.alert(
          "Hesap Bulunamadı",
          "Bu e-posta ile kayıtlı veteriner hesabı yok.",
        );
      } else if (e.code === "auth/invalid-email") {
        Alert.alert("Geçersiz E-posta", "Lütfen geçerli bir e-posta girin.");
      } else {
        Alert.alert("Hata", "Giriş yapılamadı. Tekrar deneyin.");
      }
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Landing");
  };

  return (
    <LinearGradient
      colors={["#040716", "#050914", "#070B12"]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity
          style={[styles.backBtn, { marginTop: 8 + insets.top }]}
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
          <View style={styles.center}>
            <Image
              source={require("../../../assets/landing/vet.png")}
              style={styles.hero}
              resizeMode="contain"
            />

            <Text style={styles.title}>Veteriner Girişi</Text>

            <View style={styles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Kullanıcı adı veya e-posta"
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

            <TouchableOpacity
              onPress={onLogin}
              activeOpacity={0.9}
              style={styles.loginBtn}
            >
              <Text style={styles.loginText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => console.log("Şifremi unuttum")}
              activeOpacity={0.8}
            >
              <Text style={styles.link}>Şifremi Unuttum</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <Text style={styles.muted}>Hesabınız yok mu? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("VetRegister")}
                activeOpacity={0.8}
              >
                <Text style={styles.linkStrong}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  backText: {
    color: "rgba(234,244,255,0.9)",
    fontWeight: "800",
    marginLeft: 2,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 22,
  },

  hero: {
    width: "100%",
    height: 380,
    marginBottom: 10,
  },

  title: {
    color: "#EAF4FF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14,
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

  loginBtn: {
    width: "100%",
    maxWidth: 420,
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#EAF4FF",
  },
  loginText: { color: "#050914", fontWeight: "900" },

  link: {
    marginTop: 12,
    color: "rgba(234,244,255,0.75)",
    textAlign: "center",
    fontWeight: "700",
  },
  row: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  muted: { color: "rgba(234,244,255,0.6)", fontWeight: "700" },
  linkStrong: { color: "#7BBEFF", fontWeight: "900" },
});
