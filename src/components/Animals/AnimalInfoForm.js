import React from "react";
import Field from "../../components/Animals/Field";
import SelectField from "../../components/Animals/SelectField";

export default function AnimalInfoForm({
  styles,
  COLORS,
  form,
  update,
  onOpenBirthDate,
  onOpenPurchaseDate,
  onOpenBreed,
  onOpenGender,
}) {
  return (
    <>
      <Field
        styles={styles}
        value={form.tagNo}
        onChangeText={(t) => update("tagNo", t)}
        placeholder="Küpe No *"
      />
      <Field
        styles={styles}
        value={form.name}
        onChangeText={(t) => update("name", t)}
        placeholder="Hayvan Adı"
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={form.birthDate}
        placeholder="Doğum Tarihi Seç"
        onPress={onOpenBirthDate}
      />
      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={form.breed}
        placeholder="Irk Seç"
        onPress={onOpenBreed}
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={form.gender}
        placeholder="Cinsiyet Seç"
        onPress={onOpenGender}
      />
      <Field
        styles={styles}
        value={form.status}
        onChangeText={(t) => update("status", t)}
        placeholder="Durum: Buzağı"
      />

      <Field
        styles={styles}
        value={form.recordType}
        onChangeText={(t) => update("recordType", t)}
        placeholder="Kayıt Şekli: Satın alındı"
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={form.purchaseDate}
        placeholder="Satın Alış Tarihi Seç"
        onPress={onOpenPurchaseDate}
      />

      <Field
        styles={styles}
        value={form.purchasePrice}
        onChangeText={(t) => update("purchasePrice", t)}
        placeholder="Satın Alış Fiyatı"
        keyboardType="numeric"
      />
      <Field
        styles={styles}
        value={form.purchaseWeight}
        onChangeText={(t) => update("purchaseWeight", t)}
        placeholder="Satın Alış Kilosu"
        keyboardType="numeric"
      />

      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={form.origin}
        placeholder="Menşei (Irk seçince gelir)"
        onPress={onOpenBreed}
        full
      />
    </>
  );
}
