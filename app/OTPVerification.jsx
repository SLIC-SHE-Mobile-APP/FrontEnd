import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {ActivityIndicator,Animated,Image,Keyboard,Linking,Platform,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View,Modal,Dimensions,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/index.js';

const { width, height } = Dimensions.get('window');

// Custom Popup Component
const CustomPopup = ({ visible, title, message, onConfirm, type = 'info' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#4ECDC4';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.popupOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onConfirm}
        />
        <Animated.View
          style={[
            styles.popupContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: getIconColor() }]}>
            <Text style={styles.iconText}>{getIcon()}</Text>
          </View>
          
          {title && <Text style={styles.popupTitle}>{title}</Text>}
          <Text style={styles.popupMessage}>{message}</Text>
          
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: getIconColor() }]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmButtonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

function OTPVerificationContent() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Get contact info from navigation params (primary method)
  const [contactInfo, setContactInfo] = useState(params.contactInfo);
  const [contactType, setContactType] = useState(params.contactType || "phone");
  const [nicNumber, setNicNumber] = useState(params.nicNumber || "");
  const [mobileNumber, setMobileNumber] = useState(params.mobileNumber || "");

  // Popup state
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

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

  // Function to show popup
  const showPopup = (message, type = 'info', title = '') => {
    setPopup({
      visible: true,
      title,
      message,
      type
    });
  };

  // Function to hide popup
  const hidePopup = () => {
    setPopup({
      visible: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  // Alternative function to clear only policy and member data (keeping user login data)
  const clearPolicyAndMemberData = async () => {
    try {
      console.log("Clearing policy and member data...");
      
      // Clear policy-related data
      await SecureStore.deleteItemAsync("selected_policy_number");
      await SecureStore.deleteItemAsync("selected_member_number");
      await SecureStore.deleteItemAsync("selected_policy_id");
      await SecureStore.deleteItemAsync("selected_policy_period");
      await SecureStore.deleteItemAsync("selected_policy_type");
      await SecureStore.deleteItemAsync("selected_policy_data");
      
      // Clear member-related data
      await SecureStore.deleteItemAsync("selected_member_complete");
      await SecureStore.deleteItemAsync("selected_member_name");
      
      console.log("Policy and member data cleared successfully");
    } catch (error) {
      console.error("Error clearing policy and member data:", error);
    }
  };

  // Debug: Log the data being used
  useEffect(() => {
    console.log("OTP Verification Data:");
    console.log("Contact Info:", contactInfo);
    console.log("Contact Type:", contactType);
    console.log("NIC Number:", nicNumber);
    console.log("Mobile Number:", mobileNumber);
  }, [contactInfo, contactType, nicNumber, mobileNumber]);

  // Check if OTP is complete (all 4 digits filled)
  const isOTPComplete = () => {
    return otp.every(digit => digit !== "");
  };

 

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

  // Updated verifyOTP function with popup messages
  const verifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      showPopup("Please enter a valid 4-digit OTP", 'warning');
      return;
    }

    if (!mobileNumber) {
      showPopup("Missing mobile number. Please go back and try again.", 'error', 'Error');
      return;
    }

    setLoading(true);

    try {
      console.log("Validating OTP with:", {
        mobileNumber,
        otp: otpCode,
      });

      const response = await fetch(
        `${API_BASE_URL}/LoginNicMnumber/ValidateOtp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobileNumber: mobileNumber,
            otp: otpCode,
            nicNumber: nicNumber,
          }),
        }
      );

      const result = await response.json();
      console.log("ValidateOtp response:", result);

      if (result.success) {
        // Clear all stored data before navigation
        await clearPolicyAndMemberData();
        
        if (result.nicAvailaWeb === false) {
          router.push("/email");
        } else if (result.nicAvailaWeb === true) {
          router.push("/home");
        } else {
          showPopup("Unexpected response. Please try again.", 'error', 'Error');
        }
      } else {
        if (result.errorType === "INVALID_OTP") {
          showPopup("Invalid OTP. Please check and try again.", 'error');
        } else if (result.errorType === "OTP_EXPIRED") {
          showPopup("OTP has expired. Please request a new one.", 'warning');
        } else {
          showPopup(result.message || "OTP verification failed.", 'error', 'Error');
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      showPopup(error.message || "Something went wrong. Please try again.", 'error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP with popup messages
  const resendOTP = async () => {
    if (!canResend) return;

    // Check if we have required data
    if (!nicNumber || !mobileNumber) {
      showPopup("Missing user data. Please go back and try again.", 'error', 'Error');
      return;
    }

    setResendLoading(true);

    try {
      console.log("Resending OTP via CheckAvailability with:", {
        nicNumber,
        mobileNumber,
      });

      const response = await fetch(
        `${API_BASE_URL}/LoginNicMnumber/CheckAvailability`,
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

        showPopup(`OTP resent to ${contactInfo}`, 'success', 'Success');
      } else {
        showPopup(result.message || "Failed to resend OTP. Please try again.", 'error', 'Error');
      }
    } catch (error) {
      console.error("API Error:", error);
      showPopup(error.message || "Something went wrong. Please try again.", 'error', 'Error');
    } finally {
      setResendLoading(false);
    }
  };

  // Phone call function
  const makePhoneCall = () => {
    Linking.openURL("tel:0112357357").catch((err) => {
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
        {/* Header with Logo only */}
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

      {/* Bottom Section with OTP Form */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            transform: [{ translateY: slideAnim }],
            // marginBottom: isKeyboardVisible ? keyboardHeight - 500 : 0,
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
            <Text style={styles.otpTitle}>OTP Verification</Text>

            <Text style={styles.instructions}>
              Enter the verification code we just sent to your{" "}
              {contactType === "phone" ? "registered number" : "email"}:
            </Text>

            <Text style={styles.contactInfo}>{contactInfo}</Text>

            {/* Security Warning */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningIcon}>🔒</Text>
              <Text style={styles.warningText}>
                Never share your OTP with anyone. 
              </Text>
            </View>

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

            {/* Verify Button - Disabled until OTP is complete and when canResend is true */}
            <TouchableOpacity
              style={[
                styles.verifyButton, 
                (loading || canResend || !isOTPComplete()) && styles.buttonDisabled
              ]}
              onPress={verifyOTP}
              disabled={loading || canResend || !isOTPComplete()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
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
                <Text style={styles.contactText}>Contact Us 011 - 2357357</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Custom Popup */}
      <CustomPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onConfirm={hidePopup}
      />
    </View>
  );
}

export default function OTPVerification() {
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
    // marginBottom: 10,
    lineHeight: 22,
  },
  contactInfo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#13646D",
    marginBottom: 8,
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
    marginTop: 15,
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
  // Warning styles
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
    lineHeight: 16,
  },
  // Auto-fill button styles
  autoFillButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  autoFillButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Popup Styles
  popupOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: width * 0.85,
    minWidth: width * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  confirmButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 100,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});