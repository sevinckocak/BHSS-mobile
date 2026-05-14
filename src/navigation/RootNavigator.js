import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/Onboarding/OnboardingScreen";
import LandingScreen from "../screens/Landing/LandingScreen";
import VetLoginScreen from "../screens/Landing/VetLoginScreen";
import FarmerLoginScreen from "../screens/Landing/FarmerLoginScreen";
import FarmerRegisterScreen from "../screens/Landing/FarmerRegisterScreen";
import VetRegisterScreen from "../screens/Landing/VetRegisterScreen";

import MainTabs from "./MainTabs";
import VetTabs from "./VetTabs";

import AddAnimalScreen from "../screens/Animals/AddAnimalScreen";
import CreateAppointmentScreen from "../screens/Calendar/CreateAppointmentScreen";
import CreateTaskScreen from "../screens/Calendar/CreateTaskScreen";
import AddBirthScreen from "../screens/Animals/AddBirthScreen";
import MessagesScreen from "../screens/Messages/MessagesScreen";
import NewChatScreen from "../screens/Messages/NewChatScreen";
import ChatRoomScreen from "../screens/ChatRoom/ChatRoomScreen";
import VetChatRoomScreen from "../screens/ChatRoom/VetChatRoomScreen";
import AnimalsScreen from "../screens/Animals/AnimalsScreen";
import VaccinesScreen from "../screens/Vaccines/VaccinesScreen";
import AnimalDetailScreen from "../screens/Animals/AnimalDetailScreen";
import HeatDetectionScreen from "../screens/Animals/HeatDetectionScreen";
import PregnancyCheckScreen from "../screens/Animals/PregnancyCheckScreen";
import ExaminationScreen from "../screens/Animals/ExaminationScreen";
import VetFinderScreen from "../screens/VetFinder/VetFinderScreen";
import VetDetailScreen from "../screens/VetFinder/VetDetailScreen";

// Farmer profile sub-screens
import PersonalInfoScreen    from "../screens/Profile/PersonalInfoScreen";
import BusinessSettingsScreen from "../screens/Profile/BusinessSettingsScreen";
import ActivityHistoryScreen from "../screens/Profile/ActivityHistoryScreen";
import ReportsScreen         from "../screens/Profile/ReportsScreen";
import NotificationsScreen   from "../screens/Profile/NotificationsScreen";
import SecurityScreen        from "../screens/Profile/SecurityScreen";
import SupportScreen         from "../screens/Profile/SupportScreen";

// Vet profile sub-screens
import NotificationCenterScreen from "../screens/Notifications/NotificationCenterScreen";
import VetPersonalInfoScreen from "../screens/Profile/VetPersonalInfoScreen";
import VetClinicInfoScreen   from "../screens/Profile/VetClinicInfoScreen";
import VetLicenseInfoScreen  from "../screens/Profile/VetLicenseInfoScreen";
import VetSecurityScreen     from "../screens/Profile/VetSecurityScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />

      <Stack.Screen name="VetLogin" component={VetLoginScreen} />
      <Stack.Screen name="FarmerLogin" component={FarmerLoginScreen} />

      <Stack.Screen name="FarmerRegister" component={FarmerRegisterScreen} />
      <Stack.Screen name="VetRegister" component={VetRegisterScreen} />

      {/* Farmer tarafı */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Vet tarafı */}
      <Stack.Screen name="VetTabs" component={VetTabs} />

      {/* Farmer ekranları */}
      <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
      <Stack.Screen name="AddBirth" component={AddBirthScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="NewChat" component={NewChatScreen} />
      <Stack.Screen name="ChatRoom"    component={ChatRoomScreen} />
      <Stack.Screen name="VetChatRoom" component={VetChatRoomScreen} />
      <Stack.Screen name="AnimalsScreen" component={AnimalsScreen} />
      <Stack.Screen name="VaccinesScreen" component={VaccinesScreen} />
      <Stack.Screen name="AnimalDetail"    component={AnimalDetailScreen} />
      <Stack.Screen name="HeatDetection"  component={HeatDetectionScreen} />
      <Stack.Screen name="PregnancyCheck" component={PregnancyCheckScreen} />
      <Stack.Screen name="Examination"    component={ExaminationScreen} />

      {/* Vet Finder */}
      <Stack.Screen name="VetFinder" component={VetFinderScreen} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} />

      {/* Profile sub-screens */}
      <Stack.Screen name="PersonalInfo"       component={PersonalInfoScreen} />
      <Stack.Screen name="BusinessSettings"   component={BusinessSettingsScreen} />
      <Stack.Screen name="ActivityHistory"    component={ActivityHistoryScreen} />
      <Stack.Screen name="Reports"            component={ReportsScreen} />
      <Stack.Screen name="Notifications"      component={NotificationsScreen} />
      <Stack.Screen name="Security"           component={SecurityScreen} />
      <Stack.Screen name="Support"            component={SupportScreen} />

      {/* Vet profile sub-screens */}
      <Stack.Screen name="VetPersonalInfo"  component={VetPersonalInfoScreen} />
      <Stack.Screen name="VetClinicInfo"    component={VetClinicInfoScreen} />
      <Stack.Screen name="VetLicenseInfo"   component={VetLicenseInfoScreen} />
      <Stack.Screen name="VetSecurity"      component={VetSecurityScreen} />
      <Stack.Screen name="VetNotifications" component={NotificationsScreen} />
      <Stack.Screen name="VetSupport"       component={SupportScreen} />

      {/* Notification Center */}
      <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />

      {/* Calendar */}
      <Stack.Screen name="CreateAppointment" component={CreateAppointmentScreen} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
    </Stack.Navigator>
  );
}
