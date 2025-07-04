import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert, Animated, BackHandler, Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { SafeAreaView } from 'react-native-safe-area-context';
import ClaimTypeSelection from './ClaimTypeSelection';
import PendingIntimations from './PendingIntimations';

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

export default function PolicyHome() {
  const navigation = useNavigation();
  const [showIllnessPopup, setShowIllnessPopup] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Policy selection modal state
  const [showPolicySelection, setShowPolicySelection] = useState(false);
  const [policySelectSlideAnim] = useState(new Animated.Value(screenHeight));
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(true);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showPendingIntimations, setShowPendingIntimations] = useState(false);
  const [pendingIntimationsSlideAnim] = useState(new Animated.Value(screenHeight));
  // Available policies - now loaded from API
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);

  // Function to format policy period from start and end dates
  const formatPolicyPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Function to retrieve stored policy data
  const getStoredPolicyData = async () => {
    try {
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );
      const policyData = await SecureStore.getItemAsync("selected_policy_data");

      if (policyNumber && memberNumber) {
        return {
          policyNumber,
          memberNumber,
          fullPolicyData: policyData ? JSON.parse(policyData) : null,
        };
      }

      return null;
    } catch (error) {
      console.error("Error retrieving stored policy data:", error);
      return null;
    }
  };

  // Utility function to clear all stored policy data
  const clearStoredPolicyData = async () => {
    try {
      await SecureStore.deleteItemAsync("selected_policy_number");
      await SecureStore.deleteItemAsync("selected_member_number");
      await SecureStore.deleteItemAsync("selected_policy_id");
      await SecureStore.deleteItemAsync("selected_policy_period");
      await SecureStore.deleteItemAsync("selected_policy_type");
      await SecureStore.deleteItemAsync("selected_policy_data");
      console.log("All stored policy data cleared");
    } catch (error) {
      console.error("Error clearing stored policy data:", error);
    }
  };

  // Function to fetch policies from API
  const fetchPolicies = async () => {
    try {
      setIsLoadingPolicies(true);
      console.log("Fetching NIC number from SecureStore...");
      const nicNumber = await SecureStore.getItemAsync("user_nic");

      if (!nicNumber) {
        throw new Error("NIC number not found in SecureStore.");
      }

      console.log("Fetching policies for NIC:", nicNumber);

      const response = await fetch(
        `http://203.115.11.229:1002/api/HomePagePoliciesLoad/GetPoliciesByNic?nicNumber=${nicNumber}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            nicNumber,
          }),
        }
      );

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response text first to check what we're receiving
      const responseText = await response.text();

      // Check if response is empty
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from server");
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text that failed to parse:", responseText);
        throw new Error("Invalid JSON response from server");
      }

      // Close modal
      Animated.timing(policySelectSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPolicySelection(false);
      });

      const handleMoreDetails = () => {
        router.push('/PolicyMemberDetails');
      };




      if (result.success && result.data) {
        // Transform API data to match the expected format
        const transformedPolicies = result.data.map((policy, index) => ({
          id: index + 1,
          policyNumber: policy.policyNumber,
          policyID: policy.memNumber,
          policyPeriod: formatPolicyPeriod(
            policy.policyStartDate,
            policy.policyEndDate
          ),
          type: "Health Insurance", // Default type since it's not in API response
          nicNumber: policy.nicNumber,
          memNumber: policy.memNumber,
          policyStartDate: policy.policyStartDate,
          policyEndDate: policy.policyEndDate,
        }));

        setAvailablePolicies(transformedPolicies);

        // If no policy selected and policies are available, show selection modal
        if (
          !selectedPolicyNumber &&
          transformedPolicies.length > 0 &&
          isFirstTime
        ) {
          setTimeout(() => {
            setShowPolicySelection(true);
            Animated.timing(policySelectSlideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 500);
        }
      } else {
        console.error("API returned unsuccessful response:", result);
        Alert.alert(
          "Error",
          result.message || "Failed to load policies. Please try again."
        );
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      Alert.alert("Error", `Failed to load policies: ${error.message}`);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  // Initialize members and fetch policies
  useEffect(() => {
    const membersList = [
      { id: 1, name: "H.M.Menaka Herath", relationship: "Self" },
      { id: 2, name: "Kamal Perera", relationship: "Spouse" },
      { id: 3, name: "Saman Herath", relationship: "Child" },
      { id: 4, name: "Nimal Silva", relationship: "Child" },
      { id: 5, name: "Kamala Herath", relationship: "Parent" },
    ];
    setMembers(membersList);
    setSelectedMember(membersList[0]);

    // Load stored policy data and fetch policies
    const initializePolicyData = async () => {
      try {
        // First, try to load stored policy data
        const storedPolicyData = await getStoredPolicyData();

        if (storedPolicyData) {
          console.log("Loaded stored policy data:", storedPolicyData);
          setSelectedPolicyNumber(storedPolicyData.policyNumber);

          if (storedPolicyData.fullPolicyData) {
            setPolicyDetails({
              policyID: storedPolicyData.fullPolicyData.policyID,
              policyNumber: storedPolicyData.fullPolicyData.policyNumber,
              policyPeriod: storedPolicyData.fullPolicyData.policyPeriod,
              type: storedPolicyData.fullPolicyData.type,
            });
          }

          setIsFirstTime(false);
        }

        // Then fetch fresh policies from API
        await fetchPolicies();
      } catch (error) {
        console.error("Error initializing policy data:", error);
        // Still fetch policies even if stored data retrieval fails
        await fetchPolicies();
      }
    };

    initializePolicyData();
  }, []);

  // Updated handlePolicySelection to store data in SecureStore
  const handlePolicySelection = async (policy) => {
    try {
      // Store policy number and member number in SecureStore
      await SecureStore.setItemAsync(
        "selected_policy_number",
        policy.policyNumber
      );
      await SecureStore.setItemAsync(
        "selected_member_number",
        policy.memNumber.toString()
      );

      // Optional: Store additional policy data if needed
      await SecureStore.setItemAsync(
        "selected_policy_id",
        policy.policyID.toString()
      );
      await SecureStore.setItemAsync(
        "selected_policy_period",
        policy.policyPeriod
      );
      await SecureStore.setItemAsync("selected_policy_type", policy.type);

      // Store the full policy data as JSON string for complex data
      await SecureStore.setItemAsync(
        "selected_policy_data",
        JSON.stringify(policy)
      );

      console.log("Policy data stored successfully:", {
        policyNumber: policy.policyNumber,
        memberNumber: policy.memNumber,
      });

      // Update state as before
      setSelectedPolicyNumber(policy.policyNumber);
      setPolicyDetails({
        policyID: policy.policyID,
        policyNumber: policy.policyNumber,
        policyPeriod: policy.policyPeriod,
        type: policy.type,
      });
      setIsFirstTime(false);

      // Close modal
      Animated.timing(policySelectSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPolicySelection(false);
      });
    } catch (error) {
      console.error("Error storing policy data:", error);
      Alert.alert("Error", "Failed to save policy data. Please try again.");
    }
  };

  // Updated handleDeletePolicy to also remove from SecureStore
  const handleDeletePolicy = async (policyId, policyNumber) => {
    Alert.alert(
      "Delete Policy",
      `Are you sure you want to delete policy ${policyNumber}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove policy from the list
              const updatedPolicies = availablePolicies.filter(
                (policy) => policy.id !== policyId
              );
              setAvailablePolicies(updatedPolicies);

              // If the deleted policy was selected, reset selection and clear SecureStore
              if (selectedPolicyNumber === policyNumber) {
                setSelectedPolicyNumber(null);
                setPolicyDetails(null);
                setIsFirstTime(true);

                // Clear stored policy data
                await clearStoredPolicyData();
                console.log("Cleared stored policy data");
              }

              // If no policies left, close modal
              if (updatedPolicies.length === 0) {
                handleClosePolicySelection();
              }
            } catch (error) {
              console.error("Error deleting policy data:", error);
              Alert.alert("Error", "Failed to delete policy data completely.");
            }
          },
        },
      ]
    );
  };

  const handleNavigation = (label) => {
    if (label === "Policy Details") {
      navigation.navigate("HealthPolicyDetails");
    } else if (label === "Add") {
      router.push("/AddPolicy");
    } else if (label === "Profile") {
      router.push("/userDetails");
    }
  };

  const handleMoreDetails = () => {
    router.push("/PolicyMemberDetails");
  };

  const handleTypePress = (type) => {
    // Remove newline characters and normalize the type string
    const normalizedType = type.replace(/\n/g, ' ').trim();

    console.log('Button pressed:', type);
    console.log('Normalized type:', normalizedType);

    if (normalizedType === 'New Claim') {
      console.log('Opening New Claim modal');
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (normalizedType === 'Saved Claims') {
      console.log('Saved Claims pressed');
      setShowPendingIntimations(true);
      Animated.timing(pendingIntimationsSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (normalizedType === 'Claim History') {
      console.log('Claim History pressed');
      // Add your navigation logic here
    } else if (normalizedType === 'Pending Requirement') {
      console.log('Pending Requirement pressed');
      // Add your navigation logic here
    } else {
      console.log(`${normalizedType} pressed`);
    }
  };

  const handleClosePendingIntimations = () => {
    Animated.timing(pendingIntimationsSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPendingIntimations(false);
    });
  };

  const handleCloseModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleClosePolicySelection = () => {
    // Only close if a policy has been selected
    if (selectedPolicyNumber) {
      Animated.timing(policySelectSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPolicySelection(false);
      });
    }
    // If no policy selected, do nothing - force user to select a policy
  };

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true; // prevent navigating back to OTP/Login
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setShowMemberDropdown(false);
  };

  const toggleMemberDropdown = () => {
    setShowMemberDropdown(!showMemberDropdown);
  };

  const showPolicySelectionModal = () => {
    setShowPolicySelection(true);
    Animated.timing(policySelectSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderType = (label, imageSource, onPress) => (
    <TouchableOpacity
      style={styles.typeItem}
      key={label}
      onPress={() => onPress(label)}
    >
      <View style={styles.iconCircle}>
        <Image
          source={imageSource}
          style={styles.typeIcon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.typeText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderNavItem = (iconName, label, onPress) => (
    <TouchableOpacity
      style={styles.navItem}
      onPress={() => onPress(label)}
      key={label}
    >
      <Icon name={iconName} size={25} color="white" />
      <Text style={styles.navText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ backgroundColor: "black", flex: 1 }}>
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.userSection}>
              <Image
                source={require("../assets/images/userhome.png")}
                style={styles.userAvatar}
                resizeMode="contain"
              />
              <Text style={styles.userName}>Kumuduni Rajapakshe</Text>
              <TouchableOpacity onPress={showPolicySelectionModal}>
                <Icon name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.sectionTitle}>POLICY DETAILS</Text>
          <View style={styles.cardOutline}>
            <View style={styles.insuranceCard}>
              <View style={styles.policyHeader}>
                <View style={styles.policyInfo}>
                  <Text style={styles.insuranceText}>
                    Policy Number :{" "}
                    <Text style={styles.boldText}>
                      {policyDetails?.policyNumber || "Loading..."}
                    </Text>
                  </Text>
                  <Text style={styles.insuranceText}>
                    Policy Period :{" "}
                    <Text style={styles.boldText}>
                      {policyDetails?.policyPeriod || "Loading..."}
                    </Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={handleMoreDetails}
              >
                <Text style={styles.moreText}>More Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>MEMBER</Text>
          <View style={styles.memberCard}>
            <TouchableOpacity
              style={styles.memberRow}
              onPress={toggleMemberDropdown}
            >
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {selectedMember ? selectedMember.name : "Select Member"}
                </Text>
                {selectedMember && (
                  <Text style={styles.memberRelationship}>
                    {selectedMember.relationship}
                  </Text>
                )}
              </View>
              <View style={styles.memberActions}>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalText}>Total </Text>
                  <Text style={styles.totalNumber}>
                    {members.length.toString().padStart(2, "0")}
                  </Text>
                </View>
                <Icon
                  name={showMemberDropdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#666"
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>

            {showMemberDropdown && (
              <View style={styles.dropdownContainer}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.dropdownItem,
                      selectedMember?.id === member.id &&
                      styles.selectedDropdownItem,
                    ]}
                    onPress={() => handleMemberSelect(member)}
                  >
                    <View style={styles.dropdownMemberInfo}>
                      <Text style={styles.dropdownMemberName}>{member.name}</Text>
                      <Text style={styles.dropdownMemberRelationship}>
                        {member.relationship}
                      </Text>
                    </View>
                    {selectedMember?.id === member.id && (
                      <Icon name="check" size={16} color="#16858D" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>TYPE</Text>
          <View style={styles.typeContainer}>
            {renderType(
              "New\nClaim",
              require("../assets/images/newclaimicon.png"),
              handleTypePress
            )}
            {renderType(
              "Saved\nClaims",
              require("../assets/images/savedclaimicon.png"),
              handleTypePress
            )}
            {renderType(
              "Claim\nHistory",
              require("../assets/images/claimhistoryicon.png"),
              handleTypePress
            )}
            {renderType(
              "Pending\nRequirement",
              require("../assets/images/pendingicon.png"),
              handleTypePress
            )}
          </View>

          <Text style={styles.sectionTitle}>HEALTH CARD</Text>
          <View style={styles.healthCardContainer}>
            <Image
              source={require("../assets/images/healthcard.png")}
              style={styles.healthCard}
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        <View style={styles.navbar}>
          {renderNavItem("home", "Home", handleNavigation)}
          {renderNavItem("bell", "Notification", handleNavigation)}
          {renderNavItem("file-text", "Policy Details", handleNavigation)}
          {renderNavItem("user", "Profile", handleNavigation)}
        </View>
        {/* Policy Selection Modal */}
        <Modal
          visible={showPolicySelection}
          transparent
          animationType="none"
          onRequestClose={() => {
            // Prevent closing modal with back button if no policy selected
            if (selectedPolicyNumber) {
              handleClosePolicySelection();
            }
          }}
        >
          <View style={styles.overlay}>
            {/* Remove the TouchableOpacity that was allowing outside clicks */}
            <Animated.View
              style={[
                styles.policySelectionModal,
                { transform: [{ translateY: policySelectSlideAnim }] },
              ]}
            >
              <View style={styles.policyModalHeader}>
                <Text style={styles.policyModalTitle}>Select Your Policy</Text>
                <Text style={styles.policyModalSubtitle}>
                  Please select a policy to continue
                </Text>
              </View>
              <ScrollView style={styles.policyList}>
                {isLoadingPolicies ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading policies...</Text>
                  </View>
                ) : availablePolicies.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No policies found</Text>
                  </View>
                ) : (
                  availablePolicies.map((policy) => (
                    <View key={policy.id} style={styles.policyItemContainer}>
                      <TouchableOpacity
                        style={[
                          styles.policyItem,
                          selectedPolicyNumber === policy.policyNumber &&
                          styles.selectedPolicyItem,
                        ]}
                        onPress={() => handlePolicySelection(policy)}
                      >
                        <View style={styles.policyContent}>
                          <Text style={styles.policyNumber}>
                            {policy.policyNumber}
                          </Text>
                          <Text style={styles.policyID}>
                            Member: {policy.policyID}
                          </Text>
                          <Text style={styles.policyPeriod}>
                            {policy.policyPeriod}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          handleDeletePolicy(policy.id, policy.policyNumber)
                        }
                      >
                        <Icon name="trash" size={25} color="#E12427" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
        {/* Claim Type Selection Modal */}
        <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleCloseModal}>

          <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleCloseModal} />
          <Animated.View style={[styles.animatedModal, { transform: [{ translateY: slideAnim }] }]}>
            <ClaimTypeSelection onClose={handleCloseModal} />
          </Animated.View>
        </Modal>
        {/* PendingIntimations Modal */}
        <Modal visible={showPendingIntimations} transparent animationType="none" onRequestClose={handleClosePendingIntimations}  >
          <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleClosePendingIntimations} />
          <Animated.View style={[styles.animatedModal, { transform: [{ translateY: pendingIntimationsSlideAnim }] }]}>
            <PendingIntimations onClose={handleClosePendingIntimations} />
          </Animated.View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  policyModalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    marginLeft: 10,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 15,
    display: "flex",
    alignItems: "left",
    justifyContent: "center",
  },
  logo: {
    width: 130,
    height: 30,
  },

  sligBadge: {
    backgroundColor: "#16858D",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  sligText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  generalBadge: {
    backgroundColor: "#E12427",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  generalText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "left",
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: "#333",
    marginRight: 120,
  },
  body: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#004D40",
    marginVertical: 10,
  },
  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  memberRelationship: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalBadge: {
    backgroundColor: "#16858D",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  totalText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  totalNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  dropdownContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    paddingTop: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  selectedDropdownItem: {
    backgroundColor: "#F0F8FF",
  },
  dropdownMemberInfo: {
    flex: 1,
  },
  dropdownMemberName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownMemberRelationship: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  cardOutline: {
    borderWidth: 1,
    borderColor: "#16858D",
    borderRadius: 10,
    marginBottom: 15,
  },
  insuranceCard: {
    backgroundColor: "#17ABB7",
    padding: 15,
    borderRadius: 10,
  },
  healthCardContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  healthCard: {
    width: 350,
    height: 200,
    borderRadius: 10,
  },
  policyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  policyInfo: {
    flex: 1,
  },
  insuranceText: {
    fontSize: 16,
    color: "white",
    marginBottom: 5,
  },
  boldText: {
    fontWeight: "bold",
    color: "white",
    fontSize: 14,
  },
  moreButton: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  moreText: {
    color: "#FFFFFF",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  typeItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 3,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeIcon: {
    width: 30,
    height: 30,
  },
  typeText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    lineHeight: 16,
  },
  healthCardContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  healthCardWrapper: {
    width: screenWidth - 40,
    backgroundColor: "#16858D",
    borderRadius: 12,
    overflow: "hidden",
  },
  healthCardHeader: {
    padding: 15,
    paddingBottom: 10,
  },
  healthCardBadges: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  healthBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  healthBadgeText: {
    color: "#16858D",
    fontSize: 12,
    fontWeight: "bold",
  },
  sligCardBadge: {
    backgroundColor: "#E12427",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sligCardBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  healthCardBody: {
    padding: 15,
    paddingTop: 5,
  },
  cardHolderText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 5,
  },
  cardHolderName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    opacity: 0.8,
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
  cardRightInfo: {
    alignItems: "flex-end",
  },
  validUpTo: {
    color: "#FFFFFF",
    fontSize: 10,
    opacity: 0.8,
  },
  expiryDate: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#6DD3D3",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    alignItems: "center",
    height: 70,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: "#FFFFFF",
  },
  // Policy Selection Modal styles
  policySelectionModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: screenHeight * 0.6,
    paddingBottom: 20,
  },
  policyModalHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  policyModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  policyList: {
    maxHeight: screenHeight * 0.4,
  },
  policyItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  policyItem: {
    flex: 1,
    padding: 20,
  },
  selectedPolicyItem: {
    backgroundColor: "#F0F8FF",
    borderLeftWidth: 4,
    borderLeftColor: "#16858D",
  },
  policyContent: {
    flex: 1,
  },
  policyNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  policyPeriod: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  policyID: {
    fontSize: 14,
    // color: '#16858D',
    fontWeight: "500",
  },
  deleteButton: {
    padding: 15,
    paddingLeft: 10,
    paddingRight: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
  },
  animatedModal: {
    height: 375,
    backgroundColor: "transparent",
  },
});