import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";

const { width: W, height: H } = Dimensions.get("window");

export default function OnboardingScreen({ navigation }) {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        key: "1",
        title: "Akıllı Hatırlatmalar & Raporlar",
        subtitle:
          "Aşı ve bakım zamanlarını otomatik hatırlat, sürü verimliliğini artır.",
        image: require("../../../assets/onboarding/1.png"),
      },
      {
        key: "2",
        title: "Veterinerle İletişim",
        subtitle: "Veterinerinle hızlı ve kolay şekilde iletişim kur.",
        image: require("../../../assets/onboarding/2.png"),
      },
      {
        key: "3",
        title: "AI ile Anında Danış",
        subtitle:
          "Veterinere bağlanmadan önce hayvan sağlığıyla ilgili sorularını yapay zekaya sor.",
        image: require("../../../assets/onboarding/3.png"),
      },
      {
        key: "4",
        title: "Sağlık Takibini Kolayca Yap",
        subtitle:
          "Aşılar, tedaviler, hastalık belirtileri ve sağlık geçmişini tek ekrandan yönet.",
        image: require("../../../assets/onboarding/4.png"),
      },
      {
        key: "5",
        title: "Hayvanlarını Kaydet",
        subtitle:
          "Büyükbaş hayvanlarını sisteme ekle, kimlik ve sağlık bilgilerini güvenle sakla.",
        image: require("../../../assets/onboarding/5.png"),
      },
    ],
    []
  );

  const isLast = index === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      navigation.replace("Landing");
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* GÖRSEL */}
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="contain"
            />

            {/* METİNLER */}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* ALT BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : styles.dotPassive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={goNext}>
          <Text style={styles.buttonText}>{isLast ? "Başla" : "İleri"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B12",
  },

  slide: {
    width: W,
    height: H,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  image: {
    width: W * 0.75,
    height: W * 0.75,
    marginBottom: 28,
  },

  title: {
    color: "#EAF4FF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    color: "rgba(234,244,255,0.75)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(7,11,18,0.7)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  dots: {
    flexDirection: "row",
  },
  dot: {
    height: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  dotPassive: {
    width: 8,
    backgroundColor: "rgba(234,244,255,0.25)",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#FFAA5A",
  },

  button: {
    backgroundColor: "#FFAA5A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buttonText: {
    color: "#06101E",
    fontWeight: "900",
    fontSize: 14,
  },
});
