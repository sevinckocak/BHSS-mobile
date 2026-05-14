import { formatTR, parseTRDate } from "./date";
import { VACCINE_TYPES } from "../data/vaccines";

// Days until next dose for each vaccine ID.
// null = one-time only (no repeat reminder).
export const VACCINE_INTERVALS = {
  sap:           180, // Şap: every 6 months
  brusella:      null, // one-time (female calves 6-8 months)
  sarbon:        365, // Şarbon: annual
  lsd:           365, // LSD: annual
  enterotoksemi: 365, // annual
  septisemi:     365, // annual
  pasteurella:   365, // annual
  ibr:           365, // IBR: annual
  bvd:           365, // BVD: annual
  leptospiroz:   365, // annual
  rota_corona:   null, // one-time (newborn)
  ecoli:         null, // one-time (newborn)
  diger:         365, // default: annual
};

export function getVaccineIdFromName(typeName) {
  return VACCINE_TYPES.find((v) => v.name === typeName)?.id ?? null;
}

/**
 * Given a vaccine type name (as stored in Firestore) and the date of last
 * vaccination (DD/MM/YYYY), returns the next due date as a DD/MM/YYYY string.
 * Returns null for one-time vaccines or invalid input.
 */
export function computeNextDueDateStr(vaccineTypeName, lastDateStr) {
  const vaccineId = getVaccineIdFromName(vaccineTypeName);
  const intervalDays = vaccineId ? VACCINE_INTERVALS[vaccineId] : null;
  if (!intervalDays) return null;

  const lastDate = parseTRDate(lastDateStr);
  if (!lastDate) return null;

  const next = new Date(lastDate);
  next.setDate(next.getDate() + intervalDays);
  return formatTR(next);
}

/**
 * Returns status info for a vaccine's next due date.
 *
 * status values:
 *   'overdue'  → past due (red)
 *   'today'    → due today (orange)
 *   'upcoming' → within 7 days (yellow/orange)
 *   'ok'       → more than 7 days away (green)
 *   'none'     → no nextDate
 */
export function getVaccineStatus(nextDateStr) {
  if (!nextDateStr) {
    return { status: "none", daysLeft: null, color: null, label: null };
  }

  const next = parseTRDate(nextDateStr);
  if (!next) {
    return { status: "none", daysLeft: null, color: null, label: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextNorm = new Date(next);
  nextNorm.setHours(0, 0, 0, 0);

  const diffMs = nextNorm - today;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: "overdue",
      daysLeft,
      color: "#FF6B6B",
      label: `${Math.abs(daysLeft)} gün gecikti`,
    };
  }
  if (daysLeft === 0) {
    return { status: "today", daysLeft: 0, color: "#FFAA5A", label: "Bugün!" };
  }
  if (daysLeft <= 7) {
    return {
      status: "upcoming",
      daysLeft,
      color: "#FFAA5A",
      label: `${daysLeft} gün kaldı`,
    };
  }
  return {
    status: "ok",
    daysLeft,
    color: "#4ECDC4",
    label: `${daysLeft} gün kaldı`,
  };
}

/**
 * Returns a flat, date-sorted list of all upcoming vaccine reminders across
 * all animals. Only includes vaccines that have a nextDate set.
 */
export function getAllUpcomingVaccines(animals) {
  const result = [];

  for (const animal of animals) {
    const vaccineList = Array.isArray(animal.vaccines) ? animal.vaccines : [];
    for (const v of vaccineList) {
      if (!v.nextDate) continue;
      const next = parseTRDate(v.nextDate);
      if (!next) continue;
      const statusInfo = getVaccineStatus(v.nextDate);
      result.push({
        animalId: animal.id,
        animalName: animal.name || animal.tagNo || "—",
        animalTag: animal.tagNo || "",
        vaccineId: v.id,
        vaccineType: v.type || "—",
        nextDate: v.nextDate,
        nextDateObj: next,
        notifIds: v.notifIds || null,
        ...statusInfo,
      });
    }
  }

  // Soonest first; overdue items bubble to top
  result.sort((a, b) => a.nextDateObj - b.nextDateObj);
  return result;
}
