import { useMemo, useState } from "react";
import { Platform } from "react-native";
import { formatTR, parseTRDate } from "../../../utils/date";
import { getAnimalAgeMonths } from "../../../utils/animalAge";

/** Bugünden N ay geriye giderek tahmini doğum tarihi üretir. */
function birthDateFromMonths(months) {
  const n = Math.max(0, Math.floor(Number(months)));
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, now.getDate());
}

export function useAddAnimalForm() {
  const todayStr = useMemo(() => formatTR(new Date()), []);

  const [form, setForm] = useState({
    tagNo: "",
    name: "",
    birthDate: todayStr,
    breed: "",
    gender: "",

    // ✅ status artık modal ile seçilecek
    status: "Buzağı",

    recordType: "Satın alındı",
    purchaseDate: "",
    purchasePrice: "",
    purchaseWeight: "",
    origin: "",
  });

  const [vaccines, setVaccines] = useState([
    { id: "v1", date: todayStr, type: "", note: "" },
  ]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Doğum tarihi / yaş modu ──────────────────────────────────────────────
  // "date" → takvimden seç  |  "age" → ay sayısı gir
  const [birthDateMode, setBirthDateMode] = useState("date");
  const [ageMonthsInput, setAgeMonthsInputRaw] = useState("");

  const setAgeMonthsInput = (t) => {
    const digits = String(t ?? "").replace(/[^0-9]/g, "");
    setAgeMonthsInputRaw(digits);
    if (digits !== "") {
      const computed = birthDateFromMonths(digits);
      update("birthDate", formatTR(computed));
    }
  };

  const toggleBirthDateMode = () => {
    setBirthDateMode((prev) => {
      if (prev === "date") {
        // Mevcut birthDate'den ayı hesapla, age inputa yükle
        const months = getAnimalAgeMonths(form.birthDate);
        setAgeMonthsInputRaw(months != null ? String(months) : "");
        return "age";
      } else {
        return "date";
      }
    });
  };

  // Modals
  const [breedModal, setBreedModal] = useState(false);
  const [genderModal, setGenderModal] = useState(false);
  const [vaccineModal, setVaccineModal] = useState({ open: false, id: null });

  // ✅ NEW: status modal
  const [statusModal, setStatusModal] = useState(false);

  // DatePicker
  const [datePicker, setDatePicker] = useState({
    open: false,
    field: null, // "birthDate" | "purchaseDate" | "vaccineDate"
    vaccineId: null,
    value: new Date(),
  });

  const openDatePickerForForm = (fieldKey) => {
    const current = parseTRDate(form[fieldKey]) || new Date();
    setDatePicker({
      open: true,
      field: fieldKey,
      vaccineId: null,
      value: current,
    });
  };

  const openDatePickerForVaccine = (vaccineId) => {
    const v = vaccines.find((x) => x.id === vaccineId);
    const current = parseTRDate(v?.date) || new Date();
    setDatePicker({
      open: true,
      field: "vaccineDate",
      vaccineId,
      value: current,
    });
  };

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === "android" && event?.type === "dismissed") {
      setDatePicker((p) => ({ ...p, open: false }));
      return;
    }

    const date = selectedDate || datePicker.value;
    setDatePicker((p) => ({ ...p, value: date }));

    if (Platform.OS === "android")
      setDatePicker((p) => ({ ...p, open: false }));

    const dateStr = formatTR(date);

    if (datePicker.field === "birthDate") update("birthDate", dateStr);
    if (datePicker.field === "purchaseDate") update("purchaseDate", dateStr);

    if (datePicker.field === "vaccineDate" && datePicker.vaccineId) {
      setVaccines((p) =>
        p.map((x) =>
          x.id === datePicker.vaccineId ? { ...x, date: dateStr } : x,
        ),
      );
    }
  };

  const closeIOSDatePicker = () =>
    setDatePicker((p) => ({ ...p, open: false }));

  // Vaccines ops
  const addVaccine = () => {
    setVaccines((p) => [
      {
        id: `v_${Date.now()}`,
        date: form.birthDate || todayStr,
        type: "",
        note: "",
      },
      ...p,
    ]);
  };

  const deleteVaccine = (id) =>
    setVaccines((p) => p.filter((x) => x.id !== id));

  const setVaccineNote = (id, note) =>
    setVaccines((p) => p.map((x) => (x.id === id ? { ...x, note } : x)));

  const setVaccineType = (id, type) =>
    setVaccines((p) => p.map((x) => (x.id === id ? { ...x, type } : x)));

  return {
    todayStr,
    form,
    vaccines,
    update,

    // modals
    breedModal,
    setBreedModal,
    genderModal,
    setGenderModal,
    vaccineModal,
    setVaccineModal,

    // ✅ NEW
    statusModal,
    setStatusModal,

    // doğum tarihi / yaş modu
    birthDateMode,
    toggleBirthDateMode,
    ageMonthsInput,
    setAgeMonthsInput,

    // date picker
    datePicker,
    openDatePickerForForm,
    openDatePickerForVaccine,
    onChangeDate,
    closeIOSDatePicker,

    // vaccines
    addVaccine,
    deleteVaccine,
    setVaccineNote,
    setVaccineType,
  };
}
