import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VetHomeScreen from "../screens/Home/VetHomeScreen";
import VetCalendarScreen from "../screens/Calendar/VetCalendarScreen";
import VetMessagesScreen from "../screens/Messages/VetMessagesScreen";
import VetProfileScreen from "../screens/Profile/VetProfileScreen";

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: "#070B12",
  tabBar: "rgba(7,11,18,0.98)",
  border: "rgba(255,255,255,0.08)",
  inactive: "rgba(234,244,255,0.55)",
  active: "#FFAA5A",
};

function TabBg() {
  return <View style={styles.tabBg} />;
}

function TabIcon({ focused, color, size, activeName, inactiveName }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons
        name={focused ? activeName : inactiveName}
        size={size ?? 22}
        color={color}
      />
    </View>
  );
}

export default function VetTabs() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";

  const tabBarHeight = isIOS ? 78 + insets.bottom : 72;

  return (
    <Tab.Navigator
      initialRouteName="VetHome"
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: COLORS.bg },

        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,

        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarHideOnKeyboard: true,

        tabBarBackground: () => <TabBg />,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 10,
          paddingBottom: isIOS ? insets.bottom + 8 : 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: "transparent",
          elevation: 0,
          position: "absolute",
        },
      }}
    >
      <Tab.Screen
        name="VetHome"
        component={VetHomeScreen}
        options={{
          tabBarLabel: "Anasayfa",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              activeName="grid"
              inactiveName="grid-outline"
            />
          ),
        }}
      />

      <Tab.Screen
        name="VetCalendar"
        component={VetCalendarScreen}
        options={{
          tabBarLabel: "Takvim",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              activeName="calendar"
              inactiveName="calendar-outline"
            />
          ),
        }}
      />

      <Tab.Screen
        name="VetMessages"
        component={VetMessagesScreen}
        options={{
          tabBarLabel: "Mesajlar",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              activeName="chatbubble"
              inactiveName="chatbubble-outline"
            />
          ),
        }}
      />

      <Tab.Screen
        name="VetProfile"
        component={VetProfileScreen}
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              activeName="person"
              inactiveName="person-outline"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBg: {
    flex: 1,
    backgroundColor: COLORS.tabBar,
  },

  item: {
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: -1,
  },

  iconWrap: {
    minWidth: 42,
    minHeight: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapFocused: {
    backgroundColor: "rgba(255,170,90,0.12)",
  },
});
