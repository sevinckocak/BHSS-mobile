import React from "react";
import { TouchableOpacity, View, Text, Image } from "react-native";
import { COLORS } from "../constants/colors";
import { styles } from "../styles/home.styles";

export default function HerdChip({
  img,
  label,
  value,
  tone = "default",
  onPress,
}) {
  const toneStyle =
    tone === "warn"
      ? {
          backgroundColor: "rgba(255,170,90,0.10)",
          borderColor: "rgba(255,170,90,0.18)",
        }
      : tone === "danger"
      ? {
          backgroundColor: "rgba(255,107,107,0.10)",
          borderColor: "rgba(255,107,107,0.18)",
        }
      : tone === "accent"
      ? {
          backgroundColor: "rgba(123,190,255,0.10)",
          borderColor: "rgba(123,190,255,0.18)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderColor: "rgba(255,255,255,0.08)",
        };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.herdChip, toneStyle]}
    >
      <View style={styles.herdChipLeft}>
        <Text style={styles.herdChipValue}>{value}</Text>
        <Text style={styles.herdChipLabel}>{label}</Text>
      </View>

      <Image source={img} style={styles.herdChipBgImg} resizeMode="contain" />
    </TouchableOpacity>
  );
}
