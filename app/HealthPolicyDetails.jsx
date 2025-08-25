import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

// Import your separate page components
import BankDetailsSum from "./BankDetailsSum";
import ClaimDocRequired from "./ClaimDocRequired";
import ClaimHistory from "./ClaimHistory";
import DependentDetails from "./dependentDetails";
import DownloadClaimForms from "./DownloadClaimForms";
import HealthInsuCard from "./HealthInsuCard";
import HospitalList from "./hospitalList";
import NewClaim from "./NewClaim.jsx";
import PaymentHistory from "./PaymentHistory";
import SavedClaims from "./PendingIntimations.jsx";
import PendingRequirement from "./PendingRequirement";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const HealthPolicyDetails = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState("");
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // State for dynamic data
  const [storedData, setStoredData] = useState(null);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <Text style={styles.loadingText}>Loading Policy Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Memoize available height calculation
  const availableHeight = useMemo(() => {
    return screenHeight - insets.top - insets.bottom;
  }, [screenHeight, insets.top, insets.bottom]);

  // Function to load data from SecureStore
  const loadStoredData = async () => {
    try {
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );
      const memberName = await SecureStore.getItemAsync("selected_member_name");
      const userNic = await SecureStore.getItemAsync("user_nic");
      const userMobile = await SecureStore.getItemAsync("user_mobile");

      const data = {
        policyNumber,
        memberNumber,
        memberName,
        userNic,
        userMobile,
      };

      setStoredData(data);

      // Check if required data is available
      if (!policyNumber || !memberNumber) {
        throw new Error("Required policy or member data not found in storage");
      }

      return data;
    } catch (err) {
      console.error("Error loading stored data:", err);
      setError(err.message);
      return null;
    }
  };

  // Function to fetch policy info from the API with enhanced error handling
  const fetchPolicyInfo = async (policyNumber) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/PolicyInfo/GetPolicyInfo?policyNo=${policyNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Policy info not found (404), using default values");
          return {
            name: "Policy Information Not Available",
            policyNumber: policyNumber,
            status: "Unknown",
            effectiveDate: "Not Available",
            expiryDate: "Not Available"
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from policy info server, using default values");
        return {
          name: "Policy Information Not Available",
          policyNumber: policyNumber,
          status: "Unknown"
        };
      }

      const result = JSON.parse(responseText);

      // Return the first item if it's an array, or the result if it's an object
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      } else if (result && typeof result === "object") {
        return result;
      }

      // If no valid data, return default
      return {
        name: "Policy Information Not Available",
        policyNumber: policyNumber,
        status: "Unknown"
      };
    } catch (err) {
      console.error("Error fetching policy info:", err);
      // Return default policy info instead of null
      return {
        name: "Policy Information Unavailable",
        policyNumber: policyNumber || "Unknown",
        status: "Unable to retrieve",
        error: err.message
      };
    }
  };

  // Function to fetch employee info from the API with enhanced 404 handling
  const fetchEmployeeInfo = async (policyNumber, memberNumber) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNumber}&memberNo=${memberNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Employee info not found (404), using default values");
          // Return default employee info structure instead of null
          return {
            memberName: "Member Information Not Available",
            memberNumber: memberNumber,
            employeeId: "Not Available",
            department: "Not Available",
            designation: "Not Available",
            joinDate: "Not Available",
            email: "Not Available",
            phone: "Not Available",
            address: "Not Available",
            emergencyContact: "Not Available",
            relationship: "Not Available",
            emergencyPhone: "Not Available"
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from employee info server, using default values");
        return {
          memberName: "Member Information Not Available",
          memberNumber: memberNumber,
          employeeId: "Not Available"
        };
      }

      const result = JSON.parse(responseText);

      // Ensure we have a valid result object
      if (result && typeof result === "object") {
        // Fill in missing fields with appropriate defaults
        return {
          memberName: result.memberName || "Member Name Not Available",
          memberNumber: result.memberNumber || memberNumber,
          employeeId: result.employeeId || "Not Available",
          department: result.department || "Not Available",
          designation: result.designation || "Not Available",
          joinDate: result.joinDate || "Not Available",
          email: result.email || "Not Available",
          phone: result.phone || "Not Available",
          address: result.address || "Not Available",
          emergencyContact: result.emergencyContact || "Not Available",
          relationship: result.relationship || "Not Available",
          emergencyPhone: result.emergencyPhone || "Not Available",
          ...result // Spread original result to preserve any additional fields
        };
      }

      // Fallback default
      return {
        memberName: "Member Information Not Available",
        memberNumber: memberNumber,
        employeeId: "Not Available"
      };
    } catch (err) {
      console.error("Error fetching employee info:", err);
      // Return default employee info instead of null
      return {
        memberName: "Member Information Unavailable",
        memberNumber: memberNumber || "Unknown",
        employeeId: "Unable to retrieve",
        department: "Unable to retrieve",
        designation: "Unable to retrieve",
        error: err.message
      };
    }
  };

  // Initialize data on component mount with improved error handling
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load stored data first
        const stored = await loadStoredData();
        if (!stored) {
          setError("Failed to load stored data");
          return;
        }

        // Both functions now return default objects instead of null on error
        const [policyData, employeeData] = await Promise.all([
          fetchPolicyInfo(stored.policyNumber),
          fetchEmployeeInfo(stored.policyNumber, stored.memberNumber),
        ]);

        setPolicyInfo(policyData);
        setEmployeeInfo(employeeData);

        // Only set error if both failed completely (both would have error property)
        if (policyData?.error && employeeData?.error) {
          setError("Unable to load policy and member information. Please check your connection and try again.");
        }
      } catch (err) {
        console.error("Error initializing data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Generate policy display info based on loaded data with better fallbacks
  const policyDisplayInfo = useMemo(() => {
    if (!storedData) return ["Loading policy information..."];

    const info = [];

    // Add policy number
    if (storedData.policyNumber) {
      info.push(`${storedData.policyNumber}`);
    }

    // Add member name (from employee info or stored data)
    if (employeeInfo?.memberName && employeeInfo.memberName !== "Member Information Not Available" && employeeInfo.memberName !== "Member Information Unavailable") {
      info.push(`${employeeInfo.memberName}`);
    } else if (storedData.memberName) {
      info.push(`${storedData.memberName}`);
    } else {
      info.push("Member Name is Not Available.");
    }

    // Add company name from policy info
    if (policyInfo?.name && policyInfo.name !== "Policy Information Not Available" && policyInfo.name !== "Policy Information Unavailable") {
      info.push(`${policyInfo.name}`);
    } else {
      info.push("Company Name is Not Available.");
    }

    return info.length > 0 ? info : ["Policy information not available"];
  }, [storedData, policyInfo, employeeInfo]);

  // Define heights with multiple strategies for different devices
  const getPageHeight = useCallback(
    (pageName) => {
      const pageConfigs = {
        "Dependent Details": {
          minHeight: 100,
          maxHeight: 350,
          preferredRatio: 0.5,
          contentBased: true,
        },
        "Health Insurance Card": {
          minHeight: 500,
          maxHeight: availableHeight * 0.9,
          preferredRatio: 0.85,
          contentBased: true,
        },
        "Bank Details": {
          minHeight: 300,
          maxHeight: 450,
          preferredRatio: 0.4,
          contentBased: true,
        },
        "Claim Documents Required": {
          minHeight: 450,
          maxHeight: 500,
          preferredRatio: 0.9,
          contentBased: true,
        },
        "Hospitals List": {
          minHeight: 650,
          maxHeight: 457,
          preferredRatio: 0.9,
          contentBased: true,
        },
        "Download Claim Forms": {
          minHeight: 400,
          maxHeight: 550,
          preferredRatio: 0.6,
          contentBased: true,
        },
        "New Claim": {
          minHeight: 400,
          maxHeight: 530,
          preferredRatio: 0.75,
          contentBased: true,
        },
        "Saved Claims": {
          minHeight: 650,
          maxHeight: 457,
          preferredRatio: 0.9,
          contentBased: true,
        },
        "Claim History": {
          minHeight: 600,
          maxHeight: availableHeight * 0.9,
          preferredRatio: 0.85,
          contentBased: true,
        },
        "Pending Requirements": {
          minHeight: 450,
          maxHeight: 600,
          preferredRatio: 0.7,
          contentBased: true,
        },
        "Payment History": {
          minHeight: 550,
          maxHeight: availableHeight * 0.85,
          preferredRatio: 0.8,
          contentBased: true,
        },
      };

      const config = pageConfigs[pageName] || {
        minHeight: 400,
        maxHeight: availableHeight * 0.8,
        preferredRatio: 0.8,
        contentBased: true,
      };

      // Calculate preferred height
      let calculatedHeight = availableHeight * config.preferredRatio;

      // Apply constraints
      calculatedHeight = Math.max(calculatedHeight, config.minHeight);
      calculatedHeight = Math.min(calculatedHeight, config.maxHeight);

      // Ensure it doesn't exceed 90% of available height to leave room for safe areas
      calculatedHeight = Math.min(calculatedHeight, availableHeight * 0.9);

      return calculatedHeight;
    },
    [availableHeight]
  );

  const handleButtonPress = useCallback(
    (buttonLabel) => {
      if (!buttonLabel || typeof buttonLabel !== "string") {
        console.error("Invalid button label:", buttonLabel);
        return;
      }

      setCurrentPage(buttonLabel);
      setModalVisible(true);

      // Animate slide in from bottom
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [slideAnim]
  );

  const handleCloseModal = useCallback(() => {
    // Animate slide out to bottom
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setCurrentPage("");
    });
  }, [slideAnim]);

  const renderModalContent = useCallback(() => {
    if (!currentPage) {
      return null;
    }

    const commonProps = {
      onClose: handleCloseModal,
      availableHeight: getPageHeight(currentPage) - 100,
      storedData,
      policyInfo,
      employeeInfo,
    };

    try {
      switch (currentPage) {
        case "Dependent Details":
          return <DependentDetails {...commonProps} />;
        case "Health Insurance Card":
          return <HealthInsuCard {...commonProps} />;
        case "Bank Details":
          return <BankDetailsSum {...commonProps} />;
        case "Claim Documents Required":
          return <ClaimDocRequired {...commonProps} />;
        case "Hospitals List":
          return <HospitalList {...commonProps} />;
        case "Download Claim Forms":
          return <DownloadClaimForms {...commonProps} />;
        case "New Claim":
          return <NewClaim {...commonProps} />;
          case "Saved Claims":
            return <SavedClaims {...commonProps} />;
        case "Claim History":
          return <ClaimHistory {...commonProps} />;
        case "Payment History":
          return <PaymentHistory {...commonProps} />;
        case "Pending Requirements":
          return <PendingRequirement {...commonProps} />;
        default:
          return (
            <PlaceholderPage title={currentPage} onClose={handleCloseModal} />
          );
      }
    } catch (error) {
      console.error("Error rendering modal content:", error);
      return <PlaceholderPage title={currentPage} onClose={handleCloseModal} />;
    }
  }, [
    currentPage,
    handleCloseModal,
    getPageHeight,
    storedData,
    policyInfo,
    employeeInfo,
  ]);

  // Retry function for failed API calls
  const handleRetry = useCallback(() => {
    // Re-run the initialization
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const stored = await loadStoredData();
        if (!stored) {
          setError("Failed to load stored data");
          return;
        }

        const [policyData, employeeData] = await Promise.all([
          fetchPolicyInfo(stored.policyNumber),
          fetchEmployeeInfo(stored.policyNumber, stored.memberNumber),
        ]);

        setPolicyInfo(policyData);
        setEmployeeInfo(employeeData);

        // Only set error if both failed completely
        if (policyData?.error && employeeData?.error) {
          setError("Unable to load policy and member information. Please check your connection and try again.");
        }
      } catch (err) {
        console.error("Error initializing data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Memoize buttons array
  const buttons = useMemo(
    () => [
      "Health Insurance Card",
      "Dependent Details",
      "Bank Details",
      "Claim Documents Required",
      "Hospitals List",
      "Download Claim Forms",
      "New Claim","Saved Claims",
      "Claim History",
      "Pending Requirements",
      "Payment History",
    ],
    []
  );

  // Show loading screen with custom animation
  if (loading) {
    return (
      <LinearGradient
        colors={["#FFFFFF", "#6DD3D3"]}
        style={styles.container}
      >
        <LoadingScreen />
      </LinearGradient>
    );
  }

  // Show error screen only for critical errors (not 404s which are now handled)
  if (error) {
    return (
      <LinearGradient
        colors={["#FFFFFF", "#6DD3D3"]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Error Loading Policy</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#D1D1D1", "#6DD3D3"]} style={styles.container}>
      {/* Fixed Header Section */}
      <View style={styles.headerContainer}>
        {/* Back Icon + Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backIcon}
          >
            <Ionicons name="arrow-back" size={24} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Policy Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Policy Info Card */}
        <View style={styles.policyCard}>
          {policyDisplayInfo.map((item, idx) => (
            <Text key={idx} style={styles.policyText}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      {/* Scrollable Buttons Section */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonsWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {buttons.map((label, index) => (
              <TouchableOpacity
                key={`button-${index}`}
                style={styles.button}
                onPress={() => handleButtonPress(label)}
                accessible={true}
                accessibilityLabel={label}
              >
                <Text style={styles.buttonText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Modal for displaying pages */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          <Animated.View
            style={[
              styles.animatedModal,
              {
                height: getPageHeight(currentPage),
                transform: [{ translateY: slideAnim }],
                // Add bottom padding to account for safe area
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {renderModalContent()}
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// Placeholder component for pages that aren't implemented yet
const PlaceholderPage = ({ title, onClose }) => (
  <View style={styles.modalContent}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalHeaderTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="times" size={24} color="#13646D" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.placeholderScrollContainer}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>{title} Page</Text>
          <Text style={styles.placeholderSubText}>
            This page is under development. Please check back later.
          </Text>
        </View>
      </ScrollView>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 15,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  backIcon: {
    marginRight: 1,
    marginLeft: 12,
    padding: 5
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#13646D",
    letterSpacing: 0.38,
    lineHeight: 30,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 35,
  },
  policyCard: {
    backgroundColor: "#48bfc8",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 13,
    minHeight: 110,
    justifyContent: "space-between",
  },
  policyText: {
    fontSize: 15,
    fontFamily: "Adamina",
    fontWeight: "400",
    color: "#FFFFFF",
    textAlign: "left",
    letterSpacing: 0.38,
    marginBottom: 8,
  },
  buttonsContainer: {
    flex: 1,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonsWrapper: {
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 30,
    flex: 1,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  button: {
    backgroundColor: "#17ABB7",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "AbhayaLibreMedium",
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayBackground: {
    flex: 1,
  },
  animatedModal: {
    backgroundColor: "transparent",
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    backgroundColor: "white",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#13646D",
    textAlign: "center",
    flex: 1,
  },
  modalHeaderSpacer: {
    width: 26,
  },
  placeholderScrollContainer: {
    flex: 1,
  },
  placeholderContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: "#13646D",
    textAlign: "center",
    marginBottom: 15,
  },
  placeholderSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
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
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#13646D",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#17ABB7",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#13646D",
  },
  backButtonText: {
    color: "#13646D",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HealthPolicyDetails;