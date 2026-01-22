import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase/firebaseConfig";

const FarmerAuthContext = createContext(null);

const farmerDocRef = (uid) => doc(db, "farmer_info", uid);

/** ✅ Firestore (snake_case) -> UI (camelCase) */
function normalizeFarmerProfile(raw, fallbackEmail) {
  if (!raw) return null;

  return {
    // UI alanları (camelCase)
    fullName: (raw.name || "").trim(),
    phone: raw.phone ?? "",
    city: (raw.city || "").trim(),
    district: (raw.district || "").trim(),
    farmName: (raw.farm_name || "").trim(),
    herdSize: raw.total_animals ?? 0,

    role: raw.role || "farmer",
    email: (raw.email || fallbackEmail || "").trim(),
    uid: raw.uid,

    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,

    // İstersen debug için ham veriyi de tutabilirsin
    _raw: raw,
  };
}

/** ✅ UI patch (camelCase) -> Firestore patch (snake_case) */
function toFirestorePatch(patch) {
  if (!patch) return {};

  const out = { ...patch };

  // UI isimlerini Firestore isimlerine çevir
  if ("fullName" in out) {
    out.name = (out.fullName || "").trim();
    delete out.fullName;
  }
  if ("farmName" in out) {
    out.farm_name = (out.farmName || "").trim();
    delete out.farmName;
  }
  if ("herdSize" in out) {
    out.total_animals = Number(out.herdSize) || 0;
    delete out.herdSize;
  }

  // temizlik
  if ("phone" in out) out.phone = Number(out.phone) || 0;
  if ("city" in out) out.city = (out.city || "").trim();
  if ("district" in out) out.district = (out.district || "").trim();

  return out;
}

export function FarmerAuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthUser(u ?? null);

      if (!u) {
        setFarmerProfile(null);
        setBooting(false);
        return;
      }

      try {
        const snap = await getDoc(farmerDocRef(u.uid));
        const raw = snap.exists() ? snap.data() : null;

        // ✅ normalize
        setFarmerProfile(normalizeFarmerProfile(raw, u.email));
      } catch (err) {
        console.log("FARMER PROFILE GET ERROR:", err?.code, err?.message);
        setFarmerProfile(null);
      } finally {
        setBooting(false);
      }
    });

    return unsub;
  }, []);

  // ✅ Login
  const farmerLogin = async ({ email, password }) => {
    const e = (email || "").trim();
    const p = password || "";
    const cred = await signInWithEmailAndPassword(auth, e, p);
    return cred.user;
  };

  // ✅ Register
  const farmerRegister = async ({
    email,
    password,
    fullName,
    phone,
    city,
    district,
    farmName,
    herdSize,
  }) => {
    const e = (email || "").trim();
    const p = password || "";

    const cred = await createUserWithEmailAndPassword(auth, e, p);
    const uid = cred.user.uid;

    // ✅ Firestore (snake_case)
    const farmerDoc = {
      name: (fullName || "").trim(),
      phone: Number(phone) || 0,
      city: (city || "").trim(),
      district: (district || "").trim(),
      farm_name: (farmName || "").trim(),
      total_animals: herdSize ? Number(herdSize) : 0,

      role: "farmer",
      email: e,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(farmerDocRef(uid), farmerDoc, { merge: true });

    // ✅ UI state (camelCase)
    setFarmerProfile(normalizeFarmerProfile(farmerDoc, e));
    return cred.user;
  };

  // ✅ Profil güncelleme
  const updateFarmerProfile = async (patch) => {
    if (!authUser?.uid) throw new Error("No authenticated user");
    const uid = authUser.uid;

    const fsPatch = {
      ...toFirestorePatch(patch),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(farmerDocRef(uid), fsPatch);

    // UI state’i de camelCase olarak güncelle
    setFarmerProfile((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  };

  // ✅ Logout
  const farmerLogout = async () => {
    await signOut(auth);
    setAuthUser(null); // ✅ önemli
    setFarmerProfile(null);
  };

  const value = useMemo(
    () => ({
      authUser,
      farmerProfile,
      booting,
      isAuthed: !!authUser,
      farmerLogin,
      farmerRegister,
      farmerLogout,
      updateFarmerProfile,
    }),
    [authUser, farmerProfile, booting]
  );

  return (
    <FarmerAuthContext.Provider value={value}>
      {children}
    </FarmerAuthContext.Provider>
  );
}

export function useFarmerAuth() {
  const ctx = useContext(FarmerAuthContext);
  if (!ctx)
    throw new Error("useFarmerAuth must be used within FarmerAuthProvider");
  return ctx;
}
