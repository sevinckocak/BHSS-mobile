import { useMemo, useState } from "react";
import { Platform } from "react-native";
import { formatTR, parseTRDate } from "../../../utils/date";

function makeTempTag() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `GEÇİCİ_NO_${n}`;
}

const emptyCalf = () => ({
  tagNo: makeTempTag(),
  name: "",
  gender: "",
  birthType: "",
  birthWeight: "",
  note: "",
  formation: "",
  fatherId: "",
  color: "",
  barn: "",
  section: "",
  group: "",
});

export function useAddBirthForm() {
  const todayStr = useMemo(() => formatTR(new Date()), []);

  // ✅ Üst form
  const [top, setTop] = useState({
    // ⬇️ geriye dönük: ekranda halen motherId kullanan yerler olabilir
    motherId: "",

    // ✅ ASIL BEKLENEN: addBirthAndCreateCalves bunu ister
    motherAnimalId: "",

    motherLabel: "",
    birthDate: todayStr,
    birthTime: "",
    breed: "",
    staffId: "",
  });

  // ✅ Buzağı 1
  const [calf, setCalf] = useState(emptyCalf());

  // ✅ Buzağı 2
  const [calf2, setCalf2] = useState(emptyCalf());

  const [isTwin, setIsTwin] = useState(false);
  const [showOther, setShowOther] = useState(false);

  /**
   * ✅ updateTop geliştirme:
   * - motherAnimalId set edilirse motherId'yi de aynılar
   * - motherId set edilirse motherAnimalId'yi de aynılar
   * Böylece hangi alanı set edersen et, ikisi de dolu kalır.
   */
  const updateTop = (k, v) => {
    setTop((p) => {
      if (k === "motherAnimalId") {
        return { ...p, motherAnimalId: v, motherId: v };
      }
      if (k === "motherId") {
        return { ...p, motherId: v, motherAnimalId: v };
      }
      return { ...p, [k]: v };
    });
  };

  const updateCalf = (k, v) => setCalf((p) => ({ ...p, [k]: v }));
  const updateCalf2 = (k, v) => setCalf2((p) => ({ ...p, [k]: v }));

  // ✅ Hangi buzağı için seçim yapıyoruz?
  const [calfTarget, setCalfTarget] = useState(1); // 1 | 2

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

  // ✅ helper: hedef buzağıyı güncelle
  const updateTargetCalf = (k, v) => {
    if (calfTarget === 1) updateCalf(k, v);
    else updateCalf2(k, v);
  };

  const openGenderModalFor = (target) => {
    setCalfTarget(target);
    setGenderModal(true);
  };

  const openBirthTypeModalFor = (target) => {
    setCalfTarget(target);
    setBirthTypeModal(true);
  };

  const openOtherModalFor = (target, modalName) => {
    setCalfTarget(target);
    if (modalName === "formation") setFormationModal(true);
    if (modalName === "color") setColorModal(true);
    if (modalName === "barn") setBarnModal(true);
    if (modalName === "section") setSectionModal(true);
    if (modalName === "group") setGroupModal(true);
  };

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

  // ✅ İkiz kapatılırsa 2. buzağı reset
  const setIsTwinSafe = (val) => {
    setIsTwin(val);
    if (!val) setCalf2(emptyCalf());
  };

  return {
    todayStr,

    top,
    calf,
    calf2,
    isTwin,
    showOther,

    updateTop,
    updateCalf,
    updateCalf2,
    setIsTwin: setIsTwinSafe,
    setShowOther,

    calfTarget,
    setCalfTarget,
    updateTargetCalf,
    openGenderModalFor,
    openBirthTypeModalFor,
    openOtherModalFor,

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

    datePicker,
    openBirthDatePicker,
    onChangeDate,
    closeIOSDatePicker,
  };
}
