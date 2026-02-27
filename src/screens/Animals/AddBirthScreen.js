import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnimals } from "../../context/AnimalsContext";

import { styles, COLORS } from "./styles/AddBirthScreen.styles";
import { useAddBirthForm } from "./hooks/useAddBirthForm";

import SimpleSelectModal from "../../components/Animals/SimpleSelectModal";
import DatePickerSheet from "../../components/Animals/DatePickerSheet";

import BirthTopForm from "../../components/Animals/BirthTopForm";
import CalfForm from "../../components/Animals/CalfForm";
import OtherInfoAccordion from "../../components/Animals/OtherInfoAccordion";

import { BREEDS } from "../../data/breeds";
import { GENDERS } from "../../data/genders";
import {
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

  const { animals, addBirthAndCreateCalves } = useAnimals();

  // ✅ sadece dişiler anne olabilir
  const motherCandidates = useMemo(() => {
    return (animals || []).filter((a) => a.gender === "Dişi");
  }, [animals]);

  const openMotherModal = () => {
    if (!motherCandidates.length) {
      Alert.alert("Uygun anne yok", "Dişi hayvan bulunamadı.");
      return;
    }
    f.setMotherModal(true);
  };

  const onSubmit = async () => {
    try {
      // ✅ ZORUNLU: motherAnimalId (asıl beklenen alan)
      if (!f.top.motherAnimalId)
        return Alert.alert("Eksik", "Doğuran Hayvan seçmelisin.");
      if (!f.top.birthDate)
        return Alert.alert("Eksik", "Doğum tarihi seçmelisin.");
      if (!f.top.breed) return Alert.alert("Eksik", "Irk seçmelisin.");

      // buzağı 1 zorunlular
      if (!f.calf.tagNo)
        return Alert.alert("Eksik", "1. buzağı küpe no boş olamaz.");
      if (!f.calf.gender)
        return Alert.alert("Eksik", "1. buzağı cinsiyeti seç.");

      // ikiz ise buzağı 2 zorunlular
      if (f.isTwin) {
        if (!f.calf2.tagNo)
          return Alert.alert("Eksik", "2. buzağı küpe no boş olamaz.");
        if (!f.calf2.gender)
          return Alert.alert("Eksik", "2. buzağı cinsiyeti seç.");
      }

      await addBirthAndCreateCalves({
        top: f.top,
        calf1: f.calf,
        calf2: f.isTwin ? f.calf2 : null,
        isTwin: f.isTwin,
      });

      Alert.alert("Başarılı ✅", "Doğum kaydedildi.");
      navigation.goBack();
    } catch (err) {
      console.log("BIRTH SAVE ERROR:", err);
      Alert.alert("Hata", err?.message || "Doğum kaydedilemedi.");
    }
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

        <BirthTopForm
          styles={styles}
          COLORS={COLORS}
          top={f.top}
          onOpenMother={openMotherModal}
          onOpenBirthDate={f.openBirthDatePicker}
          onOpenBirthTime={() => f.setBirthTimeModal(true)}
          onOpenBreed={() => f.setBreedModal(true)}
          onOpenStaff={() => f.setStaffModal(true)}
        />

        {/* ✅ Buzağı 1 */}
        <CalfForm
          title="1. Buzağı"
          styles={styles}
          COLORS={COLORS}
          calf={f.calf}
          updateCalf={f.updateCalf}
          onOpenGender={() => f.openGenderModalFor(1)}
          onOpenBirthType={() => f.openBirthTypeModalFor(1)}
        />

        {/* ✅ Buzağı 2 (ikizse) */}
        {f.isTwin && (
          <CalfForm
            title="2. Buzağı"
            styles={styles}
            COLORS={COLORS}
            calf={f.calf2}
            updateCalf={f.updateCalf2}
            onOpenGender={() => f.openGenderModalFor(2)}
            onOpenBirthType={() => f.openBirthTypeModalFor(2)}
          />
        )}

        <OtherInfoAccordion
          styles={styles}
          COLORS={COLORS}
          open={f.showOther}
          onToggleOpen={() => f.setShowOther((p) => !p)}
          isTwin={f.isTwin}
          setIsTwin={f.setIsTwin}
          calf={f.calf}
          updateCalf={f.updateCalf}
          onOpenFormation={() => f.openOtherModalFor(1, "formation")}
          onOpenColor={() => f.openOtherModalFor(1, "color")}
          onOpenBarn={() => f.openOtherModalFor(1, "barn")}
          onOpenSection={() => f.openOtherModalFor(1, "section")}
          onOpenGroup={() => f.openOtherModalFor(1, "group")}
        />

        <Pressable onPress={onSubmit} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Ekle</Text>
        </Pressable>
      </ScrollView>

      {/* ✅ Mother modal (sadece Dişi) */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.motherModal}
        title="Doğuran Hayvan Seç"
        items={motherCandidates.map((a) => ({
          id: a.id, // animalId (doc id)
          name: `${a.tagNo || "-"} • ${a.name || "İsimsiz"} • ${a.status || "-"}`,
        }))}
        onClose={() => f.setMotherModal(false)}
        onSelect={(it) => {
          // ✅ EN KRİTİK DÜZELTME: motherAnimalId
          f.updateTop("motherAnimalId", it.id);
          f.updateTop("motherLabel", it.name);
          f.setMotherModal(false);
        }}
      />

      {/* Breed */}
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

      {/* Staff */}
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

      {/* Birth Time */}
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

      {/* ✅ Gender modal (target: calfTarget) */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.genderModal}
        title="Cinsiyet Seç"
        items={GENDERS}
        onClose={() => f.setGenderModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("gender", it.name);
          f.setGenderModal(false);
        }}
      />

      {/* ✅ Birth Type modal (target: calfTarget) */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.birthTypeModal}
        title="Doğum Türü"
        items={BIRTH_TYPES}
        onClose={() => f.setBirthTypeModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("birthType", it.name);
          f.setBirthTypeModal(false);
        }}
      />

      {/* Formation */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.formationModal}
        title="Oluşma Şekli"
        items={FORMATION_TYPES}
        onClose={() => f.setFormationModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("formation", it.name);
          f.setFormationModal(false);
        }}
      />

      {/* Color */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.colorModal}
        title="Renk"
        items={COLORS_LIST}
        onClose={() => f.setColorModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("color", it.name);
          f.setColorModal(false);
        }}
      />

      {/* Barn */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.barnModal}
        title="Ahır Seçiniz"
        items={BARNS}
        onClose={() => f.setBarnModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("barn", it.name);
          f.setBarnModal(false);
        }}
      />

      {/* Section */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.sectionModal}
        title="Bölme Seçiniz"
        items={SECTIONS}
        onClose={() => f.setSectionModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("section", it.name);
          f.setSectionModal(false);
        }}
      />

      {/* Group */}
      <SimpleSelectModal
        styles={styles}
        COLORS={COLORS}
        visible={f.groupModal}
        title="Grup Seç"
        items={GROUPS}
        onClose={() => f.setGroupModal(false)}
        onSelect={(it) => {
          f.updateTargetCalf("group", it.name);
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
