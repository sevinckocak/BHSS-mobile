import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SimpleSelectModal({
  styles,
  COLORS,
  visible,
  title,
  items,
  onClose,
  onSelect,
}) {
  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalPortal} pointerEvents="box-none">
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={COLORS.gold} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {items.map((it, idx) => (
              <Pressable
                key={it.id ?? `${it.name}-${idx}`}
                onPress={() => onSelect(it)}
                style={styles.modalItem}
                android_ripple={
                  Platform.OS === "android"
                    ? { color: "rgba(242,208,138,0.12)" }
                    : undefined
                }
              >
                <Text style={styles.modalItemText}>{it.name}</Text>
                {it.origin ? (
                  <Text style={styles.modalItemSub}>{it.origin}</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
