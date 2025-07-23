import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Dimensions, StatusBar } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaProvider } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // Actor: require('../assets/fonts/Actor-Regular.ttf'),  // Make sure to add the Actor font
  });

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar
          translucent
          backgroundColor='transparent'
          // barStyle='light-content'
        />


          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                navigationBarHidden: true,
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                navigationBarHidden: true,
              }}
            />
            <Stack.Screen
              name="loginRequestOTP"
              options={{
                headerShown: false,
                navigationBarHidden: true,
              }}
            />
            <Stack.Screen name="home" />
            <Stack.Screen
              name="notification"
              options={{ title: "Notifications" }}
            />
            <Stack.Screen name="userDetails" />
            <Stack.Screen name="PendingRequirement" />
            <Stack.Screen name="PendingRequirement1" />
            <Stack.Screen name="+not-found" />
          </Stack>
      </ThemeProvider>
    </SafeAreaProvider >
  );
}
