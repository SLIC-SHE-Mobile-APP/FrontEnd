import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

const BankDetailsSum = ({ onClose }) => {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // References for OTP input fields
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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
      outputRange: ['0deg', '360deg'],
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

  // Get policy, member, NIC and mobile numbers from SecureStore
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

      if (storedPolicyNumber && storedMemberNumber) {
        const paddedMemberNumber = storedMemberNumber.padStart(9, "0");

        console.log("Padded member number:", {
          original: storedMemberNumber,
          padded: paddedMemberNumber,
        });

        setPolicyNo(storedPolicyNumber);
        setMemberNo(paddedMemberNumber);
        setNicNumber(storedNicNumber);
        setMobileNumber(storedMobileNumber);
        
        return { 
          policyNo: storedPolicyNumber, 
          memberNo: paddedMemberNumber,
          nicNumber: storedNicNumber,
          mobileNumber: storedMobileNumber
        };
      } else {
        throw new Error(
          "Policy number or member number not found in SecureStore"
        );
      }
    } catch (error) {
      console.error("Error retrieving stored data:", error);
      setError("Failed to retrieve policy information");
      return null;
    }
  };

  // Fetch bank details from API
  const fetchBankDetails = async (policyNumber, memberNumber) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching bank details for:", {
        policyNumber,
        memberNumber,
      });

      const response = await fetch(
         `${API_BASE_URL}/BankDetails?policyNo=${policyNumber}&memberNo=${memberNumber}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const bankInfo = data[0];
        setBankDetails({
          bankName: bankInfo.bankname,
          branchName: bankInfo.bankbranch,
          accountNumber: bankInfo.accountno,
          mobileNumber: bankInfo.mobileno,
          bankCode: bankInfo.bankcode,
          branchCode: bankInfo.branchcode,
        });
      } else {
        setError("No bank details found");
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
      setError("Failed to load bank details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP via CheckAvailability API
  const sendOTP = async () => {
    if (!nicNumber || !mobileNumber) {
      Alert.alert("Error", "Missing user credentials. Please try again.");
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
        Alert.alert(
          "Error",
          result.message || "Failed to send OTP. Please try again."
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again."
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
      Alert.alert("", "Please enter a valid 4-digit OTP");
      return;
    }

    if (!mobileNumber) {
      Alert.alert(
        "Error",
        "Missing mobile number. Please try again."
      );
      return;
    }

    setOtpVerifyLoading(true);

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
          }),
        }
      );

      const result = await response.json();
      console.log("ValidateOtp response:", result);

      if (result.success) {
        // Close modal and show unmasked details
        setShowOtpModal(false);
        setShowMasked(false);
        Alert.alert("Success", "OTP verified successfully!");
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
      setOtpVerifyLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;

    if (!nicNumber || !mobileNumber) {
      Alert.alert("Error", "Missing user data. Please try again.");
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

        Alert.alert(
          "Success",
          `OTP resent to ${maskContactInfo(mobileNumber)}`
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

  useEffect(() => {
    const initializeData = async () => {
      const storedData = await getStoredData();
      if (storedData) {
        await fetchBankDetails(storedData.policyNo, storedData.memberNo);
      } else {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleViewDetails = () => {
    if (showMasked) {
      // If currently showing masked data, send OTP for verification
      sendOTP();
    } else {
      // If currently showing full data, mask it again
      setShowMasked(true);
    }
  };

  const handleRetry = () => {
    if (policyNo && memberNo) {
      fetchBankDetails(policyNo, memberNo);
    } else {
      // Try to get stored data again
      const initializeData = async () => {
        const storedData = await getStoredData();
        if (storedData) {
          await fetchBankDetails(storedData.policyNo, storedData.memberNo);
        }
      };
      initializeData();
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!bankDetails) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No bank details available</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.leftColumn}>
          <Text style={styles.label}>Bank Name</Text>
          <Text style={styles.label}>Branch Name</Text>
          <Text style={styles.label}>Account Number</Text>
          <Text style={styles.label}>Mobile Number</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.value}>
            {showMasked
              ? maskValue(bankDetails.bankName)
              : bankDetails.bankName}
          </Text>
          <Text style={styles.value}>
            {showMasked
              ? maskValue(bankDetails.branchName)
              : bankDetails.branchName}
          </Text>
          <Text style={styles.value}>
            {showMasked
              ? maskValue(bankDetails.accountNumber)
              : bankDetails.accountNumber}
          </Text>
          <Text style={styles.value}>
            {showMasked
              ? maskValue(bankDetails.mobileNumber)
              : bankDetails.mobileNumber}
          </Text>
          <TouchableOpacity onPress={handleViewDetails} disabled={otpLoading}>
            {otpLoading ? (
              <ActivityIndicator size="small" color="#13646D" />
            ) : (
              <Text style={styles.viewDetailsText}>
                {showMasked ? "View Details" : "Hide Details"}
              </Text>
            )}
          </TouchableOpacity>
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
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <LinearGradient
              colors={["#CDEAED", "#6DD3D3"]}
              style={styles.modalGradient}
            >
              <View style={{height: 400, maxHeight: '80%',}}>
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
                  style={[styles.verifyButton, otpVerifyLoading && styles.buttonDisabled]}
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
                    (!canResend || resendLoading) && styles.resendButtonDisabled,
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
              </View></View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#16858D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6DD3D3',
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17ABB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
  viewDetailsText: {
    color: "#13646D",
    fontWeight: "bold",
    fontSize: 18,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: "#13646D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxHeight: '90%',
    width: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#13646D',
  },
  modalCloseButton: {
    padding: 4,
  },
  otpContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpSubtitle: {
    fontSize: 16,
    color: '#13646D',
    textAlign: 'center',
    marginTop:65,
    marginBottom: 6,
    opacity: 0.8,
  },
  otpContactInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#13646D',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 24,
  },
  otpInput: {
    width: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: 24,
    textAlign: 'center',
    color: '#13646D',
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: '#13646D',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    fontSize: 14,
    color: '#13646D',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  verifyButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 60,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#13646D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#13646D',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: 'rgba(19, 100, 109, 0.5)',
  },
});

export default BankDetailsSum;