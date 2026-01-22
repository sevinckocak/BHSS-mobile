import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { styles } from "../styles/home.styles";

export default function QuickCard({
  icon,
  title,
  subtitle,
  gradient,
  iconBg,
  iconBorder,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickCardGradient}
      />

      <View style={[styles.quickIcon, { backgroundColor: iconBg }]}>
        <View
          style={[
            styles.quickIconInner,
            { borderColor: iconBorder, borderWidth: 1 },
          ]}
        >
          <Ionicons name={icon} size={20} color={COLORS.text} />
        </View>
      </View>

      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{subtitle}</Text>

      <View style={styles.quickCardCorner} />
    </TouchableOpacity>
  );
}
