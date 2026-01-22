import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#070B12",
  plus: "#FFAA5A",
  text: "#EAF4FF",
};

export default function CenterPlusButton({ onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.wrap}>
      <View style={styles.btn}>
        <Ionicons name="add" size={30} color={COLORS.text} />
      </View>
      <Text style={styles.label}>Ekle</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: "center", alignItems: "center", width: 82 },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.plus,
    borderWidth: 6,
    borderColor: COLORS.bg,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(234,244,255,0.75)",
  },
});
