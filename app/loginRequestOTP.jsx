import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  Modal,
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
import { API_BASE_URL } from "../constants/index.js";

const { width } = Dimensions.get('window');

// Custom Popup Component with Blur Background
const CustomPopup = ({
  visible,
  title,
  message,
  type = "info",
  onClose,
  onConfirm,
  showConfirmButton = false,
}) => {
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

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "✓", color: "#4CAF50", bgColor: "#E8F5E8" };
      case "error":
        return { icon: "✕", color: "#F44336", bgColor: "#FFEBEE" };
      case "warning":
        return { icon: "⚠", color: "#FF9800", bgColor: "#FFF3E0" };
      default:
        return { icon: "ℹ", color: "#2196F3", bgColor: "#E3F2FD" };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent={true}>
      <Animated.View
        style={[
          styles.popupOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          // onPress={onClose}
        />
        <Animated.View
          style={[
            styles.popupContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[styles.popupIconContainer, { backgroundColor: bgColor }]}
          >
            <Text style={[styles.popupIcon, { color }]}>{icon}</Text>
          </View>

          {title && <Text style={styles.popupTitle}>{title}</Text>}
          <Text style={styles.popupMessage}>{message}</Text>

          <View style={styles.popupButtonContainer}>
            {showConfirmButton && (
              <TouchableOpacity
                style={[styles.popupButton, styles.popupConfirmButton]}
                onPress={onConfirm}
              >
                <Text style={styles.popupConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.popupButton,
                showConfirmButton
                  ? styles.popupCancelButton
                  : styles.popupOkButton,
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  showConfirmButton
                    ? styles.popupCancelButtonText
                    : styles.popupOkButtonText,
                ]}
              >
                {showConfirmButton ? "Cancel" : "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

function LoginRequestOTPContent() {
  const [nic, setNIC] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    showConfirmButton: false,
    onConfirm: null,
  });

  const slideAnim = new Animated.Value(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -100,
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

  // Show popup function
  const showPopup = (
    title,
    message,
    type = "info",
    showConfirmButton = false,
    onConfirm = null
  ) => {
    setPopup({
      visible: true,
      title,
      message,
      type,
      showConfirmButton,
      onConfirm,
    });
  };

  // Hide popup function
  const hidePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  // Store user data in SecureStore
  const storeUserData = async (mobileNumber, nicNumber) => {
    try {
      const userData = {
        mobileNumber,
        nicNumber,
        timestamp: new Date().toISOString(),
      };

      // Store each piece of data separately for better security
      await SecureStore.setItemAsync("user_mobile", mobileNumber);
      await SecureStore.setItemAsync("user_nic", nicNumber);
      await SecureStore.setItemAsync(
        "user_timestamp",
        new Date().toISOString()
      );

      // Also store as combined JSON if needed elsewhere
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));

      console.log("User data stored securely");
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  const makePhoneCall = () => {
    Linking.openURL("tel:0112357357").catch((err) => {
      console.error("Phone call error:", err);
    });
  };

  const handlePress = () => {
    router.push("/login");
  };

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/\D/g, "");

    // Only allow numbers that start with 7
    if (cleaned.length > 0 && !cleaned.startsWith("7")) {
      return;
    }

    if (cleaned.length <= 9) {
      setMobile(cleaned);
    }
  };

  const handleNICChange = (text) => {
    const cleaned = text.replace(/\s/g, "");
    const validChars = cleaned.replace(/[^0-9vVxX]/g, "");
    if (validChars.length <= 12) {
      setNIC(validChars);
    }
  };

  const validateNIC = (nicValue) => {
    if (!nicValue) {
      return false;
    }
    if (/^\d{12}$/.test(nicValue)) {
      return true;
    }
    if (/^\d{9}[vVxX]$/.test(nicValue)) {
      return true;
    }
    return false;
  };

  const maskPhoneNumber = (number) => {
    if (!number || number.length < 9) return number;
    const firstPart = number.substring(0, 2);
    const lastPart = number.substring(number.length - 3);
    return `${firstPart}****${lastPart}`;
  };

  const checkAvailability = async (nicNumber, mobileNumber) => {
    try {
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

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
  };

  const handleRequestOTP = async () => {
    if (!validateNIC(nic)) {
      showPopup(
        "Invalid NIC Number",
        "Please enter a valid NIC number\n\nValid formats:\n• 12 digits (e.g., 200XXXXXXX42)\n• 9 digits + V (e.g., 60XXXXXX3V)\n• 9 digits + v (e.g., 60XXXXXX3v)\n• 9 digits + X (e.g., 60XXXXXX3X)\n• 9 digits + x (e.g., 60XXXXXX3x)",
        "warning"
      );
      return;
    }

    if (!mobile || mobile.length < 9) {
      showPopup(
        "Invalid Mobile Number",
        "Please enter a valid 9-digit mobile number",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      const result = await checkAvailability(nic, mobile);

      if (result.success && result.isValid && result.otpSent) {
        // Store the mobile number and NIC number from API response securely
        await storeUserData(result.mobileNumber, result.nicNumber);

        const maskedNumber = maskPhoneNumber(mobile);

        showPopup(
          "OTP Sent Successfully",
          `OTP has been sent to +94 ${maskedNumber}`,
          "success",
          false,
          () => {
            hidePopup();
            router.push({
              pathname: "/OTPVerification",
              params: {
                contactInfo: `+94${maskedNumber}`,
                contactType: "phone",
                nicNumber: result.nicNumber,
                mobileNumber: result.mobileNumber,
              },
            });
          }
        );
      } else {
        let errorMessage =
          result.message || "An error occurred. Please try again.";
        let errorTitle = "Validation Error";

        switch (result.errorType) {
          case "NIC_NOT_FOUND":
            errorTitle = "NIC Not Found";
            errorMessage =
              "NIC number is not registered in our system. Please contact your company HR.";
            break;
          case "MOBILE_NUMBER_MISMATCH":
            errorTitle = "Mobile Number Mismatch";
            errorMessage =
              "The mobile number is mismatch with this NIC. Please verify your mobile number.";
            break;
          default:
            errorMessage =
              result.message ||
              "Validation failed. Please check your details and try again.";
        }

        showPopup(errorTitle, errorMessage, "error");
      }
    } catch (error) {
      showPopup(
        "Connection Error",
        error.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#CDEAED", "#6DD3D3", "#6DD3D3"]}
        style={[
          styles.topSection,
          isKeyboardVisible && styles.topSectionKeyboard,
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.skylineContainer}>
          <Image
            source={require("@/assets/images/cover.png")}
            style={styles.cover}
          />
        </View>
      </LinearGradient>

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
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Welcome To</Text>
            <View style={styles.sheDigitalBadge}>
              <Text style={styles.sheDigitalText}>SHE Digital</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("@/assets/images/Idicon.png")}
                    style={styles.inputIcon}
                  />
                </View>
                <TextInput
                  placeholder="Registered NIC"
                  style={styles.input}
                  value={nic}
                  onChangeText={handleNICChange}
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("@/assets/images/phoneicon.png")}
                    style={styles.inputIcon}
                  />
                </View>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+94</Text>
                </View>
                <TextInput
                  placeholder="Registered Phone Number"
                  keyboardType="numeric"
                  style={styles.phoneInput}
                  value={mobile}
                  onChangeText={handleMobileChange}
                  placeholderTextColor="#999"
                  maxLength={9}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.alreadyRegisteredText}>
                Already registered with our customer portal?
              </Text>
              <TouchableOpacity
                onPress={handlePress}
                disabled={loading}
              >
                <Text style={styles.loginLinkText}> Login</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.requestButton, loading && styles.buttonDisabled]}
              onPress={handleRequestOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.requestButtonText}>Request an OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.troubleText}>Having Trouble?</Text>
              <TouchableOpacity onPress={makePhoneCall}>
                <Text style={styles.contactText}>Contact Us 0112 - 357357</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Custom Popup with Blur Background */}
      <CustomPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        showConfirmButton={popup.showConfirmButton}
        onClose={popup.onConfirm || hidePopup}
        onConfirm={popup.onConfirm}
      />
    </View>
  );
}

