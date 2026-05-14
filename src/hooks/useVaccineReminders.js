import { useEffect, useRef } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase/firebaseConfig";
import { useAnimals } from "../context/AnimalsContext";
import { useFarmerAuth } from "../context/FarmerAuthContext";
import { getVaccineStatus } from "../utils/vaccineScheduler";
import {
  scheduleVaccineReminders,
  cancelVaccineReminders,
} from "../utils/localNotifications";

/**
 * useVaccineReminders()
 *
 * Called once from HomeScreen on mount. Iterates every animal's vaccine
 * records and ensures OS-level notifications are scheduled for upcoming doses.
 *
 * Handles:
 *   • First-time setup (no notifIds stored yet)
 *   • App re-install (OS cleared all scheduled notifications)
 *   • Overdue vaccines are skipped (no point scheduling past dates)
 *
 * This runs silently in the background — no UI impact.
 */
export function useVaccineReminders() {
  const { animals } = useAnimals();
  const { authUser } = useFarmerAuth();
  const uid = authUser?.uid;

  // Guard: only run once per session, even if animals list re-renders
  const hasRun = useRef(false);

  useEffect(() => {
    if (!uid || animals.length === 0 || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      for (const animal of animals) {
        const vaccines = Array.isArray(animal.vaccines) ? animal.vaccines : [];
        let needsWrite = false;
        const updated = vaccines.map((v) => ({ ...v }));

        for (let i = 0; i < updated.length; i++) {
          const v = updated[i];
          if (!v.nextDate) continue;

          const { status } = getVaccineStatus(v.nextDate);
          // Skip overdue — nothing useful to schedule
          if (status === "overdue") continue;

          // If IDs already exist the OS notifications are probably still live
          const hasIds =
            v.notifIds && Object.keys(v.notifIds).length > 0;
          if (hasIds) continue;

          const animalName = animal.name || animal.tagNo || "Hayvan";
          try {
            const ids = await scheduleVaccineReminders(
              animalName,
              v.type || "Aşı",
              v.nextDate,
            );
            if (Object.keys(ids).length > 0) {
              updated[i] = { ...v, notifIds: ids };
              needsWrite = true;
            }
          } catch (e) {
            console.warn("[useVaccineReminders] schedule error:", e?.message);
          }
        }

        if (needsWrite) {
          try {
            await updateDoc(
              doc(db, "farmer_info", uid, "animals", animal.id),
              { vaccines: updated, updatedAt: serverTimestamp() },
            );
          } catch (e) {
            console.warn("[useVaccineReminders] write error:", e?.message);
          }
        }
      }
    })();
  }, [uid, animals.length]);
}
