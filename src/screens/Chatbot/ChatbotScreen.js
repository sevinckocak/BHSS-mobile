import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.55)",
  bubbleAI: "rgba(255,255,255,0.08)",
  bubbleAIBorder: "rgba(255,255,255,0.10)",
  bubbleUser: "#FFB15A",
  chip: "rgba(255,255,255,0.10)",
  chipBorder: "rgba(255,255,255,0.12)",
  inputBg: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.10)",
  orange: "#FFB15A",
  orange2: "#FFCC72",
  drawerBg: "rgba(7,11,18,0.96)",
  drawerBorder: "rgba(255,255,255,0.08)",
};

// 🔧 Eğer tab bar senin projende daha yüksekse burayı güncellersin
const TABBAR_H = 70;

// 🔧 Input bar sabit yüksekliği
const INPUT_H = 64;

export default function ChatbotScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Drawer
  const DRAWER_W = Math.round(W * 0.5);
  const drawerX = useRef(new Animated.Value(-DRAWER_W)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollRef = useRef(null);

  const initialMessages = useMemo(
    () => [
      {
        id: "m1",
        role: "assistant",
        text: "Merhaba Ahmet Bey,\nçiftliğinizle ilgili size nasıl yardımcı olabilirim?",
      },
      { id: "m2", role: "user", text: "Buzağılarda ishal için ne yapmalıyım?" },
      {
        id: "m3",
        role: "assistant",
        text: "İshal durumunda öncelikle sıvı kaybını önlemek önemlidir.\nVeterinerinize danışmanızı öneririm.",
      },
    ],
    []
  );

  const quickReplies = useMemo(
    () => [
      { id: "q1", text: "Hastalanan hayvanım var" },
      { id: "q2", text: "Rasyon önerisi al" },
      { id: "q3", text: "Veteriner randevusu oluştur" },
    ],
    []
  );

  const chats = useMemo(
    () => [
      { id: "c1", title: "Buzağı ishali", time: "Bugün" },
      { id: "c2", title: "Aşı hatırlatma", time: "Dün" },
      { id: "c3", title: "Rasyon planı", time: "1 hafta önce" },
      { id: "c4", title: "Topallık kontrol", time: "2 hafta önce" },
    ],
    []
  );

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerX, {
      toValue: -DRAWER_W,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setDrawerOpen(false);
    });
  };

  const toggleDrawer = () => (drawerOpen ? closeDrawer() : openDrawer());

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;

    const userMsg = { id: String(Date.now()), role: "user", text: t };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg = {
        id: String(Date.now() + 1),
        role: "assistant",
        text: "Anladım. Küpe no, yaş ve belirtileri yazarsanız daha net yönlendirebilirim.",
      };
      setMessages((prev) => [...prev, aiMsg]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 350);
  };

  const onSelectChat = () => closeDrawer();

  // ✅ Input BAR her zaman DİPTE: (tabbar’a yakın)
  // Tabbar yüksekliğini bottom'a EKLEME. (bu yukarı itiyor)
  // Sadece safe-area ekle.
  const inputBottom = 2;

  // ✅ ScrollView içeriği input + tabbar altına girmesin
  // (input absolute olduğu için içerik altında boşluk bırakıyoruz)
  const chatPadBottom =
    INPUT_H + inputBottom + TABBAR_H + Math.max(insets.bottom, 0) + 18;

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            activeOpacity={0.9}
            onPress={toggleDrawer}
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

        {/* Chat */}
        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={[
            styles.chatContent,
            { paddingBottom: chatPadBottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} text={m.text} />
          ))}

          <View style={styles.quickWrap}>
            {quickReplies.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={styles.quickChip}
                activeOpacity={0.9}
                onPress={() => send(q.text)}
              >
                <Text style={styles.quickText}>{q.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ✅ Input Bar (DİPTE) */}
        <View style={[styles.inputArea, { bottom: inputBottom }]}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.9}>
              <Ionicons name="camera-outline" size={20} color={COLORS.muted} />
            </TouchableOpacity>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Bir mesaj yazın..."
              placeholderTextColor="rgba(234,244,255,0.32)"
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={() => send()}
            />

            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.9}>
              <Ionicons name="mic-outline" size={20} color={COLORS.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendBtn}
              activeOpacity={0.9}
              onPress={() => send()}
            >
              <Ionicons name="arrow-forward" size={20} color="#0B1220" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Drawer Overlay */}
        {drawerOpen && (
          <Pressable style={styles.overlay} onPress={closeDrawer} />
        )}

        {/* Drawer */}
        <Animated.View
          pointerEvents={drawerOpen ? "auto" : "none"}
          style={[
            styles.drawer,
            {
              width: DRAWER_W,
              paddingTop: Math.max(insets.top, 12) + 6,
              transform: [{ translateX: drawerX }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Geçmiş Sohbetler</Text>
            <TouchableOpacity onPress={closeDrawer} activeOpacity={0.9}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.drawerDivider} />

          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {chats.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.chatItem}
                activeOpacity={0.92}
                onPress={onSelectChat}
              >
                <View style={styles.chatItemIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={COLORS.orange}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatItemTitle}>{c.title}</Text>
                  <Text style={styles.chatItemMeta}>{c.time}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(234,244,255,0.35)"
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.newChatBtn}
              activeOpacity={0.9}
              onPress={closeDrawer}
            >
              <Ionicons name="add" size={18} color="#0B1220" />
              <Text style={styles.newChatText}>Yeni Sohbet</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ---------------- UI Components ---------------- */

function Bubble({ role, text }) {
  const isUser = role === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAI,
      ]}
    >
      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  hamburgerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerTitle: { flex: 1, alignItems: "center", justifyContent: "center" },
  rightSpacer: { width: 44 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: "rgba(255,177,90,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,177,90,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#EAF4FF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.2,
  },

  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingTop: 8 },

  bubbleRow: { marginBottom: 10, flexDirection: "row" },
  bubbleRowAI: { justifyContent: "flex-start" },
  bubbleRowUser: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  bubbleAI: {
    backgroundColor: COLORS.bubbleAI,
    borderColor: COLORS.bubbleAIBorder,
    borderTopLeftRadius: 10,
  },
  bubbleUser: {
    backgroundColor: COLORS.bubbleUser,
    borderColor: "rgba(0,0,0,0.12)",
    borderTopRightRadius: 10,
  },
  bubbleText: { fontSize: 13, fontWeight: "800", lineHeight: 18 },
  bubbleTextAI: { color: COLORS.text },
  bubbleTextUser: { color: "#0B1220" },

  quickWrap: { marginTop: 4, gap: 10 },
  quickChip: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  quickText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },

  // ✅ Input bar absolute + bottom (dipte)
  inputArea: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 0, // küçük, daha premium
  },
  inputBar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 18,
    paddingHorizontal: 10,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.drawerBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.drawerBorder,
    paddingHorizontal: 14,
  },
  drawerHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerTitle: { color: COLORS.text, fontWeight: "900", fontSize: 14 },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  chatItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,177,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,177,90,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatItemTitle: { color: COLORS.text, fontWeight: "900", fontSize: 12 },
  chatItemMeta: {
    color: "rgba(234,244,255,0.55)",
    fontWeight: "800",
    fontSize: 11,
    marginTop: 3,
  },

  newChatBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    marginTop: 6,
  },
  newChatText: { color: "#0B1220", fontWeight: "900", fontSize: 12 },
});
