import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { useFarmerAuth } from "../../context/FarmerAuthContext";

import ChatBubble from "./components/ChatBubble";
import ChatTopBar from "./components/ChatTopBar";
import ChatInputBar from "./components/ChatInputBar";
import ChatDrawer from "./components/ChatDrawer";
import useChatDrawer from "./hooks/useChatDrawer";
import { useActivities } from "../../context/ActivitiesContext";
import { styles } from "./styles/chatStyles";
import { CHAT_ENDPOINT, INPUT_H, TABBAR_H, W } from "./constants/chatConstants";

import {
  loadChats,
  saveChats,
  createChat,
  addMessagesToChat,
  sortChatsByUpdatedAt,
} from "./storage/chatStorage"; // ⬅️ path'i kontrol et

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const { farmerProfile, booting } = useFarmerAuth();

  // 🔁 uid sende farklıysa düzelt (auth uid vs)
  const uid = farmerProfile?.uid || "guest";
  const userName = (farmerProfile?.fullName || "").trim() || "Çiftçimiz";

  const DRAWER_W = Math.round(W * 0.5);
  const { drawerX, drawerOpen, closeDrawer, toggleDrawer } =
    useChatDrawer(DRAWER_W);

  const scrollRef = useRef(null);
  const { logActivity } = useActivities();
  const [chatLogged, setChatLogged] = useState(false);
  useEffect(() => {
    setChatLogged(false);
  }, [activeChatId]);

  const initialMessages = useMemo(
    () => [
      {
        id: "m1",
        role: "assistant",
        text:
          `Merhaba ${userName},\nçiftliğinizle ilgili size nasıl yardımcı olabilirim?\n\n` +
          "Not: Sadece büyükbaş hayvan sağlığı sorularını yanıtlarım. 🐄",
      },
    ],
    [userName],
  );

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const scrollToEndSoon = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 80);
  };

  useEffect(() => {
    if (booting) return;

    setMessages((prev) => {
      if (!prev?.length) return prev;
      const first = prev[0];
      const isWelcome = first?.id === "m1" && first?.role === "assistant";
      if (!isWelcome) return prev;

      const newText =
        `Merhaba ${userName},\nçiftliğinizle ilgili size nasıl yardımcı olabilirim?\n\n` +
        "Not: Sadece büyükbaş hayvan sağlığı sorularını yanıtlarım. 🐄";

      if (first.text === newText) return prev;
      return [{ ...first, text: newText }, ...prev.slice(1)];
    });
  }, [booting, userName]);

  useEffect(() => {
    if (booting) return;

    (async () => {
      const list = await loadChats(uid);
      const sorted = sortChatsByUpdatedAt(list);
      setChats(sorted);

      if (sorted.length) {
        const firstChat = sorted[0];
        setActiveChatId(firstChat.id);
        setMessages(
          firstChat.messages?.length ? firstChat.messages : initialMessages,
        );
      } else {
        setActiveChatId(null);
        setMessages(initialMessages);
      }

      scrollToEndSoon();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, uid, initialMessages]);

  // ✅ Kamera
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin gerekli",
          "Kamera izni olmadan fotoğraf gönderemezsiniz.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      const name = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
      const type = "image/jpeg";

      setSelectedImage({ uri, name, type });

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          text: "Fotoğraf alındı \nŞimdi sorunu kısa yazıp gönder (örn: 'meme ucunda şişlik ve sıcaklık var').",
          ts: Date.now(),
        },
      ]);
      scrollToEndSoon();
    } catch {
      Alert.alert("Hata", "Kamera açılırken hata oluştu.");
    }
  };

  const callChatApi = async (text) => {
    if (!selectedImage) {
      return fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
    }

    const form = new FormData();
    form.append("message", text);
    form.append("image", {
      uri: selectedImage.uri,
      name: selectedImage.name,
      type: selectedImage.type,
    });

    return fetch(CHAT_ENDPOINT, { method: "POST", body: form });
  };

  // ✅ Chat yoksa otomatik oluştur
  const ensureActiveChat = async (firstUserText) => {
    if (activeChatId) return activeChatId;

    const newChat = createChat({ initialMessages, firstUserText });
    const next = [newChat, ...chats];

    setChats(next);
    await saveChats(uid, next);

    setActiveChatId(newChat.id);
    setMessages(newChat.messages);
    return newChat.id;
  };

  // ✅ prev state ile güvenli kaydet
  const persist = ({ chatId, newMessages, lastMessageText, titleFromText }) => {
    setChats((prev) => {
      const updated = addMessagesToChat(prev, chatId, newMessages, {
        lastMessageText,
        titleFromText,
      });
      saveChats(uid, updated);
      return updated;
    });
  };

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;

    const chatId = await ensureActiveChat(t);

    // ✅ Activity (1 kez / chat başına)
    if (!chatLogged) {
      try {
        await logActivity({
          type: "chat",
          title: "Sohbet başlatıldı",
          meta: `Mesaj: ${t.slice(0, 80)}`,
          route: "Messages", // sende chat screen route neyse
          routeParams: { chatId },
        });
        setChatLogged(true);
      } catch (e) {
        console.log("CHAT logActivity ERROR:", e?.code, e?.message);
      }
    }

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      text: t,
      ts: Date.now(),
    };

    // UI'ya ekle
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    scrollToEndSoon();

    // Storage'a yaz (user)
    persist({
      chatId,
      newMessages: [userMsg],
      lastMessageText: t,
      titleFromText: t,
    });

    const typingId = `typing_${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", text: "Yazıyor...", ts: Date.now() },
    ]);
    scrollToEndSoon();

    try {
      setLoading(true);
      const resp = await callChatApi(t);

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`HTTP ${resp.status} - ${errText.slice(0, 220)}`);
      }

      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const txt = await resp.text();
        throw new Error(`JSON değil: ${txt.slice(0, 220)}`);
      }

      const data = await resp.json();
      const replyText = data?.reply || "Cevap üretemedim. Tekrar deneyin.";

      // typing'i değiştir
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: replyText } : m)),
      );

      const assistantMsg = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: replyText,
        ts: Date.now(),
      };

      // Storage'a assistant olarak yaz (typing'i saklamıyoruz)
      persist({
        chatId,
        newMessages: [assistantMsg],
        lastMessageText: replyText,
        titleFromText: null,
      });

      setSelectedImage(null);
    } catch (e) {
      const errTxt =
        `Hata: ${String(e.message || e).slice(0, 220)}\n\n` +
        "Kontrol:\n• Render uyandı mı?\n• Endpoint /chat mı?\n";

      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: errTxt } : m)),
      );

      const assistantErr = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: errTxt,
        ts: Date.now(),
      };

      persist({
        chatId,
        newMessages: [assistantErr],
        lastMessageText: errTxt,
        titleFromText: null,
      });
    } finally {
      setLoading(false);
      scrollToEndSoon();
    }
  };

  // ✅ Drawer item seçince (chatId geliyor)
  const handleSelectChat = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    setActiveChatId(chatId);
    setMessages(chat.messages?.length ? chat.messages : initialMessages);
    closeDrawer();
    scrollToEndSoon();
  };

  // ✅ Yeni sohbet
  const handleNewChat = async () => {
    const chat = createChat({ initialMessages, firstUserText: "Yeni Sohbet" });
    const next = [chat, ...chats];

    setChats(next);
    await saveChats(uid, next);

    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setSelectedImage(null);
    closeDrawer();
    scrollToEndSoon();
  };

  const inputBottom = 2;
  const chatPadBottom =
    INPUT_H + inputBottom + TABBAR_H + Math.max(insets.bottom, 0) + 18;

  return (
    <LinearGradient colors={["#050914", "#070B12"]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ChatTopBar insetsTop={insets.top} onPressMenu={toggleDrawer} />

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
            <ChatBubble key={m.id} role={m.role} text={m.text} />
          ))}

          {selectedImage && (
            <View style={{ marginTop: 6 }}>
              <Text
                style={{
                  color: "rgba(234,244,255,0.55)",
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                📷 Foto eklendi (gönderince otomatik silinir)
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputArea, { bottom: inputBottom }]}>
          <ChatInputBar
            value={input}
            onChangeText={setInput}
            loading={loading}
            onPickImage={pickImage}
            onSend={() => send()}
          />
        </View>

        {drawerOpen && (
          <Pressable style={styles.overlay} onPress={closeDrawer} />
        )}

        <ChatDrawer
          drawerOpen={drawerOpen}
          drawerX={drawerX}
          drawerW={DRAWER_W}
          insetsTop={insets.top}
          chats={chats}
          onClose={closeDrawer}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
