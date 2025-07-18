import { useRouter } from "expo-router";
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
} from "react-native";
import * as SecureStore from "expo-secure-store";

export default function PolicyMemberDetails() {
  const router = useRouter();
  const [memberDetails, setMemberDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storedData, setStoredData] = useState(null);
  const [policyDates, setPolicyDates] = useState(null);

  // Function to mask contact number
  const maskContactNumber = (contactNo) => {
    if (!contactNo || contactNo === "N/A") return "N/A";
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
    if (!dateOfBirth || dateOfBirth === "N/A") return "N/A";
    // Format: DD/MM/YYYY -> DD/MM/****
    const parts = dateOfBirth.split("/");
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/****`;
    }
    return dateOfBirth;
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
        `http://203.115.11.229:1002/api/PolicyInfo/GetPolicyInfo?policyNo=${policyNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from policy info server");
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
        `http://203.115.11.229:1002/api/HomePagePoliciesLoad/GetPoliciesByNic?nicNumber=${userNic}`,
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from server");
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "/");
  };

  // Function to format policy period from start and end dates
  const formatPolicyPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return { from: "N/A", to: "N/A" };

    const start = new Date(startDate);
    const end = new Date(endDate);

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
  };

  // Function to format currency values
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "0.00";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Function to fetch member details from API
  const fetchMemberDetails = async (policyNo, memberNo) => {
    try {
      const apiUrl = `http://203.115.11.229:1002/api/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNo}&memberNo=${memberNo}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(responseText);
      return data;
    } catch (err) {
      console.error("Error fetching member details:", err);
      throw err;
    }
  };

  // Initialize data function
  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stored data first
      const stored = await loadStoredData();
      if (!stored) {
        setLoading(false);
        return;
      }

      // Fetch policy info for company name
      const policyInfo = await fetchPolicyInfo(stored.policyNumber);

      // Fetch policy dates
      const policyDatesData = await fetchPolicyDates(
        stored.policyNumber,
        stored.userNic
      );
      setPolicyDates(policyDatesData);

      // Fetch member details from API
      const apiData = await fetchMemberDetails(
        stored.policyNumber,
        stored.memberNumber
      );

      // Format policy period using fetched dates or fallback to effective date
      const policyPeriod = policyDatesData
        ? formatPolicyPeriod(
            policyDatesData.policyStartDate,
            policyDatesData.policyEndDate
          )
        : { from: formatDate(apiData.effectiveDate), to: "N/A" };

      // Transform API data to match component structure with masking
      const transformedData = {
        policyNumber: stored.policyNumber,
        memberName: apiData.memberName,
        contactNo: maskContactNumber(stored.userMobile || "N/A"), // Mask contact number
        company: policyInfo?.name || "N/A",
        memberNo: apiData.employeeNumber,
        empCategory: apiData.employeeCategory,
        dateOfBirth: maskDateOfBirth(formatDate(apiData.dateOfBirth)), // Mask date of birth
        effectiveDate: formatDate(apiData.effectiveDate),
        policyPeriod: policyPeriod,
        opdLimits: {
          yearLimit: formatCurrency(apiData.outdoorYearLimit),
          eventLimit: formatCurrency(apiData.outdoorEventLimit),
        },
        indoorLimits: {
          yearLimit: formatCurrency(apiData.indoorYearLimit),
          eventLimit: formatCurrency(apiData.indoorEventLimit),
        },
        nic: apiData.nic || "N/A",
        address:
          [apiData.address1, apiData.address2, apiData.address3]
            .filter((addr) => addr && addr.trim())
            .join(", ") || "N/A",
      };

      setMemberDetails(transformedData);
    } catch (err) {
      console.error("Error initializing data:", err);
      setError(err.message);
      Alert.alert(
        "Error",
        "Failed to load member details. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  const handleRetry = () => {
    setError(null);
    initializeData();
  };

  if (loading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading member details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
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
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No member details available</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header1}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle1}>Policy Details</Text>
        <View style={{ width: 24 }} />
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
                <Text style={styles.detailValue}>{value}</Text>
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
              <Text style={styles.periodValue}>
                {memberDetails.policyPeriod.from}
              </Text>
            </View>
            <View style={styles.periodColumn}>
              <Text style={styles.periodLabel}>To</Text>
              <Text style={styles.periodValue}>
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
                {memberDetails.indoorLimits.yearLimit}
              </Text>
            </View>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Event Limit</Text>
              <Text style={styles.limitValue}>
                {memberDetails.indoorLimits.eventLimit}
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
    marginTop:20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#13515C",
    textAlign: "center",
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
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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