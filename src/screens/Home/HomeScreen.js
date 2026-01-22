import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "./constants/colors";
import { CHIP_ICONS } from "./constants/chipIcons";
import { styles } from "./styles/home.styles";

import HerdChip from "./components/HerdChip";
import QuickCard from "./components/QuickCard";
import DonutChart from "./components/DonutChart";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tagQuery, setTagQuery] = useState("");

  const herdChips = useMemo(
    () => [
      {
        key: "sick",
        label: "Hasta",
        value: 2,
        img: CHIP_ICONS.sick,
        tone: "danger",
        onPress: () => navigation?.navigate?.("Animals", { filter: "sick" }),
      },
      {
        key: "pregnant",
        label: "Gebe",
        value: 5,
        img: CHIP_ICONS.pregnant,
        tone: "warn",
        onPress: () =>
          navigation?.navigate?.("Animals", { filter: "pregnant" }),
      },
      {
        key: "lactating",
        label: "Sağımda",
        value: 12,
        img: CHIP_ICONS.lactating,
        tone: "default",
        onPress: () =>
          navigation?.navigate?.("Animals", { filter: "lactating" }),
      },
      {
        key: "dry",
        label: "Kuru",
        value: 3,
        img: CHIP_ICONS.dry,
        tone: "default",
        onPress: () => navigation?.navigate?.("Animals", { filter: "dry" }),
      },
      {
        key: "vaccine",
        label: "Aşı Yakın",
        value: 4,
        img: CHIP_ICONS.vaccine,
        tone: "warn",
        onPress: () =>
          navigation?.navigate?.("Vaccines", { filter: "upcoming" }),
      },
      {
        key: "total",
        label: "Toplam",
        value: 28,
        img: CHIP_ICONS.total,
        tone: "accent",
        onPress: () => navigation?.navigate?.("Animals"),
      },
    ],
    [navigation]
  );

  const healthDistribution = useMemo(
    () => [
      { label: "Sağlıklı", value: 21, color: COLORS.success, percentage: 75 },
      { label: "Gebe", value: 5, color: COLORS.warm, percentage: 17.9 },
      { label: "Hasta", value: 2, color: COLORS.danger, percentage: 7.1 },
    ],
    []
  );

  const activities = useMemo(
    () => [
      {
        id: "a1",
        icon: "chatbubble-ellipses-outline",
        title: "Chatbot Sorgusu",
        meta: "Çıban belirtileri • 1 saat önce",
        color: COLORS.accent,
      },
      {
        id: "a2",
        icon: "calendar-outline",
        title: "Veteriner Randevusu",
        meta: "Dr. Mehmet Yılmaz • 25 Aralık",
        color: COLORS.warm,
      },
      {
        id: "a3",
        icon: "shield-checkmark-outline",
        title: "Aşı Hatırlatma",
        meta: "Şap Aşısı • 3 hayvan için",
        color: COLORS.success,
      },
    ],
    []
  );

  const onFindByTag = () =>
    navigation?.navigate?.("AnimalSearch", { tag: tagQuery });
  const onVetFinder = () => navigation?.navigate?.("VetFinder");
  const onCreateAppointment = () => navigation?.navigate?.("TabCalendar");
  const onMessages = () => navigation?.navigate?.("Messages");

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.bg2]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 10) + 10 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require("../../../assets/logo/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>BHSS</Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.9}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.text}
            />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>4</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={tagQuery}
            onChangeText={setTagQuery}
            placeholder="Küpe no ile ara (örn: TR-123456)"
            placeholderTextColor="rgba(234,244,255,0.35)"
            style={styles.searchInput}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={onFindByTag}
          />
          <TouchableOpacity
            style={styles.searchGo}
            onPress={onFindByTag}
            activeOpacity={0.9}
          >
            <Text style={styles.searchGoText}>Bul</Text>
          </TouchableOpacity>
        </View>

        {/* VETERİNER BUL */}
        <View style={styles.vetCard}>
          <View style={styles.vetBgWrap} pointerEvents="none">
            <Image
              source={require("../../../assets/images/vet-bg.jpeg")}
              style={styles.vetBgImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(5,9,20,0.20)", "rgba(5,9,20,0.92)"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.vetTitle}>Veteriner Bul</Text>
            <Text style={styles.vetDesc}>
              Yakındaki veterinerleri gör, iletişime geç veya randevu oluştur.
            </Text>

            <View style={styles.vetActions}>
              <TouchableOpacity
                style={styles.vetPrimary}
                onPress={onVetFinder}
                activeOpacity={0.9}
              >
                <Ionicons name="location-outline" size={18} color="#0B1220" />
                <Text style={styles.vetPrimaryText}>
                  Yakındaki Veterinerler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.vetSecondary}
                onPress={onCreateAppointment}
                activeOpacity={0.9}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.text} />
                <Text style={styles.vetSecondaryText}>Takvim</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.vetIconWrap}
            activeOpacity={0.9}
            onPress={onVetFinder}
          >
            <Ionicons name="add" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* SÜRÜ DURUMU */}
        <View style={styles.rowHeader}>
          <Text style={styles.sectionTitle}>Sürü Durumu</Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate?.("Animals")}
            activeOpacity={0.9}
          >
            <Text style={styles.link}>Detay</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={herdChips}
          horizontal
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsList}
          renderItem={({ item }) => (
            <HerdChip
              img={item.img}
              label={item.label}
              value={item.value}
              tone={item.tone}
              onPress={item.onPress}
            />
          )}
        />

        {/* HIZLI İŞLEMLER */}
        <Text style={[styles.sectionTitle, { marginTop: 2 }]}>
          Hızlı İşlemler
        </Text>

        <View style={styles.grid}>
          <QuickCard
            icon="chatbubble-ellipses-outline"
            title="Mesaj"
            subtitle="Veterinerle mesajlaşma"
            gradient={["rgba(123,190,255,0.15)", "rgba(123,190,255,0.05)"]}
            iconBg="rgba(123,190,255,0.20)"
            iconBorder="rgba(123,190,255,0.30)"
            onPress={onMessages}
          />

          <QuickCard
            icon="calendar-outline"
            title="Takvim"
            subtitle="Randevu & hatırlatma"
            gradient={["rgba(255,170,90,0.15)", "rgba(255,170,90,0.05)"]}
            iconBg="rgba(255,170,90,0.20)"
            iconBorder="rgba(255,170,90,0.30)"
            onPress={onCreateAppointment}
          />
          <QuickCard
            icon="barcode-outline"
            title="Hayvanlar"
            subtitle="Kayıt & filtreleme"
            gradient={["rgba(183,148,246,0.15)", "rgba(183,148,246,0.05)"]}
            iconBg="rgba(183,148,246,0.20)"
            iconBorder="rgba(183,148,246,0.30)"
            onPress={() => navigation?.navigate?.("AnimalsScreen")}
          />
          <QuickCard
            icon="shield-checkmark-outline"
            title="Aşılar"
            subtitle="Takvim & geçmiş"
            gradient={["rgba(78,205,196,0.15)", "rgba(78,205,196,0.05)"]}
            iconBg="rgba(78,205,196,0.20)"
            iconBorder="rgba(78,205,196,0.30)"
            onPress={() => navigation?.navigate?.("VaccinesScreen")}
          />
        </View>

        {/* HAYVAN SAĞLIK DURUMU */}
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View>
              <Text style={styles.healthTitle}>Hayvan Sağlık Durumu</Text>
              <Text style={styles.healthSubtitle}>
                Toplam {herdChips.find((c) => c.key === "total")?.value} hayvan
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation?.navigate?.("Animals")}
            >
              <Text style={styles.link}>Detay</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.donutContainer}>
            <DonutChart data={healthDistribution} />

            <View style={styles.donutLegend}>
              {healthDistribution.map((item, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <View style={styles.legendInfo}>
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <View style={styles.legendValueRow}>
                      <Text style={styles.legendValue}>{item.value}</Text>
                      <Text style={styles.legendPercentage}>
                        ({item.percentage}%)
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SON AKTİVİTELER */}
        <View style={styles.activitiesCard}>
          <View style={styles.activitiesHeader}>
            <Text style={styles.activitiesTitle}>Son Aktiviteler</Text>
          </View>

          {activities.map((a) => (
            <View key={a.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: a.color }]}>
                <Ionicons name={a.icon} size={18} color="#FFF" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{a.title}</Text>
                <Text style={styles.activityMeta}>{a.meta}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </View>
          ))}

          <TouchableOpacity
            style={styles.moreBtn}
            activeOpacity={0.9}
            onPress={() => navigation?.navigate?.("Activity")}
          >
            <Text style={styles.moreBtnText}>Tüm Aktiviteleri Gör</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Platform.OS === "ios" ? 36 : 22 }} />
      </ScrollView>
    </LinearGradient>
  );
}
