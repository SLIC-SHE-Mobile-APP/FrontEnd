import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Modal,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";

const { width } = Dimensions.get('window');

// Enhanced Custom Popup Component with blur background and animations
const CustomPopup = ({
  visible,
  title,
  message,
  type = "info",
  onClose,
  onConfirm,
  showConfirmButton = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "✓", color: "#4CAF50", bgColor: "#E8F5E8" };
      case "error":
        return { icon: "✕", color: "#F44336", bgColor: "#FFEBEE" };
      case "warning":
        return { icon: "⚠", color: "#FF9800", bgColor: "#FFF3E0" };
      case "confirm":
        return { icon: "?", color: "#FF9800", bgColor: "#FFF3E0" };
      default:
        return { icon: "ℹ", color: "#2196F3", bgColor: "#E3F2FD" };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent={true}>
      <Animated.View
        style={[
          styles.popupOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.popupContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[styles.popupIconContainer, { backgroundColor: bgColor }]}
          >
            <Text style={[styles.popupIcon, { color }]}>{icon}</Text>
          </View>

          {title && <Text style={styles.popupTitle}>{title}</Text>}
          <Text style={styles.popupMessage}>{message}</Text>

          <View style={styles.popupButtonContainer}>
            {showConfirmButton && (
              <TouchableOpacity
                style={[styles.popupButton, styles.popupConfirmButton]}
                onPress={onConfirm}
              >
                <Text style={styles.popupConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.popupButton,
                showConfirmButton
                  ? styles.popupCancelButton
                  : styles.popupOkButton,
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  showConfirmButton
                    ? styles.popupCancelButtonText
                    : styles.popupOkButtonText,
                ]}
              >
                {showConfirmButton ? "Cancel" : "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const PendingIntimations = ({ onClose, onEditClaim }) => {
  const navigation = useNavigation();

  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [policyNo, setPolicyNo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");



  const filteredClaims = pendingClaims.filter(claim =>
    claim.claimNo.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Enhanced popup states
  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    showConfirmButton: false,
    onConfirm: null,
  });

  // Show popup function
  const showCustomPopup = (
    title,
    message,
    type = "info",
    showConfirmButton = false,
    onConfirm = null
  ) => {
    setPopup({
      visible: true,
      title,
      message,
      type,
      showConfirmButton,
      onConfirm,
    });
  };

  // Hide popup function
  const hidePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
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
      outputRange: ["0deg", "360deg"],
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

  // Add useFocusEffect to refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh when screen comes into focus (when returning from EditClaimIntimation1)
      console.log("PendingIntimations screen focused, refreshing claims...");
      if (userId && policyNo) {
        refreshData();
      }
    }, [userId, policyNo])
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

  // Modified fetchClaims function to be reusable
  const fetchClaims = async (showLoading = true) => {
    // Don't fetch if we don't have the required values yet
    if (!userId || !policyNo) {
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
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
        claimNo: claim.clmSeqNo,
        enteredBy: claim.patientName,
        relationship: claim.relationship,
        claimType: claim.indOut,
        createdOn: formatDate(claim.createdDate),
        policyNo: policyNo,
        illness: claim.illness,
      }));

      setPendingClaims(transformedData);
      console.log(`Loaded ${transformedData.length} claims`);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError(err.message);

      // More specific error messages with enhanced popup
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
        showCustomPopup(
          "Error",
          "Failed to load claims data. Please try again.",
          "error"
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Update the initial useEffect to use the new fetchClaims function
  useEffect(() => {
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

  // Updated refreshData function
  const refreshData = async () => {
    if (!userId || !policyNo) {
      showCustomPopup("Error", "Missing policy information", "error");
      return;
    }

    console.log("Refreshing claims data...");
    await fetchClaims(false); // Don't show loading spinner for refresh
  };

  // Modified handleEdit function to clear any refresh flags
  const handleEdit = async (claim) => {
    try {
      await SecureStore.setItemAsync("edit_claimNo", claim.claimNo);
      await SecureStore.setItemAsync("referenNo", claim.claimNo);
      await SecureStore.setItemAsync("edit_enteredBy", claim.enteredBy);
      await SecureStore.setItemAsync("edit_relationship", claim.relationship);
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
        claim: claim, // Pass the claim data
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

  // Handle Delete with enhanced confirmation popup
  const handleDelete = (id) => {
    showCustomPopup(
      "Confirm Delete",
      "Are you sure you want to delete this claim? This action cannot be undone.",
      "confirm",
      true,
      () => {
        hidePopup();
        deleteClaimFromServer(id);
      }
    );
  };

  // Update deleteClaimFromServer to refresh the list after deletion
  const deleteClaimFromServer = async (claimId) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/DeleteClaim/DeleteClaim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claimNo: claimId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Remove the claim from local state after successful deletion
      setPendingClaims((prev) => prev.filter((item) => item.id !== claimId));

      showCustomPopup("Success", "Claim deleted successfully", "success");

      // Refresh the data to ensure consistency
      setTimeout(() => {
        refreshData();
      }, 1000);
    } catch (error) {
      console.error("Error deleting claim:", error);
      showCustomPopup(
        "Error",
        "Failed to delete claim. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a manual refresh button to the header (optional)
  const renderRefreshButton = () => (
    <TouchableOpacity
      style={styles.refreshButton}
      onPress={refreshData}
      disabled={loading}
    >
    </TouchableOpacity>
  );

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
          message={
            !userId || !policyNo
              ? "Loading Policy Information..."
              : "Loading Pending Claims..."
          }
        />
        <CustomPopup
          visible={popup.visible}
          title={popup.title}
          message={popup.message}
          type={popup.type}
          showConfirmButton={popup.showConfirmButton}
          onClose={hidePopup}
          onConfirm={popup.onConfirm}
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
        <CustomPopup
          visible={popup.visible}
          title={popup.title}
          message={popup.message}
          type={popup.type}
          showConfirmButton={popup.showConfirmButton}
          onClose={hidePopup}
          onConfirm={popup.onConfirm}
        />
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
          {renderRefreshButton()}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Claim Number..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery("")}
            >
              {/* <Ionicons name="close-circle" size={20} color="#666" /> */}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredClaims.length === 0 && searchQuery.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color="#00ADBB" />
            <Text style={styles.emptyText}>No claims found for "{searchQuery}"</Text>
            <TouchableOpacity
              style={styles.clearSearchButtonLarge}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : filteredClaims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={60} color="#00ADBB" />
            <Text style={styles.emptyText}>No pending claims found.</Text>
          </View>
        ) : (
          // Fix 1: Replace line 566-569 with the complete claim card JSX:

          filteredClaims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <View style={styles.claimContent}>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Claim No :</Text>
                  <Text style={styles.claimValue}>{claim.claimNo}</Text>
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
                  <Text style={styles.claimLabel}>Last Edit on :</Text>
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


      {/* Enhanced Custom Popup */}
      <CustomPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        showConfirmButton={popup.showConfirmButton}
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
      />
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
  // Enhanced Popup Styles with Blur Background
  popupOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popupContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    maxWidth: width * 0.85,
    minWidth: width * 0.7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
  },
  popupIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  popupIcon: {
    fontSize: 28,
    fontWeight: "bold",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  popupMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  popupButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  popupButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  popupOkButton: {
    backgroundColor: "#4ECDC4",
  },
  popupOkButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  popupConfirmButton: {
    backgroundColor: "#4ECDC4",
  },
  popupConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  popupCancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  popupCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  }, searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(46, 125, 125, 0.1)",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 5,
    marginLeft: 10,
  },
  clearSearchButtonLarge: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  clearSearchButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PendingIntimations;