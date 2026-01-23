import AsyncStorage from "@react-native-async-storage/async-storage";

const keyOf = (uid) => `bhss_chats_${uid || "guest"}`;

export async function loadChats(uid) {
  try {
    const raw = await AsyncStorage.getItem(keyOf(uid));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("loadChats error:", e);
    return [];
  }
}

export async function saveChats(uid, chats) {
  try {
    await AsyncStorage.setItem(keyOf(uid), JSON.stringify(chats || []));
    return true;
  } catch (e) {
    console.warn("saveChats error:", e);
    return false;
  }
}

export function sortChatsByUpdatedAt(chats) {
  return [...(chats || [])].sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
  );
}

export function makeChatTitleFromText(text) {
  const t = String(text || "").trim();
  if (!t) return "Yeni Sohbet";
  return t.length > 28 ? t.slice(0, 28) + "…" : t;
}

export function makeWelcomeMessages(initialMessages) {
  const now = Date.now();
  return (initialMessages || []).map((m) => ({
    id: m.id || `m_${now}`,
    role: m.role,
    text: m.text,
    ts: now,
  }));
}

export function createChat({ initialMessages, firstUserText }) {
  const now = Date.now();
  const id = `chat_${now}`;
  const title = makeChatTitleFromText(firstUserText);

  return {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    lastMessage: "",
    messages: makeWelcomeMessages(initialMessages),
  };
}

/**
 * prev state üstünden güvenli şekilde güncellemek için helper
 */
export function addMessagesToChat(prevChats, chatId, newMessages, meta) {
  const now = Date.now();
  const list = Array.isArray(prevChats) ? prevChats : [];

  const updated = list.map((c) => {
    if (c.id !== chatId) return c;

    const prevMsgs = Array.isArray(c.messages) ? c.messages : [];
    const nextMsgs = [...prevMsgs, ...(newMessages || [])];

    const nextTitle =
      !c.title || c.title === "Yeni Sohbet"
        ? makeChatTitleFromText(meta?.titleFromText)
        : c.title;

    return {
      ...c,
      title: nextTitle,
      updatedAt: now,
      lastMessage: meta?.lastMessageText ?? c.lastMessage ?? "",
      messages: nextMsgs,
    };
  });

  return sortChatsByUpdatedAt(updated);
}
