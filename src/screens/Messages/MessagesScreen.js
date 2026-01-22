import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Platform,
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

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  // ✅ Şimdilik dummy data. Firebase/Firestore’dan çekince burayı replace edeceğiz.
  const threads = useMemo(
    () => [
      {
        id: "t1",
        vetId: "vet_001",
        vetName: "Dr. Mehmet Yılmaz",
        clinic: "Kötekli Veteriner Kliniği",
        lastMessage: "Tamam, akşama doğru kontrol edelim. Ateşi ölçtün mü?",
        lastAt: "12:40",
        unread: 2,
        online: true,
      },
      {
        id: "t2",
        vetId: "vet_002",
        vetName: "Dr. Ayşe Demir",
        clinic: "Aydın Hayvan Sağlığı",
        lastMessage: "Şap aşısı için en uygun gün Perşembe. Takvime ekliyorum.",
        lastAt: "Dün",
        unread: 0,
        online: false,
      },
      {
        id: "t3",
        vetId: "vet_003",
        vetName: "Dr. Selim Kaya",
        clinic: "Saha Veterineri",
        lastMessage: "Küpe no TR-123456 için fotoğraf atabilir misin?",
        lastAt: "Pzt",
        unread: 1,
        online: true,
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.vetName.toLowerCase().includes(q) ||
        t.clinic.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q)
    );
  }, [query, threads]);

  const openChat = (thread) => {
    // ✅ Chat ekranın farklı isimdeyse burayı değiştir
    navigation?.navigate?.("ChatRoom", {
      threadId: thread.id,
      vetId: thread.vetId,
      vetName: thread.vetName,
    });
  };

  const onNewMessage = () => {
    // Eğer “Veteriner seç” ekranın varsa oraya yönlendir:
    // navigation.navigate("VetFinder", { mode: "message" });

    // Şimdilik basitçe VetFinder'a gidelim (varsa)
    navigation?.navigate?.("VetFinder");
  };

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
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mesajlar</Text>
            <Text style={styles.subtitle}>Veterinerlerle görüşmeler</Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={onNewMessage}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Veteriner ara (isim, klinik...)"
            placeholderTextColor="rgba(234,244,255,0.35)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!query && (
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.9}
              onPress={() => setQuery("")}
            >
              <Ionicons name="close" size={16} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* LIST */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
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
                Bir veteriner seçip görüşme başlatabilirsin.
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={onNewMessage}
              >
                <Ionicons name="add" size={18} color="#0B1220" />
                <Text style={styles.primaryBtnText}>Yeni Mesaj Başlat</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={onNewMessage}
        >
          <Ionicons name="add" size={24} color="#0B1220" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function ThreadItem({ item, onPress }) {
  const initials = item.vetName
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
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* online dot */}
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: item.online
                ? COLORS.success
                : "rgba(234,244,255,0.25)",
            },
          ]}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={styles.threadTopRow}>
          <Text style={styles.threadName} numberOfLines={1}>
            {item.vetName}
          </Text>

          <Text style={styles.threadTime}>{item.lastAt}</Text>
        </View>

        <Text style={styles.threadClinic} numberOfLines={1}>
          {item.clinic}
        </Text>

        <View style={styles.threadBottomRow}>
          <Text style={styles.threadMsg} numberOfLines={1}>
            {item.lastMessage}
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
  subtitle: {
    color: COLORS.muted,
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
  },

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

  avatarWrap: { width: 52, height: 52, position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(123,190,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.text, fontWeight: "900", fontSize: 15 },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

  threadTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  threadName: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: "900" },
  threadTime: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },

  threadClinic: {
    color: "rgba(234,244,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  threadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  threadMsg: { flex: 1, color: COLORS.muted, fontSize: 12, fontWeight: "700" },

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
  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
  },
  emptyDesc: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  primaryBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.warm,
  },
  primaryBtnText: { color: "#0B1220", fontWeight: "900", fontSize: 12 },

  fab: {
    position: "absolute",
    right: 16,
    bottom: Platform.OS === "ios" ? 22 : 18,
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
