import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";

const { width, height } = Dimensions.get("window");

// Custom Popup Component
const CustomPopup = ({ visible, title, message, onConfirm, type = "info" }) => {
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
      case "success":
        return "#4CAF50";
      case "error":
        return "#F44336";
      case "warning":
        return "#FF9800";
      default:
        return "#4ECDC4";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
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
      <Animated.View style={[styles.popupOverlay, { opacity: fadeAnim }]}>
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
          <View
            style={[styles.iconContainer, { backgroundColor: getIconColor() }]}
          >
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

const BankDetailsSum = ({ onClose }) => {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFoundError, setNotFoundError] = useState(false);
  const [showMasked, setShowMasked] = useState(true);
  const [policyNo, setPolicyNo] = useState(null);
  const [memberNo, setMemberNo] = useState(null);
  const [nicNumber, setNicNumber] = useState(null);
  const [mobileNumber, setMobileNumber] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const slideAnim = new Animated.Value(0);

  // Popup state
  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  // References for OTP input fields
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Function to show popup
  const showPopup = (message, type = "info", title = "") => {
    setPopup({
      visible: true,
      title,
      message,
      type,
    });
  };

  // Function to hide popup
  const hidePopup = () => {
    setPopup({
      visible: false,
      title: "",
      message: "",
      type: "info",
    });
  };

  // Custom Loading Animation Component
  const LoadingIcon = () => {
    const [rotateAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(1));

    useEffect(() => {
      const createRotateAnimation = () => {
        return Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        );
      };

      const createPulseAnimation = () => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const rotateAnimation = createRotateAnimation();
      const pulseAnimation = createPulseAnimation();

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    }, []);

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <Animated.View
        style={[
          styles.customLoadingIcon,
          {
            transform: [{ rotate: spin }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.loadingIconOuter}>
          <View style={styles.loadingIconInner}>
            <Icon name="heartbeat" size={20} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>
    );
  };

  // Loading Screen Component with Custom Icon
  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>Loading Bank Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Utility to mask string with only first 2 and last 2 characters visible
  const maskValue = (value) => {
    if (!value || value.length <= 4) return value;
    const first = value.slice(0, 2);
    const last = value.slice(-2);
    return `${first}${"*".repeat(value.length - 4)}${last}`;
  };

  // Function to mask contact information
  const maskContactInfo = (contact) => {
    if (!contact) return "";
    if (contact.length >= 9) {
      let cleanNumber = contact.replace(/^\+94|^0/, "");
      const start = cleanNumber.substring(0, 2);
      const end = cleanNumber.substring(cleanNumber.length - 3);
      const middle = "*".repeat(6);
      return `+94${start}${middle}${end}`;
    }
    return contact;
  };

  // Get policy, member, NIC and mobile numbers from SecureStore with fallbacks
  const getStoredData = async () => {
    try {
      const storedPolicyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const storedMemberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );
      const storedNicNumber = await SecureStore.getItemAsync("user_nic");
      const storedMobileNumber = await SecureStore.getItemAsync("user_mobile");

      console.log("Retrieved from SecureStore:", {
        policyNumber: storedPolicyNumber,
        memberNumber: storedMemberNumber,
        nicNumber: storedNicNumber,
        mobileNumber: storedMobileNumber,
      });

      // Set data with fallbacks
      setPolicyNo(storedPolicyNumber || "Not Available");
      setNicNumber(storedNicNumber || "Not Available");
      setMobileNumber(storedMobileNumber || "Not Available");

      if (storedPolicyNumber && storedMemberNumber) {
        const paddedMemberNumber = storedMemberNumber.padStart(9, "0");

        console.log("Padded member number:", {
          original: storedMemberNumber,
          padded: paddedMemberNumber,
        });

        setMemberNo(paddedMemberNumber);

        return {
          policyNo: storedPolicyNumber,
          memberNo: paddedMemberNumber,
          nicNumber: storedNicNumber,
          mobileNumber: storedMobileNumber,
        };
      } else {
        console.warn("Policy number or member number not found in SecureStore");
        setMemberNo("Not Available");
        return null;
      }
    } catch (error) {
      console.error("Error retrieving stored data:", error);
      setPolicyNo("Not Available");
      setMemberNo("Not Available");
      setNicNumber("Not Available");
      setMobileNumber("Not Available");
      return null;
    }
  };

  // Enhanced fetch bank details with 404 handling
  const fetchBankDetails = async (policyNumber, memberNumber) => {
    try {
      setLoading(true);
      setError(null);
      setNotFoundError(false);

      console.log("Fetching bank details for:", {
        policyNumber,
        memberNumber,
      });

      const response = await fetch(
        `${API_BASE_URL}/BankDetails?policyNo=${policyNumber}&memberNo=${memberNumber}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Bank details not found (404), using default values");
          setNotFoundError(true);
          setBankDetails({
            bankName: "Bank Information Not Available",
            branchName: "Branch Information Not Available",
            accountNumber: "Account Number Not Available",
            mobileNumber: "Mobile Number Not Available",
            bankCode: "Not Available",
            branchCode: "Not Available",
          });
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from bank details server");
        setNotFoundError(true);
        setBankDetails({
          bankName: "Bank Information Not Available",
          branchName: "Branch Information Not Available",
          accountNumber: "Account Number Not Available",
          mobileNumber: "Mobile Number Not Available",
          bankCode: "Not Available",
          branchCode: "Not Available",
        });
        setLoading(false);
        return;
      }

      const data = JSON.parse(responseText);

      if (data && data.length > 0) {
        const bankInfo = data[0];
        setBankDetails({
          bankName: bankInfo.bankname || "Bank Name Not Available",
          branchName: bankInfo.bankbranch || "Branch Name Not Available",
          accountNumber: bankInfo.accountno || "Account Number Not Available",
          mobileNumber: bankInfo.mobileno || "Mobile Number Not Available",
          bankCode: bankInfo.bankcode || "Not Available",
          branchCode: bankInfo.branchcode || "Not Available",
        });
      } else {
        console.warn("No bank details found in response");
        setNotFoundError(true);
        setBankDetails({
          bankName: "Bank Information Not Available",
          branchName: "Branch Information Not Available",
          accountNumber: "Account Number Not Available",
          mobileNumber: "Mobile Number Not Available",
          bankCode: "Not Available",
          branchCode: "Not Available",
        });
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
      setError(
        "Unable to load bank details. Please check your connection and try again."
      );
      setBankDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP via CheckAvailability API
  const sendOTP = async () => {
    if (
      !nicNumber ||
      nicNumber === "Not Available" ||
      !mobileNumber ||
      mobileNumber === "Not Available"
    ) {
      showPopup(
        "User credentials are not available. Cannot verify details.",
        "error",
        "Error"
      );
      return;
    }

    setOtpLoading(true);

    try {
      console.log("Sending OTP via CheckAvailability with:", {
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
        // Show OTP modal instead of navigating
        setShowOtpModal(true);
        setTimer(90);
        setCanResend(false);
        setOtp(["", "", "", ""]);
      } else {
        showPopup(
          result.message || "Failed to send OTP. Please try again.",
          "error",
          "Error"
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      showPopup(
        error.message || "Something went wrong. Please try again.",
        "error",
        "Error"
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // Keyboard handling for OTP modal
  useEffect(() => {
    if (showOtpModal) {
      const keyboardDidShowListener = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      );

      const keyboardDidHideListener = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => {
          setKeyboardHeight(0);
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
    }
  }, [showOtpModal]);

  // Timer countdown for OTP
  useEffect(() => {
    if (showOtpModal && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, showOtpModal]);

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

  // Verify OTP
  const verifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      showPopup("Please enter a valid 4-digit OTP", "warning");
      return;
    }

    if (!mobileNumber || mobileNumber === "Not Available") {
      showPopup("Missing mobile number. Please try again.", "error", "Error");
      return;
    }

    // Add validation for NIC number as well
    if (!nicNumber || nicNumber === "Not Available") {
      showPopup("Missing NIC number. Please try again.", "error", "Error");
      return;
    }

    setOtpVerifyLoading(true);

    try {
      console.log("Validating OTP with:", {
        mobileNumber,
        nicNumber, // Make sure this is logged
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
            nicNumber: nicNumber, // ADD THIS LINE - it was missing!
          }),
        }
      );

      const result = await response.json();
      console.log("ValidateOtp response:", result);

      if (result.success) {
        // Close modal and show unmasked details
        setShowOtpModal(false);
        setShowMasked(false);
        showPopup(
          "OTP verified successfully! Bank details are now visible.",
          "success",
          "Success"
        );
      } else {
        if (result.errorType === "INVALID_OTP") {
          showPopup("Invalid OTP. Please check and try again.", "error");
        } else if (result.errorType === "OTP_EXPIRED") {
          showPopup("OTP has expired. Please request a new one.", "warning");
        } else {
          showPopup(
            result.message || "OTP verification failed.",
            "error",
            "Error"
          );
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      showPopup(
        error.message || "Something went wrong. Please try again.",
        "error",
        "Error"
      );
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;

    if (
      !nicNumber ||
      nicNumber === "Not Available" ||
      !mobileNumber ||
      mobileNumber === "Not Available"
    ) {
      showPopup("Missing user data. Please try again.", "error", "Error");
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

        showPopup(
          `OTP resent to ${maskContactInfo(mobileNumber)}`,
          "success",
          "Success"
        );
      } else {
        showPopup(
          result.message || "Failed to resend OTP. Please try again.",
          "error",
          "Error"
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      showPopup(
        error.message || "Something went wrong. Please try again.",
        "error",
        "Error"
      );
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const storedData = await getStoredData();
      if (storedData && storedData.policyNo && storedData.memberNo) {
        await fetchBankDetails(storedData.policyNo, storedData.memberNo);
      } else {
        console.warn("Missing required data for bank details fetch");
        setLoading(false);
        setNotFoundError(true);
        setBankDetails({
          bankName: "Bank Information Not Available",
          branchName: "Branch Information Not Available",
          accountNumber: "Account Number Not Available",
          mobileNumber: "Mobile Number Not Available",
          bankCode: "Not Available",
          branchCode: "Not Available",
        });
      }
    };

    initializeData();
  }, []);

  const handleViewDetails = () => {
    if (notFoundError) {
      showPopup(
        "Bank details are not available. Cannot verify.",
        "warning",
        "Information Not Available"
      );
      return;
    }

    if (showMasked) {
      // If currently showing masked data, send OTP for verification
      sendOTP();
    } else {
      // If currently showing full data, mask it again
      setShowMasked(true);
    }
  };

  const handleRetry = () => {
    if (
      policyNo &&
      policyNo !== "Not Available" &&
      memberNo &&
      memberNo !== "Not Available"
    ) {
      fetchBankDetails(policyNo, memberNo);
    } else {
      // Try to get stored data again
      const initializeData = async () => {
        const storedData = await getStoredData();
        if (storedData && storedData.policyNo && storedData.memberNo) {
          await fetchBankDetails(storedData.policyNo, storedData.memberNo);
        } else {
          showPopup(
            "Required policy information is not available.",
            "error",
            "Missing Information"
          );
        }
      };
      initializeData();
    }
  };

  // Component to render field with icon for missing/not available data
  const renderFieldValue = (value, fieldName) => {
    const isDataNotAvailable =
      !value ||
      value === "Not Available" ||
      value === "Bank Name Not Available" ||
      value === "Branch Name Not Available" ||
      value === "Account Number Not Available" ||
      value === "Mobile Number Not Available" ||
      value === "Bank Information Not Available" ||
      value === "Branch Information Not Available";

    if (isDataNotAvailable) {
      return (
        <View style={styles.missingDataContainer}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#00ADBB"
          />
          <Text style={styles.missingDataText}>Not Available</Text>
        </View>
      );
    }

    return (
      <Text style={styles.value}>{showMasked ? maskValue(value) : value}</Text>
    );
  };

  // Enhanced empty/error state component
  const EmptyStateComponent = () => (
    <View style={styles.centerContent}>
      <Ionicons name="card-outline" size={60} color="#00ADBB" />
      <Text style={styles.emptyStateMessage}>
        {notFoundError
          ? "Bank Details Not Found for this Policy."
          : "BBank Details Not Found for this Policy."}
      </Text>

      {error && !notFoundError && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons
            name="refresh-outline"
            size={16}
            color="#FFFFFF"
            style={styles.retryIcon}
          />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    if (error && !notFoundError) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="warning-outline" size={60} color="#00ADBB" />
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorDetailText}>
            Unable to load bank details. Please check your connection and try
            again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons
              name="refresh-outline"
              size={16}
              color="#FFFFFF"
              style={styles.retryIcon}
            />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!bankDetails || notFoundError) {
      return <EmptyStateComponent />;
    }

    return (
      <View style={styles.contentContainer}>
        {/* Status Banner */}
        {notFoundError && (
          <View style={styles.statusBanner}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#00ADBB"
            />
            <Text style={styles.statusBannerText}>
              Some bank information may not be available
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.leftColumn}>
            <Text style={styles.label}>Bank Name</Text>
            <Text style={styles.label}>Branch Name</Text>
            <Text style={styles.label}>Account Number</Text>
            <Text style={styles.label}>Mobile Number</Text>
          </View>
          <View style={styles.rightColumn}>
            {renderFieldValue(bankDetails.bankName, "bankName")}
            {renderFieldValue(bankDetails.branchName, "branchName")}
            {renderFieldValue(bankDetails.accountNumber, "accountNumber")}
            {renderFieldValue(bankDetails.mobileNumber, "mobileNumber")}

            <TouchableOpacity
              onPress={handleViewDetails}
              disabled={otpLoading}
              style={notFoundError ? styles.disabledButton : null}
            >
              {otpLoading ? (
                <ActivityIndicator size="small" color="#13646D" />
              ) : (
                <Text
                  style={[
                    styles.viewDetailsText,
                    notFoundError && styles.disabledText,
                  ]}
                >
                  {notFoundError
                    ? "Details Not Available"
                    : showMasked
                    ? "View Details"
                    : "Hide Details"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#6DD3D3"]}
      style={{
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: "hidden",
      }}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Bank Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons
            name="close"
            size={26}
            color="#13646D"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingScreen />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredContainer}>{renderContent()}</View>
        </ScrollView>
      )}

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <LinearGradient
              colors={["#CDEAED", "#6DD3D3"]}
              style={styles.modalGradient}
            >
              <View style={{ height: 400, maxHeight: "80%" }}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>OTP Verification</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowOtpModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#13646D" />
                  </TouchableOpacity>
                </View>

                {/* OTP Content */}
                <View style={styles.otpContent}>
                  <Text style={styles.otpSubtitle}>
                    Enter the verification code sent to
                  </Text>
                  <Text style={styles.otpContactInfo}>
                    {maskContactInfo(mobileNumber)}
                  </Text>

                  {/* OTP Input Container */}
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
                        editable={!otpVerifyLoading}
                      />
                    ))}
                  </View>

                  {/* Timer */}
                  <Text style={styles.timerText}>
                    {canResend
                      ? "You can now resend OTP"
                      : `Resend OTP in ${formatTime(timer)}`}
                  </Text>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      otpVerifyLoading && styles.buttonDisabled,
                    ]}
                    onPress={verifyOTP}
                    disabled={otpVerifyLoading}
                  >
                    {otpVerifyLoading ? (
                      <ActivityIndicator color="#6DD3D3" size="small" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend Button */}
                  <TouchableOpacity
                    style={[
                      styles.resendButton,
                      (!canResend || resendLoading) &&
                        styles.resendButtonDisabled,
                    ]}
                    onPress={resendOTP}
                    disabled={!canResend || resendLoading}
                  >
                    {resendLoading ? (
                      <ActivityIndicator color="#13646D" size="small" />
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
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Custom Popup */}
      <CustomPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onConfirm={hidePopup}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#13646D",
    textAlign: "left",
    flex: 1,
  },
  // Custom Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    minWidth: 200,
    minHeight: 150,
  },
  customLoadingIcon: {
    marginBottom: 15,
  },
  loadingIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#16858D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6DD3D3",
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#17ABB7",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  centeredContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  contentContainer: {
    width: "100%",
  },
  // Status Banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 173, 187, 0.1)",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00ADBB",
  },
  statusBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#00ADBB",
    marginLeft: 8,
    fontWeight: "500",
  },
  // Policy Info
  policyInfoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#00ADBB",
  },
  policyInfoText: {
    fontSize: 12,
    color: "#13646D",
    fontWeight: "600",
    marginBottom: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    justifyContent: "space-between",
    elevation: 5,
    width: "100%",
    marginTop: 30,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 15,
    color: "#003B4A",
  },
  value: {
    marginBottom: 15,
  },
  missingDataContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  missingDataText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 4,
  },
  viewDetailsText: {
    color: "#13646D",
    fontWeight: "bold",
    fontSize: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#999",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateTitle: {
    marginTop: 15,
    fontSize: 18,
    color: "#13646D",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyStateMessage: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorDetailText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#13646D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    maxHeight: "90%",
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#13646D",
  },
  modalCloseButton: {
    padding: 4,
  },
  otpContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  otpSubtitle: {
    fontSize: 16,
    color: "#13646D",
    textAlign: "center",
    marginTop: 65,
    marginBottom: 6,
    opacity: 0.8,
  },
  otpContactInfo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#13646D",
    textAlign: "center",
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 24,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    fontSize: 24,
    textAlign: "center",
    color: "#13646D",
    fontWeight: "bold",
  },
  otpInputFilled: {
    borderColor: "#13646D",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    fontSize: 14,
    color: "#13646D",
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
  },
  verifyButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 60,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "#13646D",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: "#13646D",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  resendButtonTextDisabled: {
    color: "rgba(19, 100, 109, 0.5)",
  },
  // Popup Styles
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  popupContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    maxWidth: width * 0.85,
    minWidth: width * 0.7,
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  popupMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default BankDetailsSum;
