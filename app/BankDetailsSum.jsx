import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";

const BankDetailsSum = ({ onClose }) => {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMasked, setShowMasked] = useState(true);
  const [policyNo, setPolicyNo] = useState(null);
  const [memberNo, setMemberNo] = useState(null);

  // Utility to mask string with only first 2 and last 2 characters visible
  const maskValue = (value) => {
    if (!value || value.length <= 4) return value;
    const first = value.slice(0, 2);
    const last = value.slice(-2);
    return `${first}${"*".repeat(value.length - 4)}${last}`;
  };

  // Get policy and member numbers from SecureStore
  const getStoredData = async () => {
    try {
      const storedPolicyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const storedMemberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      console.log("Retrieved from SecureStore:", {
        policyNumber: storedPolicyNumber,
        memberNumber: storedMemberNumber,
      });

      if (storedPolicyNumber && storedMemberNumber) {
        // Pad member number with leading zeros to make it 9 digits
        const paddedMemberNumber = storedMemberNumber.padStart(9, "0");

        console.log("Padded member number:", {
          original: storedMemberNumber,
          padded: paddedMemberNumber,
        });

        setPolicyNo(storedPolicyNumber);
        setMemberNo(paddedMemberNumber);
        return { policyNo: storedPolicyNumber, memberNo: paddedMemberNumber };
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
        `http://203.115.11.229:1002/api/BankDetails?policyNo=${policyNumber}&memberNo=${memberNumber}`
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
    setShowMasked(!showMasked);
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
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#13646D" />
          <Text style={styles.loadingText}>Loading bank details...</Text>
        </View>
      );
    }

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
          <TouchableOpacity onPress={handleViewDetails}>
            <Text style={styles.viewDetailsText}>
              {showMasked ? "View Details" : "Hide Details"}
            </Text>
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

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContainer}>{renderContent()}</View>
      </ScrollView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#13646D",
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
});

export default BankDetailsSum;
