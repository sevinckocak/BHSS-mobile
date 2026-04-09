/**
 * useNotificationsList(uid)
 *
 * In-app bildirim listesi için Firestore real-time listener.
 *
 * Koleksiyon: notifications/{uid}/items/{id}
 *   title     : string
 *   body      : string
 *   data      : object  { screen, appointmentId }
 *   isRead    : boolean
 *   createdAt : Timestamp
 *
 * Döndürür:
 *   items         — bildirim listesi (en yeni üstte, maks 50)
 *   unreadCount   — okunmamış sayısı
 *   markAsRead    — tek bildirimi okundu işaretle
 *   markAllRead   — tüm okunmamışları toplu işaretle (writeBatch)
 *   loading       — ilk yükleme durumu
 *
 * Gerekli Firestore index:
 *   notifications/{uid}/items → createdAt DESC
 *   (tek alan index, otomatik oluşturulur — composite index gerekmez)
 */

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase/firebaseConfig";

const MAX_ITEMS = 50;

export function useNotificationsList(uid) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications", uid, "items"),
      orderBy("createdAt", "desc"),
      limit(MAX_ITEMS),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id:        d.id,
            ref:       d.ref,
            title:     d.data().title    ?? "",
            body:      d.data().body     ?? "",
            data:      d.data().data     ?? {},
            isRead:    d.data().isRead   ?? false,
            createdAt: d.data().createdAt?.toDate?.() ?? null,
          })),
        );
        setLoading(false);
      },
      (err) => {
        console.error("[useNotificationsList] listener error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [uid]);

  // ── Tek bildirim okundu işaretle ──────────────────────────────────────────
  const markAsRead = useCallback(async (itemId) => {
    if (!uid || !itemId) return;
    try {
      await updateDoc(
        doc(db, "notifications", uid, "items", itemId),
        { isRead: true },
      );
    } catch (err) {
      console.error("[useNotificationsList] markAsRead:", err);
    }
  }, [uid]);

  // ── Tüm okunmamışları toplu okundu işaretle ───────────────────────────────
  const markAllRead = useCallback(async () => {
    const unread = items.filter((i) => !i.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((i) => batch.update(i.ref, { isRead: true }));
      await batch.commit();
    } catch (err) {
      console.error("[useNotificationsList] markAllRead:", err);
    }
  }, [items]);

  // ── Türetilen değer ───────────────────────────────────────────────────────
  const unreadCount = items.filter((i) => !i.isRead).length;

  return { items, unreadCount, markAsRead, markAllRead, loading };
}
