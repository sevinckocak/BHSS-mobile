/**
 * useVetDashboard(uid)
 *
 * Firestore'dan veteriner dashboard verilerini realtime listener ile çeker.
 * onSnapshot kullanır — yeni randevu / mesaj geldiğinde anlık güncellenir.
 *
 * Döndürür:
 *   todaySummary  — 3 kartlık özet array
 *   weeklyVisits  — son 7 günün randevu sayısı [{day, value}]
 *   monthStats    — bu ayın randevu / talep istatistikleri
 *   activities    — son 5 aktivite metni (string[])
 *   totalUnread   — toplam okunmamış mesaj (badge için)
 *   loading       — boolean
 *
 * ── Firestore şeması (appointments) ───────────────────────────────────────
 *   date       : "YYYY-MM-DD"   string
 *   time       : "HH:mm"        string
 *   status     : "pending" | "confirmed" | "rejected"
 *   vetId      : string
 *   farmerId   : string
 *   senderId   : string   ← randevuyu kim oluşturdu
 *   receiverId : string   ← randevuyu kim alacak (vet ise farmer gönderdi)
 *   createdAt  : Timestamp
 *
 * ── "Farmer Talepleri" mantığı ─────────────────────────────────────────────
 *   receiverId === uid  →  çiftçinin veterinere gönderdiği talep
 */

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase/firebaseConfig";

// ─── Sabitler ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const COLOR_ACTIVE = "#FFAA5A";
const COLOR_ACCENT = "#7BBEFF";
const COLOR_PURPLE = "#A970FF";

const DAY_MS = 86_400_000;

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function parseDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return 0;
  const ms = new Date(dateStr + "T00:00:00").getTime();
  return isNaN(ms) ? 0 : ms;
}

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function toMs(v) {
  if (!v) return 0;
  if (typeof v.toDate === "function") return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  return 0;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useVetDashboard(uid) {
  const [appointments, setAppointments] = useState([]);
  const [chats,        setChats]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Appointments realtime listener ────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "appointments"),
      where("vetId", "==", uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("[useVetDashboard] appointments error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [uid]);

  // ── Chats realtime listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("[useVetDashboard] chats error:", err);
      },
    );

    return unsub;
  }, [uid]);

  // ── Bugünkü özet kartları ─────────────────────────────────────────────────
  const todaySummary = useMemo(() => {
    const todayMs  = dayStart(Date.now());
    const todayEnd = todayMs + DAY_MS;

    const todayCount = appointments.filter((a) => {
      const ms = parseDateStr(a.date);
      return ms >= todayMs && ms < todayEnd;
    }).length;

    // Çiftçinin veterinere gönderdiği bekleyen talepler (receiverId === uid)
    const pendingCount = appointments.filter(
      (a) => a.receiverId === uid && a.status === "pending",
    ).length;

    const unreadCount = chats.reduce(
      (sum, c) => sum + (c.unreadCount?.[uid] ?? 0),
      0,
    );

    return [
      {
        id: "1",
        title: "Bugünkü Randevu",
        value: String(todayCount),
        icon: "calendar-outline",
        color: COLOR_ACTIVE,
      },
      {
        id: "2",
        title: "Bekleyen Talep",
        value: String(pendingCount),
        icon: "person-add-outline",
        color: COLOR_ACCENT,
      },
      {
        id: "3",
        title: "Okunmamış Mesaj",
        value: String(unreadCount),
        icon: "chatbubble-ellipses-outline",
        color: COLOR_PURPLE,
      },
    ];
  }, [appointments, chats, uid]);

  // ── Son 7 günün grafik verisi ─────────────────────────────────────────────
  const weeklyVisits = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const start = dayStart(Date.now() - (6 - i) * DAY_MS);
      const end   = start + DAY_MS;
      const d     = new Date(start);

      return {
        day: DAY_LABELS[d.getDay()],
        value: appointments.filter((a) => {
          const ms = parseDateStr(a.date);
          return ms >= start && ms < end;
        }).length,
      };
    });
  }, [appointments]);

  // ── Bu ayın istatistikleri ────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    const inThisMonth = (dateStr) => {
      const ms = parseDateStr(dateStr);
      return ms >= monthStart && ms < monthEnd;
    };

    const monthAppts = appointments.filter((a) => inThisMonth(a.date));

    // Farmer Talepleri: bu ay içinde çiftçinin veterinere gönderdiği randevular
    const farmerReqs = monthAppts.filter((a) => a.receiverId === uid);

    return {
      totalAppointments:     monthAppts.length,
      completedAppointments: monthAppts.filter((a) => a.status === "confirmed").length,
      pendingAppointments:   monthAppts.filter((a) => a.status === "pending").length,
      canceledAppointments:  monthAppts.filter((a) => a.status === "rejected").length,

      // Farmer'dan gelen talepler — "Farmer Talepleri" kartı için
      pendingRequests:  farmerReqs.filter((r) => r.status === "pending").length,
      acceptedRequests: farmerReqs.filter((r) => r.status === "confirmed").length,
      rejectedRequests: farmerReqs.filter((r) => r.status === "rejected").length,
    };
  }, [appointments, uid]);

  // ── Son aktiviteler ───────────────────────────────────────────────────────
  const activities = useMemo(() => {
    const events = [];

    [...appointments]
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      .slice(0, 3)
      .forEach((a) => {
        const name = a.farmerName ?? "Çiftçi";
        if (a.status === "confirmed") {
          events.push(`${name} ile görüşme onaylandı.`);
        } else if (a.status === "rejected") {
          events.push(`${name} randevusu reddedildi.`);
        } else {
          events.push(`${name} yeni randevu talebi gönderdi.`);
        }
      });

    const totalUnread = chats.reduce(
      (sum, c) => sum + (c.unreadCount?.[uid] ?? 0),
      0,
    );
    if (totalUnread > 0) {
      events.push(`${totalUnread} yeni okunmamış mesaj.`);
    }

    return events.slice(0, 5);
  }, [appointments, chats, uid]);

  // ── Toplam okunmamış (bildirim badge'i için) ──────────────────────────────
  const totalUnread = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unreadCount?.[uid] ?? 0), 0),
    [chats, uid],
  );

  return { todaySummary, weeklyVisits, monthStats, activities, totalUnread, loading };
}
