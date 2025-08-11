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
  View
} from "react-native";

import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";
import ClaimHistory from "./ClaimHistory";
import ClaimTypeSelection from "./NewClaim.jsx";
import PendingIntimations from "./PendingIntimations";
import PendingRequirement from "./PendingRequirement";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

export default function PolicyHome({ route }) {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [policyDetails, setPolicyDetails] = useState(null);
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [showPolicySelection, setShowPolicySelection] = useState(false);
  const [policySelectSlideAnim] = useState(new Animated.Value(1000));
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
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

  // Add new loading state for policy selection
  const [isLoadingPolicySelection, setIsLoadingPolicySelection] =
    useState(false);

  useEffect(() => {
    if (route?.params?.showPendingIntimations) {
      // Clear the parameter to prevent repeated triggers
      navigation.setParams({ showPendingIntimations: undefined });

      // Show PendingIntimations modal with animation
      setTimeout(() => {
        setShowPendingIntimations(true);
        Animated.timing(pendingIntimationsSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 100); // Small delay to ensure component is ready
    }
  }, [route?.params?.showPendingIntimations]);

  useFocusEffect(
    React.useCallback(() => {
      const refreshPageData = async () => {
        try {
          // Check if we should refresh (you can set a flag in SecureStore when navigating)
          const shouldRefresh = await SecureStore.getItemAsync(
            "should_refresh_home"
          );

          // Also check for refresh parameter from navigation
          const shouldRefreshFromNav = route?.params?.refreshPendingClaims;

          if (shouldRefresh === "true" || shouldRefreshFromNav) {
            // Clear the refresh flag
            await SecureStore.deleteItemAsync("should_refresh_home");

            // Clear navigation parameter
            if (shouldRefreshFromNav) {
              navigation.setParams({ refreshPendingClaims: undefined });
            }

            // Show loading and refresh all data
            setIsLoadingPolicySelection(true);

            await Promise.all([
              fetchEmployeeInfo(),
              fetchPolicyInfo(),
              refreshMembersData(),
              refreshDependentsData(),
            ]);

            const storedMemberName = await SecureStore.getItemAsync(
              "selected_member_name"
            );
            if (storedMemberName && members.length > 0) {
              await fetchMembers();
            }

            await fetchPolicies();
            setIsLoadingPolicySelection(false);

            console.log("Page refreshed after navigation");
          }
        } catch (error) {
          console.error("Error refreshing page data:", error);
          setIsLoadingPolicySelection(false);
        }
      };

      refreshPageData();
    }, [route?.params?.refreshPendingClaims])
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

      // Handle 404 error specifically
      if (response.status === 404) {
        console.log("Members not found (404), disabling dropdown");
        setMembers([]);
        setMembersCount(0);
        setIsDropdownDisabled(true); // Add this state variable
        return;
      }

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
      setIsDropdownDisabled(false); // Enable dropdown when data is available

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
      // Set empty members array on error and disable dropdown
      setMembers([]);
      setIsDropdownDisabled(true);
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

      // Handle 404 error silently
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const dependentsData = await response.json();
      return dependentsData;
    } catch (error) {
      // Only log, don't show error message to user
      console.log("Dependents data not available or API error occurred");
      return [];
    }
  };

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

      // Handle 404 and 500 errors silently
      if (response.status === 404 || response.status === 500) {
        setEmployeeInfo(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const employeeData = await response.json();
      setEmployeeInfo(employeeData);
    } catch (error) {
      // Only log error, don't show alert for 404s
      console.log("Employee info not available or API error occurred");
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
        setIsLoadingPolicySelection(true);
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

          // Fetch all data simultaneously
          await Promise.all([
            fetchEmployeeInfo(),
            fetchPolicyInfo(),
            refreshMembersData(),
            refreshDependentsData(),
          ]);

          // Only check for stored member name, don't auto-fetch all members
          const storedMemberName = await SecureStore.getItemAsync(
            "selected_member_name"
          );
          if (storedMemberName) {
            // If there's a stored member name, fetch members to restore selection
            await fetchMembers();
          }
        }

        await fetchPolicies();
      } catch (error) {
        console.error("Error initializing policy data:", error);
        await fetchPolicies();
      } finally {
        setIsLoadingPolicySelection(false);
      }
    };

    initializePolicyData();
  }, []);

  const handlePolicySelection = async (policy) => {
    try {
      // Show loading state
      setIsLoadingPolicySelection(true);

      // 1. Clear all existing data first
      await clearAllData();

      // 2. Store new policy data in SecureStore
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

      // Store additional policy data
      await SecureStore.setItemAsync(
        "selected_policy_id",
        policy.policyID.toString()
      );
      await SecureStore.setItemAsync(
        "selected_policy_period",
        policy.policyPeriod
      );
      await SecureStore.setItemAsync("selected_policy_type", policy.type);

      // Store the full policy data as JSON string
      await SecureStore.setItemAsync(
        "selected_policy_data",
        JSON.stringify(policy)
      );

      // 3. Update policy-related state
      setSelectedPolicyNumber(policy.policyNumber);
      setPolicyDetails({
        policyID: policy.policyID,
        policyNumber: policy.policyNumber,
        policyPeriod: policy.policyPeriod,
        type: policy.type,
        endDate: formatDate(policy.endDate),
      });
      setIsFirstTime(false);

      // 4. Close the policy selection modal first
      Animated.timing(policySelectSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPolicySelection(false);
      });

      // 5. Fetch all fresh data for the new policy simultaneously
      await Promise.all([
        fetchEmployeeInfo(),
        fetchPolicyInfo(),
        refreshMembersData(),
        refreshDependentsData(),
      ]);

      console.log("Policy selection completed and all data refreshed");
    } catch (error) {
      console.error("Error during policy selection:", error);
      Alert.alert("Error", "Failed to save policy data. Please try again.");
    } finally {
      setIsLoadingPolicySelection(false);
    }
  };

  // Helper function to clear all existing data
  const clearAllData = async () => {
    try {
      // Clear member selection
      await clearMemberSelection();

      // Clear all state variables
      setMembers([]);
      setSelectedMember(null);
      setMembersCount(0);
      setDependents([]);
      setEmployeeInfo(null);
      setPolicyInfo(null);
      setShowMemberDropdown(false);

      // Clear any stored member data
      await SecureStore.deleteItemAsync("selected_member_name");
      await SecureStore.deleteItemAsync("selected_member_complete");

      console.log("All data cleared successfully");
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  const refreshMembersData = async () => {
    try {
      const count = await fetchMembersCount();
      setMembersCount(count);

      // Don't automatically fetch all members - only fetch when dropdown is opened
      // This maintains the existing behavior
      console.log("Members count refreshed:", count);
    } catch (error) {
      console.error("Error refreshing members data:", error);
    }
  };

  // Helper function to refresh dependents data
  const refreshDependentsData = async () => {
    try {
      const dependentsData = await fetchDependentsWithoutEmployee();
      setDependents(dependentsData);
      console.log(
        "Dependents data refreshed:",
        dependentsData.length,
        "dependents"
      );
    } catch (error) {
      console.error("Error refreshing dependents data:", error);
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
      await SecureStore.deleteItemAsync("selected_member_name");
      setSelectedMember(null);
      setShowMemberDropdown(false);
      console.log("Member selection cleared");
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

              // If no policies left, close modal and navigate to AddPolicy
              if (updatedPolicies.length === 0) {
                handleClosePolicySelection();
                // Navigate to AddPolicy page after a short delay
                setTimeout(() => {
                  router.push("/AddPolicy");
                }, 300);
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

      // Removed member selection requirement - directly open New Claim modal
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
    // Remove these lines that set the selected member:
    // setSelectedMember(member);
    setShowMemberDropdown(false); // Only close the dropdown

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
      // Always fetch fresh members when opening the dropdown
      // This ensures we get updated data after policy selection
      await fetchMembers();
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
  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>Loading Policy Data...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Show loading screen during policy selection
  if (isLoadingPolicySelection) {
    return (
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
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
            <TouchableOpacity
              style={styles.userTouchableArea}
              onPress={showPolicySelectionModal}
            >
              <Image
                source={require("../assets/images/userhome.png")}
                style={styles.userAvatar}
                resizeMode="contain"
              />
              <Text style={styles.userName}>{displayMemberName()}</Text>
              <Icon style={{ marginRight: 10 }} name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionTitle}>Policy Details</Text>
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

        <Text style={styles.sectionTitle}>Members</Text>
        <View style={styles.memberCard}>
          <TouchableOpacity
            style={styles.memberRow}
            onPress={toggleMemberDropdown}
          >
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                View Your Members {/* Always show this text */}
              </Text>
              {/* Remove the conditional rendering of relationship */}
            </View>
            <View style={styles.memberActions}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>Total : </Text>
                <Text style={styles.totalNumber}>
                  {membersCount.toString().padStart(2, "0")}
                </Text>
              </View>
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
                    style={styles.dropdownItem} // Remove selected styling
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
                    {/* Remove the check icon */}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Type</Text>
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

        <Text style={styles.sectionTitle}>Health Card</Text>
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
  // Loading overlay styles
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    elevation: 10,
    minWidth: 250,
    minHeight: 200,
  },
  // Custom loading icon styles
  customLoadingIcon: {
    marginBottom: 20,
  },
  loadingIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16858D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#6DD3D3",
  },
  loadingIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#17ABB7",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
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
    display: 'flex',
    alignItems: 'left'
  }, userTouchableArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 15, marginTop: 15,
    display: "flex",
    justifyContent: "left",
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
    backgroundColor: 'white',
    width: '100%',
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 30,
    marginLeft: 10,
    height: 30,
    borderRadius: 15,
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 10,
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
    borderRadius: 10,
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
    // borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 10,
    marginBottom: 15,
  },
  insuranceCard: {
    backgroundColor: "#ffffff",
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
    fontSize: 14,
    color: "black",
    marginBottom: 5,
  },
  boldText: {
    fontWeight: "bold",
    color: "black",
    fontSize: 14,
  },
  moreButton: {
    alignSelf: "flex-end",
    marginTop: 10,
    backgroundColor: "#16858D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#16858D",
  },
  moreText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  // Empty state styles
  emptyContainer: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
