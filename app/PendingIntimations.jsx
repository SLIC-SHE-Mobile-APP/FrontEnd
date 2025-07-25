import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

const PendingIntimations = ({ onClose, onEditClaim }) => {
  const navigation = useNavigation();

  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [policyNo, setPolicyNo] = useState(null);

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
  const LoadingScreen = ({ message = "Loading Pending Claims..." }) => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>{message}</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Fetch stored values from SecureStore
  useEffect(() => {
    const getStoredValues = async () => {
      try {
        const policyNum = await SecureStore.getItemAsync(
          "selected_policy_number"
        );
        const memberNum = await SecureStore.getItemAsync(
          "selected_member_number"
        );

        setUserId(memberNum);
        setPolicyNo(policyNum);
      } catch (error) {
        console.error("Error retrieving stored values:", error);
        setError("Failed to retrieve stored policy information");
      }
    };

    getStoredValues();
  }, []);

  useEffect(() => {
    const fetchClaims = async () => {
      // Don't fetch if we don't have the required values yet
      if (!userId || !policyNo) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/SavedclaimlistCon?userid=${userId}&policyNo=${policyNo}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if data is an array
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from server");
        }

        // Transform API data to match component structure
        const transformedData = data.map((claim, index) => ({
          id: claim.clmSeqNo || `claim_${index}`,
          referenceNo: claim.clmSeqNo,
          enteredBy: claim.patientName,
          relationship: claim.relationship,
          claimType: claim.indOut,
          createdOn: formatDate(claim.createdDate),
          policyNo: policyNo, // Use the policyNo from params since it's not in API response
          illness: claim.illness, // Added this field from API
        }));

        setPendingClaims(transformedData);
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError(err.message);

        // More specific error messages
        if (
          err.message.includes("NetworkError") ||
          err.message.includes("Failed to fetch")
        ) {
          Alert.alert(
            "Network Error",
            "Please check your internet connection and try again."
          );
        } else if (err.message.includes("HTTP error")) {
          Alert.alert(
            "Server Error",
            "The server is currently unavailable. Please try again later."
          );
        } else {
          Alert.alert("Error", "Failed to load claims data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [userId, policyNo]);

  // Helper function to format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      // Format as needed (example: DD/MM/YYYY)
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Refresh data function
  const refreshData = async () => {
    if (!userId || !policyNo) {
      Alert.alert("Error", "Missing policy information");
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors

      const response = await fetch(
        `${API_BASE_URL}/SavedclaimlistCon?userid=${userId}&policyNo=${policyNo}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response data
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from server");
      }

      const transformedData = data.map((claim, index) => ({
        id: claim.clmSeqNo || `claim_${index}`,
        referenceNo: claim.clmSeqNo,
        enteredBy: claim.patientName,
        relationship: claim.relationship,
        claimType: claim.indOut,
        createdOn: formatDate(claim.createdDate),
        policyNo: policyNo, // Use the parameter value since it's not in API response
        illness: claim.illness, // Include illness field from API
      }));

      setPendingClaims(transformedData);

      // Optional: Show success message
      // Alert.alert("Success", "Claims data refreshed successfully");
    } catch (err) {
      console.error("Error refreshing claims:", err);
      setError(err.message);

      // More specific error messages
      if (
        err.message.includes("NetworkError") ||
        err.message.includes("Failed to fetch")
      ) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );
      } else if (err.message.includes("HTTP error! status: 404")) {
        Alert.alert("Not Found", "No claims found for this policy.");
      } else if (err.message.includes("HTTP error! status: 500")) {
        Alert.alert(
          "Server Error",
          "The server is experiencing issues. Please try again later."
        );
      } else if (err.message.includes("Invalid data format")) {
        Alert.alert(
          "Data Error",
          "Received unexpected data format from server."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to refresh claims data. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (claim) => {
    try {
      await SecureStore.setItemAsync("edit_referenceNo", claim.referenceNo);
      await SecureStore.setItemAsync("referenNo", claim.referenceNo);
      await SecureStore.setItemAsync("edit_enteredBy", claim.enteredBy); //patient name
      await SecureStore.setItemAsync("edit_relationship", claim.relationship); // relationship
      await SecureStore.setItemAsync("edit_claimType", claim.claimType);
      await SecureStore.setItemAsync("edit_createdOn", claim.createdOn);
      await SecureStore.setItemAsync("edit_claimId", claim.id);
      await SecureStore.setItemAsync("edit_illness", claim.illness || "");

      console.log("Claim data stored successfully in SecureStore");

      if (onEditClaim) {
        onEditClaim(claim);
      }

      // Navigate to edit screen
      navigation.navigate("EditClaimIntimation", {
        claimData: claim,
        onUpdate: (updatedClaim) => {
          setPendingClaims((prev) =>
            prev.map((item) =>
              item.id === updatedClaim.id ? updatedClaim : item
            )
          );
        },
      });
    } catch (error) {
      console.error("Error storing claim data or navigating:", error);
      Alert.alert(
        "Error",
        "Could not save claim data or navigate to edit page"
      );
    }
  };

  // Handle Delete
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this claim?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteClaimFromServer(id),
        },
      ]
    );
  };

  // Delete claim from server
  const deleteClaimFromServer = async (claimId) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/DeleteClaim/DeleteClaim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            claimNo: claimId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Remove the claim from local state after successful deletion
      setPendingClaims((prev) => prev.filter((item) => item.id !== claimId));

      Alert.alert("Success", "Claim deleted successfully");
    } catch (error) {
      console.error("Error deleting claim:", error);
      Alert.alert("Error", "Failed to delete claim. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching stored values or claims
  if (loading || !userId || !policyNo) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Pending Intimations</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
        <LoadingScreen 
          message={!userId || !policyNo
            ? "Loading Policy Information..."
            : "Loading Pending Claims..."
          }
        />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Pending Intimations</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load claims</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Pending Intimations</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {pendingClaims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={50} color="#B0BEC5" />
            <Text style={styles.emptyText}>No pending claims found</Text>
          </View>
        ) : (
          pendingClaims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <View style={styles.claimContent}>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Reference No :</Text>
                  <Text style={styles.claimValue}>{claim.referenceNo}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Patient Name :</Text>
                  <Text style={styles.claimValue}>{claim.enteredBy}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Relationship :</Text>
                  <Text style={styles.claimValue}>{claim.relationship}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Claim Type :</Text>
                  <Text style={styles.claimValue}>{claim.claimType}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Created on :</Text>
                  <Text style={styles.claimValue}>{claim.createdOn}</Text>
                </View>
              </View>

              <View style={styles.actionIcons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(claim)}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(claim.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D7D",
    textAlign: "left",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    padding: 5,
    marginRight: 10,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2E7D7D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#B0BEC5",
    marginTop: 10,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 20,
  },
  claimCard: {
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimContent: {
    flex: 1,
  },
  claimRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  claimValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    flex: 1,
    marginLeft: 10,
  },
  actionIcons: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    backgroundColor: "#2E7D7D",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
});

export default PendingIntimations;