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
import ChatRoomScreen from "../screens/ChatRoom/ChatRoomScreen";
import AnimalsScreen from "../screens/Animals/AnimalsScreen";
import VaccinesScreen from "../screens/Vaccines/VaccinesScreen";
import AnimalDetailScreen from "../screens/Animals/AnimalDetailScreen";

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
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="AnimalsScreen" component={AnimalsScreen} />
      <Stack.Screen name="VaccinesScreen" component={VaccinesScreen} />
      <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} />

      {/* Calendar */}
      <Stack.Screen name="CreateAppointment" component={CreateAppointmentScreen} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
    </Stack.Navigator>
  );
}
