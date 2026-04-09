/**
 * useNotifications(uid, navigation)
 *
 * Expo push notification kurulumu:
 *   1. İzin iste
 *   2. ExpoPushToken al
 *   3. Token'ı Firestore'a kaydet (savePushToken)
 *   4. Foreground bildirim listener (uygulama açıkken bildirim gelince)
 *   5. Notification tap listener (kullanıcı bildirime tıklayınca)
 *   6. Uygulama kapalıyken tap olan bildirimi yakala (getLastNotificationResponseAsync)
 *
 * Kullanım:
 *   // HomeScreen.js (farmer)
 *   useNotifications(uid, navigation);
 *
 *   // VetHomeScreen.js (vet)
 *   useNotifications(vetProfile?.uid, navigation);
 *
 * Gerekli paket: npx expo install expo-notifications expo-constants
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { savePushToken } from "../services/pushService";

// ─── Foreground bildirim davranışı ────────────────────────────────────────────
// Uygulama açıkken gelen bildirimler için global ayar.
// Bu satır modül yüklendiğinde bir kez çalışır.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications(uid, navigation) {
  const foregroundListenerRef = useRef(null);
  const responseListenerRef   = useRef(null);

  useEffect(() => {
    if (!uid) return;
    let active = true;

    // 1. İzin + token al, Firestore'a kaydet
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && active) {
        await savePushToken(uid, token);
      }
    })();

    // 2. Uygulama açıkken gelen bildirimler (gösterim setNotificationHandler ile olur,
    //    burada ek işlem yapmak istersen kullanabilirsin)
    foregroundListenerRef.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // İsteğe bağlı: badge sayısını güncelle, local state tetikle, vb.
      },
    );

    // 3. Kullanıcı bildirimine tap'ladığında (foreground / background)
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data, navigation);
      });

    // 4. Uygulama kapalıyken tap olan bildirim (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!active || !response) return;
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data, navigation);
    });

    return () => {
      active = false;
      foregroundListenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, [uid, navigation]);
}

// ─── Navigation yönlendirici ──────────────────────────────────────────────────

/**
 * Bildirim payload'ına göre ilgili ekrana yönlendirir.
 *
 * Desteklenen payload'lar:
 *   { screen: "Calendar",    appointmentId: "..." }  ← farmer randevu
 *   { screen: "VetCalendar", appointmentId: "..." }  ← vet randevu
 *   { screen: "ChatRoom",    chatId, otherName, otherUserId }
 *   { screen: "VetChatRoom", chatId, otherName, otherUserId }
 */
function handleNotificationNavigation(data, navigation) {
  if (!data?.screen || !navigation) return;

  try {
    switch (data.screen) {
      case "Calendar":
        navigation.navigate("Calendar");
        break;

      case "VetCalendar":
        navigation.navigate("VetCalendar");
        break;

      case "ChatRoom":
        if (data.chatId && data.otherName && data.otherUserId) {
          navigation.navigate("ChatRoom", {
            chatId:      data.chatId,
            otherName:   data.otherName,
            otherUserId: data.otherUserId,
          });
        }
        break;

      case "VetChatRoom":
        if (data.chatId && data.otherName && data.otherUserId) {
          navigation.navigate("VetChatRoom", {
            chatId:      data.chatId,
            otherName:   data.otherName,
            otherUserId: data.otherUserId,
          });
        }
        break;

      default:
        break;
    }
  } catch (err) {
    console.error("[useNotifications] navigation error:", err);
  }
}

// ─── Token kayıt yardımcısı ───────────────────────────────────────────────────

/**
 * Bildirim izni ister ve Expo push token'ı döndürür.
 * Simulator / web ortamında null döner.
 *
 * @returns {Promise<string|null>}
 */
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;

  // Android bildirim kanalı (SDK 26+)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name:             "Varsayılan",
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       "#FFAA5A",
      sound:            "default",
    });
  }

  // Mevcut izin durumunu kontrol et
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // İzin henüz verilmemişse iste
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[useNotifications] Push izni reddedildi.");
    return null;
  }

  // EAS projectId — app.json'da eas.projectId tanımlı olmalı
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "[useNotifications] projectId bulunamadı. " +
      "app.json → extra.eas.projectId alanını kontrol et.",
    );
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.error("[useNotifications] getExpoPushTokenAsync:", err);
    return null;
  }
}
