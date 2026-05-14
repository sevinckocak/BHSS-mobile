import * as Notifications from "expo-notifications";
import { parseTRDate } from "./date";

/**
 * Schedules 3 local OS-level notifications for a vaccine reminder:
 *   • 7 days before  → "X aşısına 7 gün kaldı"
 *   • 1 day before   → "X aşısına yarın uygulanacak!"
 *   • On the day     → "X aşı zamanı geldi"
 *
 * Triggers that are already in the past are silently skipped.
 * Returns an object { sevenDay, oneDay, sameDay } with Expo notification IDs.
 * Store these IDs alongside the vaccine record to enable cancellation later.
 *
 * These notifications fire at 09:00 local time even when the app is closed,
 * because they are OS-scheduled (not push notifications).
 *
 * @param {string} animalName   - Display name of the animal
 * @param {string} vaccineName  - Vaccine type label
 * @param {string} nextDateStr  - "DD/MM/YYYY" formatted due date
 * @returns {Promise<{sevenDay?: string, oneDay?: string, sameDay?: string}>}
 */
export async function scheduleVaccineReminders(animalName, vaccineName, nextDateStr) {
  const nextDate = parseTRDate(nextDateStr);
  if (!nextDate) return {};

  const ids = {};

  const scheduleAt = async (offsetDays, body, key) => {
    const triggerDate = new Date(nextDate);
    triggerDate.setDate(triggerDate.getDate() + offsetDays);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate <= new Date()) return; // already past — skip silently

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💉 Aşı Hatırlatıcısı",
          body,
          data: {
            screen: "VaccinesScreen",
            animalName,
            vaccineName,
          },
          sound: "default",
        },
        // SDK 53+: trigger must be a typed object, not a raw Date
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      ids[key] = id;
    } catch (e) {
      console.warn("[localNotifications] scheduleAt failed:", key, e?.message);
    }
  };

  await Promise.all([
    scheduleAt(-7, `${animalName} - ${vaccineName} aşısına 7 gün kaldı.`, "sevenDay"),
    scheduleAt(-1, `${animalName} - ${vaccineName} aşısına yarın uygulanacak!`, "oneDay"),
    scheduleAt(0, `${animalName} isimli hayvanın ${vaccineName} aşı zamanı geldi.`, "sameDay"),
  ]);

  return ids;
}

/**
 * Cancels previously scheduled vaccine notifications.
 * @param {{ sevenDay?: string, oneDay?: string, sameDay?: string }} notifIds
 */
export async function cancelVaccineReminders(notifIds) {
  if (!notifIds || typeof notifIds !== "object") return;
  const ids = Object.values(notifIds).filter(Boolean);
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}
