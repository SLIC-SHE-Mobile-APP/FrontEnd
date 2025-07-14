import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

function OTPVerificationContent() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Get contact info from navigation params (primary method)
  const [contactInfo, setContactInfo] = useState(params.contactInfo);
  const [contactType, setContactType] = useState(params.contactType || "phone");
  const [nicNumber, setNicNumber] = useState(params.nicNumber || "");
  const [mobileNumber, setMobileNumber] = useState(params.mobileNumber || "");
  const [fromBankDetails, setFromBankDetails] = useState(
    params.fromBankDetails === "true"
  );

  // References for OTP input fields
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // State management
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = new Animated.Value(0);

  // Function to mask contact information
  const maskContactInfo = (contact, type) => {
    if (!contact) return "";

    if (type === "phone") {
      // For phone numbers: format as +94XX******XXX
      if (contact.length >= 9) {
        // Remove any existing country code or leading zeros
        let cleanNumber = contact.replace(/^\+94|^0/, "");

        // Take first 2 digits and last 3 digits
        const start = cleanNumber.substring(0, 2);
        const end = cleanNumber.substring(cleanNumber.length - 3);
        const middle = "*".repeat(6); // Always 6 asterisks

        return `+94${start}${middle}${end}`;
      }
      return contact;
    } else if (type === "email") {
      // For email: show first 2 characters and domain
      // Example: john@example.com becomes jo***@example.com
      const atIndex = contact.indexOf("@");
      if (atIndex > 2) {
        const start = contact.substring(0, 2);
        const domain = contact.substring(atIndex);
        const middle = "*".repeat(atIndex - 2);
        return `${start}${middle}${domain}`;
      }
      return contact;
    }

    return contact;
  };

  // Load user data from SecureStore as backup
  const loadUserData = async () => {
    try {
      // Try to get individual values first (more secure approach)
      const storedMobile = await SecureStore.getItemAsync("user_mobile");
      const storedNic = await SecureStore.getItemAsync("user_nic");

      if (storedMobile && storedNic) {
        console.log("Loaded user data from SecureStore:", {
          mobileNumber: storedMobile,
          nicNumber: storedNic,
        });

        // Use SecureStore data if navigation params are empty
        if (!nicNumber && storedNic) {
          setNicNumber(storedNic);
        }
        if (!mobileNumber && storedMobile) {
          setMobileNumber(storedMobile);
        }
      } else {
        // Fallback to combined userData if individual items don't exist
        const userData = await SecureStore.getItemAsync("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          console.log(
            "Loaded combined user data from SecureStore:",
            parsedData
          );

          // Use SecureStore data if navigation params are empty
          if (!nicNumber && parsedData.nicNumber) {
            setNicNumber(parsedData.nicNumber);
          }
          if (!mobileNumber && parsedData.mobileNumber) {
            setMobileNumber(parsedData.mobileNumber);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data from SecureStore:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Debug: Log the data being used
  useEffect(() => {
    console.log("OTP Verification Data:");
    console.log("Contact Info:", contactInfo);
    console.log("Contact Type:", contactType);
    console.log("NIC Number:", nicNumber);
    console.log("Mobile Number:", mobileNumber);
    console.log("From Bank Details:", fromBankDetails);
  }, [contactInfo, contactType, nicNumber, mobileNumber, fromBankDetails]);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -80,
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
          toValue: 0,
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

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle OTP input change
  const handleOtpChange = (text, index) => {
    if (text.length > 1) {
      text = text.charAt(0);
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs[index - 1].current.focus();
    }
  };

  // Handle back button
  const handleBack = () => {
    if (fromBankDetails) {
      router.back();
    } else {
      router.back();
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      Alert.alert("", "Please enter a valid 4-digit OTP");
      return;
    }

    if (!mobileNumber) {
      Alert.alert(
        "Error",
        "Missing mobile number. Please go back and try again."
      );
      return;
    }

    setLoading(true);

    try {
      console.log("Validating OTP with:", {
        mobileNumber,
        otp: otpCode,
      });

      const response = await fetch(
        "http://203.115.11.229:1002/api/LoginNicMnumber/ValidateOtp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobileNumber: mobileNumber,
            otp: otpCode,
          }),
        }
      );

      const result = await response.json();
      console.log("ValidateOtp response:", result);

      if (result.success) {
        if (fromBankDetails) {
          // Set a flag to indicate OTP was verified successfully for bank details
          await SecureStore.setItemAsync("otp_verified_bank", "true");

          // Show success message
          Alert.alert("Success", "OTP verified successfully!", [
            {
              text: "OK",
              onPress: () => {
                router.back(); // Navigate back to bank details
              },
            },
          ]);
        } else {
          // Original flow for login
          if (result.nicAvailaWeb === false) {
            router.push("/email");
          } else if (result.nicAvailaWeb === true) {
            router.push("/home");
          } else {
            Alert.alert("Error", "Unexpected response. Please try again.");
          }
        }
      } else {
        if (result.errorType === "INVALID_OTP") {
          Alert.alert("", "Invalid OTP. Please check and try again.");
        } else if (result.errorType === "OTP_EXPIRED") {
          Alert.alert("", "OTP has expired. Please request a new one.");
        } else {
          Alert.alert("Error", result.message || "OTP verification failed.");
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;

    // Check if we have required data
    if (!nicNumber || !mobileNumber) {
      Alert.alert("Error", "Missing user data. Please go back and try again.");
      return;
    }

    setResendLoading(true);

    try {
      console.log("Resending OTP via CheckAvailability with:", {
        nicNumber,
        mobileNumber,
      });

      const response = await fetch(
        "http://203.115.11.229:1002/api/LoginNicMnumber/CheckAvailability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nicNumber: nicNumber,
            mobileNumber: mobileNumber,
          }),
        }
      );

      const result = await response.json();
      console.log("CheckAvailability response:", result);

      if (result.success) {
        // Reset OTP fields
        setOtp(["", "", "", ""]);
        inputRefs[0].current.focus();

        // Reset timer
        setTimer(90);
        setCanResend(false);

        Alert.alert(
          "Success",
          `OTP resent to ${maskContactInfo(contactInfo, contactType)}`
        );
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to resend OTP. Please try again."
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Phone call function
  const makePhoneCall = () => {
    Linking.openURL("tel:0112252596").catch((err) => {
      console.error("Phone call error:", err);
    });
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
        {/* Header with Logo and Back Button */}
        <View style={styles.header}>
          {fromBankDetails && (
            <TouchableOpacity style={styles.backButton}>
            </TouchableOpacity>
          )}
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
          />
          <View style={styles.placeholder} />
        </View>

        <View style={styles.skylineContainer}>
          <Image
            source={require("../assets/images/cover.png")}
            style={styles.cover}
          />
        </View>
      </LinearGradient>

      {/* Bottom Section with OTP Form */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            transform: [{ translateY: slideAnim }],
            marginBottom: isKeyboardVisible ? keyboardHeight - 80 : 0,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* OTP Verification Card */}
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>
              {fromBankDetails ? "Verify to View Details" : "OTP Verification"}
            </Text>

            <Text style={styles.instructions}>
              Enter the verification code we just sent to your{" "}
              {contactType === "phone" ? "registered number" : "email"}:
            </Text>

            <Text style={styles.contactInfo}>
              {maskContactInfo(contactInfo, contactType)}
            </Text>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.otpInput,
                    digit !== "" && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {canResend
                  ? "You can now resend OTP"
                  : `Resend OTP in ${formatTime(timer)}`}
              </Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={verifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>
                  {fromBankDetails ? "Verify" : "Verify OTP"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Button */}
            <TouchableOpacity
              style={[
                styles.resendButton,
                (!canResend || resendLoading) && styles.resendButtonDisabled,
              ]}
              onPress={resendOTP}
              disabled={!canResend || resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator color="#4ECDC4" size="small" />
              ) : (
                <Text
                  style={[
                    styles.resendButtonText,
                    !canResend && styles.resendButtonTextDisabled,
                  ]}
                >
                  Resend OTP
                </Text>
              )}
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

export default function OTPVerificationBank() {
  return (
    <SafeAreaProvider>
      <OTPVerificationContent />
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
    flex: 0.3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  backButtonText: {
    fontSize: 28,
    color: "#13646D",
    fontWeight: "500",
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: "contain",
  },
  placeholder: {
    width: 40,
  },
  cover: {
    width: "100%",
    height: "100%",
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
  otpCard: {
    padding: 20,
    alignItems: "center",
  },
  otpTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#13646D",
    marginBottom: 20,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
  },
  contactInfo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#13646D",
    marginBottom: 30,
  },
  debugContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: "100%",
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
    fontSize: 24,
    textAlign: "center",
    color: "#333",
  },
  otpInputFilled: {
    borderColor: "#4ECDC4",
    backgroundColor: "#fff",
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendButton: {
    paddingVertical: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: "#4ECDC4",
    fontSize: 16,
    fontWeight: "500",
  },
  resendButtonTextDisabled: {
    color: "#999",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  troubleText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
});