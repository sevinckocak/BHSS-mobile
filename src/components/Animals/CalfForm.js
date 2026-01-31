import React from "react";
import { View, Text } from "react-native";
import Field from "./Field";
import SelectField from "./SelectField";

export default function CalfForm({
  styles,
  COLORS,
  calf,
  updateCalf,
  onOpenGender,
  onOpenBirthType,
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>1. Buzağı</Text>

      <View style={styles.grid}>
        <Field
          styles={styles}
          value={calf.tagNo}
          onChangeText={(t) => updateCalf("tagNo", t)}
          placeholder="Küpe No *"
        />

        <Field
          styles={styles}
          value={calf.name}
          onChangeText={(t) => updateCalf("name", t)}
          placeholder="Hayvan Adı"
        />

        <SelectField
          styles={styles}
          COLORS={COLORS}
          value={calf.gender}
          placeholder="Cinsiyet *"
          onPress={onOpenGender}
        />

        <SelectField
          styles={styles}
          COLORS={COLORS}
          value={calf.birthType}
          placeholder="Doğum Türü"
          onPress={onOpenBirthType}
        />

        <Field
          styles={styles}
          value={calf.birthWeight}
          onChangeText={(t) => updateCalf("birthWeight", t)}
          placeholder="Doğum Ağırlığı"
          keyboardType="numeric"
        />
      </View>
    </>
  );
}
