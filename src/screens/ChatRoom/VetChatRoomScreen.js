import React, { useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  card: "rgba(255,255,255,0.05)",
  card2: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  accent: "#7BBEFF",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
  success: "#4ECDC4",
};

export default function VetChatRoomScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const farmerName = route?.params?.farmerName ?? "Farmer";
  const threadId = route?.params?.threadId ?? "thread_unknown";
  const farmerId = route?.params?.farmerId ?? "farmer_unknown";
  const isOnline = route?.params?.online ?? true;

  const listRef = useRef(null);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState(() => [
    {
      id: "m1",
      sender: "farmer",
      text: "Hocam merhaba, ineğimde iştahsızlık var.",
      time: "12:35",
    },
    {
      id: "m2",
      sender: "vet",
      text: "Merhaba, küpe numarasını ve belirtileri detaylı yazar mısın?",
      time: "12:36",
    },
    {
      id: "m3",
      sender: "farmer",
      text: "TR-123456. Ateşi yüksek ve biraz halsiz.",
      time: "12:38",
    },
    {
      id: "m4",
      sender: "vet",
      text: "Tamam, ateş kaç çıktı? Burun akıntısı ya da öksürük var mı?",
      time: "12:39",
    },
  ]);

  const headerSubtitle = useMemo(() => {
    return isOnline ? "Çevrimiçi" : "Çevrimdışı";
  }, [isOnline]);

  const initials = useMemo(() => {
    return farmerName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [farmerName]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    });
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: "vet",
      text,
      time: `${hh}:${mm}`,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setInput("");
    Keyboard.dismiss();
    scrollToBottom();

    setTimeout(() => {
      const replyMinute = String((now.getMinutes() + 1) % 60).padStart(2, "0");

      const reply = {
        id: `m_${Date.now()}_farmer`,
        sender: "farmer",
        text: "Tamam hocam, birazdan detaylı bilgi atıyorum.",
        time: `${hh}:${replyMinute}`,
      };

      setMessages((prev) => [reply, ...prev]);
    }, 900);
  };

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 10) + 8,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.9}
              onPress={() => navigation?.goBack?.()}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: isOnline
                        ? COLORS.success
                        : "rgba(234,244,255,0.25)",
                    },
                  ]}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {farmerName}
                </Text>
                <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.9}
              onPress={() => {}}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          {/* MESSAGES */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 6, paddingBottom: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => <Bubble item={item} />}
          />

          {/* INPUT BAR */}
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.9}>
              <Ionicons name="add" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.inputWrap}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Mesaj yaz..."
                placeholderTextColor="rgba(234,244,255,0.35)"
                style={styles.input}
                multiline
                maxLength={800}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, { opacity: input.trim() ? 1 : 0.55 }]}
              activeOpacity={0.9}
              onPress={sendMessage}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={18} color="#0B1220" />
            </TouchableOpacity>
          </View>

          {/* debug */}
          {/* 
          <Text style={{ color: COLORS.muted, fontSize: 10 }}>
            threadId: {threadId} | farmerId: {farmerId}
          </Text> 
          */}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Bubble({ item }) {
  const isMe = item.sender === "vet";

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isMe ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleFarmer]}
      >
        <Text style={[styles.bubbleText, !isMe && styles.bubbleTextFarmer]}>
          {item.text}
        </Text>

        <View style={styles.bubbleMetaRow}>
          <Text style={[styles.bubbleTime, !isMe && styles.bubbleTimeFarmer]}>
            {item.time}
          </Text>

          {isMe && (
            <Ionicons
              name="checkmark-done"
              size={14}
              color="rgba(11,18,32,0.70)"
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  avatarWrap: { width: 44, height: 44, position: "relative" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(123,190,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.text, fontWeight: "900", fontSize: 13 },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

  headerTitle: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  bubbleRow: { flexDirection: "row" },

  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMe: {
    backgroundColor: COLORS.warm,
    borderColor: "rgba(255,170,90,0.25)",
    borderTopRightRadius: 8,
  },
  bubbleFarmer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 8,
  },
  bubbleText: {
    color: "#0B1220",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  bubbleTextFarmer: {
    color: COLORS.text,
  },

  bubbleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  bubbleTime: {
    color: "rgba(11,18,32,0.60)",
    fontSize: 10,
    fontWeight: "900",
  },
  bubbleTimeFarmer: {
    color: "rgba(234,244,255,0.45)",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: Platform.OS === "ios" ? 2 : 0,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  inputWrap: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
  },
  input: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.warm,
  },
});
