import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
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

export default function VetMessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  // 🔥 Farmer listesi (mock)
  const threads = useMemo(
    () => [
      {
        id: "f1",
        farmerName: "Mehmet Kaya",
        farm: "Kaya Çiftliği",
        lastMessage: "Hocam ineğin ateşi var ne yapmalıyım?",
        lastAt: "12:40",
        unread: 2,
        online: true,
      },
      {
        id: "f2",
        farmerName: "Ayşe Demir",
        farm: "Demir Besi",
        lastMessage: "Aşı için yarın müsait misiniz?",
        lastAt: "Dün",
        unread: 0,
        online: false,
      },
      {
        id: "f3",
        farmerName: "Ali Yılmaz",
        farm: "Yılmaz Çiftliği",
        lastMessage: "Doğum başladı acil bakabilir misiniz?",
        lastAt: "Pzt",
        unread: 1,
        online: true,
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return threads.filter(
      (t) =>
        t.farmerName.toLowerCase().includes(q) ||
        t.farm.toLowerCase().includes(q),
    );
  }, [query, threads]);

  const openChat = (item) => {
    navigation.navigate("ChatRoom", {
      farmerName: item.farmerName,
      threadId: item.id,
    });
  };

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Farmer Mesajları</Text>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            placeholder="Farmer ara..."
            placeholderTextColor="rgba(234,244,255,0.35)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {/* LIST */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ThreadItem item={item} onPress={openChat} />
          )}
        />
      </View>
    </LinearGradient>
  );
}

function ThreadItem({ item, onPress }) {
  const initials = item.farmerName
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <TouchableOpacity
      style={styles.thread}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: item.online
                ? COLORS.success
                : "rgba(255,255,255,0.3)",
            },
          ]}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{item.farmerName}</Text>
          <Text style={styles.time}>{item.lastAt}</Text>
        </View>

        <Text style={styles.farm}>{item.farm}</Text>

        <View style={styles.rowBottom}>
          <Text style={styles.msg}>{item.lastMessage}</Text>

          {item.unread > 0 && (
            <View style={styles.unread}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },

  header: {
    marginBottom: 12,
  },
  title: {
    color: "#EAF4FF",
    fontSize: 18,
    fontWeight: "900",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#EAF4FF",
  },

  thread: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  avatarWrap: { width: 50, height: 50 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(123,190,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#EAF4FF",
    fontWeight: "900",
  },

  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 999,
  },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    color: "#EAF4FF",
    fontWeight: "900",
  },
  time: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },

  farm: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },

  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  msg: {
    flex: 1,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },

  unread: {
    backgroundColor: "#FF6B6B",
    borderRadius: 999,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
});
