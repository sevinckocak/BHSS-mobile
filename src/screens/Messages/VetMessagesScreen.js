import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase/firebaseConfig";
import { useVetAuth } from "../../context/VetAuthContext";

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  card: "rgba(255,255,255,0.05)",
  card2: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(date) {
  if (!date) return "";
  const now = new Date();
  if (now.toDateString() === date.toDateString()) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return "Dün";
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

export default function VetMessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vetProfile } = useVetAuth();

  const [searchText, setSearchText] = useState("");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Firestore: tüm sohbetleri dinle ──────────────────────────────────────
  useEffect(() => {
    if (!vetProfile?.uid) return;
    setLoading(true);

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", vetProfile.uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => {
            const chat = d.data();
            const otherUserId = (chat.participants ?? []).find(
              (p) => p !== vetProfile.uid,
            );
            const lastAtDate = chat.lastAt?.toDate ? chat.lastAt.toDate() : null;
            return {
              id: d.id,
              chatId: d.id,
              otherUserId: otherUserId ?? "",
              otherName: chat.participantNames?.[otherUserId] ?? "Çiftçi",
              lastMessage: chat.lastMessage ?? "",
              lastAtStr: formatTime(lastAtDate),
              lastAtMs: lastAtDate ? lastAtDate.getTime() : 0,
              unread: chat.unreadCount?.[vetProfile.uid] ?? 0,
            };
          })
          .sort((a, b) => b.lastAtMs - a.lastAtMs);
        setThreads(data);
        setLoading(false);
      },
      (err) => {
        console.error("VetMessages listener error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [vetProfile?.uid]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.otherName.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q),
    );
  }, [searchText, threads]);

  // ── Sohbet aç ────────────────────────────────────────────────────────────
  const openChat = useCallback(
    (thread) => {
      navigation.navigate("VetChatRoom", {
        chatId: thread.chatId,
        otherName: thread.otherName,
        otherUserId: thread.otherUserId,
      });
    },
    [navigation],
  );

  const openNewChat = useCallback(
    () => navigation.navigate("NewChat"),
    [navigation],
  );

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + 8,
            paddingBottom: Math.max(insets.bottom, 10) + 12,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mesajlar</Text>
            <Text style={styles.subtitle}>Çiftçilerle görüşmeler</Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={openNewChat}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Çiftçi ara..."
            placeholderTextColor="rgba(234,244,255,0.35)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!searchText && (
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.9}
              onPress={() => setSearchText("")}
            >
              <Ionicons name="close" size={16} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator color={COLORS.warm} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <ThreadItem item={item} onPress={openChat} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color={COLORS.muted}
                />
                <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
                <Text style={styles.emptyDesc}>
                  Bir çiftçi sana mesaj gönderdiğinde burada görünür.
                </Text>
              </View>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(insets.bottom, 10) + 90 }]}
          activeOpacity={0.9}
          onPress={openNewChat}
        >
          <Ionicons name="add" size={24} color="#0B1220" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function ThreadItem({ item, onPress }) {
  const initials = item.otherName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <TouchableOpacity
      style={styles.thread}
      activeOpacity={0.92}
      onPress={() => onPress(item)}
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.threadTopRow}>
          <Text style={styles.threadName} numberOfLines={1}>
            {item.otherName}
          </Text>
          <Text style={styles.threadTime}>{item.lastAtStr}</Text>
        </View>

        <View style={styles.threadBottomRow}>
          <Text
            style={[
              styles.threadMsg,
              item.unread > 0 && styles.threadMsgUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || "Henüz mesaj yok"}
          </Text>

          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
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
  title: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  subtitle: { color: COLORS.muted, marginTop: 2, fontSize: 11, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  thread: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarWrap: { width: 52, height: 52 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,170,90,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.text, fontWeight: "900", fontSize: 15 },

  threadTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  threadName: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: "900" },
  threadTime: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },

  threadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  threadMsg: { flex: 1, color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  threadMsgUnread: { color: COLORS.text, fontWeight: "900" },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900", marginTop: 6 },
  emptyDesc: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },

  fab: {
    position: "absolute",
    right: 0,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.warm,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
