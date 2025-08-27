import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

import { API_BASE_URL } from "../constants/index.js";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

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
          <Icon name="heartbeat" size={20} color="#FFFFFF" />
        </View>
      </View>
    </Animated.View>
  );
};

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContainer}>
      <LoadingIcon />
      <Text style={styles.loadingText}>Loading Document Types...</Text>
      <Text style={styles.loadingSubText}>Please wait a moment</Text>
    </View>
  </View>
);

// Fixed CustomPopup Component
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
          onPress={showConfirmButton ? undefined : onClose}
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
                onPress={() => {
                  if (onConfirm) {
                    onConfirm(); // This calls the confirm function (e.g., delete)
                  }
                }}
              >
                <Text style={styles.popupConfirmButtonText}>Yes</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.popupButton,
                showConfirmButton
                  ? styles.popupCancelButton
                  : styles.popupOkButton,
              ]}
              onPress={() => {
                if (showConfirmButton) {
                  // This is the "No" button - just close the popup
                  onClose();
                } else {
                  // This is the single "Ok" button - call onConfirm if it exists, otherwise onClose
                  if (onConfirm) {
                    onConfirm(); // This will run navigation logic for success popups
                  } else {
                    onClose(); // Fallback to just closing
                  }
                }
              }}
            >
              <Text
                style={[
                  showConfirmButton
                    ? styles.popupCancelButtonText
                    : styles.popupOkButtonText,
                ]}
              >
                {showConfirmButton ? "No" : "Ok"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const UploadDocuments = ({ route }) => {
  const navigation = useNavigation();
  const {
    memberNo = "",
    policyNo = "",
    patientData: initialPatientData = {},
    claimId = "",
    patientName = "",
    illness = "",
    claimType = "",
    currentClaimAmount = "0.00",
    fromEditClaim = false,
    referenceNo = "",
  } = route?.params || {};

  const patientData = route?.params?.patientData || {};
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [amount, setAmount] = useState("");
  const [documentDate, setDocumentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDocumentType, setEditDocumentType] = useState("");
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storedReferenceNo, setStoredReferenceNo] = useState("");
  const [storedNic, setStoredNic] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [storedPatientName, setStoredPatientName] = useState("");
  const [storedClaimType, setStoredClaimType] = useState("");
  const [storedIllness, setStoredIllness] = useState("");
  const [actualClaimAmount, setActualClaimAmount] = useState("0.00");
  const [claimAmountLoading, setClaimAmountLoading] = useState(false);
  const [isEditPatientModalVisible, setEditPatientModalVisible] =
    useState(false);
  const [editPatientData, setEditPatientData] = useState({
    referenceNo: "",
    patientName: "",
    illness: "",
  });
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDependents = async () => {
    try {
      setLoadingMembers(true);
      console.log("Fetching dependents data...");

      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!policyNumber || !memberNumber) {
        console.log("Policy number or member number not found in SecureStore");
        setMemberOptions([]);
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

      const dependentsData = await response.json();
      console.log("Dependents API response:", dependentsData);

      const transformedMembers = dependentsData.map((dependent, index) => ({
        id: index + 1,
        name: dependent.dependentName,
        relationship:
          dependent.relationship === "Employee"
            ? "Self"
            : dependent.relationship,
        memberCode: dependent.memberCode,
        birthDay: dependent.depndentBirthDay,
        effectiveDate: dependent.effectiveDate,
      }));

      setMemberOptions(transformedMembers);
      console.log("Transformed member options:", transformedMembers);
    } catch (error) {
      console.error("Error fetching dependents:", error);
      showPopup(
        "Error",
        "Failed to load member information. Please try again.",
        "error"
      );
      setMemberOptions([
        { id: 1, name: "Unknown Member", relationship: "Self" },
      ]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const formatAmountWithCommas = (amount) => {
    if (!amount) return "";

    // Remove any existing commas and non-numeric characters except decimal point
    const cleanAmount = amount.toString().replace(/[^0-9.]/g, "");

    // Split into integer and decimal parts
    const parts = cleanAmount.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add thousand separators to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Return formatted amount
    if (decimalPart !== undefined) {
      return `${formattedInteger}.${decimalPart}`;
    }
    return formattedInteger;
  };

  const removeCommasFromAmount = (amount) => {
    if (!amount) return "";
    return amount.toString().replace(/,/g, "");
  };

  const updateIntimationAPI = async (patientInfo) => {
    try {
      console.log("Updating intimation via API:", patientInfo);

      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );
      const storedMobile = await SecureStore.getItemAsync("user_mobile");
      const storedNic = await SecureStore.getItemAsync("user_nic");

      if (!policyNumber || !memberNumber || !storedMobile || !storedNic) {
        throw new Error("Required user information not found in storage");
      }

      const updateIntimationData = {
        policyNo: policyNumber,
        memId: memberNumber,
        contactNo: storedMobile,
        createdBy: storedNic,
        indOut: "O",
        patientName: patientInfo.patientName,
        illness: patientInfo.illness,
        relationship: selectedMember?.relationship || "Self",
        claimSeqNo: patientInfo.referenceNo,
      };

      console.log("Update intimation request data:", updateIntimationData);

      const response = await fetch(`${API_BASE_URL}/UpdateIntimation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateIntimationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update Intimation API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Update intimation API response:", result);
      return result;
    } catch (error) {
      console.error("Error updating intimation via API:", error);
      throw error;
    }
  };

  const handleEditPatientInfo = () => {
    setEditPatientData({
      referenceNo: storedReferenceNo || referenceNo || "",
      patientName: storedPatientName || patientName || "",
      illness: storedIllness || illness || "",
    });

    const currentMember = memberOptions.find(
      (member) => member.name === (storedPatientName || patientName)
    );
    setSelectedMember(currentMember);

    if (memberOptions.length === 0) {
      fetchDependents();
    }

    setEditPatientModalVisible(true);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setEditPatientData((prev) => ({
      ...prev,
      patientName: member.name,
    }));
    setDropdownVisible(false);
  };

  const handleSavePatientEdit = async () => {
    try {
      if (!editPatientData.patientName || !editPatientData.illness) {
        showPopup(
          "Validation Error",
          "Patient name and illness are required.",
          "warning"
        );
        return;
      }

      if (editPatientData.illness.trim() === "") {
        showPopup(
          "Validation Error",
          "Illness field cannot be empty.",
          "warning"
        );
        return;
      }

      console.log("Saving patient edit with API integration...");

      await updateIntimationAPI(editPatientData);

      setStoredPatientName(editPatientData.patientName);
      setStoredIllness(editPatientData.illness);

      await SecureStore.setItemAsync(
        "stored_patient_name",
        editPatientData.patientName
      );
      await SecureStore.setItemAsync(
        "stored_illness_description",
        editPatientData.illness
      );

      setEditPatientModalVisible(false);
      setDropdownVisible(false);
      setSelectedMember(null);
      setEditPatientData({
        referenceNo: "",
        patientName: "",
        illness: "",
      });

      showPopup(
        "Success",
        "Patient information updated successfully!",
        "success"
      );

      console.log("Patient edit saved successfully with API integration");
    } catch (error) {
      console.error("Error in handleSavePatientEdit:", error);

      if (error.message.includes("Required user information not found")) {
        showPopup(
          "Authentication Error",
          "User information not found. Please logout and login again.",
          "error"
        );
      } else if (error.message.includes("404")) {
        showPopup(
          "Not Found Error",
          "The claim could not be found in the system. Please refresh and try again.",
          "error"
        );
      } else if (error.message.includes("400")) {
        showPopup(
          "Validation Error",
          "Please check your input data and try again.",
          "error"
        );
      } else if (error.message.includes("500")) {
        showPopup(
          "Server Error",
          "Server is currently unavailable. Please try again later.",
          "error"
        );
      } else {
        showPopup(
          "Update Error",
          `Failed to update patient information: ${error.message}`,
          "error"
        );
      }
    }
  };

  // Fixed success popup in handleDeletePatientInfo
  const handleDeletePatientInfo = () => {
    showPopup(
      "Delete Claim",
      "Are you sure you want to delete this Claim? This action cannot be undone.",
      "warning",
      true, // showConfirmButton = true
      async () => {
        // This function only runs when "Yes" is clicked
        try {
          console.log("Deleting claim:", storedReferenceNo);

          // Validate reference number
          if (!storedReferenceNo) {
            hidePopup();
            showPopup("Error", "Claim reference number not found.", "error");
            return;
          }

          // Prepare API request data
          const deleteClaimData = {
            claimNo: storedReferenceNo,
          };

          console.log("Delete claim request data:", deleteClaimData);

          // Call the Delete Claim API
          const response = await fetch(
            `${API_BASE_URL}/DeleteClaim/DeleteClaim`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(deleteClaimData),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Delete Claim API Error Response:", errorText);
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorText}`
            );
          }

          const result = await response.json();
          console.log("Delete claim API response:", result);

          // Clear stored data after successful deletion
          try {
            await SecureStore.deleteItemAsync("stored_patient_name");
            await SecureStore.deleteItemAsync("stored_illness_description");
            await SecureStore.deleteItemAsync("stored_claim_type");
            await SecureStore.deleteItemAsync("stored_claim_seq_no");
            await SecureStore.deleteItemAsync("edit_referenceNo");
            await SecureStore.deleteItemAsync("edit_claimType");
            await SecureStore.deleteItemAsync("edit_createdOn");
            await SecureStore.deleteItemAsync("edit_enteredBy");
            await SecureStore.deleteItemAsync("edit_relationship");
            await SecureStore.deleteItemAsync("edit_illness");
            await SecureStore.deleteItemAsync("edit_beneficiary_amount");
            await SecureStore.deleteItemAsync("referenNo");

            // Reset state variables
            setStoredPatientName("");
            setStoredIllness("");
            setStoredClaimType("");
            setStoredReferenceNo("");
            setActualClaimAmount("0.00");
          } catch (storageError) {
            console.warn("Error clearing stored data:", storageError);
          }

          // Hide current popup first
          hidePopup();

          // Show success popup with navigation in the onConfirm callback
          showPopup(
            "Success",
            "Claim has been deleted successfully.",
            "success",
            false, // showConfirmButton = false (single OK button)
            () => {
              // This function runs when user clicks OK button
              hidePopup();

              // Navigate to home page
              try {
                // Check which home screen name exists in your navigation
                const routeNames = navigation.getState()?.routeNames || [];

                if (routeNames.includes("Home")) {
                  navigation.navigate("Home");
                } else if (routeNames.includes("home")) {
                  navigation.navigate("home");
                } else if (routeNames.includes("HomeScreen")) {
                  navigation.navigate("HomeScreen");
                } else if (routeNames.includes("Dashboard")) {
                  navigation.navigate("Dashboard");
                } else {
                  // Fallback: reset to the first screen
                  navigation.reset({
                    index: 0,
                    routes: [{ name: routeNames[0] || "Home" }],
                  });
                }

                console.log(
                  "Successfully navigated to home page after deletion"
                );
              } catch (navError) {
                console.error("Navigation error after deletion:", navError);
                // Ultimate fallback
                navigation.popToTop();
              }
            }
          );

          console.log("Claim deleted successfully");
        } catch (error) {
          console.error("Error deleting claim:", error);

          hidePopup();
          // Handle different types of errors
          if (error.message.includes("404")) {
            showPopup(
              "Not Found",
              "The claim could not be found in the system. It may have already been deleted.",
              "error",
              false,
              () => {
                hidePopup();
                // Navigate to homepage even if claim not found
                try {
                  navigation.navigate("Home");
                } catch (navError) {
                  navigation.popToTop();
                }
              }
            );
          } else if (error.message.includes("400")) {
            showPopup(
              "Invalid Request",
              "The claim could not be deleted. Please check the claim details and try again.",
              "error"
            );
          } else if (error.message.includes("500")) {
            showPopup(
              "Server Error",
              "Server is currently unavailable. Please try again later.",
              "error"
            );
          } else if (
            error.message.includes("Network request failed") ||
            error.message.includes("fetch")
          ) {
            showPopup(
              "Network Error",
              "Unable to connect to the server. Please check your internet connection and try again.",
              "error"
            );
          } else {
            showPopup(
              "Delete Error",
              `Failed to delete claim: ${error.message}\n\nPlease try again or contact support if the problem persists.`,
              "error"
            );
          }
        }
      }
    );
  };

  // Popup state
  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    showConfirmButton: false,
    onConfirm: null,
  });

  // Sample images with local image sources
  const [sampleImages] = useState([
    {
      id: 1,
      source: require("../assets/images/sample1.jpg"),
      description: "Medical Bill Sample",
    },
    {
      id: 2,
      source: require("../assets/images/sample2.jpg"),
      description: "Prescription Sample",
    },
    {
      id: 3,
      source: require("../assets/images/sample3.jpg"),
      description: "Diagnosis Report Sample",
    },
  ]);

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

  // FETCH CLAIM AMOUNT FROM API
  const fetchClaimAmountFromAPI = async (referenceNo) => {
    try {
      setClaimAmountLoading(true);
      console.log(
        "Fetching claim amount from API for referenceNo:",
        referenceNo
      );

      if (!referenceNo || referenceNo.trim() === "") {
        console.warn("Invalid referenceNo provided:", referenceNo);
        setActualClaimAmount("0.00");
        return "0.00";
      }

      const requestBody = {
        seqNo: referenceNo.trim(),
      };

      const response = await fetch(
        `${API_BASE_URL}/ClaimAmount/GetClaimAmount`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("No claim amount found for referenceNo:", referenceNo);
          setActualClaimAmount("0.00");
          return "0.00";
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Claim Amount API Response:", data);

      let claimAmount = "0.00";

      if (data && typeof data === "object") {
        if (data.claimAmount !== undefined && data.claimAmount !== null) {
          claimAmount = data.claimAmount.toString();
        } else if (data.amount !== undefined && data.amount !== null) {
          claimAmount = data.amount.toString();
        } else if (
          data.totalAmount !== undefined &&
          data.totalAmount !== null
        ) {
          claimAmount = data.totalAmount.toString();
        }
      } else if (typeof data === "number" || typeof data === "string") {
        claimAmount = data.toString();
      }

      const formattedAmount = claimAmount.includes(".")
        ? claimAmount
        : `${claimAmount}.00`;

      // Format with commas for display
      const displayAmount = formatAmountWithCommas(formattedAmount);
      console.log("Formatted claim amount with commas:", displayAmount);
      setActualClaimAmount(displayAmount);
      return displayAmount;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      setActualClaimAmount("0.00");
      return "0.00";
    } finally {
      setClaimAmountLoading(false);
    }
  };

  const toSentenceCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/RequiredDocumentsCon/Outdoor`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch document types");
        }

        const data = await response.json();
        const transformedDocumentTypes = data.map((doc) => ({
          id: doc.docId,
          label: toSentenceCase(doc.docDesc), // Apply sentence case here
          icon: getIconForDocType(doc.docDesc),
        }));

        setDocumentTypes(transformedDocumentTypes);
      } catch (error) {
        console.error("Error fetching document types:", error);
        showPopup(
          "Error",
          "Failed to load document types. Please try again.",
          "error"
        );

        // Fallback to hardcoded types if API fails - also apply sentence case
        setDocumentTypes([
          { id: "O01", label: toSentenceCase("BILL"), icon: "receipt-outline" },
          {
            id: "O02",
            label: toSentenceCase("PRESCRIPTION"),
            icon: "medical-outline",
          },
          {
            id: "O03",
            label: toSentenceCase("DIAGNOSIS CARD"),
            icon: "document-text-outline",
          },
          { id: "O04", label: toSentenceCase("OTHER"), icon: "folder-outline" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, []);

  // LOAD STORED VALUES AND FETCH CLAIM AMOUNT
  useEffect(() => {
    const loadStoredValues = async () => {
      try {
        const referenceNoFromStore = await SecureStore.getItemAsync(
          "stored_claim_seq_no"
        );
        const nic = await SecureStore.getItemAsync("user_nic");
        const storedPatientNameFromStore = await SecureStore.getItemAsync(
          "stored_patient_name"
        );
        const storedClaimTypeFromStore = await SecureStore.getItemAsync(
          "stored_claim_type"
        );
        const storedIllnessFromStore = await SecureStore.getItemAsync(
          "stored_illness_description"
        );

        // Determine the reference number to use
        const finalReferenceNo = referenceNo || referenceNoFromStore || "";

        setStoredReferenceNo(finalReferenceNo);
        setStoredNic(nic || "");
        setStoredPatientName(patientName || storedPatientNameFromStore || "");
        setStoredClaimType(claimType || storedClaimTypeFromStore || "");
        setStoredIllness(illness || storedIllnessFromStore || "");

        console.log("Loaded stored values:", {
          referenceNo: finalReferenceNo,
          nic,
          patientName: patientName || storedPatientNameFromStore,
          claimType: claimType || storedClaimTypeFromStore,
          illness: illness || storedIllnessFromStore,
          fromEditClaim: fromEditClaim,
          passedCurrentClaimAmount: currentClaimAmount,
        });

        // FETCH ACTUAL CLAIM AMOUNT FROM API
        if (finalReferenceNo) {
          await fetchClaimAmountFromAPI(finalReferenceNo);
        } else {
          setActualClaimAmount("0.00");
        }
      } catch (error) {
        console.error("Error loading stored values:", error);
        setActualClaimAmount("0.00");
      }
    };

    loadStoredValues();
  }, [patientName, claimType, illness, referenceNo]);

  // USE FOCUS EFFECT TO REFRESH CLAIM AMOUNT WHEN SCREEN IS FOCUSED
  useFocusEffect(
    useCallback(() => {
      const refreshClaimAmount = async () => {
        if (fromEditClaim) {
          console.log(
            "Screen focused from EditClaim, refreshing claim amount..."
          );
          const refNo = referenceNo || storedReferenceNo;
          if (refNo) {
            await fetchClaimAmountFromAPI(refNo);
          }
        }
      };

      refreshClaimAmount();
    }, [fromEditClaim, referenceNo, storedReferenceNo])
  );

  const formatDateForAPI = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const createFormDataForDocument = async (document) => {
    const formData = new FormData();

    const fileUri = document.uri;
    const fileName = document.name;
    const fileType = document.type || "image/jpeg";

    formData.append("ImgContent", {
      uri: fileUri,
      type: fileType,
      name: fileName,
    });

    formData.append("ClmSeqNo", storedReferenceNo);
    formData.append("DocType", document.documentType);
    formData.append("ImgName", fileName);
    formData.append(
      "DocDate",
      formatDateForAPI(new Date(document.date.split("/").reverse().join("-")))
    );

    // Remove commas from amount before sending to API
    const cleanAmount = removeCommasFromAmount(document.amount);
    formData.append("DocAmount", cleanAmount);
    formData.append("CreatedBy", storedNic);

    return formData;
  };

  const getIconForDocType = (docDesc) => {
    switch (docDesc.toUpperCase()) {
      case "BILL":
        return "receipt-outline";
      case "PRESCRIPTION":
        return "medical-outline";
      case "DIAGNOSIS CARD":
        return "document-text-outline";
      case "OTHER":
        return "folder-outline";
      default:
        return "document-outline";
    }
  };

  // UPDATED: Use actualClaimAmount from API
  const isDocumentTypeDisabled = (docTypeId) => {
    if (docTypeId === "O01") {
      // Remove commas before parsing
      const cleanAmount = removeCommasFromAmount(actualClaimAmount || "0");
      const beneficiaryAmount = parseFloat(cleanAmount);
      console.log("Checking BILL disable condition:", {
        docTypeId,
        actualClaimAmount,
        cleanAmount,
        beneficiaryAmount,
        isDisabled: beneficiaryAmount > 0,
      });
      return beneficiaryAmount > 0;
    }
    return false;
  };

  const handleDocumentTypeSelect = (type) => {
    if (isDocumentTypeDisabled(type)) {
      const currentAmount = parseFloat(actualClaimAmount || "0");
      showPopup(
        "Document Type Not Available",
        `Bill document type is not available when the current claim amount is Rs ${currentAmount.toFixed(
          2
        )}. Only non-bill documents can be added to existing claims with amounts.`,
        "warning"
      );
      return;
    }

    setSelectedDocumentType(type);
    setSelectedDocId(type);
    console.log("Selected document type ID:", type);

    // Set amount based on document type
    if (type === "O02" || type === "O03") {
      setAmount("0.00");
    } else {
      setAmount("");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || documentDate;
    setShowDatePicker(Platform.OS === "ios");
    setDocumentDate(currentDate);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAmountChange = (text) => {
    // Disable amount input for PRESCRIPTION and DIAGNOSIS CARD
    if (selectedDocumentType === "O02" || selectedDocumentType === "O03") {
      return;
    }

    // Remove commas first to get clean number
    const cleanedText = text.replace(/[^0-9.]/g, "");
    const parts = cleanedText.split(".");

    if (parts.length > 2) {
      return;
    }

    // Check if integer part exceeds 9 digits
    if (parts[0].length > 9) {
      return;
    }

    let formattedAmount = cleanedText;
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        formattedAmount = parts[0] + "." + parts[1].substring(0, 2);
      }
    }

    // Format with commas for display
    const displayAmount = formatAmountWithCommas(formattedAmount);
    setAmount(displayAmount);
  };

  const compressImage = async (imageUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeInMB = fileInfo.size / (1024 * 1024);

      console.log(`Original image size: ${fileSizeInMB.toFixed(2)} MB`);

      if (fileSizeInMB < 1) {
        console.log("Image is already under 1MB, no compression needed");
        return imageUri;
      }

      if (fileSizeInMB > 5) {
        showPopup(
          "File Too Large",
          "Image size cannot exceed 5MB. Please select a smaller image.",
          "error"
        );
        return null;
      }

      let compress = 0.8;
      if (fileSizeInMB > 3) {
        compress = 0.3;
      } else if (fileSizeInMB > 2) {
        compress = 0.5;
      } else if (fileSizeInMB > 1.5) {
        compress = 0.7;
      }

      const compressedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        {
          compress: compress,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );

      const compressedFileInfo = await FileSystem.getInfoAsync(
        compressedImage.uri
      );
      const compressedSizeInMB = compressedFileInfo.size / (1024 * 1024);

      console.log(`Compressed image size: ${compressedSizeInMB.toFixed(2)} MB`);

      return compressedImage.uri;
    } catch (error) {
      console.error("Error compressing image:", error);
      showPopup(
        "Error",
        "Failed to compress image. Please try again.",
        "error"
      );
      return null;
    }
  };

  const handleEditAmountChange = (text) => {
    if (editDocumentType === "O02" || editDocumentType === "O03") {
      return;
    }

    // Remove commas first to get clean number
    const cleanedText = text.replace(/[^0-9.]/g, "");
    const parts = cleanedText.split(".");

    if (parts.length > 2) {
      return;
    }

    // Check if integer part exceeds 9 digits
    if (parts[0].length > 9) {
      return;
    }

    let formattedAmount = cleanedText;
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        formattedAmount = parts[0] + "." + parts[1].substring(0, 2);
      }
    }

    // Format with commas for display
    const displayAmount = formatAmountWithCommas(formattedAmount);
    setEditAmount(displayAmount);
  };

  const validateAmount = (amountString) => {
    if (selectedDocumentType === "O02" || selectedDocumentType === "O03") {
      return true;
    }

    if (selectedDocumentType === "O01") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      // Remove commas before parsing
      const cleanAmount = removeCommasFromAmount(amountString);
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    if (!amountString || amountString.trim() === "") {
      return false;
    }

    // Remove commas before parsing
    const cleanAmount = removeCommasFromAmount(amountString);
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount < 0) {
      return false;
    }

    return true;
  };

  const formatAmountForDisplay = (amountString) => {
    if (!amountString) return "";

    // Remove commas first
    const cleanAmount = removeCommasFromAmount(amountString);
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) return amountString;

    // Format with commas and ensure 2 decimal places
    return formatAmountWithCommas(amount.toFixed(2));
  };

  const canAddMoreDocuments = () => {
    if (selectedDocumentType === "O01") {
      const billDocuments = uploadedDocuments.filter(
        (doc) => doc.documentType === "O01"
      );
      return billDocuments.length < 1;
    }
    return true;
  };

  // Check if file type is allowed (only jpg, jpeg, png)
  const isAllowedFileType = (mimeType, name) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".jpg", ".jpeg", ".png"];

    if (allowedTypes.includes(mimeType)) {
      return true;
    }

    // Fallback check using file extension
    const extension = name.toLowerCase().split(".").pop();
    return ["jpg", "jpeg", "png"].includes(extension);
  };

  const handleBrowseFiles = async () => {
    if (!selectedDocumentType) {
      showPopup(
        "Validation Error",
        "Please select a document type first",
        "warning"
      );
      return;
    }

    if (
      selectedDocumentType === "O01" &&
      (!amount || amount.trim() === "" || parseFloat(amount) <= 0)
    ) {
      showPopup(
        "Validation Error",
        "Please enter a valid amount greater than 0 for Bill type",
        "warning"
      );
      return;
    }

    if (!canAddMoreDocuments()) {
      showPopup(
        "Document Limit",
        "You can only upload 1 document for Bill type.",
        "warning"
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/jpg", "image/png"], // Restrict to only JPG, JPEG, PNG
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check if file type is allowed
        if (!isAllowedFileType(file.mimeType, file.name)) {
          showPopup(
            "Invalid File Type",
            "Only JPG, JPEG, and PNG files are allowed.",
            "error"
          );
          return;
        }

        let finalUri = file.uri;

        if (file.mimeType && file.mimeType.startsWith("image/")) {
          const compressedUri = await compressImage(file.uri);
          if (!compressedUri) {
            return;
          }
          finalUri = compressedUri;
        }

        const docTypeLabel =
          documentTypes.find((type) => type.id === selectedDocumentType)
            ?.label || selectedDocumentType;

        const fileExtension = file.name.split(".").pop();
        const customName = `${docTypeLabel}.${fileExtension}`;

        const newDocument = {
          id: Date.now(),
          name: customName,
          uri: finalUri,
          type: file.mimeType,
          size: file.size,
          documentType: selectedDocumentType,
          amount: formatAmountForDisplay(amount),
          date: formatDate(documentDate),
        };
        setUploadedDocuments((prev) => [...prev, newDocument]);

        setSelectedDocumentType("");
        setAmount("");
        setDocumentDate(new Date());

      }
    } catch (error) {
      console.error("Error picking document:", error);
      showPopup("Error", "Failed to pick document", "error");
    }
  };

  const handleTakePhoto = async () => {
    if (!selectedDocumentType) {
      showPopup(
        "Validation Error",
        "Please select a document type first",
        "warning"
      );
      return;
    }

    if (
      selectedDocumentType === "O01" &&
      (!amount || amount.trim() === "" || parseFloat(amount) <= 0)
    ) {
      showPopup(
        "Validation Error",
        "Please enter a valid amount greater than 0 for Bill type",
        "warning"
      );
      return;
    }

    if (!canAddMoreDocuments()) {
      showPopup(
        "Document Limit",
        "You can only upload 1 document for Bill type.",
        "warning"
      );
      return;
    }

    // Show Yes/No confirmation popup before opening camera
    showPopup(
      "Take Photo",
      "Do you want to open the camera to take a photo?",
      "info",
      true, // showConfirmButton = true
      async () => {
        // This function only runs when "Yes" is clicked
        try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            showPopup(
              "Permission Required",
              "Camera permission is required to take photos",
              "warning"
            );
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const photo = result.assets[0];

            showPopup(
              "Processing Image",
              "Please wait while we optimize your image...",
              "info"
            );

            const compressedUri = await compressImage(photo.uri);
            if (!compressedUri) {
              return;
            }

            hidePopup(); // Hide the processing message

            const docTypeLabel =
              documentTypes.find((type) => type.id === selectedDocumentType)
                ?.label || selectedDocumentType;

            const customName = `${docTypeLabel}.jpg`;

            const newDocument = {
              id: Date.now(),
              name: customName,
              uri: compressedUri,
              type: "image/jpeg",
              size: photo.fileSize || 0,
              documentType: selectedDocumentType,
              amount: formatAmountForDisplay(amount),
              date: formatDate(documentDate),
            };
            setUploadedDocuments((prev) => [...prev, newDocument]);

            setSelectedDocumentType("");
            setAmount("");
            setDocumentDate(new Date());

            showPopup(
              "Success",
              "Photo captured and uploaded successfully!",
              "success"
            );
          }
        } catch (error) {
          console.error("Error taking photo:", error);
          showPopup("Error", "Failed to take photo", "error");
        }
      }
    );
  };

  const handleRemoveDocument = (documentId) => {
    showPopup(
      "Delete Document",
      "Are you sure you want to delete this document? This action cannot be undone.",
      "warning",
      true,
      () => {
        setUploadedDocuments((prev) =>
          prev.filter((doc) => doc.id !== documentId)
        );
        hidePopup();
        showPopup("Success", "Document deleted successfully.", "success");
      }
    );
  };

  const handleSaveEdit = () => {
    if (!validateEditAmount(editAmount)) {
      if (editDocumentType === "O01") {
        showPopup(
          "Validation Error",
          "Please enter a valid amount greater than 0 for Bill type",
          "warning"
        );
      } else {
        showPopup("Validation Error", "Please enter a valid amount", "warning");
      }
      return;
    }

    setUploadedDocuments((prev) =>
      prev.map((doc) =>
        doc.id === editingDocument.id
          ? { ...doc, amount: formatAmountForDisplay(editAmount) }
          : doc
      )
    );

    setShowEditModal(false);
    setEditingDocument(null);
    setEditAmount("");
    setEditDocumentType("");
    showPopup("Success", "Document details updated successfully.", "success");
  };

  const validateEditAmount = (amountString) => {
    if (editDocumentType === "O02" || editDocumentType === "O03") {
      return true;
    }

    if (editDocumentType === "O01") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      // Remove commas before parsing
      const cleanAmount = removeCommasFromAmount(amountString);
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    if (!amountString || amountString.trim() === "") {
      return false;
    }

    // Remove commas before parsing
    const cleanAmount = removeCommasFromAmount(amountString);
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount < 0) {
      return false;
    }

    return true;
  };

  const uploadDocumentToAPI = async (document) => {
    try {
      const formData = await createFormDataForDocument(document);

      const response = await fetch(
        `${API_BASE_URL}/ClaimIntimationDoc/AddClaimDocument`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log("Document uploaded successfully:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error uploading document:", error);
      return { success: false, error: error.message };
    }
  };

  const handleAddDocument = async () => {
    // Prevent multiple clicks
    if (isUploading) {
      return;
    }

    if (uploadedDocuments.length === 0) {
      showPopup(
        "Validation Error",
        "Please upload at least one document",
        "warning"
      );
      return;
    }

    if (!storedReferenceNo || !storedNic) {
      showPopup(
        "Error",
        "Missing required information. Please ensure you have a valid reference number and user identification.",
        "error"
      );
      return;
    }

    const invalidDocuments = uploadedDocuments.filter((doc) => {
      if (!doc.documentType) {
        return true;
      }

      if (doc.documentType === "O01") {
        const amount = parseFloat(doc.amount);
        if (isNaN(amount) || amount <= 0) {
          return true;
        }
      }

      return false;
    });

    if (invalidDocuments.length > 0) {
      showPopup(
        "Validation Error",
        "Some uploaded documents have invalid information. Please check and re-upload if necessary.",
        "warning"
      );
      return;
    }

    try {
      // Set uploading state to true
      setIsUploading(true);

      const uploadPromises = uploadedDocuments.map((doc) =>
        uploadDocumentToAPI(doc)
      );
      const results = await Promise.all(uploadPromises);

      const failedUploads = results.filter((result) => !result.success);

      if (failedUploads.length > 0) {
        setIsUploading(false);
        hidePopup();
        showPopup(
          "Upload Error",
          `Failed to upload ${failedUploads.length} document(s). Please try again.`,
          "error"
        );
        return;
      }

      const claimData = {
        referenceNo: storedReferenceNo,
        enteredBy: storedPatientName || patientData.patientName || "Unknown",
        status: "Submission for Approval Pending",
        claimType: storedClaimType || patientData.claimType || "Unknown",
        createdOn: new Date().toLocaleDateString("en-GB"),
        beneficiaries: [
          {
            id: "1",
            name: storedPatientName || patientData.patientName || "Unknown",
            relationship: "Self",
            illness: storedIllness || patientData.illness || "",
            amount: "0.00",
          },
        ],
        documents: uploadedDocuments.map((doc) => ({
          id: doc.id,
          type: getDocumentTypeLabel(doc.documentType),
          date: doc.date,
          amount: doc.amount,
          documentType: doc.documentType,
          uri: doc.uri,
          imgContent: null,
        })),
        metadata: {
          userNic: storedNic,
          totalDocuments: uploadedDocuments.length,
          uploadTimestamp: new Date().toISOString(),
        },
      };

      console.log(
        "All documents uploaded successfully. Passing data:",
        claimData
      );

      hidePopup();
      showPopup(
        "Success",
        "All documents uploaded successfully!",
        "success",
        false,
        () => {
          hidePopup();
          // Navigate immediately without setTimeout
          if (fromEditClaim) {
            navigation.navigate("EditClaimIntimation", {
              ...route.params,
              fromUploadDocuments: true,
              documentsUploaded: true,
              refreshClaimAmount: true,
            });
          } else {
            navigation.navigate("EditClaimIntimation", {
              claim: claimData,
              referenceNo: storedReferenceNo,
              claimType: storedClaimType || patientData.claimType,
              patientName: storedPatientName || patientData.patientName,
              illness: storedIllness || patientData.illness,
              claimId: claimId,
              userNic: storedNic,
              documentsUploaded: true,
              submittedData: {
                patientData: {
                  ...patientData,
                  patientName: storedPatientName || patientData.patientName,
                  illness: storedIllness || patientData.illness,
                  claimType: storedClaimType || patientData.claimType,
                  referenceNo: storedReferenceNo,
                  claimId: claimId,
                },
                documents: uploadedDocuments,
                uploadResults: results,
                metadata: claimData.metadata,
              },
            });
          }
        }
      );
    } catch (error) {
      console.error("Error during document upload:", error);
      setIsUploading(false);
      hidePopup();
      showPopup(
        "Error",
        "An unexpected error occurred while uploading documents. Please try again.",
        "error"
      );
    }
  };

  const handleAddDocumentButton = async () => {
    // Prevent multiple clicks
    if (isUploading) {
      return;
    }

    console.log("Reference Number:", storedReferenceNo);
    console.log("Patient Name:", storedPatientName || patientData.patientName);
    console.log("Claim Type:", storedClaimType);
    console.log("Illness:", storedIllness || patientData.illness);
    console.log("User NIC:", storedNic);
    console.log("Claim ID:", claimId);
    console.log("Total Documents:", uploadedDocuments.length);
    console.log("Current Claim Amount:", actualClaimAmount);
    console.log("=====================================");

    await handleAddDocument();
  };

  const handleBackPress = () => {
    console.log("Back button pressed");
    try {
      if (fromEditClaim) {
        navigation.navigate("EditClaimIntimation", {
          ...route.params,
          fromUploadDocuments: true,
          refreshClaimAmount: true,
        });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Navigation error:", error);
      navigation.goBack();
    }
  };

  const handleImagePress = (image) => {
    setSelectedImage(image);
    setShowImagePopup(true);
  };

  const handleDocumentImagePress = (document) => {
    if (document.type?.startsWith("image/")) {
      setSelectedImage({
        source: { uri: document.uri },
        description: document.name,
      });
      setShowImagePopup(true);
    }
  };

  const closeImagePopup = () => {
    setShowImagePopup(false);
    setSelectedImage(null);
  };

  const getUploadInstructionText = () => {
    if (selectedDocumentType === "O01") {
      const billDocuments = uploadedDocuments.filter(
        (doc) => doc.documentType === "O01"
      );
      return `You can upload only 1 document for Bill type (${billDocuments.length}/1 uploaded)`;
    }
    const currentTypeDocuments = uploadedDocuments.filter(
      (doc) => doc.documentType === selectedDocumentType
    );
    return `You can upload multiple documents for this type (${currentTypeDocuments.length} uploaded)`;
  };

  const isAmountEditable = () => {
    // First check if any document type is selected
    if (!selectedDocumentType) {
      return false;
    }
    // Then check if it's not PRESCRIPTION or DIAGNOSIS CARD
    return selectedDocumentType !== "O02" && selectedDocumentType !== "O03";
  };

  const getDocumentTypeLabel = (docId) => {
    const docType = documentTypes.find((type) => type.id === docId);
    return docType ? docType.label : toSentenceCase(docId); // Apply sentence case to fallback too
  };

  if (loading) {
    return (
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={[styles.gradient]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <View style={styles.placeholder} />
        </View>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={[styles.gradient]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#13646D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Info Display - Updated */}
        <View style={styles.patientInfoCard}>
          <View style={styles.patientInfoHeader}>
            <Text style={styles.patientInfoTitle}>Claim Information</Text>
            <View style={styles.patientInfoActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEditPatientInfo}
              >
                <Ionicons name="create-outline" size={22} color="#2E7D7D" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDeletePatientInfo}
              >
                <Ionicons name="trash-outline" size={22} color="#2E7D7D" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.patientInfoContent}>
            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfoLabel}>Reference No:</Text>
              <Text style={styles.patientInfoValue}>
                {storedReferenceNo || referenceNo || "N/A"}
              </Text>
            </View>

            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfoLabel}>Patient Name:</Text>
              <Text style={styles.patientInfoValue}>
                {storedPatientName || patientData.patientName || "N/A"}
              </Text>
            </View>

            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfoLabel}>Illness:</Text>
              <Text style={styles.patientInfoValue}>
                {storedIllness || illness || patientData.illness || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* CLAIM AMOUNT DISPLAY */}
        {fromEditClaim && (
          <View style={styles.claimAmountCard}>
            <Text style={styles.claimAmountTitle}>Current Claim Amount</Text>
            <Text style={styles.claimAmountValue}>
              Rs {claimAmountLoading ? "Loading..." : actualClaimAmount}
            </Text>
            {parseFloat(actualClaimAmount) > 0 && (
              <Text style={styles.claimAmountNote}>
                Note: BILL document type is disabled because claim amount is
                greater than 0
              </Text>
            )}
          </View>
        )}

        {/* Document Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Type</Text>
          <View style={styles.documentTypeContainer}>
            {documentTypes.map((type) => {
              const isDisabled = isDocumentTypeDisabled(type.id);
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.documentTypeOption,
                    selectedDocumentType === type.id &&
                      styles.documentTypeSelected,
                    isDisabled && styles.documentTypeDisabled,
                  ]}
                  onPress={() => handleDocumentTypeSelect(type.id)}
                  disabled={isDisabled}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedDocumentType === type.id &&
                          styles.radioButtonSelected,
                        isDisabled && styles.radioButtonDisabled,
                      ]}
                    >
                      {selectedDocumentType === type.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.documentTypeText,
                        selectedDocumentType === type.id &&
                          styles.documentTypeTextSelected,
                        isDisabled && styles.documentTypeTextDisabled,
                      ]}
                    >
                      {type.label}
                      {isDisabled && " (Not Available)"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>
            Amount{" "}
            {selectedDocumentType === "O01" && (
              <Text style={styles.requiredAsterisk}>*</Text>
            )}
          </Text>
          <TextInput
            style={[
              styles.textInput,
              !isAmountEditable() && styles.textInputDisabled,
              selectedDocumentType === "O01" &&
                (!amount || amount.trim() === "" || parseFloat(amount) <= 0) &&
                styles.textInputError,
            ]}
            placeholder={
              !selectedDocumentType
                ? "Select document type first"
                : isAmountEditable()
                ? "Enter amount"
                : "0.00"
            }
            placeholderTextColor="#B0B0B0"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            editable={isAmountEditable()}
          />
          {!selectedDocumentType ? (
            <Text style={styles.helpText}>
              Please select a document type first to enable amount input
            </Text>
          ) : selectedDocumentType === "O02" ||
            selectedDocumentType === "O03" ? (
            <Text style={styles.helpText}>
              Amount is automatically set to 0.00 for{" "}
              {getDocumentTypeLabel(selectedDocumentType)}
            </Text>
          ) : selectedDocumentType === "O01" ? (
            <Text
              style={[
                styles.helpText,
                (!amount || amount.trim() === "" || parseFloat(amount) <= 0) &&
                  styles.errorText,
              ]}
            >
              {!amount || amount.trim() === "" || parseFloat(amount) <= 0
                ? "Amount is required for Bill type"
                : "Amount is required for Bill type"}
            </Text>
          ) : null}
        </View>

        {/* Document Date Input */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Document Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={showDatePickerModal}
          >
            <Text style={styles.datePickerText}>
              {formatDate(documentDate)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#00C4CC" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={documentDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Sample Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Images</Text>
          <Text style={styles.sectionSubtitle}>
            Any document without "Submitted to SLICGL on [Date],[Policy
            No],[MemberID]" will be rejected by SLICGL
          </Text>
          <View style={styles.sampleImagesContainer}>
            {sampleImages.map((image) => (
              <TouchableOpacity
                key={image.id}
                style={styles.sampleImageCard}
                onPress={() => handleImagePress(image)}
                activeOpacity={0.8}
              >
                <View style={styles.sampleImageWrapper}>
                  <Image
                    source={image.source}
                    style={styles.sampleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.sampleImageOverlay}>
                    <Text style={styles.sampleImageDescription}>
                      {image.description}
                    </Text>
                    <View style={styles.expandIcon}>
                      <Ionicons name="expand-outline" size={16} color="#fff" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Upload Section */}
        <View style={styles.section}>
          {selectedDocumentType && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Document</Text>
              <Text style={styles.sectionSubtitle}>
                Maximum file size: 5MB. Allowed formats: JPG, JPEG, PNG only
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  selectedDocumentType === "O01"
                    ? styles.limitWarning
                    : styles.limitInfo,
                ]}
              >
                {getUploadInstructionText()}
              </Text>

              <View style={styles.uploadContainer}>
                <View style={styles.uploadArea}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={40}
                    color="#00C4CC"
                  />
                  <Text style={styles.uploadText}>
                    Upload your documents here
                  </Text>

                  <View style={styles.uploadButtons}>
                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        (!canAddMoreDocuments() ||
                          (selectedDocumentType === "O01" &&
                            (!amount ||
                              amount.trim() === "" ||
                              parseFloat(amount) <= 0))) &&
                          styles.uploadButtonDisabled,
                      ]}
                      onPress={handleBrowseFiles}
                      disabled={
                        !canAddMoreDocuments() ||
                        (selectedDocumentType === "O01" &&
                          (!amount ||
                            amount.trim() === "" ||
                            parseFloat(amount) <= 0))
                      }
                    >
                      <Text
                        style={[
                          styles.uploadButtonText,
                          (!canAddMoreDocuments() ||
                            (selectedDocumentType === "O01" &&
                              (!amount ||
                                amount.trim() === "" ||
                                parseFloat(amount) <= 0))) &&
                            styles.uploadButtonTextDisabled,
                        ]}
                      >
                        Browse files
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        (!canAddMoreDocuments() ||
                          (selectedDocumentType === "O01" &&
                            (!amount ||
                              amount.trim() === "" ||
                              parseFloat(amount) <= 0))) &&
                          styles.uploadButtonDisabled,
                      ]}
                      onPress={handleTakePhoto}
                      disabled={
                        !canAddMoreDocuments() ||
                        (selectedDocumentType === "O01" &&
                          (!amount ||
                            amount.trim() === "" ||
                            parseFloat(amount) <= 0))
                      }
                    >
                      <Text
                        style={[
                          styles.uploadButtonText,
                          (!canAddMoreDocuments() ||
                            (selectedDocumentType === "O01" &&
                              (!amount ||
                                amount.trim() === "" ||
                                parseFloat(amount) <= 0))) &&
                            styles.uploadButtonTextDisabled,
                        ]}
                      >
                        Take Photo
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Uploaded Documents List */}
        {uploadedDocuments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
            <View style={styles.uploadedDocuments}>
              {uploadedDocuments.map((doc) => (
                <View key={doc.id} style={styles.documentItem}>
                  {doc.type?.startsWith("image/") && (
                    <TouchableOpacity
                      onPress={() => handleDocumentImagePress(doc)}
                    >
                      <Image
                        source={{ uri: doc.uri }}
                        style={styles.documentThumbnail}
                      />
                    </TouchableOpacity>
                  )}

                  <View style={styles.documentInfo}>
                    <Text style={styles.documentType}>
                      Type: {getDocumentTypeLabel(doc.documentType)}
                    </Text>
                    <Text style={styles.documentAmount}>
                      Rs {doc.amount || "0.00"}
                    </Text>
                    <Text style={styles.documentDate}>Date: {doc.date}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveDocument(doc.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={28} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add Document Button */}
        <TouchableOpacity
          style={[
            styles.addDocumentButton,
            (uploadedDocuments.length === 0 || isUploading) &&
              styles.addDocumentButtonDisabled,
          ]}
          onPress={handleAddDocumentButton}
          disabled={uploadedDocuments.length === 0 || isUploading}
        >
          <Text
            style={[
              styles.addDocumentButtonText,
              (uploadedDocuments.length === 0 || isUploading) &&
                styles.addDocumentButtonTextDisabled,
            ]}
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Image Popup Modal */}
      <Modal
        visible={showImagePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePopup}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            onPress={closeImagePopup}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <>
                  <Image
                    source={selectedImage.source}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <View style={styles.modalImageInfo}>
                    <Text style={styles.modalImageTitle}>
                      {selectedImage.description}
                    </Text>
                    <Text style={styles.modalImageSubtitle}>
                      Tap outside to close
                    </Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={isEditPatientModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditPatientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editPatientModalContent}>
            <Text style={styles.modalTitle}>Edit Patient Information</Text>

            {/* Member Name Dropdown */}
            <Text style={styles.fieldLabel}>Patient Name</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                loadingMembers && styles.dropdownButtonDisabled,
              ]}
              onPress={() =>
                !loadingMembers && setDropdownVisible(!isDropdownVisible)
              }
              disabled={loadingMembers}
            >
              <Text style={styles.dropdownButtonText}>
                {loadingMembers
                  ? "Loading members..."
                  : selectedMember
                  ? selectedMember.name
                  : editPatientData.patientName || "Select Member"}
              </Text>
              <Ionicons
                name={isDropdownVisible ? "chevron-up" : "chevron-down"}
                size={20}
                color={loadingMembers ? "#ccc" : "#666"}
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {isDropdownVisible && !loadingMembers && (
              <View style={styles.dropdownOptions}>
                {memberOptions.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.dropdownOption,
                      selectedMember?.id === member.id &&
                        styles.selectedDropdownOption,
                    ]}
                    onPress={() => handleMemberSelect(member)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selectedMember?.id === member.id &&
                          styles.selectedDropdownOptionText,
                      ]}
                    >
                      {member.name} ({member.relationship})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Illness Field */}
            <Text style={styles.fieldLabel}>Illness</Text>
            <TextInput
              style={styles.editPatientModalInput}
              value={editPatientData.illness}
              onChangeText={(value) =>
                setEditPatientData((prev) => ({ ...prev, illness: value }))
              }
              placeholder="Enter illness"
              multiline
              numberOfLines={3}
            />

            <View style={styles.editPatientModalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setEditPatientModalVisible(false);
                  setDropdownVisible(false);
                  setSelectedMember(null);
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePatientEdit}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Popup */}
      <CustomPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        showConfirmButton={popup.showConfirmButton}
        onClose={hidePopup} // Always use hidePopup for onClose
        onConfirm={popup.onConfirm}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: "#6DD3D3",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
    borderRadius: 20,
    minWidth: 34,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#13646D",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Loading Screen Styles
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
  patientInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  patientInfoActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  patientInfoContent: {
    gap: 12,
  },
  patientInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  patientInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#13646D",
    flex: 0.4,
  },
  patientInfoValue: {
    fontSize: 14,
    color: "#333",
    flex: 0.6,
    textAlign: "right",
    flexWrap: "wrap",
  },
  patientInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#13646D",
    marginBottom: 10,
  },
  patientName: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  patientIllness: {
    fontSize: 14,
    color: "#666",
  },
  // NEW STYLES FOR CLAIM AMOUNT DISPLAY
  claimAmountCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimAmountTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#13646D",
    marginBottom: 10,
  },
  claimAmountValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 10,
  },
  claimAmountNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#13646D",
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 15,
  },
  limitWarning: {
    color: "#13646D",
    fontWeight: "500",
  },
  limitInfo: {
    color: "#13646D",
    fontWeight: "500",
  },
  documentTypeContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  documentTypeOption: {
    marginBottom: 15,
  },
  documentTypeSelected: {
    // Additional styling for selected state if needed
  },
  documentTypeDisabled: {
    opacity: 0.5,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#00C4CC",
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#00C4CC",
  },
  radioButtonDisabled: {
    borderColor: "#ccc",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00C4CC",
  },
  documentTypeText: {
    fontSize: 15,
    color: "#333",
  },
  documentTypeTextSelected: {
    color: "#00C4CC",
    fontWeight: "500",
  },
  documentTypeTextDisabled: {
    color: "#ccc",
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#13646D",
    marginBottom: 10,
  },
  requiredAsterisk: {
    color: "#13646D",
    fontSize: 16,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 15,
    color: "#333",
  },
  textInputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#888",
  },
  textInputError: {
    borderColor: "white",
    borderWidth: 2,
  },
  helpText: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  errorText: {
    color: "#13646D",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  datePickerButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 15,
    color: "#333",
  },
  sampleImagesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sampleImageCard: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sampleImageWrapper: {
    position: "relative",
  },
  sampleImage: {
    width: "100%",
    height: 120,
  },
  sampleImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sampleImageDescription: {
    fontSize: 8,
    color: "#fff",
    opacity: 0.9,
    flex: 1,
  },
  expandIcon: {
    marginLeft: 5,
  },
  uploadContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 15,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: 15,
  },
  uploadButton: {
    backgroundColor: "#00C4CC",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadButtonTextDisabled: {
    color: "#666",
  },
  uploadedDocuments: {
    marginTop: 0,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 15,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  documentAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#00C4CC",
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: "#888",
  },
  deleteButton: {
    padding: 5,
  },
  addDocumentButton: {
    backgroundColor: "#00C4CC",
    borderRadius: 15,
    paddingVertical: 18,
    marginVertical: 30,
    shadowColor: "#00C4CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addDocumentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  addDocumentButtonDisabled: {
    backgroundColor: "#bfbfbf",
    shadowOpacity: 0,
    elevation: 0,
  },
  addDocumentButtonTextDisabled: {
    color: "#666",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: screenHeight * 0.6,
    borderRadius: 10,
  },
  modalImageInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  modalImageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  modalImageSubtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
  },
  // Edit Modal styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#13646D",
  },
  editModalCloseButton: {
    padding: 5,
  },
  editModalBody: {
    marginBottom: 20,
  },
  editSection: {
    marginBottom: 15,
  },
  editLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#13646D",
    marginBottom: 10,
  },
  editValue: {
    fontSize: 15,
    color: "#333",
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 10,
  },
  editInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 15,
    color: "#333",
  },
  editInputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#888",
  },
  editHelpText: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  editModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  editCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: "#00C4CC",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  editSaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Popup Styles
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
    maxWidth: screenWidth * 0.85,
    minWidth: screenWidth * 0.7,
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
    backgroundColor: "#00C4CC",
  },
  popupOkButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  popupConfirmButton: {
    backgroundColor: "#00C4CC",
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
  editPatientModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    maxHeight: "75%",
    minHeight: "40%",
  },
  editPatientModalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  editPatientModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
    paddingTop: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2E7D7D",
    marginBottom: 8,
    marginTop: 10,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    minHeight: 45,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
    maxHeight: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedDropdownOption: {
    backgroundColor: "#E3F2FD",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#333",
  },
  selectedDropdownOptionText: {
    color: "#2E7D7D",
    fontWeight: "500",
  },
  dropdownButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  cancelBtn: {
    marginRight: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: "#888",
    fontWeight: "500",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#4DD0E1",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default UploadDocuments;
