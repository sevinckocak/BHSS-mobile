import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/Onboarding/OnboardingScreen";
import LandingScreen from "../screens/Landing/LandingScreen";
import VetLoginScreen from "../screens/Landing/VetLoginScreen";
import FarmerLoginScreen from "../screens/Landing/FarmerLoginScreen";
import FarmerRegisterScreen from "../screens/Landing/FarmerRegisterScreen";
import VetRegisterScreen from "../screens/Landing/VetRegisterScreen";
import MainTabs from "./MainTabs";
import AddAnimalScreen from "../screens/Animals/AddAnimalScreen";
import AddBirthScreen from "../screens/Animals/AddBirthScreen";
import MessagesScreen from "../screens/Messages/MessagesScreen";
import ChatRoomScreen from "../screens/ChatRoom/ChatRoomScreen";
import AnimalsScreen from "../screens/Animals/AnimalsScreen";
import VaccinesScreen from "../screens/Vaccines/VaccinesScreen";
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

      <Stack.Screen name="MainTabs" component={MainTabs} />

      <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
      <Stack.Screen name="AddBirth" component={AddBirthScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="AnimalsScreen" component={AnimalsScreen} />
      <Stack.Screen name="VaccinesScreen" component={VaccinesScreen} />
    </Stack.Navigator>
  );
}
