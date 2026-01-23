import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/chatStyles";
import { COLORS } from "../constants/chatConstants";
import { timeAgoTR } from "../../../utils/timeAgo"; // ⬅️ Gerekirse path'i düzelt

export default function ChatDrawer({
  drawerOpen,
  drawerX,
  drawerW,
  insetsTop,
  chats,
  onClose,
  onSelectChat, // (chatId) => void
  onNewChat,
}) {
  return (
    <Animated.View
      pointerEvents={drawerOpen ? "auto" : "none"}
      style={[
        styles.drawer,
        {
          width: drawerW,
          paddingTop: Math.max(insetsTop, 12) + 6,
          transform: [{ translateX: drawerX }],
        },
      ]}
    >
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Geçmiş Sohbetler</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.9}>
          <Ionicons name="close" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.drawerDivider} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {(!chats || chats.length === 0) && (
          <View style={{ paddingVertical: 14 }}>
            <Text style={{ color: "rgba(234,244,255,0.7)", fontWeight: "800" }}>
              Henüz sohbet yok
            </Text>
            <Text style={{ color: "rgba(234,244,255,0.45)", marginTop: 6 }}>
              “Yeni Sohbet” ile başlayabilirsin.
            </Text>
          </View>
        )}

        {(chats || []).map((c) => {
          const title = c?.title || "Sohbet";
          const time = timeAgoTR(c?.updatedAt || c?.createdAt);
          const last = c?.lastMessage || "";

          return (
            <TouchableOpacity
              key={c.id}
              style={styles.chatItem}
              activeOpacity={0.92}
              onPress={() => onSelectChat?.(c.id)}
            >
              <View style={styles.chatItemIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={COLORS.orange}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.chatItemTitle} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.chatItemMeta} numberOfLines={1}>
                  {time}
                  {!!last ? ` • ${last}` : ""}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(234,244,255,0.35)"
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.newChatBtn}
          activeOpacity={0.9}
          onPress={onNewChat}
        >
          <Ionicons name="add" size={18} color="#0B1220" />
          <Text style={styles.newChatText}>Yeni Sohbet</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}
