import React from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/chatStyles";
import { COLORS } from "../constants/chatConstants";

export default function ChatInputBar({
  value,
  onChangeText,
  loading,
  onPickImage,
  onSend,
}) {
  return (
    <View style={styles.inputBar}>
      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.9}
        onPress={onPickImage}
        disabled={loading}
      >
        <Ionicons name="camera-outline" size={20} color={COLORS.muted} />
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={loading ? "Yanıt bekleniyor..." : "Bir mesaj yazın..."}
        placeholderTextColor="rgba(234,244,255,0.32)"
        style={styles.input}
        returnKeyType="send"
        editable={!loading}
        onSubmitEditing={onSend}
      />

      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.9}
        disabled={loading}
        onPress={() =>
          Alert.alert(
            "Bilgi",
            "Sesli kayıt şu an aktif değil. İstersen sonra ekleriz.",
          )
        }
      >
        <Ionicons name="mic-outline" size={20} color={COLORS.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sendBtn, loading && { opacity: 0.7 }]}
        activeOpacity={0.9}
        onPress={onSend}
        disabled={loading}
      >
        <Ionicons name="arrow-forward" size={20} color="#0B1220" />
      </TouchableOpacity>
    </View>
  );
}
