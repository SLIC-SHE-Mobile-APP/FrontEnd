import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import * as SecureStore from "expo-secure-store";

export default function PolicyMemberDetails() {
  const router = useRouter();
  const [memberDetails, setMemberDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storedData, setStoredData] = useState(null);
  const [policyDates, setPolicyDates] = useState(null);

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

      const data = {
        policyNumber,
        memberNumber,
        memberName,
        userNic,
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
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching member details:", err);
      throw err;
    }
  };

  useEffect(() => {
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

        // Transform API data to match component structure
        const transformedData = {
          policyNumber: stored.policyNumber,
          memberName: apiData.memberName,
          contactNo: "N/A", // Not provided in API
          company: "N/A", // Not provided in API
          memberNo: apiData.employeeNumber,
          empCategory: apiData.employeeCategory,
          dateOfBirth: formatDate(apiData.dateOfBirth),
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

    initializeData();
  }, []);

  const handleBackPress = () => {
    router.back();
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
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Re-run the initialization
              const initializeData = async () => {
                try {
                  const stored = await loadStoredData();
                  if (!stored) {
                    setLoading(false);
                    return;
                  }

                  const policyDatesData = await fetchPolicyDates(
                    stored.policyNumber,
                    stored.userNic
                  );
                  setPolicyDates(policyDatesData);

                  const apiData = await fetchMemberDetails(
                    stored.policyNumber,
                    stored.memberNumber
                  );

                  const policyPeriod = policyDatesData
                    ? formatPolicyPeriod(
                        policyDatesData.policyStartDate,
                        policyDatesData.policyEndDate
                      )
                    : { from: formatDate(apiData.effectiveDate), to: "N/A" };

                  const transformedData = {
                    policyNumber: stored.policyNumber,
                    memberName: apiData.memberName,
                    contactNo: "N/A",
                    company: "N/A",
                    memberNo: apiData.employeeNumber,
                    empCategory: apiData.employeeCategory,
                    dateOfBirth: formatDate(apiData.dateOfBirth),
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
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              };
              initializeData();
            }}
          >
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.1}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={20} color="#13515C" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Policy Details</Text>
          <View style={styles.headerRight} />
        </View>
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
              ["Company", ],
              ["Contact No", ],
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
