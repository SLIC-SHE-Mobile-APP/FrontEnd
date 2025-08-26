import {DarkTheme,DefaultTheme,ThemeProvider,} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Dimensions, StatusBar } from "react-native";
import "react-native-reanimated";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import sessionManager from "../utils/SessionManager.jsx"; // Import the session manager

const { width, height } = Dimensions.get("window");

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // Actor: require('../assets/fonts/Actor-Regular.ttf'),  // Make sure to add the Actor font
  });

  // Initialize session management when app starts
  useEffect(() => {
    const initializeSession = async () => {
      console.log('🔐 RootLayout: Initializing session management...');
      console.log('🔐 RootLayout: Fonts loaded:', loaded);
      
      try {
        // Check if session is still valid when app starts
        const isSessionValid = await sessionManager.checkSessionOnAppStart();
        
        if (!isSessionValid) {
          console.log('🔐 RootLayout: Session invalid on app start, user will be redirected to login');
        } else {
          console.log('🔐 RootLayout: Session valid on app start');
        }
      } catch (error) {
        console.error('🔐 RootLayout: Error initializing session:', error);
      }
    };

    if (loaded) {
      initializeSession();
    }

    // Cleanup function
    return () => {
      console.log('🔐 RootLayout: Cleaning up session manager...');
      sessionManager.destroy();
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Dynamic background color based on theme
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar
          translucent
          backgroundColor='transparent'
          barStyle={colorScheme === "dark" ? 'light-content' : 'dark-content'}
        />
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="index"
            />
            <Stack.Screen
              name="login"
            />
            <Stack.Screen
              name="loginRequestOTP"
            />
            <Stack.Screen name="home" />
            <Stack.Screen
              name="AddPolicy"
            />
            <Stack.Screen name="userDetails" />
            <Stack.Screen name="PendingRequirement" />
            <Stack.Screen name="PendingRequirement1" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}