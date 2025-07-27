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
  const [notFoundError, setNotFoundError] = useState(false);
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
        policyNumber: policyNumber || "Not Available",
        memberNumber: memberNumber || "Not Available",
        memberName: memberName || "Not Available",
        userNic: userNic || "Not Available",
      };

      setStoredData(data);

      // Check if required data is available
      if (!policyNumber || !memberNumber) {
        console.warn("Required policy or member data not found in storage");
        return data;
      }

      return data;
    } catch (err) {
      console.error("Error loading stored data:", err);
      const fallbackData = {
        policyNumber: "Not Available",
        memberNumber: "Not Available",
        memberName: "Not Available",
        userNic: "Not Available",
      };
      setStoredData(fallbackData);
      return fallbackData;
    }
  };

  // Function to format date from API response with better error handling
  const formatDate = (dateString) => {
    if (!dateString) return "Not Available";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date
        .toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "/");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date Error";
    }
  };

  // Enhanced function to fetch dependents data with 404 handling
  const fetchDependentsData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFoundError(false);

      // Load stored data first
      const data = await loadStoredData();
      
      // If no policy or member data, show empty state instead of error
      if (!data || !data.policyNumber || data.policyNumber === "Not Available" || 
          !data.memberNumber || data.memberNumber === "Not Available") {
        console.warn("Missing required data, showing empty state");
        setDependentsData([]);
        setLoading(false);
        return;
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
        if (response.status === 404) {
          console.warn("Dependents not found (404), showing no dependents state");
          setDependentsData([]);
          setNotFoundError(true);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from dependents server");
        setDependentsData([]);
        setLoading(false);
        return;
      }

      const apiData = JSON.parse(responseText);

      // Handle empty array response
      if (!Array.isArray(apiData) || apiData.length === 0) {
        console.log("No dependents found in response");
        setDependentsData([]);
        setLoading(false);
        return;
      }

      // Transform API data to match component structure with fallback values
      const transformedData = apiData.map((dependent, index) => ({
        id: index + 1,
        name: dependent.dependentName || "Name Not Available",
        dateOfBirth: formatDate(dependent.depndentBirthDay),
        enrollmentDate: formatDate(dependent.effectiveDate),
        relationship: dependent.relationship || "Relationship Not Available",
        // Store original data for potential future use
        originalData: dependent
      }));

      setDependentsData(transformedData);
    } catch (err) {
      console.error("Error fetching dependents data:", err);
      setError(err.message);
      setDependentsData([]);
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

  // Component to render field with icon for missing data
  const renderFieldWithIcon = (value, fieldName) => {
    const isDataMissing = !value || 
                          value === "Not Available" || 
                          value === "Name Not Available" ||
                          value === "Relationship Not Available" ||
                          value === "Date Error" ||
                          value === "Invalid Date";

    if (isDataMissing) {
      return (
        <View style={styles.missingDataContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#00ADBB" />
          <Text style={styles.missingDataText}>
            {value === "Invalid Date" || value === "Date Error" ? "Date Unavailable" : "Not Available"}
          </Text>
        </View>
      );
    }

    return <Text style={styles.tableCellText}>{value}</Text>;
  };

  // Enhanced empty state component
  const EmptyStateComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={60} color="#00ADBB" />
      
      <Text style={styles.emptyDetailText}>
        {notFoundError 
          ? "No Dependents Found for this policy"
          : "No dependents are currently registered under this policy."
        }
      </Text>
      
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Enhanced error component
  const ErrorComponent = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={60} color="#00ADBB" />
      <Text style={styles.errorText}>Connection Error</Text>
      <Text style={styles.errorDetailText}>
        Unable to load dependent information. Please check your connection and try again.
      </Text>
      <Text style={styles.errorDetailText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={styles.retryIcon} />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

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
      ) : error && !notFoundError ? (
        <ErrorComponent />
      ) : dependentsData.length === 0 ? (
        <EmptyStateComponent />
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
                  {renderFieldWithIcon(dependent.name, "name")}
                  {renderFieldWithIcon(dependent.dateOfBirth, "dateOfBirth")}
                  {renderFieldWithIcon(dependent.enrollmentDate, "enrollmentDate")}
                  {renderFieldWithIcon(dependent.relationship, "relationship")}
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
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#00ADBB",
  },
  policyInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00ADBB",
    width: "100%",
  },
  policyInfoContent: {
    marginLeft: 10,
    flex: 1,
  },
  policyInfoText: {
    fontSize: 12,
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
    alignItems: "center",
  },
  tableCellText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    color: "#333",
  },
  missingDataContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
  },
  missingDataText: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 4,
  },
  dataStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 6,
  },
  dataStatusText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    fontStyle: "italic",
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
    fontSize: 18,
    color: "#FF6B6B",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorDetailText: {
    marginBottom: 10,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#13646D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryIcon: {
    marginRight: 8,
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
    fontSize: 18,
    color: "#13646D",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyDetailText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 15,
  },
});

export default DependentDetails;