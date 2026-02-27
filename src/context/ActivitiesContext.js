import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../config/firebase/firebaseConfig";
import { useFarmerAuth } from "./FarmerAuthContext";

const ActivitiesContext = createContext(null);

export function ActivitiesProvider({ children }) {
  const { authUser, booting } = useFarmerAuth();
  const uid = authUser?.uid;

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  useEffect(() => {
    // Auth daha gelmeden Firestore subscribe yapma
    if (booting) {
      setLoadingActivities(true);
      return;
    }

    // Logout ise temizle
    if (!uid) {
      setActivities([]);
      setActivitiesError(null);
      setLoadingActivities(false);
      return;
    }

    setLoadingActivities(true);
    setActivitiesError(null);

    const colRef = collection(db, "farmer_info", uid, "activities");
    const q = query(colRef, orderBy("createdAt", "desc"), limit(20));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setActivities(rows);
        setLoadingActivities(false);
      },
      (err) => {
        console.log("ACTIVITIES SNAP ERROR FULL:", err);
        console.log("ACTIVITIES SNAP ERROR:", err?.code, err?.message);
        setActivitiesError(err);
        setActivities([]);
        setLoadingActivities(false);
      },
    );

    return () => unsub();
  }, [uid, booting]);

  const logActivity = async (payload = {}) => {
    if (booting) throw new Error("Auth booting (try again)");
    if (!uid) throw new Error("No authenticated user (uid is empty)");

    const data = {
      type: payload.type || "general",
      title: payload.title || "Aktivite",
      meta: payload.meta || "",
      route: payload.route || null,
      routeParams: payload.routeParams || null,
      createdAt: serverTimestamp(),
    };

    try {
      console.log(
        "logActivity -> writing to:",
        `farmer_info/${uid}/activities`,
        data,
      );
      const ref = await addDoc(
        collection(db, "farmer_info", uid, "activities"),
        data,
      );
      console.log("Activity written id:", ref.id);
      return ref.id;
    } catch (e) {
      console.log("LOG ACTIVITY ERROR FULL:", e);
      console.log("LOG ACTIVITY ERROR:", e?.code, e?.message);
      throw e;
    }
  };

  const value = useMemo(
    () => ({
      activities,
      loadingActivities,
      activitiesError,
      logActivity,
      uid,
      booting,
    }),
    [activities, loadingActivities, activitiesError, uid, booting],
  );

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx)
    throw new Error("useActivities must be used within ActivitiesProvider");
  return ctx;
}
