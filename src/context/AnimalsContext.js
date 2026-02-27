import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { db } from "../config/firebase/firebaseConfig";
import { useFarmerAuth } from "./FarmerAuthContext";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { useActivities } from "./ActivitiesContext"; // ✅ EKLENDİ

const AnimalsContext = createContext(null);

export function AnimalsProvider({ children }) {
  const { authUser, booting } = useFarmerAuth();
  const uid = authUser?.uid;

  const { logActivity } = useActivities(); // ✅ EKLENDİ

  const [animals, setAnimals] = useState([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [animalsError, setAnimalsError] = useState(null);

  // =========================
  // Helpers
  // =========================
  const getAnimalLabel = useCallback(
    (animalId) => {
      const a = animals.find((x) => x.id === animalId);
      const tag = a?.tagNo ? String(a.tagNo) : "";
      const name = a?.name ? String(a.name) : "";
      if (tag && name) return `${tag} • ${name}`;
      if (tag) return tag;
      if (name) return name;
      return animalId || "";
    },
    [animals],
  );

  const safeLog = useCallback(
    async (payload) => {
      try {
        await logActivity(payload);
      } catch (e) {
        // Aktivite log başarısız olsa bile ana işlemi bozmayalım
        console.log("ANIMALS safeLog ERROR:", e?.code, e?.message);
      }
    },
    [logActivity],
  );

  // =========================
  // LISTEN ANIMALS (user scoped)
  // =========================
  useEffect(() => {
    if (booting) return;

    if (!uid) {
      setAnimals([]);
      setLoadingAnimals(false);
      setAnimalsError(null);
      return;
    }

    setLoadingAnimals(true);

    const q = query(
      collection(db, "farmer_info", uid, "animals"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnimals(rows);
        setLoadingAnimals(false);
        setAnimalsError(null);
      },
      (err) => {
        console.log("Animals onSnapshot error:", err?.code, err?.message);
        setAnimalsError(err);
        setLoadingAnimals(false);
      },
    );

    return () => unsub();
  }, [uid, booting]);

  // =========================
  // CRUD ANIMAL
  // =========================
  const addAnimal = useCallback(
    async ({ form, vaccines }) => {
      if (!uid) throw new Error("Not authenticated");

      const payload = {
        ...form,
        tagNo: (form?.tagNo || "").trim(),
        name: (form?.name || "").trim(),
        ageMonths: form?.ageMonths ? Number(form.ageMonths) : null,
        vaccines: (vaccines || []).map((v) => ({
          id: v?.id || null,
          date: v?.date || "",
          type: v?.type || "",
          note: v?.note || "",
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(
        collection(db, "farmer_info", uid, "animals"),
        payload,
      );

      // ✅ Activity: Yeni hayvan eklendi
      await safeLog({
        type: "animal",
        title: "Yeni hayvan eklendi",
        meta: `Küpe: ${payload.tagNo || "-"}${payload.name ? ` • ${payload.name}` : ""}`,
        route: "AnimalsScreen",
        routeParams: { highlightId: ref.id },
      });

      return ref.id;
    },
    [uid, safeLog],
  );

  const updateAnimal = useCallback(
    async (animalId, patch) => {
      if (!uid) throw new Error("Not authenticated");
      if (!animalId) throw new Error("animalId is required");

      await updateDoc(doc(db, "farmer_info", uid, "animals", animalId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });

      // ✅ Activity: Hayvan güncellendi
      await safeLog({
        type: "animal",
        title: "Hayvan güncellendi",
        meta: `Hayvan: ${getAnimalLabel(animalId)}`,
        route: "AnimalsScreen",
        routeParams: { highlightId: animalId },
      });
    },
    [uid, safeLog, getAnimalLabel],
  );

  const deleteAnimal = useCallback(
    async (animalId) => {
      if (!uid) throw new Error("Not authenticated");
      if (!animalId) throw new Error("animalId is required");

      const label = getAnimalLabel(animalId);

      await deleteDoc(doc(db, "farmer_info", uid, "animals", animalId));

      // ✅ Activity: Hayvan silindi
      await safeLog({
        type: "animal",
        title: "Hayvan silindi",
        meta: `Hayvan: ${label}`,
        route: "AnimalsScreen",
      });
    },
    [uid, safeLog, getAnimalLabel],
  );

  // =========================
  // BIRTH -> SAVE UNDER MOTHER
  // =========================
  const addBirthToAnimal = useCallback(
    async ({ motherAnimalId, top, calf, calf2, isTwin }) => {
      if (!uid) throw new Error("Not authenticated");
      if (!motherAnimalId) throw new Error("motherAnimalId is required");

      const payload = {
        motherAnimalId,
        birthDate: top?.birthDate || "",
        birthTime: top?.birthTime || "",
        breed: top?.breed || "",
        staffId: top?.staffId || "",
        isTwin: !!isTwin,

        calf: {
          tagNo: (calf?.tagNo || "").trim(),
          name: (calf?.name || "").trim(),
          gender: calf?.gender || "",
          birthType: calf?.birthType || "",
          birthWeight: calf?.birthWeight || "",
          note: calf?.note || "",
          formation: calf?.formation || "",
          fatherId: calf?.fatherId || "",
          color: calf?.color || "",
          barn: calf?.barn || "",
          section: calf?.section || "",
          group: calf?.group || "",
        },

        calf2: isTwin
          ? {
              tagNo: (calf2?.tagNo || "").trim(),
              name: (calf2?.name || "").trim(),
              gender: calf2?.gender || "",
              birthType: calf2?.birthType || "",
              birthWeight: calf2?.birthWeight || "",
              note: calf2?.note || "",
              formation: calf2?.formation || "",
              fatherId: calf2?.fatherId || "",
              color: calf2?.color || "",
              barn: calf2?.barn || "",
              section: calf2?.section || "",
              group: calf2?.group || "",
            }
          : null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(
        collection(db, "farmer_info", uid, "animals", motherAnimalId, "births"),
        payload,
      );

      // ✅ Activity: Doğum kaydı eklendi (özet)
      await safeLog({
        type: "animal",
        title: "Doğum kaydı eklendi",
        meta: `Anne: ${getAnimalLabel(motherAnimalId)} • Tarih: ${payload.birthDate || "-"}`,
        route: "AnimalsScreen",
        routeParams: { highlightId: motherAnimalId },
      });

      return ref.id;
    },
    [uid, safeLog, getAnimalLabel],
  );

  // =========================
  // CREATE CALF AS AN ANIMAL
  // =========================
  const createCalfAnimalFromBirth = useCallback(
    async ({ top, calf, motherAnimalId, birthId }) => {
      return addAnimal({
        form: {
          tagNo: calf?.tagNo || "",
          name: calf?.name || "",
          birthDate: top?.birthDate || "",
          breed: top?.breed || "",
          gender: calf?.gender || "",
          status: "Buzağı",
          recordType: "Doğum",
          purchaseDate: "",
          purchasePrice: "",
          purchaseWeight: calf?.birthWeight || "",
          origin: "",
          ageMonths: 0,

          motherAnimalId: motherAnimalId || "",
          birthId: birthId || "",
        },
        vaccines: [],
      });
    },
    [addAnimal],
  );

  // =========================
  // ADD BIRTH + CREATE CALVES
  // =========================
  const addBirthAndCreateCalves = useCallback(
    async ({ top, calf1, calf2, isTwin }) => {
      if (!uid) throw new Error("Not authenticated");

      const motherAnimalId = top?.motherAnimalId || top?.motherId;
      if (!motherAnimalId) throw new Error("motherAnimalId is required");

      const birthId = await addBirthToAnimal({
        motherAnimalId,
        top,
        calf: calf1,
        calf2,
        isTwin: !!isTwin,
      });

      const calf1AnimalId = await createCalfAnimalFromBirth({
        top,
        calf: calf1,
        motherAnimalId,
        birthId,
      });

      let calf2AnimalId = null;
      if (isTwin && calf2) {
        calf2AnimalId = await createCalfAnimalFromBirth({
          top,
          calf: calf2,
          motherAnimalId,
          birthId,
        });
      }

      // ✅ Activity: Buzağı oluşturuldu (özet)
      await safeLog({
        type: "animal",
        title: "Buzağı kaydı oluşturuldu",
        meta: `Anne: ${getAnimalLabel(motherAnimalId)} • ${isTwin ? "İkiz" : "Tek"} doğum`,
        route: "AnimalsScreen",
        routeParams: { highlightId: motherAnimalId },
      });

      return { birthId, calf1AnimalId, calf2AnimalId };
    },
    [uid, addBirthToAnimal, createCalfAnimalFromBirth, safeLog, getAnimalLabel],
  );

  // =========================
  // VALUE
  // =========================
  const value = useMemo(
    () => ({
      animals,
      loadingAnimals,
      animalsError,
      addAnimal,
      updateAnimal,
      deleteAnimal,
      addBirthToAnimal,
      createCalfAnimalFromBirth,
      addBirthAndCreateCalves,
    }),
    [
      animals,
      loadingAnimals,
      animalsError,
      addAnimal,
      updateAnimal,
      deleteAnimal,
      addBirthToAnimal,
      createCalfAnimalFromBirth,
      addBirthAndCreateCalves,
    ],
  );

  return (
    <AnimalsContext.Provider value={value}>{children}</AnimalsContext.Provider>
  );
}

export function useAnimals() {
  const ctx = useContext(AnimalsContext);
  if (!ctx) throw new Error("useAnimals must be used within AnimalsProvider");
  return ctx;
}
