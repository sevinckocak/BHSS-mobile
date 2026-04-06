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

const VetAuthContext = createContext(null);

const vetDocRef = (uid) => doc(db, "vet_info", uid);

/** Firestore -> UI */
function normalizeVetProfile(raw, fallbackEmail) {
  if (!raw) return null;

  return {
    fullName: (raw.name || "").trim(),
    phone: raw.phone ?? "",
    city: (raw.city || "").trim(),
    district: (raw.district || "").trim(),
    clinicName: (raw.clinic_name || "").trim(),
    specialization: (raw.specialization || "").trim(),
    licenseNo: (raw.license_no || "").trim(),

    role: raw.role || "vet",
    email: (raw.email || fallbackEmail || "").trim(),
    uid: raw.uid,

    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,

    _raw: raw,
  };
}

/** UI -> Firestore patch */
function toFirestorePatch(patch) {
  if (!patch) return {};

  const out = { ...patch };

  if ("fullName" in out) {
    out.name = (out.fullName || "").trim();
    delete out.fullName;
  }

  if ("clinicName" in out) {
    out.clinic_name = (out.clinicName || "").trim();
    delete out.clinicName;
  }

  if ("licenseNo" in out) {
    out.license_no = (out.licenseNo || "").trim();
    delete out.licenseNo;
  }

  if ("specialization" in out) {
    out.specialization = (out.specialization || "").trim();
  }

  if ("phone" in out) out.phone = Number(out.phone) || 0;
  if ("city" in out) out.city = (out.city || "").trim();
  if ("district" in out) out.district = (out.district || "").trim();

  return out;
}

export function VetAuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [vetProfile, setVetProfile] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthUser(u ?? null);

      if (!u) {
        setVetProfile(null);
        setBooting(false);
        return;
      }

      try {
        const snap = await getDoc(vetDocRef(u.uid));
        const raw = snap.exists() ? snap.data() : null;

        setVetProfile(normalizeVetProfile(raw, u.email));
      } catch (err) {
        console.log("VET PROFILE GET ERROR:", err?.code, err?.message);
        setVetProfile(null);
      } finally {
        setBooting(false);
      }
    });

    return unsub;
  }, []);

  const vetLogin = async ({ email, password }) => {
    const e = (email || "").trim();
    const p = password || "";

    const cred = await signInWithEmailAndPassword(auth, e, p);

    // Güvenlik kontrolü: gerçekten vet mi?
    const snap = await getDoc(vetDocRef(cred.user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      throw new Error("Bu hesap veteriner hesabı değil.");
    }

    return cred.user;
  };

  const vetRegister = async ({
    email,
    password,
    fullName,
    phone,
    city,
    district,
    clinicName,
    specialization,
    licenseNo,
  }) => {
    const e = (email || "").trim();
    const p = password || "";

    const cred = await createUserWithEmailAndPassword(auth, e, p);
    const uid = cred.user.uid;

    const vetDoc = {
      name: (fullName || "").trim(),
      phone: Number(phone) || 0,
      city: (city || "").trim(),
      district: (district || "").trim(),
      clinic_name: (clinicName || "").trim(),
      specialization: (specialization || "").trim(),
      license_no: (licenseNo || "").trim(),

      role: "vet",
      email: e,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(vetDocRef(uid), vetDoc, { merge: true });

    setVetProfile(normalizeVetProfile(vetDoc, e));
    return cred.user;
  };

  const updateVetProfile = async (patch) => {
    if (!authUser?.uid) throw new Error("No authenticated user");

    const fsPatch = {
      ...toFirestorePatch(patch),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(vetDocRef(authUser.uid), fsPatch);
    setVetProfile((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  };

  const vetLogout = async () => {
    await signOut(auth);
    setAuthUser(null);
    setVetProfile(null);
  };

  const value = useMemo(
    () => ({
      authUser,
      vetProfile,
      booting,
      isAuthed: !!authUser,
      vetLogin,
      vetRegister,
      vetLogout,
      updateVetProfile,
    }),
    [authUser, vetProfile, booting],
  );

  return (
    <VetAuthContext.Provider value={value}>{children}</VetAuthContext.Provider>
  );
}

export function useVetAuth() {
  const ctx = useContext(VetAuthContext);
  if (!ctx) throw new Error("useVetAuth must be used within VetAuthProvider");
  return ctx;
}
