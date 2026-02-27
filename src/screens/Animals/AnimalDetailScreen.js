import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  TextInput,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { useAnimals } from "../../context/AnimalsContext";

const BG = require("../../../assets/images/animals-info.jpeg");

const COLORS = {
  bg1: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.62)",
  border: "rgba(255,255,255,0.14)",
  glass: "rgba(255,255,255,0.06)",
  glass2: "rgba(255,255,255,0.08)",
  warm: "#FFAA5A",
  danger: "#FF6B6B",
  success: "#4ECDC4",
};

export default function AnimalDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { animals, updateAnimal, deleteAnimal } = useAnimals();

  const animalId = route?.params?.animalId;
  const passedAnimal = route?.params?.animal;

  const animal = useMemo(() => {
    if (passedAnimal) return passedAnimal;
    return (animals || []).find((a) => a.id === animalId) || null;
  }, [animals, animalId, passedAnimal]);

  const [busy, setBusy] = useState(false);

  // ✅ Inline edit state
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    tagNo: "",
    name: "",
    breed: "",
    ageMonths: "",
  });

  useEffect(() => {
    if (!animal) return;
    if (editing) return;

    setDraft({
      tagNo: animal.tagNo ?? "",
      name: animal.name ?? "",
      breed: animal.breed ?? "",
      ageMonths:
        animal.ageMonths === null || animal.ageMonths === undefined
          ? ""
          : String(animal.ageMonths),
    });
  }, [animal, editing]);

  if (!animal) {
    return (
      <LinearGradient colors={[COLORS.bg1, COLORS.bg2]} style={{ flex: 1 }}>
        <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 16 }}>
          <Text style={{ color: COLORS.text, fontWeight: "900", fontSize: 16 }}>
            Hayvan bulunamadı
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 8 }}>
            animalId route paramını kontrol et.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // Dinamik alanlar
  const tagNo = animal.tagNo || "—";
  const name = animal.name || "İsimsiz";
  const breed = animal.breed || "—";
  const ageLabel =
    animal.ageMonths != null ? `${animal.ageMonths} ay` : animal.age || "—";

  const isSick = animal.healthStatus === "sick" || animal.status === "Hasta";
  const isPregnant = animal.isPregnant === true || animal.status === "Gebe";

  // ✅ Sağım/Kuru durumları
  const isDry =
    animal.lactationStatus === "dry" ||
    animal.status === "Kuruda" ||
    animal.milkStatus === "Kuruda";

  const isLactating =
    animal.lactationStatus === "lactating" ||
    animal.status === "Sağımda" ||
    animal.milkStatus === "Sağımda";

  // ✅ DAMLA ANİMASYONU
  const dropY = useRef(new Animated.Value(0)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLactating || editing) {
      dropY.stopAnimation();
      dropOpacity.stopAnimation();
      dropY.setValue(0);
      dropOpacity.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dropOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(dropY, {
            toValue: 10,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dropOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(dropY, {
            toValue: 0,
            duration: 10,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(220),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [isLactating, editing, dropY, dropOpacity]);

  const setLactation = async (isDryValue) => {
    try {
      setBusy(true);
      await updateAnimal(animal.id, {
        lactationStatus: isDryValue ? "dry" : "lactating",
      });
    } catch (e) {
      Alert.alert("Hata", e?.message || "Güncellenemedi");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Set mantığı
  const setHealth = async (isHealthy) => {
    try {
      setBusy(true);
      await updateAnimal(animal.id, {
        healthStatus: isHealthy ? "healthy" : "sick",
      });
    } catch (e) {
      Alert.alert("Hata", e?.message || "Güncellenemedi");
    } finally {
      setBusy(false);
    }
  };

  const setPregnant = async (preg) => {
    try {
      setBusy(true);
      await updateAnimal(animal.id, { isPregnant: preg });
    } catch (e) {
      Alert.alert("Hata", e?.message || "Güncellenemedi");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Hayvanı sil?",
      "Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await deleteAnimal(animal.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Hata", e?.message || "Silinemedi");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft({
      tagNo: animal.tagNo ?? "",
      name: animal.name ?? "",
      breed: animal.breed ?? "",
      ageMonths:
        animal.ageMonths === null || animal.ageMonths === undefined
          ? ""
          : String(animal.ageMonths),
    });
  };

  const saveEdit = async () => {
    const t = (draft.tagNo || "").trim();
    if (!t) return Alert.alert("Eksik bilgi", "Küpe no boş olamaz.");

    try {
      setBusy(true);
      await updateAnimal(animal.id, {
        tagNo: t,
        name: (draft.name || "").trim(),
        breed: (draft.breed || "").trim(),
        ageMonths: (draft.ageMonths || "").trim()
          ? Number((draft.ageMonths || "").trim())
          : null,
      });
      setEditing(false);
    } catch (e) {
      Alert.alert("Hata", e?.message || "Güncellenemedi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={["rgba(255,170,90,0.16)", "rgba(5,9,20,0.92)", COLORS.bg2]}
      locations={[0, 0.28, 1]}
      style={styles.container}
    >
      <View style={[styles.safe, { paddingTop: insets.top + 10 }]}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
            disabled={busy}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.topTitle} numberOfLines={1}>
            {editing ? "Düzenle" : tagNo}
          </Text>

          {editing ? (
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.9}
              onPress={cancelEdit}
              disabled={busy}
            >
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.9}
            disabled={busy}
            onPress={() => {
              if (!editing) return setEditing(true);
              return saveEdit();
            }}
          >
            <Ionicons
              name={editing ? "checkmark" : "create-outline"}
              size={editing ? 20 : 18}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          {/* HERO */}
          <View style={styles.heroShell}>
            <ImageBackground
              source={BG}
              style={styles.heroBg}
              imageStyle={styles.heroBgImg}
            >
              <LinearGradient
                colors={[
                  "rgba(255,170,90,0.34)",
                  "rgba(255,170,90,0.14)",
                  "rgba(5,9,20,0.62)",
                  "rgba(5,9,20,0.90)",
                ]}
                locations={[0, 0.24, 0.62, 1]}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.35)"]}
                locations={[0, 1]}
                style={StyleSheet.absoluteFill}
              />

              <BlurView intensity={30} tint="dark" style={styles.glassPanel}>
                <View style={styles.heroHeader}>
                  <View style={{ flex: 1 }}>
                    {editing ? (
                      <View style={{ gap: 10 }}>
                        <InlineInput
                          value={draft.tagNo}
                          onChangeText={(t) =>
                            setDraft((p) => ({ ...p, tagNo: t }))
                          }
                          placeholder="Küpe No (Tag No)"
                        />

                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <InlineInput
                              value={draft.name}
                              onChangeText={(t) =>
                                setDraft((p) => ({ ...p, name: t }))
                              }
                              placeholder="İsim"
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <InlineInput
                              value={draft.breed}
                              onChangeText={(t) =>
                                setDraft((p) => ({ ...p, breed: t }))
                              }
                              placeholder="Irk"
                            />
                          </View>
                        </View>

                        <InlineInput
                          value={draft.ageMonths}
                          onChangeText={(t) =>
                            setDraft((p) => ({
                              ...p,
                              ageMonths: t.replace(/[^0-9]/g, ""),
                            }))
                          }
                          placeholder="Yaş (Ay)"
                          keyboardType={
                            Platform.OS === "ios" ? "number-pad" : "numeric"
                          }
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.heroTag} numberOfLines={1}>
                          {tagNo}
                        </Text>
                        <Text style={styles.heroSub} numberOfLines={1}>
                          {name} • {breed}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* ✅ PREMIUM CHIPS */}
                  <View style={styles.chipRow}>
                    <StatusChip
                      label={isSick ? "Hasta" : "Sağlıklı"}
                      tone={isSick ? "danger" : "success"}
                      icon={
                        isSick
                          ? "alert-circle-outline"
                          : "checkmark-circle-outline"
                      }
                    />

                    <StatusChip
                      label={isPregnant ? "Gebe" : "Gebe Değil"}
                      tone={isPregnant ? "warm" : "default"}
                      icon={
                        isPregnant
                          ? "shield-checkmark-outline"
                          : "remove-circle-outline"
                      }
                    />

                    {/* ✅ Sağım / Kuruda chip + damla animasyonu */}
                    <StatusChip
                      label={isDry ? "Kuruda" : "Sağımda"}
                      tone={isDry ? "warm" : "success"}
                      icon={isDry ? "moon-outline" : "water-outline"}
                      rightAccessory={
                        !isDry && !editing ? (
                          <Animated.View
                            style={{
                              transform: [{ translateY: dropY }],
                              opacity: dropOpacity,
                            }}
                          >
                            <Ionicons
                              name="water"
                              size={14}
                              color={COLORS.success}
                            />
                          </Animated.View>
                        ) : null
                      }
                    />
                  </View>
                </View>

                <View style={styles.grid}>
                  <InfoCell
                    icon="pricetag-outline"
                    label="Tag No"
                    value={tagNo}
                  />
                  <InfoCell icon="person-outline" label="Ad" value={name} />
                  <InfoCell icon="leaf-outline" label="Irk" value={breed} />
                  <InfoCell
                    icon="hourglass-outline"
                    label="Yaş"
                    value={ageLabel}
                  />
                </View>

                {editing && (
                  <Text style={styles.editHint}>
                    ✔ Kaydet ile güncelle • ✖ İptal ile geri al
                  </Text>
                )}
              </BlurView>
            </ImageBackground>
          </View>

          {/* ACTIONS */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>İşlemler</Text>
            <Text style={styles.sectionSub}>
              Hayvanla ilgili hızlı aksiyonlar
            </Text>
          </View>

          <View style={styles.actionsWrap}>
            <ActionTile
              icon="sparkles-outline"
              label="Doğum Ekle"
              tone="warm"
              onPress={() =>
                navigation.navigate("AddBirth", { motherAnimalId: animal.id })
              }
            />
            <ActionTile
              icon="medkit-outline"
              label="Muayene"
              onPress={() =>
                navigation.navigate("Examination", { animalId: animal.id })
              }
            />
            <ActionTile
              icon="bandage-outline"
              label="Aşılama"
              onPress={() =>
                navigation.navigate("Vaccines", { animalId: animal.id })
              }
            />
            <ActionTile
              icon="barbell-outline"
              label="Kilo Güncelle"
              tone="warm"
              onPress={() =>
                navigation.navigate("WeightUpdate", { animalId: animal.id })
              }
            />
            <ActionTile
              icon="pulse-outline"
              label="Kızgınlık Tespiti"
              tone="warm"
              onPress={() =>
                navigation.navigate("HeatDetection", { animalId: animal.id })
              }
            />
            <ActionTile
              icon="shield-checkmark-outline"
              label="Gebelik Kontrolü"
              onPress={() =>
                navigation.navigate("PregnancyCheck", { animalId: animal.id })
              }
            />
          </View>

          {/* DURUM */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Durum</Text>
            <Text style={styles.sectionSub}>Tek dokunuşla güncelle</Text>
          </View>

          {/* Sağlık */}
          <View style={styles.toggleRow}>
            <TogglePill
              title="Hayvan Sağlık Durumu"
              leftLabel="Hasta"
              rightLabel="Sağlıklı"
              value={!isSick}
              onChange={(v) => setHealth(v)}
              disabled={busy}
              leftIcon="medkit-outline"
              rightIcon="cow"
              leftTone="danger"
              rightTone="success"
            />
          </View>

          {/* Gebelik */}
          <View style={styles.toggleRow}>
            <TogglePill
              title="Gebelik Durumu"
              leftLabel="Gebe Değil"
              rightLabel="Gebe"
              value={isPregnant}
              onChange={(v) => setPregnant(v)}
              disabled={busy}
              leftIcon="remove-circle-outline"
              rightIcon="flower-outline"
              leftTone="default"
              rightTone="warm"
            />
          </View>

          {/* Sağım / Kuru */}
          <View style={styles.toggleRow}>
            <TogglePill
              title="Sağım Durumu"
              leftLabel="Sağımda"
              rightLabel="Kuruda"
              value={isDry} // true => sağ (Kuruda)
              onChange={(v) => setLactation(v)}
              disabled={busy}
              leftIcon="water-outline"
              rightIcon="moon-outline"
              leftTone="success"
              rightTone="warm"
            />
          </View>

          {/* DELETE */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={confirmDelete}
            style={styles.deleteBtn}
            disabled={busy}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteText}>Hayvanı Sil / Sürüden Çıkar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

/* -------------------- INLINE INPUT -------------------- */

function InlineInput({ value, onChangeText, placeholder, keyboardType }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(234,244,255,0.35)"
      keyboardType={keyboardType}
      style={{
        height: 44,
        borderRadius: 14,
        paddingHorizontal: 12,
        color: COLORS.text,
        fontWeight: "900",
        fontSize: 14,
        backgroundColor: "rgba(0,0,0,0.22)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
      }}
    />
  );
}

/* -------------------- ICON (COW) -------------------- */

function CowIcon({ size = 16, color = "#FFAA5A" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9C4 7 6 6 8 6H16C18 6 20 7 20 9V14C20 16 18 17 16 17H8C6 17 4 16 4 14V9Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6L6 4M16 6L18 4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <Path
        d="M9 12H9.01M15 12H15.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* -------------------- COMPONENTS -------------------- */

function InfoCell({ icon, label, value }) {
  return (
    <View style={styles.cell}>
      <View style={styles.cellHead}>
        <View style={styles.iconChip}>
          <Ionicons name={icon} size={14} color={COLORS.muted} />
        </View>
        {!!label && <Text style={styles.cellLabel}>{label}</Text>}
      </View>

      <Text style={styles.cellValue} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  );
}

/* ✅ Premium Chip (glow + rightAccessory) */
function StatusChip({ label, tone = "default", icon, rightAccessory }) {
  const bg =
    tone === "warm"
      ? "rgba(255,170,90,0.16)"
      : tone === "success"
        ? "rgba(78,205,196,0.14)"
        : tone === "danger"
          ? "rgba(255,107,107,0.14)"
          : "rgba(255,255,255,0.08)";

  const bd =
    tone === "warm"
      ? "rgba(255,170,90,0.30)"
      : tone === "success"
        ? "rgba(78,205,196,0.28)"
        : tone === "danger"
          ? "rgba(255,107,107,0.28)"
          : "rgba(255,255,255,0.14)";

  const color =
    tone === "warm"
      ? COLORS.warm
      : tone === "success"
        ? COLORS.success
        : tone === "danger"
          ? COLORS.danger
          : COLORS.text;

  const glow =
    tone === "warm"
      ? "rgba(255,170,90,0.28)"
      : tone === "success"
        ? "rgba(78,205,196,0.22)"
        : tone === "danger"
          ? "rgba(255,107,107,0.22)"
          : "rgba(255,255,255,0.12)";

  return (
    <View style={styles.chipWrap}>
      <View style={[styles.chipGlow, { backgroundColor: glow }]} />
      <View style={[styles.chip, { backgroundColor: bg, borderColor: bd }]}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.chipText} numberOfLines={1}>
          {label}
        </Text>
        {!!rightAccessory && (
          <View style={{ marginLeft: 4 }}>{rightAccessory}</View>
        )}
      </View>
    </View>
  );
}

function ActionTile({ icon, label, onPress, tone = "default" }) {
  const iconColor = tone === "warm" ? COLORS.warm : COLORS.text;

  const glowColors =
    tone === "warm"
      ? [
          "rgba(255,170,90,0.20)",
          "rgba(255,170,90,0.08)",
          "rgba(255,170,90,0.00)",
        ]
      : [
          "rgba(123,190,255,0.10)",
          "rgba(123,190,255,0.04)",
          "rgba(123,190,255,0.00)",
        ];

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.tile}>
      <LinearGradient
        colors={glowColors}
        locations={[0, 0.5, 1]}
        style={styles.tileGlow}
      />
      <View style={styles.tileInner}>
        <View style={styles.tileIconWrap}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.tileText} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
      </View>
    </TouchableOpacity>
  );
}

function TogglePill({
  title,
  leftLabel,
  rightLabel,
  value,
  onChange,
  disabled,
  leftIcon,
  rightIcon,
  leftTone = "default",
  rightTone = "default",
}) {
  const leftActive = !value;
  const rightActive = value;

  const getToneGradient = (tone) => {
    if (tone === "danger")
      return ["rgba(255,107,107,0.92)", "rgba(255,170,90,0.55)"];
    if (tone === "success")
      return ["rgba(78,205,196,0.92)", "rgba(123,190,255,0.40)"];
    if (tone === "warm")
      return ["rgba(255,170,90,0.92)", "rgba(255,170,90,0.45)"];
    return ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.06)"];
  };

  const leftGrad = getToneGradient(leftTone);
  const rightGrad = getToneGradient(rightTone);

  const iconColorLeft = leftActive ? COLORS.warm : "rgba(234,244,255,0.65)";
  const iconColorRight = rightActive ? COLORS.warm : "rgba(234,244,255,0.65)";

  const renderIcon = (iconName, color) => {
    if (!iconName) return null;
    if (iconName === "cow") return <CowIcon size={16} color={color} />;
    return <Ionicons name={iconName} size={16} color={color} />;
  };

  return (
    <View style={styles.pillCard}>
      {!!title && <Text style={styles.pillTitle}>{title}</Text>}

      <View style={[styles.pillShell, disabled && { opacity: 0.72 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={disabled}
          onPress={() => onChange(false)}
          style={styles.pillSide}
        >
          <View style={[styles.pillIcon, leftActive && styles.pillIconActive]}>
            {renderIcon(leftIcon, iconColorLeft)}
          </View>

          <Text
            style={[styles.pillLabel, leftActive && styles.pillLabelActive]}
          >
            {leftLabel}
          </Text>
        </TouchableOpacity>

        <View
          pointerEvents="none"
          style={[
            styles.pillSelectedWrap,
            value ? { left: "50%" } : { left: 0 },
          ]}
        >
          <LinearGradient
            colors={value ? rightGrad : leftGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pillSelected}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={disabled}
          onPress={() => onChange(true)}
          style={styles.pillSide}
        >
          <Text
            style={[styles.pillLabel, rightActive && styles.pillLabelActive]}
          >
            {rightLabel}
          </Text>

          <View style={[styles.pillIcon, rightActive && styles.pillIconActive]}>
            {renderIcon(rightIcon, iconColorRight)}
          </View>
        </TouchableOpacity>

        <View style={styles.pillChevron}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </View>
      </View>
    </View>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  topTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroShell: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroBg: { width: "100%", padding: 16 },
  heroBgImg: { borderRadius: 22, transform: [{ scale: 1.03 }] },

  glassPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.glass,
    padding: 14,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  heroTag: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  heroSub: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },

  editHint: {
    marginTop: 10,
    color: "rgba(234,244,255,0.55)",
    fontWeight: "800",
    fontSize: 12,
  },

  chipRow: { gap: 8, alignItems: "flex-end" },

  // ✅ glow wrapper
  chipWrap: { position: "relative", alignSelf: "flex-end" },
  chipGlow: {
    position: "absolute",
    left: -10,
    right: -10,
    top: -8,
    bottom: -8,
    borderRadius: 999,
    opacity: 0.55,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cell: {
    width: "50%",
    padding: 12,
    borderColor: "rgba(255,255,255,0.10)",
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  cellHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  iconChip: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cellLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  cellValue: { color: COLORS.text, fontSize: 15, fontWeight: "900" },

  sectionHead: { marginTop: 14, marginBottom: 8 },
  sectionTitle: { color: COLORS.text, fontWeight: "950", fontSize: 14 },
  sectionSub: {
    color: COLORS.muted,
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
  },

  actionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    width: "48.2%",
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  tileGlow: {
    position: "absolute",
    left: -40,
    top: -45,
    width: 170,
    height: 140,
    borderRadius: 60,
    opacity: 0.65,
    transform: [{ rotate: "12deg" }],
  },
  tileInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  tileText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },

  toggleRow: { marginTop: 12 },

  pillCard: { marginTop: 4 },
  pillTitle: {
    color: COLORS.text,
    fontWeight: "950",
    fontSize: 13,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  pillShell: {
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  pillSide: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 2,
  },
  pillLabel: {
    color: "rgba(234,244,255,0.78)",
    fontWeight: "900",
    fontSize: 13,
  },
  pillLabelActive: { color: COLORS.text },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillIconActive: {
    borderColor: "rgba(255,170,90,0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  pillSelectedWrap: {
    position: "absolute",
    top: 10,
    bottom: 10,
    width: "50%",
    paddingHorizontal: 6,
    zIndex: 1,
  },
  pillSelected: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    opacity: 0.95,
  },
  pillChevron: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 3,
  },

  deleteBtn: {
    marginTop: 16,
    height: 58,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,107,107,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.22)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  deleteText: { color: COLORS.text, fontWeight: "900" },
});
