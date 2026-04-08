import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { formatLastSeen } from "../../hooks/usePresence";
import { db } from "../../config/firebase/firebaseConfig";
import { useFarmerAuth } from "../../context/FarmerAuthContext";
import { useVetAuth } from "../../context/VetAuthContext";

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  border: "rgba(255,255,255,0.08)",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  warm: "#FFAA5A",
  accent: "#7BBEFF",
  success: "#32D583",
};

// Typing debounce: after this many ms of no input, typing=false is written
const TYPING_TIMEOUT_MS = 2000;
// Mesaj silme süresi: 1 saat
const ONE_HOUR_MS = 60 * 60 * 1000;

function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatBubbleTime(date) {
  if (!date) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ChatRoomScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { farmerProfile } = useFarmerAuth();
  const { vetProfile } = useVetAuth();
  const isVet = !!vetProfile?.uid;
  const currentUser = isVet ? vetProfile : farmerProfile;

  const chatId      = route?.params?.chatId      ?? "";
  const otherName   = route?.params?.otherName   ?? "Kullanıcı";
  const otherUserId = route?.params?.otherUserId ?? "";

  const listRef = useRef(null);
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState([]);
  const [sending,  setSending]  = useState(false);

  // Presence & typing state
  const [otherUserStatus, setOtherUserStatus] = useState({ isOnline: false, lastSeen: null });
  const [otherIsTyping,   setOtherIsTyping]   = useState(false);
  const [myClearedAtMs,   setMyClearedAtMs]   = useState(0);
  const [clearedAtReady,  setClearedAtReady]  = useState(false);

  // Refs that survive re-renders — needed in cleanup effects
  const typingTimerRef   = useRef(null);
  const isTypingRef      = useRef(false);   // tracks our own "currently typing" flag
  const chatIdRef        = useRef(chatId);
  const currentUidRef    = useRef(currentUser?.uid);
  useEffect(() => { chatIdRef.current     = chatId;           }, [chatId]);
  useEffect(() => { currentUidRef.current = currentUser?.uid; }, [currentUser?.uid]);

  const initials = useMemo(
    () => otherName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join(""),
    [otherName],
  );

  // ── 1. Listen to other user's online status + lastSeen ───────────────────
  // Kendi online/offline yönetimi usePresence hook'u ile yapılır.
  // Bu effect sadece karşı tarafı dinler.
  useEffect(() => {
    if (!otherUserId) return;
    return onSnapshot(doc(db, "users", otherUserId), (snap) => {
      const data = snap.data();
      setOtherUserStatus({
        isOnline: data?.isOnline ?? false,
        lastSeen: data?.lastSeen?.toDate ? data.lastSeen.toDate() : null,
      });
    });
  }, [otherUserId]);

  // ── 3. Listen to chat doc (typing + clearedAt) ───────────────────────────
  useEffect(() => {
    if (!chatId || !otherUserId) return;
    const ref = doc(db, "chats", chatId);
    return onSnapshot(ref, (snap) => {
      const data = snap.data();
      setOtherIsTyping(data?.typing?.[otherUserId] ?? false);
      // Use Math.max so a null/pending write never rolls back a local clear
      const clearedTs = data?.clearedAt?.[currentUser?.uid];
      const clearedMs = clearedTs?.toDate ? clearedTs.toDate().getTime() : 0;
      setMyClearedAtMs((prev) => Math.max(prev, clearedMs));
      setClearedAtReady(true);
    });
  }, [chatId, otherUserId, currentUser?.uid]);

  // ── 4. Clear own typing flag on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      const cId = chatIdRef.current;
      const uid = currentUidRef.current;
      if (cId && uid && isTypingRef.current) {
        setDoc(
          doc(db, "chats", cId),
          { [`typing.${uid}`]: false },
          { merge: true },
        ).catch(console.error);
      }
    };
  }, []); // runs only on unmount

  // ── 5. Messages listener + auto-mark seen ────────────────────────────────
  //
  // Firestore: chats/{chatId}/messages/{msgId}
  //   senderId:   string
  //   receiverId: string
  //   text:       string
  //   seen:       boolean   ← NEW
  //   createdAt:  Timestamp
  //
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        // Map messages
        const data = snap.docs.map((d) => {
          const msg = d.data();
          const createdAtDate = msg.createdAt?.toDate?.() ?? null;
          return {
            id:          d.id,
            senderId:    msg.senderId,
            receiverId:  msg.receiverId,
            text:        msg.text,
            seen:        msg.seen      ?? false,
            isDeleted:   msg.isDeleted ?? false,
            createdAtMs: createdAtDate ? createdAtDate.getTime() : 0,
            timeStr:     formatBubbleTime(createdAtDate),
          };
        });
        setMessages(data);

        // Auto-mark incoming unseen messages as seen
        if (!currentUser?.uid || !otherUserId) return;
        const unseenDocs = snap.docs.filter((d) => {
          const msg = d.data();
          return msg.senderId === otherUserId && !msg.seen;
        });
        if (unseenDocs.length === 0) return;

        try {
          const batch = writeBatch(db);
          unseenDocs.forEach((d) => batch.update(d.ref, { seen: true }));
          await batch.commit();

          // Reset our unread counter in the chat doc
          await setDoc(
            doc(db, "chats", chatId),
            { [`unreadCount.${currentUser.uid}`]: 0 },
            { merge: true },
          );
        } catch (err) {
          console.error("Mark seen error:", err);
        }
      },
      (err) => console.error("Messages listener error:", err),
    );

    return unsub;
  }, [chatId, currentUser?.uid, otherUserId]);

  // ── Typing indicator helpers ──────────────────────────────────────────────

  const writeTyping = useCallback(
    (value) => {
      if (!chatId || !currentUser?.uid) return;
      isTypingRef.current = value;
      setDoc(
        doc(db, "chats", chatId),
        { [`typing.${currentUser.uid}`]: value },
        { merge: true },
      ).catch(console.error);
    },
    [chatId, currentUser?.uid],
  );

  const handleInputChange = useCallback(
    (text) => {
      setInput(text);

      if (!text.trim()) {
        // Empty → clear immediately
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        if (isTypingRef.current) writeTyping(false);
        return;
      }

      // Set typing=true only once per "burst" to reduce writes
      if (!isTypingRef.current) writeTyping(true);

      // Reset debounce timer
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => writeTyping(false), TYPING_TIMEOUT_MS);
    },
    [writeTyping],
  );

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !currentUser?.uid || !chatId || sending) return;

    setInput("");
    Keyboard.dismiss();
    setSending(true);

    // Clear typing flag immediately
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) writeTyping(false);

    try {
      const ts = serverTimestamp();

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId:   currentUser.uid,
        receiverId: otherUserId,
        text,
        seen:       false,       // ← starts as unseen
        createdAt:  ts,
      });

      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [currentUser.uid, otherUserId],
          participantNames: {
            [currentUser.uid]: currentUser.fullName ?? "Kullanıcı",
            [otherUserId]:     otherName,
          },
          lastMessage: text,
          lastAt:      ts,
          [`unreadCount.${otherUserId}`]:    increment(1),
          [`unreadCount.${currentUser.uid}`]: 0,
        },
        { merge: true },
      );

      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      });
    } catch (err) {
      console.error("Send message error:", err);
      setInput(text); // restore on failure
    } finally {
      setSending(false);
    }
  }, [input, currentUser, chatId, otherUserId, otherName, sending, writeTyping]);

  // ── Delete message ────────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    (messageId, createdAtMs) => {
      // Süre kontrolü
      if (Date.now() - createdAtMs > ONE_HOUR_MS) {
        Alert.alert(
          "Süre Doldu",
          "Mesajlar yalnızca gönderildikten 1 saat içinde silinebilir.",
        );
        return;
      }

      Alert.alert(
        "Mesajı Sil",
        "Bu mesaj herkesten silinecek. Emin misiniz?",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: async () => {
              try {
                await updateDoc(
                  doc(db, "chats", chatId, "messages", messageId),
                  {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                    text: "",          // gizlilik için metni temizle
                  },
                );
              } catch (err) {
                console.error("Delete message error:", err);
              }
            },
          },
        ],
      );
    },
    [chatId],
  );

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    if (!currentUser?.uid || !chatId) return;
    const nowMs = Date.now();
    // Update local state immediately so UI clears without waiting for Firestore
    setMyClearedAtMs((prev) => Math.max(prev, nowMs));
    setDoc(
      doc(db, "chats", chatId),
      { [`clearedAt.${currentUser.uid}`]: Timestamp.fromMillis(nowMs) },
      { merge: true },
    ).catch(console.error);
  }, [chatId, currentUser?.uid]);

  const showMenu = useCallback(() => {
    Alert.alert("Sohbet Seçenekleri", undefined, [
      {
        text: "Sohbeti Temizle",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            "Sohbeti Temizle",
            "Tüm mesajlar yalnızca senin için silinecek.",
            [
              { text: "Vazgeç", style: "cancel" },
              { text: "Temizle", style: "destructive", onPress: clearChat },
            ],
          ),
      },
      { text: "Vazgeç", style: "cancel" },
    ]);
  }, [clearChat]);

  // ── Visible messages (filtered by clear timestamp) ───────────────────────
  const visibleMessages = useMemo(
    () => messages.filter((m) => m.createdAtMs === 0 || m.createdAtMs > myClearedAtMs),
    [messages, myClearedAtMs],
  );

  // ── Header subtitle ───────────────────────────────────────────────────────
  const headerStatus = useMemo(() => {
    if (otherIsTyping)             return "yazıyor...";
    if (otherUserStatus.isOnline)  return "çevrimiçi";
    if (otherUserStatus.lastSeen)  return `son görülme: ${formatLastSeen(otherUserStatus.lastSeen)}`;
    return "";
  }, [otherIsTyping, otherUserStatus]);

  // ─── Render ───────────────────────────────────────────────────────────────
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
              paddingTop:    Math.max(insets.top, 10) + 8,
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

            <View style={[styles.headerCenter, { flex: 1 }]}>
              {/* Online dot */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {otherUserStatus.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {otherName}
                </Text>
                {!!headerStatus && (
                  <Text
                    style={[
                      styles.headerStatus,
                      otherIsTyping && styles.headerStatusTyping,
                  !otherIsTyping && !otherUserStatus.isOnline && otherUserStatus.lastSeen && styles.headerStatusLastSeen,
                    ]}
                  >
                    {headerStatus}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.9}
              onPress={showMenu}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* MESSAGES */}
          {clearedAtReady ? (
            <FlatList
              ref={listRef}
              data={visibleMessages}
              keyExtractor={(item) => item.id}
              inverted
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 6, paddingBottom: 12 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <Bubble
                  item={item}
                  myUid={currentUser?.uid}
                  onDeleteMessage={deleteMessage}
                />
              )}
            />
          ) : (
            <ActivityIndicator color={COLORS.warm} style={{ flex: 1 }} />
          )}

          {/* TYPING BUBBLE — shown above input when other person is typing */}
          {otherIsTyping && <TypingBubble />}

          {/* INPUT BAR */}
          <View style={styles.inputBar}>
            <View style={styles.inputWrap}>
              <TextInput
                value={input}
                onChangeText={handleInputChange}
                placeholder="Mesaj yaz..."
                placeholderTextColor="rgba(234,244,255,0.35)"
                style={styles.input}
                multiline
                maxLength={800}
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, { opacity: input.trim() && !sending ? 1 : 0.45 }]}
              activeOpacity={0.9}
              onPress={sendMessage}
              disabled={!input.trim() || sending}
            >
              <Ionicons name="send" size={18} color="#0B1220" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Bubble({ item, myUid, onDeleteMessage }) {
  const isMe = item.senderId === myUid;

  // Long-press ile silme: sadece kendi mesajı, silinmemiş ve 1 saat içinde
  const canDelete =
    isMe && !item.isDeleted && Date.now() - (item.createdAtMs ?? 0) < ONE_HOUR_MS;

  const handleLongPress = () => {
    if (canDelete) onDeleteMessage(item.id, item.createdAtMs ?? 0);
  };

  // ── Silinmiş mesaj ──────────────────────────────────────────────────────
  if (item.isDeleted) {
    return (
      <View style={[styles.bubbleRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
        <View style={styles.bubbleDeleted}>
          <Ionicons name="ban-outline" size={13} color={COLORS.muted} />
          <Text style={styles.deletedText}>Bu mesaj silindi</Text>
        </View>
      </View>
    );
  }

  // ── Normal mesaj ────────────────────────────────────────────────────────
  const tickIcon  = item.seen ? "checkmark-done" : "checkmark";
  const tickColor = item.seen ? COLORS.accent    : "rgba(11,18,32,0.55)";

  return (
    <View style={[styles.bubbleRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={canDelete ? handleLongPress : undefined}
        delayLongPress={350}
      >
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, !isMe && styles.bubbleTextOther]}>
            {item.text}
          </Text>

          <View style={styles.bubbleMetaRow}>
            <Text style={[styles.bubbleTime, !isMe && styles.bubbleTimeOther]}>
              {item.timeStr}
            </Text>
            {isMe && (
              <Ionicons
                name={tickIcon}
                size={14}
                color={tickColor}
                style={{ marginLeft: 5 }}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function TypingBubble() {
  return (
    <View style={styles.typingWrap}>
      <View style={styles.typingDot} />
      <View style={[styles.typingDot, styles.typingDotMid]} />
      <View style={styles.typingDot} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { flex: 1, paddingHorizontal: 16 },

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

  avatarWrap: { width: 36, height: 36, position: "relative" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

  headerTitle: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  headerStatus: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
    color: COLORS.muted,
  },
  headerStatusTyping:   { color: COLORS.success },
  headerStatusLastSeen: { color: "rgba(234,244,255,0.38)", fontSize: 10 },

  bubbleRow: { flexDirection: "row" },

  // Silinmiş mesaj balonu
  bubbleDeleted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  deletedText: {
    color: COLORS.muted,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "600",
  },

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
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    color: "#0B1220",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  bubbleTextOther: { color: COLORS.text },
  bubbleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  bubbleTime: { color: "rgba(11,18,32,0.60)", fontSize: 10, fontWeight: "900" },
  bubbleTimeOther: { color: COLORS.muted },

  // Typing animation dots
  typingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignSelf: "flex-start",
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: COLORS.muted,
  },
  typingDotMid: { opacity: 0.6 },

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
