import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BREEDS } from "../../data/breeds";
import { VACCINE_TYPES } from "../../data/vaccines";
import { GENDERS } from "../../data/genders";

import SimpleSelectModal from "../../components/Animals/SimpleSelectModal";
import DatePickerSheet from "../../components/Animals/DatePickerSheet";

import { styles, COLORS } from "./styles/AddAnimalScreen.styles";
import { useAddAnimalForm } from "./hooks/useAddAnimalForm";

import AnimalPhotoPicker from "../../components/Animals/AnimalPhotoPicker";
import AnimalInfoForm from "../../components/Animals/AnimalInfoForm";
import VaccineHistoryForm from "../../components/Animals/VaccineHistoryForm";

export default function AddAnimalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [photoUri, setPhotoUri] = useState(null);
  const f = useAddAnimalForm();

  const onPreview = () => {
    if (!f.form.tagNo.trim()) {
      Alert.alert("Eksik", "Küpe No zorunlu.");
      return;
    }
    console.log("PREVIEW:", { form: f.form, photoUri, vaccines: f.vaccines });
    Alert.alert("Önizle ✅", "Seçimler console'a yazdırıldı.");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
          </Pressable>

          <Text style={styles.headerTitle}>Yeni Hayvan Ekle</Text>

          <View style={{ width: 24 }} />
        </View>

        <AnimalPhotoPicker
          styles={styles}
          COLORS={COLORS}
          photoUri={photoUri}
          setPhotoUri={setPhotoUri}
        />

        <Text style={styles.sectionTitle}>Hayvan Bilgileri</Text>
        <View style={styles.grid}>
          <AnimalInfoForm
            styles={styles}
            COLORS={COLORS}
            form={f.form}
            update={f.update}
            onOpenBirthDate={() => f.openDatePickerForForm("birthDate")}
            onOpenPurchaseDate={() => f.openDatePickerForForm("purchaseDate")}
            onOpenBreed={() => f.setBreedModal(true)}
            onOpenGender={() => f.setGenderModal(true)}
          />
        </View>

        <VaccineHistoryForm
          styles={styles}
          COLORS={COLORS}
          vaccines={f.vaccines}
          onAddVaccine={f.addVaccine}
          onDeleteVaccine={f.deleteVaccine}
          onOpenVaccineDate={f.openDatePickerForVaccine}
          onOpenVaccineType={(id) => f.setVaccineModal({ open: true, id })}
          onChangeVaccineNote={f.setVaccineNote}
        />

        <View style={styles.bottomBar}>
          <Pressable onPress={onPreview} style={styles.bottomBtn}>
            <Text style={styles.bottomBtnText}>Ekle</Text>
          </Pressable>
        </View>

        <SimpleSelectModal
          styles={styles}
          COLORS={COLORS}
          visible={f.breedModal}
          title="Irk Seç"
          items={BREEDS}
          onClose={() => f.setBreedModal(false)}
          onSelect={(it) => {
            f.update("breed", it.name);
            f.update("origin", it.origin);
            f.setBreedModal(false);
          }}
        />

        <SimpleSelectModal
          styles={styles}
          COLORS={COLORS}
          visible={f.genderModal}
          title="Cinsiyet Seç"
          items={GENDERS}
          onClose={() => f.setGenderModal(false)}
          onSelect={(it) => {
            f.update("gender", it.name);
            f.setGenderModal(false);
          }}
        />

        <SimpleSelectModal
          styles={styles}
          COLORS={COLORS}
          visible={f.vaccineModal.open}
          title="Aşı Tipi Seç"
          items={VACCINE_TYPES}
          onClose={() => f.setVaccineModal({ open: false, id: null })}
          onSelect={(it) => {
            const targetId = f.vaccineModal.id;
            if (!targetId) return;
            f.setVaccineType(targetId, it.name);
            f.setVaccineModal({ open: false, id: null });
          }}
        />

        <DatePickerSheet
          styles={styles}
          COLORS={COLORS}
          open={f.datePicker.open}
          value={f.datePicker.value}
          onChange={f.onChangeDate}
          onClose={f.closeIOSDatePicker}
        />
      </ScrollView>
    </View>
  );
}
