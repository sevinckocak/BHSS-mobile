import { useMemo, useState } from "react";
import { Platform } from "react-native";
import { formatTR, parseTRDate } from "../../../utils/date";

function makeTempTag() {
  // GEÇİCİ_NO_26665 benzeri
  const n = Math.floor(10000 + Math.random() * 90000);
  return `GEÇİCİ_NO_${n}`;
}

export function useAddBirthForm() {
  const todayStr = useMemo(() => formatTR(new Date()), []);

  // Üst form
  const [top, setTop] = useState({
    motherId: "", // Doğuran Hayvan
    birthDate: todayStr,
    birthTime: "", // Doğum Zamanı
    breed: "", // Irk
    staffId: "", // Yardımcı Personel
  });

  // Buzağı form
  const [calf, setCalf] = useState({
    tagNo: makeTempTag(),
    name: "",
    gender: "",
    birthType: "",
    birthWeight: "",
    // Diğer bilgiler
    note: "",
    formation: "",
    fatherId: "",
    color: "",
    barn: "",
    section: "",
    group: "",
  });

  const [isTwin, setIsTwin] = useState(false);
  const [showOther, setShowOther] = useState(false);

  const updateTop = (k, v) => setTop((p) => ({ ...p, [k]: v }));
  const updateCalf = (k, v) => setCalf((p) => ({ ...p, [k]: v }));

  // Modals
  const [motherModal, setMotherModal] = useState(false);
  const [breedModal, setBreedModal] = useState(false);
  const [staffModal, setStaffModal] = useState(false);

  const [genderModal, setGenderModal] = useState(false);
  const [birthTimeModal, setBirthTimeModal] = useState(false);
  const [birthTypeModal, setBirthTypeModal] = useState(false);
  const [formationModal, setFormationModal] = useState(false);
  const [colorModal, setColorModal] = useState(false);
  const [barnModal, setBarnModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);

  // DatePicker
  const [datePicker, setDatePicker] = useState({
    open: false,
    field: null, // "birthDate"
    value: new Date(),
  });

  const openBirthDatePicker = () => {
    const current = parseTRDate(top.birthDate) || new Date();
    setDatePicker({ open: true, field: "birthDate", value: current });
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
    if (datePicker.field === "birthDate") updateTop("birthDate", dateStr);
  };

  const closeIOSDatePicker = () =>
    setDatePicker((p) => ({ ...p, open: false }));

  return {
    todayStr,

    top,
    calf,
    isTwin,
    showOther,

    updateTop,
    updateCalf,
    setIsTwin,
    setShowOther,

    // modals
    motherModal,
    setMotherModal,
    breedModal,
    setBreedModal,
    staffModal,
    setStaffModal,
    genderModal,
    setGenderModal,
    birthTimeModal,
    setBirthTimeModal,
    birthTypeModal,
    setBirthTypeModal,
    formationModal,
    setFormationModal,
    colorModal,
    setColorModal,
    barnModal,
    setBarnModal,
    sectionModal,
    setSectionModal,
    groupModal,
    setGroupModal,

    // date picker
    datePicker,
    openBirthDatePicker,
    onChangeDate,
    closeIOSDatePicker,
  };
}
