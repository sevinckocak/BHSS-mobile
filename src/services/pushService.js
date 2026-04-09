/**
 * pushService.js
 *
 * Expo Push Notification servisi.
 * Firebase Cloud Messaging kurulumu gerektirmez.
 * Expo'nun ücretsiz push proxy'si kullanılır: https://exp.host/--/api/v2/push/send
 *
 * Firestore şeması:
 *
 *   users/{uid}
 *     expoPushToken : string        ← cihaz push token'ı
 *
 *   notifications/{uid}/items/{id}
 *     title     : string
 *     body      : string
 *     data      : object            ← { screen, appointmentId, ... }
 *     isRead    : boolean
 *     createdAt : Timestamp
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase/firebaseConfig";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── Token yönetimi ───────────────────────────────────────────────────────────

/**
 * Cihaz push token'ını Firestore'a kaydeder.
 * useNotifications hook'u tarafından app başlangıcında çağrılır.
 */
export async function savePushToken(uid, token) {
  if (!uid || !token) return;
  try {
    await setDoc(doc(db, "users", uid), { expoPushToken: token }, { merge: true });
  } catch (err) {
    console.error("[pushService] savePushToken:", err);
  }
}

/**
 * Firestore'dan kullanıcının push token'ını okur.
 * @returns {Promise<string|null>}
 */
async function getPushToken(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.data()?.expoPushToken ?? null;
  } catch (err) {
    console.error("[pushService] getPushToken:", err);
    return null;
  }
}

// ─── Bildirim gönderme ────────────────────────────────────────────────────────

/**
 * Expo Push API'sine tek bir mesaj gönderir.
 * Token geçersizse veya yoksa sessizce devam eder.
 *
 * @param {string} token      - ExpoPushToken[xxx...] formatında
 * @param {string} title      - Bildirim başlığı
 * @param {string} body       - Bildirim metni
 * @param {object} data       - Tap edilince navigation'da kullanılacak payload
 */
async function sendRawPush(token, title, body, data = {}) {
  if (!token) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method:  "POST",
      headers: {
        "Content-Type":    "application/json",
        "Accept":          "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to:       token,
        title,
        body,
        data,
        sound:    "default",
        priority: "high",
        // iOS badge sayısını artırmak istersen:
        // badge: 1,
      }),
    });

    const json = await res.json();

    // Expo API hata bildirirse logla
    const result = json?.data;
    if (result?.status === "error") {
      console.error("[pushService] Expo push error:", result.message, result.details);
    }
  } catch (err) {
    console.error("[pushService] sendRawPush:", err);
  }
}

/**
 * Kullanıcı UID'sine göre push bildirimi gönderir.
 * Token Firestore'dan otomatik okunur.
 *
 * @param {string} recipientUid
 * @param {string} title
 * @param {string} body
 * @param {object} data
 */
export async function sendPushNotification(recipientUid, title, body, data = {}) {
  const token = await getPushToken(recipientUid);
  if (!token) {
    console.warn("[pushService] Token bulunamadı, bildirim atlanıyor:", recipientUid);
    return;
  }
  await sendRawPush(token, title, body, data);
}

// ─── In-app bildirim (Firestore) ──────────────────────────────────────────────

/**
 * Firestore'a in-app bildirim kaydeder.
 * useNotificationsList hook'u bu koleksiyonu dinler.
 *
 * Koleksiyon: notifications/{uid}/items/{id}
 */
export async function saveInAppNotification(recipientUid, { title, body, data = {} }) {
  if (!recipientUid) return;
  try {
    await addDoc(collection(db, "notifications", recipientUid, "items"), {
      title,
      body,
      data,
      isRead:    false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[pushService] saveInAppNotification:", err);
  }
}

// ─── Randevu bildirimi (combined) ─────────────────────────────────────────────

/**
 * Randevu oluşturulduğunda alıcıya hem push hem in-app bildirim gönderir.
 *
 * @param {object} params
 * @param {string} params.recipientUid   - Bildirimi alacak kullanıcının UID'i
 * @param {string} params.senderName     - Gönderen kullanıcının adı
 * @param {string} params.date           - "YYYY-MM-DD"
 * @param {string} params.time           - "HH:mm"
 * @param {string} params.appointmentId  - Firestore appointment doc ID
 * @param {string} params.targetScreen   - "Calendar" (farmer) | "VetCalendar" (vet)
 *
 * Payload şeması (bildirime tap edilince navigation'da kullanılır):
 * {
 *   screen:        "Calendar" | "VetCalendar",
 *   appointmentId: string,
 * }
 */
export async function notifyAppointmentCreated({
  recipientUid,
  senderName,
  date,
  time,
  appointmentId,
  targetScreen,
}) {
  const title = "📅 Yeni Randevu Talebi";
  const body  = `${senderName} — ${date} saat ${time}`;
  const data  = { screen: targetScreen, appointmentId };

  // Push + in-app paralel gönderim
  await Promise.all([
    sendPushNotification(recipientUid, title, body, data),
    saveInAppNotification(recipientUid, { title, body, data }),
  ]);
}
