import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const RootLayout = () => {
  return (
    <>
    <StatusBar 
            style="light" 
            backgroundColor=" white" 
            translucent={false}
          />
      {/* tabs stack */}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}  />
        <Stack.Screen name="(screens)" options={{ headerShown: false }} />
        <Stack.Screen name="(teachertabs)" options={{ headerShown: false }}  />
      </Stack>
    </>
  );
};

export default RootLayout;
