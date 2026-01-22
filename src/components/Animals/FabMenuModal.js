import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  active: "#FFAA5A",
  text: "#EAF4FF",
};

export default function FabMenuModal({ visible, onClose, onPick }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dışarı tıklayınca kapansın */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        {/* ✅ BLUR: daha güçlü */}
        <BlurView
          tint="dark"
          intensity={Platform.OS === "android" ? 95 : 80} // ✅ arttır
          style={StyleSheet.absoluteFill}
          // ✅ Android’de blur gücü (Expo destekliyse)
          experimentalBlurMethod="dimezisBlurView"
        />

        {/* ✅ Blur’u BOĞMAYAN ince karartma */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.12)" }, // eskisi 0.25+ idi, düşürdüm
          ]}
        />
      </Pressable>

      {/* İçerik */}
      <View pointerEvents="box-none" style={styles.content}>
        <ActionCard
          icon="paw-outline"
          title="Yeni Hayvan Ekle"
          onPress={() => onPick("AddAnimal")}
        />
        <ActionCard
          icon="heart-outline"
          title="Doğum Ekle"
          onPress={() => onPick("AddBirth")}
        />

        {/* alttaki kapat */}
        <View
          style={[styles.bottomWrap, { paddingBottom: 10 + insets.bottom }]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={26} color="#0B1220" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ActionCard({ icon, title, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={24} color={COLORS.active} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.plusBox}>
        <Ionicons name="add" size={22} color={COLORS.active} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 86,
  },

  card: {
    height: 78,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 16,

    // ✅ Kart transparan ama okunaklı
    backgroundColor: "rgba(25,35,60,0.55)", // biraz daha şeffaf → blur daha görünür
    borderWidth: 2,
    borderColor: "rgba(255,170,90,0.65)",

    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: { flexDirection: "row", alignItems: "center", gap: 14 },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,170,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { color: COLORS.text, fontWeight: "900", fontSize: 18 },

  plusBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },

  closeBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.active,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 14,
  },
});
