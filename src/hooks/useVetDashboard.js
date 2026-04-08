/**
 * useVetDashboard(uid)
 *
 * Firestore'dan veteriner dashboard verilerini paralel olarak çeker.
 * getDocs kullanır (realtime listener değil — dashboard için yeterli).
 *
 * Döndürür:
 *   todaySummary  — 3 kartlık özet array
 *   weeklyVisits  — son 7 günün randevu sayısı [{day, value}]
 *   monthStats    — bu ayın randevu / talep istatistikleri
 *   activities    — son 5 aktivite metni (string[])
 *   loading       — boolean
 *
 * ── Firestore şeması (appointments) ───────────────────────────────────────
 *   date   : "YYYY-MM-DD"   string  ← NOT a Timestamp, string karşılaştırma gerekir
 *   time   : "HH:mm"        string
 *   status : "pending" | "confirmed" | "rejected"
 *   vetId, farmerId, vetName, farmerName, createdAt: Timestamp
 */

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase/firebaseConfig";

// ─── Sabitler ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// VetHomeScreen COLORS ile eşleşiyor
const COLOR_ACTIVE = "#FFAA5A";
const COLOR_ACCENT = "#7BBEFF";
const COLOR_PURPLE = "#A970FF";

const DAY_MS = 86_400_000;

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

/**
 * "YYYY-MM-DD" string → yerel gece yarısı ms
 *
 * NEDEN: appointments.date, Timestamp değil "2025-04-08" formatında string.
 * new Date("2025-04-08") UTC midnight döner, T00:00:00 eklersek local midnight.
 * dayStart() da local midnight kullandığından tutarlı karşılaştırma yapılır.
 */
function parseDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return 0;
  const ms = new Date(dateStr + "T00:00:00").getTime();
  return isNaN(ms) ? 0 : ms;
}

/** "YYYY-MM-DD" string → yerel gece yarısı ms (dayStart ile aynı format) */
function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Firestore Timestamp veya Date → ms (createdAt gibi gerçek Timestamp alanlar için) */
function toMs(v) {
  if (!v) return 0;
  if (typeof v.toDate === "function") return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  return 0;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useVetDashboard(uid) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Paralel çekme — tüm koleksiyonlar aynı anda sorgulanır
        const [apptSnap, reqSnap, chatSnap] = await Promise.all([
          getDocs(
            query(collection(db, "appointments"), where("vetId", "==", uid)),
          ),
          getDocs(
            query(collection(db, "requests"), where("vetId", "==", uid)),
          ).catch(() => ({ docs: [] })), // requests koleksiyonu yoksa graceful fallback
          getDocs(
            query(
              collection(db, "chats"),
              where("participants", "array-contains", uid),
            ),
          ),
        ]);

        if (cancelled) return;

        setRaw({
          appointments: apptSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          requests:     reqSnap.docs.map((d)  => ({ id: d.id, ...d.data() })),
          chats:        chatSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        });
      } catch (err) {
        console.error("[useVetDashboard] fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // ── Bugünkü özet kartları ─────────────────────────────────────────────────
  const todaySummary = useMemo(() => {
    const todayMs  = dayStart(Date.now());
    const todayEnd = todayMs + DAY_MS;

    // date STRING karşılaştırması: parseDateStr kullanılıyor, toMs değil
    const todayCount = (raw?.appointments ?? []).filter((a) => {
      const ms = parseDateStr(a.date);
      return ms >= todayMs && ms < todayEnd;
    }).length;

    const pendingCount = (raw?.requests ?? []).filter(
      (r) => r.status === "pending",
    ).length;

    const unreadCount = (raw?.chats ?? []).reduce(
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
  }, [raw, uid]);

  // ── Son 7 günün grafik verisi ─────────────────────────────────────────────
  const weeklyVisits = useMemo(() => {
    const appts = raw?.appointments ?? [];

    return Array.from({ length: 7 }, (_, i) => {
      // Bugünden geriye doğru: i=0 → 6 gün önce, i=6 → bugün
      const start = dayStart(Date.now() - (6 - i) * DAY_MS);
      const end   = start + DAY_MS;
      const d     = new Date(start);

      return {
        day: DAY_LABELS[d.getDay()],
        // date STRING "YYYY-MM-DD" → parseDateStr ile ms'e çevrilir
        value: appts.filter((a) => {
          const ms = parseDateStr(a.date);
          return ms >= start && ms < end;
        }).length,
      };
    });
  }, [raw]);

  // ── Bu ayın istatistikleri ────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    const inThisMonth = (dateStr) => {
      const ms = parseDateStr(dateStr); // string date için parseDateStr
      return ms >= monthStart && ms < monthEnd;
    };

    const inThisMonthByCreatedAt = (createdAt) => {
      const ms = toMs(createdAt); // Timestamp alanı için toMs
      return ms >= monthStart && ms < monthEnd;
    };

    const appts = (raw?.appointments ?? []).filter((a) => inThisMonth(a.date));
    const reqs  = (raw?.requests     ?? []).filter((r) => inThisMonthByCreatedAt(r.createdAt));

    // ── DÜZELTME: Firestore'daki gerçek status değerleri: ──────────────────
    // "pending" | "confirmed" | "rejected"
    // (Eski kod "completed" ve "canceled" arıyordu — her zaman 0 dönerdi)
    return {
      totalAppointments:     appts.length,
      completedAppointments: appts.filter((a) => a.status === "confirmed").length,
      pendingAppointments:   appts.filter((a) => a.status === "pending").length,
      canceledAppointments:  appts.filter((a) => a.status === "rejected").length,

      pendingRequests:  reqs.filter((r) => r.status === "pending").length,
      acceptedRequests: reqs.filter((r) => r.status === "accepted").length,
      rejectedRequests: reqs.filter((r) => r.status === "rejected").length,
    };
  }, [raw]);

  // ── Son aktiviteler ───────────────────────────────────────────────────────
  const activities = useMemo(() => {
    const events = [];

    // Son randevular — createdAt Timestamp ile sırala
    [...(raw?.appointments ?? [])]
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      .slice(0, 3)
      .forEach((a) => {
        const name = a.farmerName ?? "Çiftçi";
        // DÜZELTME: status "confirmed" ve "rejected" kullanılıyor
        if (a.status === "confirmed") {
          events.push(`${name} ile görüşme onaylandı.`);
        } else if (a.status === "rejected") {
          events.push(`${name} randevusu reddedildi.`);
        } else {
          events.push(`${name} yeni randevu talebi gönderdi.`);
        }
      });

    // Son kabul / red talepler
    [...(raw?.requests ?? [])]
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      .filter((r) => r.status === "accepted" || r.status === "rejected")
      .slice(0, 2)
      .forEach((r) => {
        const name = r.farmerName ?? "Çiftçi";
        events.push(
          r.status === "accepted"
            ? `${name} talebi kabul edildi.`
            : `${name} talebi reddedildi.`,
        );
      });

    // Toplam okunmamış mesaj
    const totalUnread = (raw?.chats ?? []).reduce(
      (sum, c) => sum + (c.unreadCount?.[uid] ?? 0),
      0,
    );
    if (totalUnread > 0) {
      events.push(`${totalUnread} yeni okunmamış mesaj.`);
    }

    return events.slice(0, 5);
  }, [raw, uid]);

  return { todaySummary, weeklyVisits, monthStats, activities, loading };
}
