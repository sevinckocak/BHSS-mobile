/**
 * usePresence(uid)
 *
 * AppState tabanlı online/offline takibi.
 *
 * Firestore: users/{uid}
 *   isOnline : boolean
 *   lastSeen : Timestamp
 *
 * Kullanım — kullanıcının giriş yaptıktan sonra kaldığı ilk ekranda çağır:
 *
 *   // HomeScreen.js (farmer)
 *   const { farmerProfile } = useFarmerAuth();
 *   usePresence(farmerProfile?.uid);
 *
 *   // VetHomeScreen.js (vet)
 *   const { vetProfile } = useVetAuth();
 *   usePresence(vetProfile?.uid);
 */

import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase/firebaseConfig";

// ─── Firestore helpers ─────────────────────────────────────────────────────────

/**
 * Kullanıcıyı online yap.
 */
export async function setUserOnline(uid) {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, "users", uid),
      { isOnline: true },
      { merge: true },
    );
  } catch (err) {
    console.error("[presence] setUserOnline error:", err);
  }
}

/**
 * Kullanıcıyı offline yap ve son görülme zamanını kaydet.
 */
export async function setUserOffline(uid) {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, "users", uid),
      { isOnline: false, lastSeen: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.error("[presence] setUserOffline error:", err);
  }
}

// ─── "Son görülme" formatlayıcı ───────────────────────────────────────────────

/**
 * Bir Date nesnesini "X dakika önce" formatına çevirir.
 * ChatRoom header'ında kullanılır.
 */
export function formatLastSeen(date) {
  if (!date) return "";
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "az önce";
  if (diffMin < 60) return `${diffMin} dakika önce`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr} saat önce`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} gün önce`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Ana ekrana (HomeScreen / VetHomeScreen) bir kez eklenmeli.
 * AppState değişikliğini izler ve Firestore'u günceller.
 *
 * Davranış:
 *  - Hook mount edildiğinde (uygulama aktif):  isOnline = true
 *  - AppState "active":                        isOnline = true
 *  - AppState "background" | "inactive":       isOnline = false + lastSeen = now
 *  - Hook unmount edildiğinde (logout):        isOnline = false + lastSeen = now
 */
export function usePresence(uid) {
  // uid henüz hazır değilse ref'te null tutuyoruz,
  // uid değişince effect yeniden çalışır.
  const uidRef = useRef(uid);
  useEffect(() => { uidRef.current = uid; }, [uid]);

  useEffect(() => {
    if (!uid) return;

    // Uygulama zaten açıkken hook mount edildi → hemen online yap
    if (AppState.currentState === "active") {
      setUserOnline(uid);
    }

    // AppState değişikliklerini dinle
    const handleChange = (nextState) => {
      if (nextState === "active") {
        setUserOnline(uidRef.current);
      } else if (nextState === "background" || nextState === "inactive") {
        setUserOffline(uidRef.current);
      }
    };

    const subscription = AppState.addEventListener("change", handleChange);

    // Cleanup: kullanıcı logout olduğunda veya hook unmount olduğunda offline yap
    return () => {
      subscription.remove();
      setUserOffline(uidRef.current);
    };
  }, [uid]); // uid değişince (login/logout) tekrar başlar
}
