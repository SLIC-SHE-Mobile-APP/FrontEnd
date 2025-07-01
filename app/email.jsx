import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function EmailVerificationContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = new Animated.Value(0);
  const insets = useSafeAreaInsets();
  const [nicNumber, setNicNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsed = JSON.parse(userData);
          console.log("Loaded user data from AsyncStorage:", parsed);

          if (parsed.nicNumber) setNicNumber(parsed.nicNumber);
          if (parsed.mobileNumber) setMobileNumber(parsed.mobileNumber);
        } else {
          console.warn("User data not found in AsyncStorage");
          Alert.alert("Error", "User data not found. Please log in again.");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -100, // Slide up by 100 pixels
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        Animated.timing(slideAnim, {
          toValue: 0, // Slide back to original position
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const makePhoneCall = () => {
    Linking.openURL("tel:0112252596").catch((err) => {
      console.error("Phone call error:", err);
    });
  };

  // Validate email format
  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async () => {
    // Validate email first
    if (!email) {
      Alert.alert("", "Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("", "Please enter a valid email address");
      return;
    }

    if (!nicNumber || !mobileNumber) {
      Alert.alert(
        "Error",
        "Missing NIC or Mobile Number. Please log in again."
      );
      return;
    }

    setLoading(true);

    try {
      console.log("Calling Submit API with:", {
        nic: nicNumber,
        mobileNumber,
        email,
      });

      const response = await fetch(
        "http://203.115.11.229:1002/api/LoginPageEmail/Submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nic: nicNumber,
            mobileNumber: mobileNumber,
            email: email,
          }),
        }
      );

      const result = await response.json();
      console.log("Submit API response:", result);

      if (result.message === "User inserted successfully") {
        await AsyncStorage.removeItem("userData");
        router.push("/home");
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to send verification email."
        );
      }
    } catch (error) {
      console.error("Submit API error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!nicNumber || !mobileNumber) {
      Alert.alert(
        "Error",
        "Missing NIC or Mobile Number. Please log in again."
      );
      return;
    }

    setLoading(true);

    try {
      console.log("Calling skip API with:", { nic: nicNumber, mobileNumber });

      const response = await fetch(
        "http://203.115.11.229:1002/api/LoginPageEmail/Skip",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nic: nicNumber,
            mobileNumber: mobileNumber,
          }),
        }
      );

      const result = await response.json();
      console.log("Skip API response:", result);

      if (result.message === "User inserted successfully") {
        await AsyncStorage.removeItem("userData");
        router.push("/home");
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to skip email verification."
        );
      }
    } catch (error) {
      console.error("Skip API error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Section with Gradient and City Skyline */}
      <LinearGradient
        colors={["#CDEAED", "#6DD3D3", "#6DD3D3"]}
        style={[
          styles.topSection,
          isKeyboardVisible && styles.topSectionKeyboard,
        ]}
      >
        {/* Header with SLIC Logo */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.skylineContainer}>
          <Image
            source={require("../assets/images/cover.png")}
            style={styles.cover}
          />
        </View>
      </LinearGradient>

      {/* Bottom Section with Form */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            transform: [{ translateY: slideAnim }],
            marginBottom: isKeyboardVisible ? keyboardHeight - 100 : 0,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Welcome To</Text>
            <View style={styles.sheDigitalBadge}>
              <Text style={styles.sheDigitalText}>SHE Digital</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.instructionText}>
              Enter your email address to verify your registration
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("../assets/images/emailicon.png")}
                    style={styles.inputIcon}
                  />
                </View>
                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={[styles.skipButton, loading && styles.buttonDisabled]}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.troubleText}>Having Trouble ?</Text>
              <TouchableOpacity onPress={makePhoneCall}>
                <Text style={styles.contactText}>Contact Us 011 - 2252596</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export default function EmailVerification() {
  return (
    <SafeAreaProvider>
      <EmailVerificationContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topSection: {
    flex: 0.6,
    paddingTop: 50,
  },
  topSectionKeyboard: {
    flex: 0.3, // Reduce top section when keyboard is visible
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 10,
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skylineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -120,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeCard: {
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 25,
    color: "#13646D",
    marginBottom: 10,
    fontWeight: "500",
  },
  sheDigitalBadge: {
    width: 192,
    height: 44,
    backgroundColor: "#FF4757",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  sheDigitalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  formSection: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    color: "#13646D",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 15,
    height: 50,
  },
  iconContainer: {
    marginRight: 10,
  },
  inputIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  linkContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  alreadyRegisteredText: {
    fontSize: 14,
    color: "#666",
  },
  loginLinkText: {
    color: "#4ECDC4",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginVertical: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  skipButton: {
    backgroundColor: "rgba(78, 205, 196, 0.8)",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    // marginBottom: 5,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  troubleText: {
    fontSize: 14,
    color: "#666",
  },
  contactText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
});
