import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { FarmerAuthProvider } from "./src/context/FarmerAuthContext";
import { AnimalsProvider } from "./src/context/AnimalsContext";
import { ActivitiesProvider } from "./src/context/ActivitiesContext";

export default function App() {
  return (
    <FarmerAuthProvider>
      <ActivitiesProvider>
        <AnimalsProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AnimalsProvider>
      </ActivitiesProvider>
    </FarmerAuthProvider>
  );
}
