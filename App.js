import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { FarmerAuthProvider } from "./src/context/FarmerAuthContext";

export default function App() {
  return (
    <FarmerAuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </FarmerAuthProvider>
  );
}
