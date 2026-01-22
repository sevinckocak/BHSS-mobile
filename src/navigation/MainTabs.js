import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import HomeScreen from "../screens/Home/HomeScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import CalendarScreen from "../screens/Calendar/CalendarScreen";
import ChatbotScreen from "../screens/Chatbot/ChatbotScreen";

import CenterPlusButton from "../components/Animals/CenterPlusButton";
import FabMenuModal from "../components/Animals/FabMenuModal";

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: "#070B12",
  tabBar: "rgba(7,11,18,0.98)",
  border: "rgba(255,255,255,0.08)",
  inactive: "rgba(234,244,255,0.55)",
  active: "#FFAA5A",
};

function DummyScreen() {
  return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [fabOpen, setFabOpen] = useState(false);

  const ios = Platform.OS === "ios";
  const tabBarHeight = 70 + (ios ? insets.bottom : 0);

  const onPick = (routeName) => {
    setFabOpen(false);
    navigation.navigate(routeName);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: { backgroundColor: COLORS.bg },
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginTop: -2 },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: COLORS.tabBar }} />
          ),
          tabBarStyle: {
            height: tabBarHeight,
            paddingBottom: 10 + (ios ? insets.bottom : 0),
            paddingTop: 10,
            backgroundColor: COLORS.tabBar,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          },
        }}
      >
        <Tab.Screen
          name="TabHome"
          component={HomeScreen}
          options={{
            tabBarLabel: "Anasayfa",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="TabCalendar"
          component={CalendarScreen}
          options={{
            tabBarLabel: "Takvim",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="TabFab"
          component={DummyScreen}
          options={{
            tabBarButton: () => (
              <CenterPlusButton onPress={() => setFabOpen(true)} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setFabOpen(true);
            },
          }}
        />

        <Tab.Screen
          name="TabChatbot"
          component={ChatbotScreen}
          options={{
            tabBarLabel: "Asistan",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="TabProfile"
          component={ProfileScreen}
          options={{
            tabBarLabel: "Profil",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>

      <FabMenuModal
        visible={fabOpen}
        onClose={() => setFabOpen(false)}
        onPick={onPick}
      />
    </>
  );
}

const styles = StyleSheet.create({});
