import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles, COLORS } from "./styles/AddBirthScreen.styles";
import { useAddBirthForm } from "./hooks/useAddBirthForm";

import SimpleSelectModal from "../../components/Animals/SimpleSelectModal";
import DatePickerSheet from "../../components/Animals/DatePickerSheet";

import BirthTopForm from "../../components/Animals/BirthTopForm";
import CalfForm from "../../components/Animals/CalfForm";
import OtherInfoAccordion from "../../components/Animals/OtherInfoAccordion";
import AnimalPhotoPicker from "../../components/Animals/AnimalPhotoPicker";

import { BREEDS } from "../../data/breeds";
import { GENDERS } from "../../data/genders";
import {
  MOTHERS,
  STAFF,
  BIRTH_TIMES,
  BIRTH_TYPES,
  FORMATION_TYPES,
  COLORS_LIST,
  BARNS,
  SECTIONS,
  GROUPS,
} from "../../data/birth";

export default function AddBirthScreen({ navigation }) {
  const f = useAddBirthForm();
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState(null);

  const onSubmit = () => {
    if (!f.top.motherId)
      return Alert.alert("Eksik", "Doğuran Hayvan seçmelisin.");
    if (!f.top.birthDate)
      return Alert.alert("Eksik", "Doğum tarihi seçmelisin.");
    if (!f.top.breed) return Alert.alert("Eksik", "Irk seçmelisin.");
    if (!f.calf.tagNo)
      return Alert.alert("Eksik", "Buzağı küpe no boş olamaz.");
    if (!f.calf.gender) return Alert.alert("Eksik", "Buzağı cinsiyeti seç.");

    console.log("BIRTH PREVIEW", {
      top: f.top,
      calf: f.calf,
      isTwin: f.isTwin,
      photoUri,
    });

    Alert.alert("OK", "Önizleme console’a yazıldı.");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
          </Pressable>

          <Text style={styles.headerTitle}>Doğum Ekle</Text>

          <View style={{ width: 24 }} />
        </View>

        <View style={styles.photoCenter}>
          <AnimalPhotoPicker
            styles={styles}
            COLORS={COLORS}
            photoUri={photoUri}
            setPhotoUri={setPhotoUri}
          />
        </View>

        <BirthTopForm
          styles={styles}
          COLORS={COLORS}
          top={f.top}
          onOpenMother={() => f.setMotherModal(true)}
          onOpenBirthDate={f.openBirthDatePicker}
          onOpenBirthTime={() => f.setBirthTimeModal(true)}
          onOpenBreed={() => f.setBreedModal(true)}
          onOpenStaff={() => f.setStaffModal(true)}
        />

        <CalfForm
          styles={styles}
          COLORS={COLORS}
          calf={f.calf}
          updateCalf={f.updateCalf}
          onOpenGender={() => f.setGenderModal(true)}
          onOpenBirthType={() => f.setBirthTypeModal(true)}
        />

        <OtherInfoAccordion
          styles={styles}
          COLORS={COLORS}
          open={f.showOther}
          onToggleOpen={() => f.setShowOther((p) => !p)}
          isTwin={f.isTwin}
          setIsTwin={f.setIsTwin}
          calf={f.calf}
          updateCalf={f.updateCalf}
          onOpenFormation={() => f.setFormationModal(true)}
          onOpenColor={() => f.setColorModal(true)}
          onOpenBarn={() => f.setBarnModal(true)}
          onOpenSection={() => f.setSectionModal(true)}
          onOpenGroup={() => f.setGroupModal(true)}
        />

        <Pressable onPress={onSubmit} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Ekle</Text>
        </Pressable>
      </ScrollView>

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.motherModal}
        title="Doğuran Hayvan Seç"
        items={MOTHERS.map((m) => ({ id: m.id, name: m.label }))}
        onClose={() => f.setMotherModal(false)}
        onSelect={(it) => {
          f.updateTop("motherId", it.name);
          f.setMotherModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.breedModal}
        title="Irk Seç"
        items={BREEDS}
        onClose={() => f.setBreedModal(false)}
        onSelect={(it) => {
          f.updateTop("breed", it.name);
          f.setBreedModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.staffModal}
        title="Yardımcı Personel"
        items={STAFF}
        onClose={() => f.setStaffModal(false)}
        onSelect={(it) => {
          f.updateTop("staffId", it.name);
          f.setStaffModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.birthTimeModal}
        title="Doğum Zamanı"
        items={BIRTH_TIMES}
        onClose={() => f.setBirthTimeModal(false)}
        onSelect={(it) => {
          f.updateTop("birthTime", it.name);
          f.setBirthTimeModal(false);
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
          f.updateCalf("gender", it.name);
          f.setGenderModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.birthTypeModal}
        title="Doğum Türü"
        items={BIRTH_TYPES}
        onClose={() => f.setBirthTypeModal(false)}
        onSelect={(it) => {
          f.updateCalf("birthType", it.name);
          f.setBirthTypeModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.formationModal}
        title="Oluşma Şekli"
        items={FORMATION_TYPES}
        onClose={() => f.setFormationModal(false)}
        onSelect={(it) => {
          f.updateCalf("formation", it.name);
          f.setFormationModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.colorModal}
        title="Renk"
        items={COLORS_LIST}
        onClose={() => f.setColorModal(false)}
        onSelect={(it) => {
          f.updateCalf("color", it.name);
          f.setColorModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.barnModal}
        title="Ahır Seçiniz"
        items={BARNS}
        onClose={() => f.setBarnModal(false)}
        onSelect={(it) => {
          f.updateCalf("barn", it.name);
          f.setBarnModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.sectionModal}
        title="Bölme Seçiniz"
        items={SECTIONS}
        onClose={() => f.setSectionModal(false)}
        onSelect={(it) => {
          f.updateCalf("section", it.name);
          f.setSectionModal(false);
        }}
      />

      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.groupModal}
        title="Grup Seç"
        items={GROUPS}
        onClose={() => f.setGroupModal(false)}
        onSelect={(it) => {
          f.updateCalf("group", it.name);
          f.setGroupModal(false);
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
    </View>
  );
}
