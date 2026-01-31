import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Field from "./Field";
import SelectField from "./SelectField";

export default function OtherInfoAccordion({
  styles,
  COLORS,
  open,
  onToggleOpen,

  isTwin,
  setIsTwin,

  calf,
  updateCalf,

  onOpenFormation,
  onOpenColor,
  onOpenBarn,
  onOpenSection,
  onOpenGroup,
}) {
  return (
    <>
      <Pressable onPress={onToggleOpen} style={styles.accordionBtn}>
        <Text style={styles.accordionText}>Diğer Bilgiler:</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.gold}
        />
      </Pressable>

      {open ? (
        <View style={{ marginTop: 10 }}>
          <View style={styles.grid}>
            <Field
              styles={styles}
              value={calf.note}
              onChangeText={(t) => updateCalf("note", t)}
              placeholder="Genel Not"
              full
            />

            <SelectField
              styles={styles}
              COLORS={COLORS}
              value={calf.formation}
              placeholder="Oluşma Şekli"
              onPress={onOpenFormation}
              full
            />

            <Field
              styles={styles}
              value={calf.fatherId}
              onChangeText={(t) => updateCalf("fatherId", t)}
              placeholder="Baba ID"
              full
            />

            <SelectField
              styles={styles}
              COLORS={COLORS}
              value={calf.color}
              placeholder="Renk"
              onPress={onOpenColor}
              full
            />

            <SelectField
              styles={styles}
              COLORS={COLORS}
              value={calf.barn}
              placeholder="Ahır Seçiniz"
              onPress={onOpenBarn}
              full
            />

            <SelectField
              styles={styles}
              COLORS={COLORS}
              value={calf.section}
              placeholder="Bölme Seçiniz"
              onPress={onOpenSection}
              full
            />

            <SelectField
              styles={styles}
              COLORS={COLORS}
              value={calf.group}
              placeholder="Grup"
              onPress={onOpenGroup}
              full
            />
          </View>
        </View>
      ) : null}

      <View style={styles.twinRow}>
        <Text style={styles.twinText}>İkiz</Text>
        <Switch value={isTwin} onValueChange={setIsTwin} />
      </View>
    </>
  );
}
