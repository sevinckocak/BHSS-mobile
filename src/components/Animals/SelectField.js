import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SelectField({
  styles,
  COLORS,
  value,
  placeholder,
  onPress,
  full,
}) {
  const hasValue = !!(value && String(value).trim().length > 0);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.fieldWrap, full && { width: "100%" }]}
    >
      <View style={styles.selectPill}>
        <Text
          style={[
            styles.selectText,
            !hasValue && { color: "rgba(255,255,255,0.45)" },
          ]}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.gold} />
      </View>
    </Pressable>
  );
}
