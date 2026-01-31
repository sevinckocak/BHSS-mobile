import React from "react";
import { View, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function AnimalPhotoPicker({
  styles,
  COLORS,
  photoUri,
  setPhotoUri,
}) {
  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("İzin Gerekli", "Galeri izni vermen lazım.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) setPhotoUri(res.assets?.[0]?.uri ?? null);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("İzin Gerekli", "Kamera izni vermen lazım.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) setPhotoUri(res.assets?.[0]?.uri ?? null);
  };

  const onPressPhoto = () => {
    Alert.alert("Görsel Ekle", "Nasıl eklemek istersin?", [
      { text: "İptal", style: "cancel" },
      { text: "Kamera", onPress: takePhoto },
      { text: "Galeri", onPress: pickFromGallery },
    ]);
  };

  return (
    <View style={styles.photoWrap}>
      <Pressable onPress={onPressPhoto} style={styles.photoBtn}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoImg} />
        ) : (
          <View style={styles.photoInner}>
            <Ionicons name="paw-outline" size={28} color={COLORS.gold} />
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={16} color={COLORS.gold} />
        </View>
      </Pressable>
    </View>
  );
}
