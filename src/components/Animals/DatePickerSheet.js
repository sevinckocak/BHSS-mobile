import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DatePickerSheet({
  styles,
  COLORS,
  open,
  value,
  onChange,
  onClose,
}) {
  if (!open) return null;

  return (
    <View style={styles.pickerWrap}>
      {Platform.OS === "ios" ? (
        <View style={styles.iosPickerTop}>
          <Pressable onPress={onClose} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Tamam</Text>
          </Pressable>
        </View>
      ) : null}

      <DateTimePicker
        value={value}
        mode="date"
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={onChange}
        maximumDate={new Date(2100, 0, 1)}
        minimumDate={new Date(1980, 0, 1)}
        themeVariant="dark"
      />
    </View>
  );
}