export default function LoginRequestOTP() {
  return (
    <SafeAreaProvider>
      <LoginRequestOTPContent />
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
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  slicText: {
    color: "#4ECDC4",
    fontSize: 16,
    fontWeight: "bold",
  },
  generalBadge: {
    backgroundColor: "#FF4757",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  generalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  skylineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  skylineText: {
    fontSize: 40,
    opacity: 0.3,
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
    backgroundColor: "transparent", 
    borderWidth: 2, 
    borderColor: "#FF4757", 
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  sheDigitalText: {
    color: "#FF4757", 
  fontSize: 18,
  fontWeight: "500", 
  textAlign: "center",
  },
  logInText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
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
  countryCodeContainer: {
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
  },
  countryCodeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  linkContainer: {
    alignItems: "center",
    marginVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  alreadyRegisteredText: {
    fontSize: 14,
    color: "#666",
  },
  loginLinkText: {
    color: "#4ECDC4",
    fontWeight: "500",
  },
  requestButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  requestButtonText: {
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
    marginTop: 45,
  },
  contactText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  // Popup Styles with Blur Background
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
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    maxWidth: width * 0.85,
    minWidth: width * 0.7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
  },
  popupIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  popupIcon: {
    fontSize: 28,
    fontWeight: "bold",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  popupMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  popupButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  popupButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  popupOkButton: {
    backgroundColor: "#4ECDC4",
  },
  popupOkButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  popupConfirmButton: {
    backgroundColor: "#4ECDC4",
  },
  popupConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  popupCancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  popupCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});