import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";

const { width } = Dimensions.get("window");

// Custom Popup Component with Blur Background
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
      default:
        return { icon: "ℹ", color: "#2196F3", bgColor: "#E3F2FD" };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.popupOverlay, { opacity: fadeAnim }]}>
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

const AddPolicy = () => {
  const [policyNumber, setPolicyNumber] = useState("");
  const [policyList, setPolicyList] = useState([]);
  const [deletedPolicies, setDeletedPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [removedPoliciesFromAPI, setRemovedPoliciesFromAPI] = useState([]);
  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    showConfirmButton: false,
    onConfirm: null,
  });
  const navigation = useNavigation();

  const REQUIRED_PREFIX = "G/010/SHE/";

  // Show popup function
  const showPopup = (
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
  const LoadingScreen = ({
    text = "Loading Policies...",
    subText = "Please wait a moment",
  }) => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>{text}</Text>
        <Text style={styles.loadingSubText}>{subText}</Text>
      </View>
    </View>
  );

  // Load policies from API when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadPoliciesFromAPI(), loadRemovedPolicies()]);
      setInitialLoading(false);
    };

    initializeData();
  }, []);

  const loadRemovedPolicies = async () => {
    try {
      const storedNic = await SecureStore.getItemAsync("user_nic");

      if (!storedNic) {
        console.log("NIC not found for removed policies");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/ManagePolices/RemovedPoliciesByNic?nic=${storedNic}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success && result.policies) {
        setRemovedPoliciesFromAPI(result.policies);
        // Set them as deleted policies for display
        setDeletedPolicies(result.policies);
      } else {
        setRemovedPoliciesFromAPI([]);
      }
    } catch (error) {
      console.error("Error loading removed policies:", error);
      setRemovedPoliciesFromAPI([]);
    }
  };

  const loadPoliciesFromAPI = async () => {
    try {
      const storedNic = await SecureStore.getItemAsync("user_nic");

      if (!storedNic) {
        showPopup(
          "Authentication Error",
          "Your session has expired. Please login again to continue.",
          "error"
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/HomePagePoliciesLoad/GetPoliciesByNic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nicNumber: storedNic,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        const formattedPolicies = result.data.map((policy) => ({
          id: policy.policyNumber,
          policyNumber: policy.policyNumber,
          memberId: policy.memNumber,
          policyPeriod: `${new Date(
            policy.policyStartDate
          ).toLocaleDateString()} - ${new Date(
            policy.policyEndDate
          ).toLocaleDateString()}`,
          contactNo: "", // Default contact number
          status:
            new Date(policy.policyEndDate) > new Date() ? "Active" : "Inactive",
        }));

        setPolicyList(formattedPolicies);
      } else {
        showPopup(
          "Data Loading Error",
          "Unable to load your policies at this time. Please try refreshing the page or contact support if the issue persists.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error loading policies:", error);
      showPopup(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again.",
        "error"
      );
    }
  };

  // Function to set refresh flag and navigate to home - ONLY for back button
  const navigateToHomeWithRefresh = async (isBackButton = false) => {
    try {
      // Set the refresh flag in SecureStore
      await SecureStore.setItemAsync("should_refresh_home", "true");

      // MODIFIED: Only set from_add_policy flag for back button navigation
      if (isBackButton) {
        await SecureStore.setItemAsync("from_add_policy", "true");
        console.log("Back button pressed - will show policy selection modal");
      } else {
        // Clear the flag if policy was selected
        await SecureStore.deleteItemAsync("from_add_policy");
        console.log("Policy selected - will not show policy selection modal");
      }

      console.log("Refresh flag set, navigating to home from AddPolicy");
      router.push("/home");
    } catch (error) {
      console.error("Error setting refresh flag:", error);
      router.push("/home");
    }
  };

  const handleAddPolicy = async () => {
    if (!policyNumber.trim()) {
      showPopup(
        "Missing Information",
        "Please enter a policy number to continue.",
        "warning"
      );
      return;
    }

    if (!policyNumber.startsWith(REQUIRED_PREFIX)) {
      showPopup(
        "Invalid Policy Format",
        `Policy number must start with "${REQUIRED_PREFIX}"\n\nExample: G/010/SHE/18666/25`,
        "warning"
      );
      return;
    }

    const existing = policyList.find(
      (item) => item.policyNumber === policyNumber
    );
    if (existing) {
      showPopup(
        "Duplicate Policy",
        `Policy ${policyNumber} already exists in your account.\n\nPlease enter a different policy number.`,
        "warning"
      );
      return;
    }

    try {
      setLoading(true);

      // Call the DELETE API
      const response = await fetch(
        `${API_BASE_URL}/ManagePolices/DeletePolicy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            policyNumber: policyNumber.trim(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // For manually added policies, use default values
        const newPolicy = {
          id: Date.now().toString(),
          policyNumber,
          memberId: "1165", // Default member ID for manually added policies
          policyPeriod: "2020-02-13 - 2020-02-13",
          contactNo: "0713158877",
          status: policyList.length % 2 === 0 ? "Active" : "Inactive",
        };

        setPolicyList([...policyList, newPolicy]);

        // Remove from deleted if it exists
        setDeletedPolicies((prev) => prev.filter((p) => p !== policyNumber));

        // Remove from removed policies API list
        setRemovedPoliciesFromAPI((prev) =>
          prev.filter((policy) => policy !== policyNumber)
        );

        setPolicyNumber("");

        // Show enhanced success popup
        showPopup(
          "Policy Added Successfully",
          `Policy ${policyNumber} has been added to your account and is now active.`,
          "success"
        );
      } else {
        showPopup(
          "Policy Not Found",
          result.message ||
          "The policy number you entered could not be found in our system. Please verify the policy number and try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error adding policy:", error);
      showPopup(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDeleted = (number) => {
    setPolicyNumber(number);
  };

  // Auto-complete input with prefix and validate format
  const handleInputChange = (text) => {
    // If user is typing and hasn't included the prefix, auto-add it
    if (text.length > 0 && !text.startsWith(REQUIRED_PREFIX)) {
      // Check if the text could be part of the prefix
      if (REQUIRED_PREFIX.startsWith(text)) {
        setPolicyNumber(text);
      } else {
        setPolicyNumber(REQUIRED_PREFIX + text);
      }
    } else {
      // Validate the part after the prefix
      if (text.startsWith(REQUIRED_PREFIX)) {
        const afterPrefix = text.substring(REQUIRED_PREFIX.length);

        // Filter out letters after any '/' in the suffix
        const parts = afterPrefix.split("/");
        const filteredParts = parts.map((part) => {
          // Allow only numbers after '/'
          return part.replace(/[^0-9]/g, "");
        });

        const cleanedAfterPrefix = filteredParts.join("/");
        setPolicyNumber(REQUIRED_PREFIX + cleanedAfterPrefix);
      } else {
        setPolicyNumber(text);
      }
    }
  };

  const renderDeletedPolicy = ({ item }) => {
    // Check if this policy is from the API (removed policies)
    const isFromAPI = removedPoliciesFromAPI.includes(item);

    return (
      <TouchableOpacity
        style={[styles.deletedTag, isFromAPI && styles.deletedTagFromAPI]}
        onPress={() => handleRestoreDeleted(item)}
      >
        <Text style={styles.deletedTagText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  const handlePolicySelect = async (policy) => {
    try {
      // Store the selected policy data
      await SecureStore.setItemAsync(
        "selected_policy_number",
        policy.policyNumber
      );
      await SecureStore.setItemAsync(
        "selected_member_number",
        policy.memberId.toString()
      );

      // Store additional policy data for consistency
      await SecureStore.setItemAsync(
        "selected_policy_id",
        policy.memberId.toString()
      );
      await SecureStore.setItemAsync(
        "selected_policy_period",
        policy.policyPeriod
      );
      await SecureStore.setItemAsync(
        "selected_policy_type",
        "Health Insurance"
      );

      // Store the full policy data as JSON string
      const fullPolicyData = {
        id: policy.id,
        policyNumber: policy.policyNumber,
        policyID: policy.memberId,
        policyPeriod: policy.policyPeriod,
        type: "Health Insurance",
        memNumber: policy.memberId,
        endDate: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(
        "selected_policy_data",
        JSON.stringify(fullPolicyData)
      );

      // ADDED: Set a flag to indicate policy was selected in AddPolicy
      await SecureStore.setItemAsync("policy_selected_in_add_policy", "true");

      console.log("Policy selected:", policy.policyNumber);
      console.log("Member ID stored:", policy.memberId);

      // Show success popup
      showPopup(
        "Policy Selected",
        `Policy ${policy.policyNumber} has been selected successfully.`,
        "success"
      );

      // Navigate back to home with a delay to show the success message
      setTimeout(() => {
        navigateToHomeWithRefresh();
      }, 1500);
    } catch (error) {
      console.error("Error selecting policy:", error);
      showPopup(
        "Selection Error",
        "Failed to select policy. Please try again.",
        "error"
      );
    }
  };

  const handleDeletePolicy = async (policyToDelete) => {
    showPopup(
      "Delete Policy",
      `Are you sure you want to delete policy ${policyToDelete.policyNumber}?`,
      "warning",
      true, // showConfirmButton
      async () => {
        try {
          setLoading(true);

          // Call the API to delete the policy
          const response = await fetch(
            `${API_BASE_URL}/DeletePoliciesHome/RemovePolicy`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                policyNumber: policyToDelete.policyNumber,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Check if the response has content before parsing
          const responseText = await response.text();
          let result = null;
          if (responseText && responseText.trim() !== "") {
            try {
              result = JSON.parse(responseText);
            } catch (parseError) {
              console.log("Response is not JSON, treating as successful");
            }
          }

          // Remove from policy list
          const updatedPolicies = policyList.filter(policy => policy.id !== policyToDelete.id);
          setPolicyList(updatedPolicies);

          // Add to deleted policies list
          setDeletedPolicies(prev => [...prev, policyToDelete.policyNumber]);

          // Check if the deleted policy was currently selected and clear if needed
          try {
            const selectedPolicyNumber = await SecureStore.getItemAsync("selected_policy_number");
            if (selectedPolicyNumber === policyToDelete.policyNumber) {
              // Clear stored policy data
              await SecureStore.deleteItemAsync("selected_policy_number");
              await SecureStore.deleteItemAsync("selected_member_number");
              await SecureStore.deleteItemAsync("selected_policy_id");
              await SecureStore.deleteItemAsync("selected_policy_period");
              await SecureStore.deleteItemAsync("selected_policy_type");
              await SecureStore.deleteItemAsync("selected_policy_data");
              console.log("Cleared stored policy data for deleted policy");
            }
          } catch (error) {
            console.error("Error clearing stored policy data:", error);
          }

          // Hide the confirmation popup
          hidePopup();

          // Show success message
          showPopup(
            "Policy Deleted",
            `Policy ${policyToDelete.policyNumber} has been successfully deleted.`,
            "success"
          );

        } catch (error) {
          console.error("Error deleting policy:", error);
          hidePopup();
          showPopup(
            "Delete Error",
            "Failed to delete policy. Please check your connection and try again.",
            "error"
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };


  const renderPolicyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.policyCard}
      onPress={() => handlePolicySelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.policyCardContent}>
        {/* Delete Button - moved to top right */}
        <TouchableOpacity
          style={styles.deleteButtonTopRight}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the card's onPress
            handleDeletePolicy(item);
          }}
          activeOpacity={0.7}
        >
          <Icon name="trash" size={16} color="#FF4444" />
        </TouchableOpacity>

        <View style={styles.policyInfo}>
          <View style={styles.row}>
            <Text style={styles.label}>Policy Number :</Text>
            <Text style={styles.value}>{item.policyNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Member Number :</Text>
            <Text style={styles.value}>{item.memberId}</Text>
          </View>
          {/* Add a visual indicator that items are clickable */}
          <View style={styles.clickIndicator}>
            <Text style={styles.clickIndicatorText}>Tap to select this policy</Text>
            <Icon name="arrow-right" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show loading screen during initial load
  if (initialLoading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.gradient}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  // Show processing loading screen during operations
  if (loading && !initialLoading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.gradient}>
        <LoadingScreen
          text="Processing..."
          subText="Please wait while we process your request"
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          {/* <TouchableOpacity
            onPress={() => navigateToHomeWithRefresh(true)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#05445E" />
          </TouchableOpacity> */}
          <Text style={styles.title}>Manage Policy</Text>
        </View>
        {deletedPolicies.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Removed Policies</Text>
              <Text style={styles.tapToAddText}> (Tap to Add)</Text>
            </View>
            <FlatList
              data={deletedPolicies}
              horizontal
              keyExtractor={(item, index) => `deleted-${index}`}
              renderItem={renderDeletedPolicy}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>ADD POLICY</Text>

        {/* Text Input Section */}
        <View style={styles.textInputSection}>
          <Text style={styles.inputLabel}>Enter policy number:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="G/010/SHE/18666/25"
              value={policyNumber}
              onChangeText={handleInputChange}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.buttonDisabled]}
          onPress={handleAddPolicy}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? "Adding..." : "Add Policy"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>POLICY DETAILS</Text>

        {loading && !initialLoading ? (
          <Text style={styles.loadingText}>Processing...</Text>
        ) : (
          <FlatList
            data={policyList}
            keyExtractor={(item) => item.id}
            renderItem={renderPolicyItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      {/* Custom Popup Component */}
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

export default AddPolicy;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 0,
    paddingLeft: 20,
    paddingRight: 20,
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
  inputLabel: {
    fontSize: 14,
    color: "#05445E",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInputSection: {
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffffffff",
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: "#05445E",
  },
  addButton: {
    backgroundColor: "#189AB4",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#05445E",
    marginBottom: 10,
    marginTop: 20,
  },
  policyCard: {
    backgroundColor: "#189AB4",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  infoText: {
    color: "white",
    marginBottom: 4,
    fontSize: 14,
  },
  label: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  value: {
    color: "white",
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  deletedTag: {
    backgroundColor: "#05445E",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  deletedTagFromAPI: {
    backgroundColor: "#05445E",
    borderWidth: 1,
    borderColor: "#05445E",
  },
  deletedTagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  deletedTagSubText: {
    color: "white",
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tapToAddText: {
    fontSize: 13,
    color: "#05445E",
    marginBottom: 10,
    marginTop: 20,
    fontWeight: "normal", // This removes the bold
  },
  // Popup Styles with Blur Background
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
  },
  clickIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  clickIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 30,
  },
  backButton: {
    padding: 5, // Add some padding for better touch area
  },
  title: {
    fontSize: 20,
    color: "#05445E",
    fontWeight: "bold",
    // marginLeft: 15,
  },

  policyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  policyInfo: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }, deleteButtonTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  policyCardContent: {
    position: 'relative',
    paddingRight: 50,
  },
  policyInfo: {
    flex: 1,
  },
});
