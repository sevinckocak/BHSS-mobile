import React from "react";
import SelectField from "./SelectField";

export default function BirthTopForm({
  styles,
  COLORS,
  top,
  onOpenMother,
  onOpenBirthDate,
  onOpenBirthTime,
  onOpenBreed,
  onOpenStaff,
}) {
  return (
    <>
      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={top.motherId}
        placeholder="Doğuran Hayvan *"
        onPress={onOpenMother}
        full
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={top.birthDate}
        placeholder="Doğum Yaptığı Tarih *"
        onPress={onOpenBirthDate}
        full
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={top.birthTime}
        placeholder="Doğum Zamanı"
        onPress={onOpenBirthTime}
        full
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={top.breed}
        placeholder="Irk *"
        onPress={onOpenBreed}
        full
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={top.staffId}
        placeholder="Yardımcı Personel"
        onPress={onOpenStaff}
        full
      />
    </>
  );
}
