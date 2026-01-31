import React from "react";
import { View, TextInput } from "react-native";

export default function Field({
  styles,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = "rgba(255,255,255,0.45)",
  keyboardType,
  full,
}) {
  return (
    <View style={[styles.fieldWrap, full && { width: "100%" }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}
