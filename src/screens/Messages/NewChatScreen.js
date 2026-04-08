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
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { useVetAuth } from "../../context/VetAuthContext";

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  card: "rgba(255,255,255,0.05)",
  card2: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  faint: "rgba(234,244,255,0.30)",
  warm: "#FFAA5A",
};

export default function NewChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile } = useFarmerAuth();
  const { vetProfile } = useVetAuth();
  const isVet = !!vetProfile?.uid;
  const currentUser = isVet ? vetProfile : farmerProfile;

  // Vet → farmer_info listesi, Farmer → vet_info listesi
  const targetCollection = isVet ? "farmer_info" : "vet_info";

  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch kullanıcı listesi (one-time, gerçek zamanlı gerekmez) ───────────
  useEffect(() => {
    setLoading(true);
    getDocs(collection(db, targetCollection))
      .then((snap) => {
        const data = snap.docs
          .map((d) => {
            const raw = d.data();
            return {
              id: d.id,
              uid: raw.uid ?? d.id,
              name: (raw.name ?? "").trim(),
              subtitle: isVet
                ? [(raw.farm_name ?? ""), (raw.city ?? "")]
                    .filter(Boolean)
                    .join(" · ")
                : [(raw.clinic_name ?? ""), (raw.city ?? "")]
                    .filter(Boolean)
                    .join(" · "),
              city: (raw.city ?? "").trim(),
            };
          })
          // Kendini listeden çıkar (vet aynı uid'yi farklı koleksiyonda taşıyamaz ama önlem)
          .filter((u) => u.uid !== currentUser?.uid)
          .sort((a, b) => a.name.localeCompare(b.name, "tr"));
        setUsers(data);
      })
      .catch((err) => console.error("NewChat fetch error:", err))
      .finally(() => setLoading(false));
  }, [targetCollection, currentUser?.uid]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.subtitle.toLowerCase().includes(q),
    );
  }, [searchText, users]);

  // ── Sohbet başlat ─────────────────────────────────────────────────────────
  const startChat = useCallback(
    (user) => {
      if (!currentUser?.uid) return;

      // Deterministik chatId: iki uid'yi sırala ve birleştir
      // Aynı iki kullanıcı her zaman aynı chatId'yi üretir
      const chatId = [currentUser.uid, user.uid].sort().join("_");

      // Vet → VetChatRoom, Farmer → ChatRoom
      const screen = isVet ? "VetChatRoom" : "ChatRoom";
      navigation.replace(screen, {
        chatId,
        otherName: user.name || "Kullanıcı",
        otherUserId: user.uid,
      });
    },
    [currentUser, navigation],
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
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Yeni Mesaj</Text>
            <Text style={styles.subtitle}>
              {isVet ? "Çiftçi ara ve seç" : "Veteriner ara ve seç"}
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={isVet ? "Çiftçi adı, çiftlik..." : "Veteriner adı, klinik..."}
            placeholderTextColor="rgba(234,244,255,0.35)"
            style={styles.searchInput}
            autoFocus
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
          <ActivityIndicator color={COLORS.warm} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.uid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <UserRow
                user={item}
                isVet={isVet}
                onPress={() => startChat(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="person-outline"
                  size={28}
                  color={COLORS.faint}
                />
                <Text style={styles.emptyText}>
                  {searchText
                    ? "Sonuç bulunamadı."
                    : isVet
                    ? "Kayıtlı çiftçi yok."
                    : "Kayıtlı veteriner yok."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

function UserRow({ user, isVet, onPress }) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.88} onPress={onPress}>
      {/* Avatar */}
      <View style={[styles.avatar, isVet ? styles.avatarFarmer : styles.avatarVet]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {user.name || "İsimsiz"}
        </Text>
        {!!user.subtitle && (
          <Text style={styles.rowSub} numberOfLines={1}>
            {user.subtitle}
          </Text>
        )}
      </View>

      {/* Arrow */}
      <View style={styles.chatIcon}>
        <Ionicons name="chatbubble-outline" size={16} color={COLORS.warm} />
      </View>
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
    marginBottom: 14,
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
    marginBottom: 14,
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

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarVet: {
    backgroundColor: "rgba(123,190,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(123,190,255,0.30)",
  },
  avatarFarmer: {
    backgroundColor: "rgba(255,170,90,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.30)",
  },
  avatarText: { color: COLORS.text, fontWeight: "900", fontSize: 15 },

  rowName: { color: COLORS.text, fontWeight: "900", fontSize: 13 },
  rowSub: { color: COLORS.muted, fontWeight: "700", fontSize: 11, marginTop: 3 },

  chatIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,170,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,170,90,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { color: COLORS.faint, fontWeight: "700", fontSize: 13 },
});
