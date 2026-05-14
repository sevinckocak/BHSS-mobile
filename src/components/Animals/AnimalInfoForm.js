import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

  // ✅ NEW: status modal aç
  onOpenStatus,

  // doğum tarihi / yaş modu
  birthDateMode,
  toggleBirthDateMode,
  ageMonthsInput,
  setAgeMonthsInput,
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

      {/* ── Doğum tarihi VEYA yaş girişi ── */}
      <View>
        {birthDateMode === "date" ? (
          <SelectField
            styles={styles}
            COLORS={COLORS}
            value={form.birthDate}
            placeholder="Doğum Tarihi Seç"
            onPress={onOpenBirthDate}
          />
        ) : (
          <Field
            styles={styles}
            value={ageMonthsInput}
            onChangeText={setAgeMonthsInput}
            placeholder="Yaş (Ay olarak gir — örn: 18)"
            keyboardType="numeric"
          />
        )}
        <TouchableOpacity
          onPress={toggleBirthDateMode}
          style={{ alignSelf: "flex-end", marginTop: -6, marginBottom: 6, paddingVertical: 4, paddingHorizontal: 2 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: COLORS?.gold ?? "#F2D08A", fontSize: 12, fontWeight: "700" }}>
            {birthDateMode === "date" ? "Tarihi bilmiyorum, yaşını gireceğim →" : "← Doğum tarihini seçeceğim"}
          </Text>
        </TouchableOpacity>
      </View>

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

      {/* ✅ status: artık elle yazma yok */}
      <SelectField
        styles={styles}
        COLORS={COLORS}
        value={form.status}
        placeholder="Durum Seç (Buzağı/Dana/Düve/İnek/Boğa/Öküz...)"
        onPress={onOpenStatus}
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
