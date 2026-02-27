import { useMemo, useState } from "react";
import { Platform } from "react-native";
import { formatTR, parseTRDate } from "../../../utils/date";

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

    // ✅ NEW: kullanıcı yaş girebilsin (ay)
    ageMonths: "",

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

  // ✅ NEW: yaş input helper (sadece rakam)
  const setAgeMonths = (t) => {
    const onlyDigits = String(t ?? "").replace(/[^0-9]/g, "");
    update("ageMonths", onlyDigits);
  };

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
    setAgeMonths,

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
