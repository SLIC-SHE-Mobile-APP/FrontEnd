import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

const DependentDetails = ({ onClose }) => {
  const [dependentsData, setDependentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storedData, setStoredData] = useState({
    policyNumber: null,
    memberNumber: null,
    memberName: null,
    userNic: null,
  });

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
        <Text style={styles.loadingText}>Loading Dependent Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

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

  // Function to fetch dependents data from API
  const fetchDependentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stored data first
      const data = await loadStoredData();
      if (!data || !data.policyNumber || !data.memberNumber) {
        throw new Error(
          "Missing required data. Please select a policy and member first."
        );
      }

      console.log("Fetching dependents with:", {
        policyNo: data.policyNumber,
        memberNo: data.memberNumber,
        memberName: data.memberName,
        userNic: data.userNic,
      });

      const response = await fetch(
        `${API_BASE_URL}/Dependents/WithEmployee?policyNo=${data.policyNumber}&memberNo=${data.memberNumber}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();

      // Transform API data to match component structure
      const transformedData = apiData.map((dependent, index) => ({
        id: index + 1,
        name: dependent.dependentName || "N/A",
        dateOfBirth: formatDate(dependent.depndentBirthDay),
        enrollmentDate: formatDate(dependent.effectiveDate),
        relationship: dependent.relationship || "N/A",
      }));

      setDependentsData(transformedData);
    } catch (err) {
      console.error("Error fetching dependents data:", err);
      setError(err.message);
      Alert.alert(
        "Error",
        "Failed to load dependent details. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchDependentsData();
  }, []);

  // Retry function
  const handleRetry = () => {
    fetchDependentsData();
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
        <Text style={styles.headerTitle}>Dependent Details</Text>
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
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load data</Text>
          <Text style={styles.errorDetailText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : dependentsData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#13646D" />
          <Text style={styles.emptyText}>No dependents found</Text>
          <Text style={styles.emptyDetailText}>
            No dependents are registered under this policy.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredContainer}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableRowHeader}>
                <Text style={styles.tableHeaderText}>Name</Text>
                <Text style={styles.tableHeaderText}>Date of Birth</Text>
                <Text style={styles.tableHeaderText}>Enrollment Date</Text>
                <Text style={styles.tableHeaderText}>Relationship</Text>
              </View>

              {/* Table Rows */}
              {dependentsData.map((dependent) => (
                <View key={dependent.id} style={styles.tableRow}>
                  <Text style={styles.tableCellText}>{dependent.name}</Text>
                  <Text style={styles.tableCellText}>
                    {dependent.dateOfBirth}
                  </Text>
                  <Text style={styles.tableCellText}>
                    {dependent.enrollmentDate}
                  </Text>
                  <Text style={styles.tableCellText}>
                    {dependent.relationship}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
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
  policyInfoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2EC6C6",
  },
  policyInfoText: {
    fontSize: 14,
    color: "#13646D",
    fontWeight: "600",
    marginBottom: 2,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    overflow: "hidden",
    borderColor: "#2EC6C6",
    borderWidth: 2,
    width: "100%",
    maxHeight: "100%",
    marginTop: 10,
    marginBottom: 5,
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#2EC6C6",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    flex: 1,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tableCellText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    color: "#333",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 10,
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorDetailText: {
    marginBottom: 20,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#13646D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 15,
    marginBottom: 8,
    fontSize: 16,
    color: "#13646D",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyDetailText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default DependentDetails;