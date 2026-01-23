import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/chatStyles";
import { COLORS } from "../constants/chatConstants";

export default function ChatTopBar({ insetsTop, onPressMenu }) {
  return (
    <View style={[styles.topBar, { paddingTop: Math.max(insetsTop, 12) }]}>
      <TouchableOpacity
        style={styles.hamburgerBtn}
        activeOpacity={0.9}
        onPress={onPressMenu}
      >
        <Ionicons name="menu" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.centerTitle}>
        <View style={styles.titleRow}>
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={16} color={COLORS.orange2} />
          </View>
          <Text style={styles.title}>BHSS Akıllı Asistan</Text>
        </View>
      </View>

      <View style={styles.rightSpacer} />
    </View>
  );
}
