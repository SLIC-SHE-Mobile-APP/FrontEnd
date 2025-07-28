import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Modal,
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

  // Custom Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupType, setPopupType] = useState("info"); // "success", "error", "info", "confirm"
  const [popupActions, setPopupActions] = useState(null);

  // Custom Popup Component
  const CustomPopup = () => {
    const getIconName = () => {
      switch (popupType) {
        case "success": return "checkmark-circle";
        case "error": return "alert-circle";
        case "confirm": return "help-circle";
        default: return "information-circle";
      }
    };

    const getIconColor = () => {
      switch (popupType) {
        case "success": return "#4CAF50";
        case "error": return "#FF6B6B";
        case "confirm": return "#FF9800";
        default: return "#2196F3";
      }
    };

    const closePopup = () => {
      setShowPopup(false);
      setPopupActions(null);
    };

    if (!showPopup) return null;

    return (
      <Modal
        visible={showPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={closePopup}
        statusBarTranslucent={true}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.blurContainer}>
            <View style={styles.popupContainer}>
              <LinearGradient
                colors={["#FFFFFF", "#F8F9FA"]}
                style={styles.popupContent}
              >
                <View style={styles.popupHeader}>
                  <Ionicons
                    name={getIconName()}
                    size={32}
                    color={getIconColor()}
                    style={styles.popupIcon}
                  />
                  {popupTitle && (
                    <Text style={styles.popupTitle}>{popupTitle}</Text>
                  )}
                </View>
                
                <Text style={styles.popupMessage}>{popupMessage}</Text>
                
                {popupActions ? (
                  <View style={styles.popupButtonContainer}>
                    {popupActions.map((action, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.popupButton,
                          { 
                            backgroundColor: action.style === 'destructive' ? '#FF6B6B' : 
                                            action.style === 'cancel' ? '#9E9E9E' : getIconColor(),
                            marginHorizontal: 5,
                          }
                        ]}
                        onPress={() => {
                          closePopup();
                          if (action.onPress) action.onPress();
                        }}
                      >
                        <Text style={styles.popupButtonText}>{action.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.popupButton, { backgroundColor: getIconColor() }]}
                    onPress={closePopup}
                  >
                    <Text style={styles.popupButtonText}>OK</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Show popup function
  const showCustomPopup = (title, message, type = "info", actions = null) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupActions(actions);
    setShowPopup(true);
  };

  // Custom Loading Animation Component
  const LoadingIcon = () => {
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      rotateAnimation.start();

      return () => {
        rotateAnimation.stop();
      };
    }, [rotateAnim]);

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.customLoadingIcon,
          {
            transform: [{ rotate: spin }],
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
          showCustomPopup(
            "Network Error",
            "Please check your internet connection and try again.",
            "error"
          );
        } else if (err.message.includes("HTTP error")) {
          showCustomPopup(
            "Server Error",
            "The server is currently unavailable. Please try again later.",
            "error"
          );
        } else {
          showCustomPopup("Error", "Failed to load claims data. Please try again.", "error");
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
      showCustomPopup("Error", "Missing policy information", "error");
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
      // showCustomPopup("Success", "Claims data refreshed successfully", "success");
    } catch (err) {
      console.error("Error refreshing claims:", err);
      setError(err.message);

      // More specific error messages
      if (
        err.message.includes("NetworkError") ||
        err.message.includes("Failed to fetch")
      ) {
        showCustomPopup(
          "Network Error",
          "Please check your internet connection and try again.",
          "error"
        );
      } else if (err.message.includes("HTTP error! status: 404")) {
        showCustomPopup("Not Found", "No claims found for this policy.", "error");
      } else if (err.message.includes("HTTP error! status: 500")) {
        showCustomPopup(
          "Server Error",
          "The server is experiencing issues. Please try again later.",
          "error"
        );
      } else if (err.message.includes("Invalid data format")) {
        showCustomPopup(
          "Data Error",
          "Received unexpected data format from server.",
          "error"
        );
      } else {
        showCustomPopup(
          "Error",
          "Failed to refresh claims data. Please try again.",
          "error"
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
      navigation.navigate("EditClaimIntimation1", {
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
      showCustomPopup(
        "Error",
        "Could not save claim data or navigate to edit page",
        "error"
      );
    }
  };

  // Handle Delete
  const handleDelete = (id) => {
    showCustomPopup(
      "Confirm Delete",
      "Are you sure you want to delete this claim?",
      "confirm",
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

      showCustomPopup("Success", "Claim deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting claim:", error);
      showCustomPopup("Error", "Failed to delete claim. Please try again.", "error");
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
        <CustomPopup />
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
        <CustomPopup />
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
            <Ionicons name="document-outline" size={60} color="#00ADBB" />
            <Text style={styles.emptyText}>No pending claims found.</Text>
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

      {/* Custom Popup */}
      <CustomPopup />
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
    fontSize: 14,
    color: "#666",
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
  // Custom Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popupContainer: {
    width: '85%',
    maxWidth: 350,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  popupContent: {
    padding: 24,
    alignItems: 'center',
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  popupIcon: {
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  popupMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  popupButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  popupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PendingIntimations;