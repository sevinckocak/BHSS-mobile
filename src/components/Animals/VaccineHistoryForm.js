import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SelectField from "./SelectField";

export default function VaccineHistoryForm({
  styles,
  COLORS,
  vaccines,
  onAddVaccine,
  onDeleteVaccine,
  onOpenVaccineDate,
  onOpenVaccineType,
  onChangeVaccineNote,
}) {
  return (
    <>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Geçmiş Aşılar</Text>
        <Pressable onPress={onAddVaccine} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Aşı Ekle (+)</Text>
        </Pressable>
      </View>

      <View style={{ gap: 10, marginTop: 10 }}>
        {vaccines.map((v) => (
          <View key={v.id} style={styles.vaccineCard}>
            <View style={styles.vaccineIcon}>
              <Ionicons name="medical" size={18} color={COLORS.gold} />
            </View>

            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <SelectField
                  styles={styles}
                  COLORS={COLORS}
                  value={v.date}
                  placeholder="Tarih Seç"
                  onPress={() => onOpenVaccineDate(v.id)}
                />
                <SelectField
                  styles={styles}
                  COLORS={COLORS}
                  value={v.type}
                  placeholder="Aşı Tipi"
                  onPress={() => onOpenVaccineType(v.id)}
                />
              </View>

              <TextInput
                value={v.note}
                onChangeText={(t) => onChangeVaccineNote(v.id, t)}
                placeholder="Not (opsiyonel)..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.vaccineNote}
              />
            </View>

            <Pressable
              onPress={() => onDeleteVaccine(v.id)}
              style={styles.trashBtn}
            >
              <Ionicons name="trash" size={18} color={COLORS.gold} />
            </Pressable>
          </View>
        ))}
      </View>
    </>
  );
}
