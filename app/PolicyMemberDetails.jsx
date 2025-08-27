import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Animated,
  BackHandler,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";

export default function PolicyMemberDetails() {
  const router = useRouter();
  const [memberDetails, setMemberDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storedData, setStoredData] = useState(null);
  const [policyDates, setPolicyDates] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Function to mask contact number
  const maskContactNumber = (contactNo) => {
    if (!contactNo || contactNo === "N/A" || contactNo === "Not Available")
      return "Not Available";
    const contact = contactNo.toString();
    if (contact.length <= 4) return contact;
    // Show first 2 digits and last 2 digits, mask the middle
    const firstPart = contact.substring(0, 2);
    const lastPart = contact.substring(contact.length - 2);
    const maskedMiddle = "*".repeat(contact.length - 4);
    return `${firstPart}${maskedMiddle}${lastPart}`;
  };

  // Function to mask date of birth
  const maskDateOfBirth = (dateOfBirth) => {
    if (
      !dateOfBirth ||
      dateOfBirth === "N/A" ||
      dateOfBirth === "Not Available"
    )
      return "Not Available";
    // Format: DD/MM/YYYY -> DD/MM/****
    const parts = dateOfBirth.split("/");
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/****`;
    }
    return dateOfBirth;
  };

  // Function to mask policy number
  const maskPolicyNumber = (policyNumber) => {
    if (!policyNumber || policyNumber.length <= 10) return policyNumber;
    const firstTen = policyNumber.substring(0, 10);
    const maskedEnd = '*'.repeat(policyNumber.length - 10);
    return `${firstTen}${maskedEnd}`;
  };

  // Function to mask member number
  const maskMemberNumber = (memberNumber) => {
    if (!memberNumber || memberNumber === "N/A" || memberNumber === "Not Available")
      return "Not Available";
    const member = memberNumber.toString();
    if (member.length <= 4) return member;
    // Show first 2 digits and last 2 digits, mask the middle
    const firstPart = member.substring(0, 2);
    const lastPart = member.substring(member.length - 2);
    const maskedMiddle = "*".repeat(member.length - 4);
    return `${firstPart}${maskedMiddle}${lastPart}`;
  };

  // Function to mask member name
  const maskMemberName = (memberName) => {
    if (!memberName || memberName === "N/A" || memberName === "Not Available")
      return "Not Available";
    const names = memberName.trim().split(' ');
    if (names.length === 1) {
      // Single name - show first 2 and last 1 characters
      const name = names[0];
      if (name.length <= 3) return name;
      const firstPart = name.substring(0, 2);
      const lastPart = name.substring(name.length - 1);
      const maskedMiddle = "*".repeat(name.length - 3);
      return `${firstPart}${maskedMiddle}${lastPart}`;
    } else {
      // Multiple names - show first name fully, mask middle names, show last name first and last char
      const firstName = names[0];
      const lastName = names[names.length - 1];
      let maskedName = firstName;

      // Mask middle names completely if any
      if (names.length > 2) {
        for (let i = 1; i < names.length - 1; i++) {
          maskedName += " " + "*".repeat(names[i].length);
        }
      }

      // Mask last name
      if (lastName.length <= 2) {
        maskedName += " " + lastName;
      } else {
        const lastFirstChar = lastName.substring(0, 1);
        const lastLastChar = lastName.substring(lastName.length - 1);
        const lastMasked = "*".repeat(lastName.length - 2);
        maskedName += " " + lastFirstChar + lastMasked + lastLastChar;
      }

      return maskedName;
    }
  };

  // Function to create fallback member details from stored data
  const createFallbackMemberDetails = (storedData) => {
    return {
      policyNumber: maskPolicyNumber(storedData.policyNumber) || "Not Available",
      memberName: maskMemberName(storedData.memberName) || "Not Available",
      contactNo: maskContactNumber(storedData.userMobile) || "Not Available",
      company: "Not Available",
      memberNo: maskMemberNumber(storedData.memberNumber) || "Not Available",
      empCategory: "Not Available",
      dateOfBirth: "Not Available",
      effectiveDate: "Not Available",
      policyPeriod: {
        from: "Not Available",
        to: "Not Available",
      },
      opdLimits: {
        yearLimit: "0.00",
        eventLimit: "0.00",
      },
      indoorLimits: {
        yearLimit: "0.00",
        eventLimit: "0.00",
      },
      nic: storedData.userNic || "Not Available",
      address: "Not Available",
    };
  };

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

  // Function to fetch policy info from the new API
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
          console.warn("Policy info not found (404), using fallback data");
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn(
          "Empty response from policy info server, using fallback data"
        );
        return null;
      }

      const result = JSON.parse(responseText);

      // Return the first item if it's an array, or the result if it's an object
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      } else if (result && typeof result === "object") {
        return result;
      }

      return null;
    } catch (err) {
      console.error("Error fetching policy info:", err);
      return null;
    }
  };

  // Function to fetch policy dates from the policies API
  const fetchPolicyDates = async (policyNumber, userNic) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/HomePagePoliciesLoad/GetPoliciesByNic?nicNumber=${userNic}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            nicNumber: userNic,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Policy dates not found (404), using fallback data");
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from server, using fallback data");
        return null;
      }

      const result = JSON.parse(responseText);

      if (result.success && result.data) {
        // Find the matching policy
        const matchingPolicy = result.data.find(
          (policy) => policy.policyNumber === policyNumber
        );

        if (matchingPolicy) {
          return {
            policyStartDate: matchingPolicy.policyStartDate,
            policyEndDate: matchingPolicy.policyEndDate,
          };
        }
      }

      return null;
    } catch (err) {
      console.error("Error fetching policy dates:", err);
      return null;
    }
  };

  // Function to format date from API response
  const formatDate = (dateString) => {
    if (!dateString) return "Not Available";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not Available";
      return date
        .toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "/");
    } catch (err) {
      return "Not Available";
    }
  };

  // Function to format policy period from start and end dates
  const formatPolicyPeriod = (startDate, endDate) => {
    if (!startDate || !endDate)
      return { from: "Not Available", to: "Not Available" };

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { from: "Not Available", to: "Not Available" };
      }

      const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      return {
        from: formatDate(start),
        to: formatDate(end),
      };
    } catch (err) {
      return { from: "Not Available", to: "Not Available" };
    }
  };

  // Function to format currency values
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "0.00";
    try {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (err) {
      return "0.00";
    }
  };

  // Function to fetch member details from API with 404 handling
  const fetchMemberDetails = async (policyNo, memberNo) => {
    try {
      const apiUrl = `${API_BASE_URL}/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNo}&memberNo=${memberNo}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Member details not found (404), using fallback data");
          setIsOfflineMode(true);
          return null; // Return null to indicate we should use fallback data
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from server, using fallback data");
        setIsOfflineMode(true);
        return null;
      }

      const data = JSON.parse(responseText);
      return data;
    } catch (err) {
      console.error("Error fetching member details:", err);
      if (err.message.includes("404")) {
        setIsOfflineMode(true);
        return null;
      }
      throw err;
    }
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
            <Icon name="heartbeat" size={24} color="#FFFFFF" />
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
        <Text style={styles.loadingText}>Loading Member Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Initialize data function with enhanced error handling
  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOfflineMode(false);

      // Load stored data first
      const stored = await loadStoredData();
      if (!stored) {
        // Create minimal fallback even without stored data
        const fallbackData = createFallbackMemberDetails({
          policyNumber: "Not Available",
          memberNumber: "Not Available",
          memberName: "Not Available",
          userNic: "Not Available",
          userMobile: "Not Available",
        });
        setMemberDetails(fallbackData);
        setLoading(false);
        return;
      }

      let apiData = null;
      let policyInfo = null;
      let policyDatesData = null;

      // Try to fetch member details from API
      try {
        apiData = await fetchMemberDetails(
          stored.policyNumber,
          stored.memberNumber
        );
      } catch (err) {
        console.error("Failed to fetch member details, using fallback:", err);
        setIsOfflineMode(true);
      }

      // Try to fetch policy info for company name
      try {
        policyInfo = await fetchPolicyInfo(stored.policyNumber);
      } catch (err) {
        console.error("Failed to fetch policy info:", err);
      }

      // Try to fetch policy dates
      try {
        policyDatesData = await fetchPolicyDates(
          stored.policyNumber,
          stored.userNic
        );
        setPolicyDates(policyDatesData);
      } catch (err) {
        console.error("Failed to fetch policy dates:", err);
      }

      let transformedData;

      if (apiData) {
        // We have API data, use it with fallbacks for missing fields
        const policyPeriod = policyDatesData
          ? formatPolicyPeriod(
            policyDatesData.policyStartDate,
            policyDatesData.policyEndDate
          )
          : {
            from: formatDate(apiData.effectiveDate),
            to: "Not Available",
          };

        transformedData = {
          policyNumber: maskPolicyNumber(stored.policyNumber) || "Not Available",
          memberName: maskMemberName(apiData.memberName || stored.memberName) || "Not Available",
          contactNo: maskContactNumber(stored.userMobile) || "Not Available",
          company: policyInfo?.name || "Not Available",
          memberNo: maskMemberNumber(apiData.employeeNumber || stored.memberNumber) || "Not Available",
          dateOfBirth:
            maskDateOfBirth(formatDate(apiData.dateOfBirth)) || "Not Available",
          effectiveDate: formatDate(apiData.effectiveDate) || "Not Available",
          policyPeriod: policyPeriod,
          opdLimits: {
            yearLimit: formatCurrency(apiData.outdoorYearLimit) || "0.00",
            eventLimit: formatCurrency(apiData.outdoorEventLimit) || "0.00",
          },
          indoorLimits: {
            yearLimit: formatCurrency(apiData.indoorYearLimit) || "0.00",
            eventLimit: formatCurrency(apiData.indoorEventLimit) || "0.00",
          },
          nic: apiData.nic || stored.userNic || "Not Available",
          address:
            [apiData.address1, apiData.address2, apiData.address3]
              .filter((addr) => addr && addr.trim())
              .join(", ") || "Not Available",
        };
      } else {
        // No API data available, use fallback with stored data
        transformedData = createFallbackMemberDetails(stored);

        // Try to add company name if we got policy info
        if (policyInfo?.name) {
          transformedData.company = policyInfo.name;
        }

        // Try to add policy dates if we got them
        if (policyDatesData) {
          transformedData.policyPeriod = formatPolicyPeriod(
            policyDatesData.policyStartDate,
            policyDatesData.policyEndDate
          );
        }
      }

      setMemberDetails(transformedData);

    } catch (err) {
      console.error("Error initializing data:", err);
      setError(err.message);

      // Even on error, try to show fallback data
      if (storedData) {
        const fallbackData = createFallbackMemberDetails(storedData);
        setMemberDetails(fallbackData);
        setIsOfflineMode(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Check if we can go back in router
        if (router.canGoBack()) {
          router.back();
          return true; // Prevent default behavior
        }
        
        // If no previous screen, allow default behavior (minimize app)
        return false;
      };

      // Add hardware back button listener
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [router])
  );

  const handleBackPress = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Navigate to home screen or handle gracefully
      router.replace("/(tabs)/home"); // Replace with your actual home route
    }
  }, [router]);

  
  const handleRetry = () => {
    setError(null);
    setIsOfflineMode(false);
    initializeData();
  };

  if (loading) {
    return (
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  if (error && !memberDetails) {
    return (
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!memberDetails) {
    return (
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No member details available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header1}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle1}>Policy Details</Text>
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={styles.body}>
        {/* Member Information */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Member Information</Text>
          <View style={styles.cardContent}>
            {[
              ["Policy Number", memberDetails.policyNumber],
              ["Member Number", memberDetails.memberNo],
              ["Member Name", memberDetails.memberName],
              ["Emp. Category", memberDetails.empCategory],
              ["Company", memberDetails.company],
              ["Contact No", memberDetails.contactNo],
              ["Date of Birth", memberDetails.dateOfBirth],
              ["Effective Date", memberDetails.effectiveDate],
            ].map(([label, value], index) => (
              <View style={styles.detailRow} key={index}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    value === "Not Available" && styles.notAvailableText,
                  ]}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Policy Period */}
        <View style={styles.policyPeriodCard}>
          <Text style={styles.cardTitle}>Policy Period</Text>
          <View style={styles.periodContent}>
            <View style={styles.periodColumn}>
              <Text style={styles.periodLabel}>From</Text>
              <Text
                style={[
                  styles.periodValue,
                  memberDetails.policyPeriod.from === "Not Available" &&
                  styles.notAvailableText,
                ]}
              >
                {memberDetails.policyPeriod.from}
              </Text>
            </View>
            <View style={styles.periodColumn}>
              <Text style={styles.periodLabel}>To</Text>
              <Text
                style={[
                  styles.periodValue,
                  memberDetails.policyPeriod.to === "Not Available" &&
                  styles.notAvailableText,
                ]}
              >
                {memberDetails.policyPeriod.to}
              </Text>
            </View>
          </View>
        </View>

        {/* OPD Limits (Outdoor) */}
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>OPD Limits</Text>
          <View style={styles.limitContent}>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Year Limit</Text>
              <Text style={styles.limitValue}>
                {memberDetails.opdLimits.yearLimit}
              </Text>
            </View>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Event Limit</Text>
              <Text style={styles.limitValue}>
                {memberDetails.opdLimits.eventLimit}
              </Text>
            </View>
          </View>
        </View>

        {/* Indoor Limits */}
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Indoor Limits</Text>
          <View style={styles.limitContent}>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Year Limit</Text>
              <Text style={styles.limitValue}>
                Rs {memberDetails.indoorLimits.yearLimit}
              </Text>
            </View>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Event Limit</Text>
              <Text style={styles.limitValue}>
                Rs {memberDetails.indoorLimits.eventLimit}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header1: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  headerTitle1: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D7D",
    flex: 1,
    textAlign: "center",
  },
  offlineIndicator: {
    width: 24,
    alignItems: "center",
  },
  offlineBanner: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  offlineBannerText: {
    fontSize: 12,
    color: "#E65100",
    marginLeft: 8,
    flex: 1,
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 5,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C5F69",
    flex: 1,
    textAlign: "center",
    marginLeft: -36,
  },
  headerRight: {
    width: 36,
  },
  body: {
    padding: 20,
    paddingBottom: 30,
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
    padding: 40,
    elevation: 10,
    minWidth: 250,
    minHeight: 200,
  },
  customLoadingIcon: {
    marginBottom: 20,
  },
  loadingIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16858D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#6DD3D3",
  },
  loadingIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#17ABB7",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 16,
    color: "#DC3545",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#13515C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  retryIcon: {
    marginRight: 8,
  },
  retrySection: {
    alignItems: "center",
    marginTop: 20,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
    textAlign: "center",
  },
  cardContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailRow: {
    width: "48%",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  notAvailableText: {
    color: "#999999",
    fontStyle: "italic",
  },
  policyPeriodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  periodContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  periodColumn: {
    alignItems: "center",
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 6,
  },
  periodValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  limitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
    textAlign: "center",
  },
  limitContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  limitColumn: {
    alignItems: "center",
    flex: 1,
  },
  limitLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 6,
  },
  limitValue: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "bold",
  },
});
