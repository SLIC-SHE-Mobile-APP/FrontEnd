import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import ClaimTypeSelection from "./AddPatientDetails.jsx";
import ClaimHistory from "./ClaimHistory";
import PendingIntimations from "./PendingIntimations";
import PendingRequirement from "./PendingRequirement";
import { API_BASE_URL } from '../constants/index.js';

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

export default function PolicyHome() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [showPolicySelection, setShowPolicySelection] = useState(false);
  const [policySelectSlideAnim] = useState(new Animated.Value(screenHeight));
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [dependents, setDependents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showPendingIntimations, setShowPendingIntimations] = useState(false);
  const [showClaimHistory, setShowClaimHistory] = useState(false);
  const [claimHistorySlideAnim] = useState(new Animated.Value(screenHeight));
  const [showPendingRequirement, setShowPendingRequirement] = useState(false);
  const [pendingRequirementSlideAnim] = useState(
    new Animated.Value(screenHeight)
  );
  const [pendingIntimationsSlideAnim] = useState(
    new Animated.Value(screenHeight)
  );
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [isLoadingEmployeeInfo, setIsLoadingEmployeeInfo] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [isLoadingPolicyInfo, setIsLoadingPolicyInfo] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const refreshPageData = async () => {
        try {
          // Check if we should refresh (you can set a flag in SecureStore when navigating)
          const shouldRefresh = await SecureStore.getItemAsync(
            "should_refresh_home"
          );

          if (shouldRefresh === "true") {
            // Clear the refresh flag
            await SecureStore.deleteItemAsync("should_refresh_home");

            // Refresh all data
            await fetchEmployeeInfo();
            await fetchPolicyInfo();
            const count = await fetchMembersCount();
            setMembersCount(count);
            const dependentsData = await fetchDependentsWithoutEmployee();
            setDependents(dependentsData);

            const storedMemberName = await SecureStore.getItemAsync(
              "selected_member_name"
            );
            if (storedMemberName && members.length > 0) {
              await fetchMembers();
            }

            await fetchPolicies();

            console.log("Page refreshed after navigation");
          }
        } catch (error) {
          console.error("Error refreshing page data:", error);
        }
      };

      refreshPageData();
    }, [])
  );

  const fetchPolicyInfo = async () => {
    try {
      setIsLoadingPolicyInfo(true);

      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );

      if (!policyNumber) {
        console.log("Policy number not found in SecureStore");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/PolicyInfo/GetPolicyInfo?policyNo=${policyNumber}`,
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

      const policyInfoData = await response.json();

      if (policyInfoData && policyInfoData.length > 0) {
        setPolicyInfo(policyInfoData[0]); // Take the first item from the array
      } else {
        setPolicyInfo(null);
      }
    } catch (error) {
      console.error("Error fetching policy info:", error);
      setPolicyInfo(null);
    } finally {
      setIsLoadingPolicyInfo(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setIsLoadingMembers(true);

      // Get policy number and member number from SecureStore
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!policyNumber || !memberNumber) {
        console.log("Policy number or member number not found in SecureStore");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/Dependents/WithEmployee?policyNo=${policyNumber}&memberNo=${memberNumber}`,
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

      const membersData = await response.json();

      // Transform API data to match the expected format
      const transformedMembers = membersData.map((member, index) => ({
        id: index + 1,
        name: member.dependentName,
        relationship: member.relationship,
        birthDay: member.depndentBirthDay,
        effectiveDate: member.effectiveDate,
        memberCode: member.memberCode,
      }));

      setMembers(transformedMembers);

      // Check if there's a stored member name and restore selection
      const storedMemberName = await SecureStore.getItemAsync(
        "selected_member_name"
      );
      if (storedMemberName && transformedMembers.length > 0) {
        const memberToSelect = transformedMembers.find(
          (member) => member.name === storedMemberName
        );
        if (memberToSelect) {
          setSelectedMember(memberToSelect);
        }
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load members. Please try again.");
      // Set empty members array on error
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchDependentsWithoutEmployee = async () => {
    try {
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!policyNumber || !memberNumber) {
        console.log("Policy number or member number not found in SecureStore");
        return [];
      }

      const response = await fetch(
        `${API_BASE_URL}/Dependents/WithoutEmployee?policyNo=${policyNumber}&memberNo=${memberNumber}`,
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

      const dependentsData = await response.json();
      return dependentsData;
    } catch (error) {
      console.error("Error fetching dependents:", error);
      return [];
    }
  };

  // Function to fetch employee information
  const fetchEmployeeInfo = async () => {
    try {
      setIsLoadingEmployeeInfo(true);

      // Get policy number and member number from SecureStore
      const storedNic = await SecureStore.getItemAsync("user_nic");
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!policyNumber || !memberNumber) {
        console.log("Policy number or member number not found in SecureStore");
        return;
      }

      console.log("Fetching employee info for:", {
        policyNumber,
        memberNumber,
        storedNic,
      });

      const response = await fetch(
        `${API_BASE_URL}/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNumber}&memberNo=${memberNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.status === 500) {
        setEmployeeInfo(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const employeeData = await response.json();
      setEmployeeInfo(employeeData);
    } catch (error) {
      console.error("Error fetching employee info:", error);
      setEmployeeInfo(null);
    } finally {
      setIsLoadingEmployeeInfo(false);
    }
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to fetch policies from API
  const fetchPolicies = async () => {
    try {
      setIsLoadingPolicies(true);
      const nicNumber = await SecureStore.getItemAsync("user_nic");

      if (!nicNumber) {
        throw new Error("NIC number not found in SecureStore.");
      }

      const response = await fetch(
        `${API_BASE_URL}/HomePagePoliciesLoad/GetPoliciesByNic?nicNumber=${nicNumber}`,
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
          endDate: policy.policyEndDate,
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

  useEffect(() => {
    const initializePolicyData = async () => {
      try {
        const storedPolicyData = await getStoredPolicyData();

        if (storedPolicyData) {
          if (storedPolicyData.fullPolicyData) {
            setPolicyDetails({
              policyID: storedPolicyData.fullPolicyData.policyID,
              policyNumber: storedPolicyData.fullPolicyData.policyNumber,
              policyPeriod: storedPolicyData.fullPolicyData.policyPeriod,
              type: storedPolicyData.fullPolicyData.type,
              endDate: storedPolicyData.fullPolicyData.endDate, // This should already be formatted if stored properly
            });
          }

          setIsFirstTime(false);

          // Fetch employee info
          await fetchEmployeeInfo();
          await fetchPolicyInfo();
          const count = await fetchMembersCount();
          setMembersCount(count);

          // Only check for stored member name, don't auto-fetch all members
          const storedMemberName = await SecureStore.getItemAsync(
            "selected_member_name"
          );
          if (storedMemberName) {
            // If there's a stored member name, fetch members to restore selection
            await fetchMembers();
          }

          // Fetch dependents for health card display
          const dependentsData = await fetchDependentsWithoutEmployee();
          setDependents(dependentsData);
        }

        await fetchPolicies();
      } catch (error) {
        console.error("Error initializing policy data:", error);
        await fetchPolicies();
      }
    };

    initializePolicyData();
  }, []);

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

      // Store NIC number in SecureStore
      if (policy.nicNumber) {
        await SecureStore.setItemAsync("user_nic", policy.nicNumber);
      }

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

      // Update state as before
      setSelectedPolicyNumber(policy.policyNumber);
      setPolicyDetails({
        policyID: policy.policyID,
        policyNumber: policy.policyNumber,
        policyPeriod: policy.policyPeriod,
        type: policy.type,
        endDate: formatDate(policy.endDate),
      });
      setIsFirstTime(false);

      // Clear member selection when policy changes
      await clearMemberSelection();
      setMembers([]);

      Animated.timing(policySelectSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPolicySelection(false);
      });

      await fetchEmployeeInfo();
      await fetchPolicyInfo();
      const count = await fetchMembersCount();
      setMembersCount(count);

      const dependentsData = await fetchDependentsWithoutEmployee();
      setDependents(dependentsData);
    } catch (error) {
      console.error("Error storing policy data:", error);
      Alert.alert("Error", "Failed to save policy data. Please try again.");
    }
  };

  const fetchMembersCount = async () => {
    try {
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!policyNumber || !memberNumber) {
        return 0;
      }

      const response = await fetch(
        `${API_BASE_URL}/Dependents/WithEmployee?policyNo=${policyNumber}&memberNo=${memberNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

      const membersData = await response.json();
      return membersData.length;
    } catch (error) {
      console.error("Error fetching members count:", error);
      return 0;
    }
  };

  const clearMemberSelection = async () => {
    try {
      await SecureStore.deleteItemAsync("selected_member_complete");
      setSelectedMember(null);
    } catch (error) {
      console.error("Error clearing member selection:", error);
    }
  };

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
                    policyNumber: policyNumber,
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

              // If API call was successful, proceed with local cleanup
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
                setEmployeeInfo(null); // Clear employee info
                setMembers([]); // Clear members
                setSelectedMember(null); // Clear selected member

                // Clear stored policy data
                await clearStoredPolicyData();
                console.log("Cleared stored policy data");
              }

              // If no policies left, close modal
              if (updatedPolicies.length === 0) {
                handleClosePolicySelection();
              }

              // Show success message
              Alert.alert("Success", "Policy deleted successfully.");
            } catch (error) {
              console.error("Error deleting policy:", error);
              Alert.alert(
                "Error",
                "Failed to delete policy. Please check your connection and try again."
              );
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

  const handleTypePress = async (type) => {
    // Remove newline characters and normalize the type string
    const normalizedType = type.replace(/\n/g, " ").trim();

    console.log("Button pressed:", type);
    console.log("Normalized type:", normalizedType);

    if (normalizedType === "New Claim") {
      console.log("Opening New Claim modal");

      // Check if a member is selected for New Claim
      if (!selectedMember) {
        Alert.alert(
          "Member Selection Required",
          "Please select a member from the dropdown before creating a New Claim.",
          [{ text: "OK" }]
        );
        return;
      }

      // Verify member data is stored in SecureStore
      try {
        const storedMemberData = await SecureStore.getItemAsync(
          "selected_member_complete"
        );
        if (!storedMemberData) {
          Alert.alert(
            "Member Selection Required",
            "Please select a member from the dropdown before creating a New Claim.",
            [{ text: "OK" }]
          );
          return;
        }

        const memberData = JSON.parse(storedMemberData);
        console.log("Member data for New Claim:", memberData);

        // Proceed to open New Claim modal
        setModalVisible(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error("Error checking member data:", error);
        Alert.alert(
          "Error",
          "Unable to verify member selection. Please select a member again.",
          [{ text: "OK" }]
        );
      }
    } else if (normalizedType === "Saved Claims") {
      console.log("Saved Claims pressed");

      // Remove member selection requirement - directly open Saved Claims
      setShowPendingIntimations(true);
      Animated.timing(pendingIntimationsSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (normalizedType === "Claim History") {
      console.log("Claim History pressed");

      // Remove member selection requirement - directly open Claim History
      setShowClaimHistory(true);
      Animated.timing(claimHistorySlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (normalizedType === "Pending Requirement") {
      console.log("Pending Requirement pressed");

      // Remove member selection requirement - directly open Pending Requirement
      setShowPendingRequirement(true);
      Animated.timing(pendingRequirementSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
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

  const handleCloseClaimHistory = () => {
    Animated.timing(claimHistorySlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowClaimHistory(false);
    });
  };

  const handleClosePendingRequirement = () => {
    Animated.timing(pendingRequirementSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPendingRequirement(false);
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
  };

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleMemberSelect = async (member) => {
    setSelectedMember(member);
    setShowMemberDropdown(false);

    try {
      // Get existing policy data
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );
      const storedNic = await SecureStore.getItemAsync("user_nic");

      // Create combined data object
      const combinedMemberData = {
        memberNumber: memberNumber,
        policyNumber: policyNumber,
        storedNic: storedNic,
        memberName: member.name,
      };

      // Store combined data in SecureStore
      await SecureStore.setItemAsync(
        "selected_member_complete",
        JSON.stringify(combinedMemberData)
      );

      // Also store just the member name for backward compatibility
      await SecureStore.setItemAsync("selected_member_name", member.name);

      console.log("Stored data:", combinedMemberData);
      console.log("Complete member data stored successfully");
    } catch (error) {
      console.error("Error storing member data:", error);
    }
  };

  const toggleMemberDropdown = async () => {
    if (!showMemberDropdown) {
      // Only fetch members when opening the dropdown for the first time
      if (members.length === 0) {
        await fetchMembers();
      }
    }
    setShowMemberDropdown(!showMemberDropdown);
  };

  const showPolicySelectionModal = () => {
    setShowPolicySelection(true);
    Animated.timing(policySelectSlideAnim, {
      toValue: 0,
      duration: 100,
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

  // Function to display member name or "No data found"
  const displayMemberName = () => {
    if (isLoadingEmployeeInfo) {
      return "Loading...";
    }
    if (employeeInfo && employeeInfo.memberName) {
      return employeeInfo.memberName;
    }
    return "No User";
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
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
              <Text style={styles.userName}>{displayMemberName()}</Text>
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
                  {selectedMember ? selectedMember.name : "Select a Member"}
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
                    {membersCount.toString().padStart(2, "0")}
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
                {isLoadingMembers ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading members...</Text>
                  </View>
                ) : members.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No members found</Text>
                  </View>
                ) : (
                  members.map((member) => (
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
                        <Text style={styles.dropdownMemberName}>
                          {member.name}
                        </Text>
                        <Text style={styles.dropdownMemberRelationship}>
                          {member.relationship}
                        </Text>
                      </View>
                      {selectedMember?.id === member.id && (
                        <Icon name="check" size={16} color="#16858D" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
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
            {/* Company Name Overlay - Add this new overlay */}
            <View style={styles.companyNameOverlay}>
              <Text style={styles.companyNameOnCard}>
                {isLoadingPolicyInfo ? "Loading..." : policyInfo?.name || "N/A"}
              </Text>
            </View>
            {/* Employee Name Overlay - First Position */}
            <View style={styles.employeeNameOverlay}>
              <Text style={styles.memberNameOnCard}>{displayMemberName()}</Text>
            </View>
            {/* Dependent Names Overlay - Second Position */}
            <View style={styles.dependentNamesOverlay}>
              {dependents.map((dependent, index) => (
                <Text key={index} style={styles.dependentNameOnCard}>
                  {dependent.dependentName}
                </Text>
              ))}
            </View>
            <View style={styles.memberNumberOverlay}>
              <Text style={styles.cardDataText}>
                {employeeInfo?.memberNumber || policyDetails?.policyID || "N/A"}
              </Text>
            </View>
            <View style={styles.policyNumberOverlay}>
              <Text style={styles.cardDataText}>
                {policyDetails?.policyNumber || "N/A"}
              </Text>
            </View>
            <View style={styles.endDateOverlay}>
              <Text style={styles.cardDataText}>
                {policyDetails?.endDate || "N/A"}
              </Text>
            </View>
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
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={handleCloseModal}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <Animated.View
            style={[
              styles.animatedModal,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <ClaimTypeSelection onClose={handleCloseModal} />
          </Animated.View>
        </Modal>
        {/* PendingIntimations Modal */}
        <View style={{ backgroundColor: "" }}>
          <Modal
            visible={showPendingIntimations}
            style={{ minHeight: 200 }}
            transparent
            animationType="none"
            onRequestClose={handleClosePendingIntimations}
          >
            <TouchableOpacity
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={handleClosePendingIntimations}
            />
            <Animated.View
              style={[
                styles.animatedModal,
                { transform: [{ translateY: pendingIntimationsSlideAnim }] },
              ]}
            >
              <PendingIntimations onClose={handleClosePendingIntimations} />
            </Animated.View>
          </Modal>
        </View>
        {/* Claim History Modal */}
        <Modal
          visible={showClaimHistory}
          transparent
          animationType="none"
          onRequestClose={handleCloseClaimHistory}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleCloseClaimHistory}
          />
          <Animated.View
            style={[
              styles.animatedModal,
              { transform: [{ translateY: claimHistorySlideAnim }] },
            ]}
          >
            <ClaimHistory onClose={handleCloseClaimHistory} />
          </Animated.View>
        </Modal>

        {/* Pending Requirement Modal */}
        <Modal
          visible={showPendingRequirement}
          transparent
          animationType="none"
          onRequestClose={handleClosePendingRequirement}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleClosePendingRequirement}
          />
          <Animated.View
            style={[
              styles.animatedModal,
              { transform: [{ translateY: pendingRequirementSlideAnim }] },
            ]}
          >
            <PendingRequirement onClose={handleClosePendingRequirement} />
          </Animated.View>
        </Modal>
      </LinearGradient>
    // {/* </SafeAreaView> */}
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
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
    paddingTop: 30,
    paddingBottom: 20,
  },
  logoContainer: {
    marginLeft: 10,
    marginTop:10
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 15,
    display: "flex",
    justifyContent: "center",
  },
  logo: {
    width: 150,
    height: 50,
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
    justifyContent: "right",
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
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },
  employeeNameOverlay: {
    position: "absolute",
    top: "29.5%",
    left: "31%",
    alignItems: "flex-start",
  },

  dependentNamesOverlay: {
    position: "absolute",
    top: "38%",
    left: "31%",
    alignItems: "flex-start",
  },
  companyNameOverlay: {
    position: "absolute",
    top: "91%",
    left: "31%",
  },
  companyNameOnCard: {
    fontSize: 9,
    color: "#000",
    textAlign: "center",
  },

  memberNameOnCard: {
    color: "#000",
    fontSize: 9,
    marginBottom: 4,
  },

  dependentNameOnCard: {
    color: "#000",
    fontSize: 9,
    marginBottom: 0,
  },
  memberNumberOverlay: {
    position: "absolute",
    top: "75.5%",
    left: "31%",
    alignItems: "flex-start",
  },
  policyNumberOverlay: {
    position: "absolute",
    top: "83.5%",
    left: "31%",
    alignItems: "flex-start",
  },
  endDateOverlay: {
    position: "absolute",
    top: "75.5%",
    left: "71%",
    alignItems: "flex-start",
  },

  cardDataText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "500",
  },
  healthCard: {
    width: screenWidth * 0.9,
    height: 200,
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
    shadowOpacity: 0.1,
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
    height: "65%",
    backgroundColor: "transparent",
  },
});
