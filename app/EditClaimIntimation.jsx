import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
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

const { width } = Dimensions.get("window");

// Custom Popup Component
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
        return { icon: "?", color: "#2196F3", bgColor: "#E3F2FD" };
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
          onPress={() => {
            if (!showConfirmButton && onClose) {
              onClose();
            }
          }}
        />
        <Animated.View
          style={[styles.popupContainer, { transform: [{ scale: scaleAnim }] }]}
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

const formatAmountWithCommas = (amount) => {
  if (!amount || isNaN(parseFloat(amount))) {
    return "0.00";
  }
  const numericAmount = parseFloat(amount);
  return numericAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const EditClaimIntimation = ({ route }) => {
  const navigation = useNavigation();
  const {
    claim,
    claimNo,
    claimNumber,
    claimType,
    patientName,
    illness,
    createdOn,
    claimAmount,
  } = route?.params || {};

  // Document types state
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
  const [editDocumentType, setEditDocumentType] = useState("");
  const [editDocumentDate, setEditDocumentDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [isEditDocTypeDropdownVisible, setEditDocTypeDropdownVisible] =
    useState(false);
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [documentDateRange, setDocumentDateRange] = useState(null);
  const [isEditBeneficiaryModalVisible, setEditBeneficiaryModalVisible] =
    useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: "",
    relationship: "",
    illness: "",
    amount: "",
  });
  const [claimAmountLoading, setClaimAmountLoading] = useState(false);

  const removeCommasFromAmount = (amount) => {
    if (!amount) return "";
    return amount.toString().replace(/,/g, "");
  };

  const toSentenceCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  const getDocumentTypeLabel = (docId) => {
    const docType = documentTypes.find((type) => type.docId === docId);
    return docType ? toSentenceCase(docType.docDesc) : toSentenceCase(docId);
  };

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

  const getPolicyEndDate = async () => {
    try {
      const policyData = await SecureStore.getItemAsync("selected_policy_data");
      if (policyData) {
        const parsedData = JSON.parse(policyData);
        // Check both possible date fields
        const endDate = parsedData.policyEndDate || parsedData.endDate;
        if (endDate) {
          return new Date(endDate);
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting policy end date:", error);
      return null;
    }
  };

  const isPolicyExpired = (policyEndDate, currentDate = new Date()) => {
    if (!policyEndDate) return false;
    return currentDate > policyEndDate;
  };

  // 3. Add these functions for beneficiary editing
  const handleEditBeneficiary = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    const member = memberOptions.find((m) => m.name === beneficiary.name);
    setSelectedMember(member);
    setNewBeneficiary({
      name: beneficiary.name,
      relationship: beneficiary.relationship,
      illness: beneficiary.illness,
      amount: beneficiary.amount,
    });
    setEditBeneficiaryModalVisible(true);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setNewBeneficiary((prev) => ({
      ...prev,
      name: member.name,
      relationship: member.relationship,
    }));
    setDropdownVisible(false);
  };

  const updateIntimationAPI = async (beneficiaryData) => {
    try {
      console.log("Updating intimation via API:", beneficiaryData);

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
        patientName: beneficiaryData.name,
        illness: beneficiaryData.illness,
        relationship: beneficiaryData.relationship,
        claimSeqNo: claimDetails.claimNo,
        createdOn: claimDetails.createdOn,
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

  const handleSaveBeneficiaryEdit = async () => {
    try {
      if (!newBeneficiary.name || !newBeneficiary.relationship) {
        showPopup(
          "Validation Error",
          "Patient name and relationship are required.",
          "warning"
        );
        return;
      }

      if (!newBeneficiary.illness || newBeneficiary.illness.trim() === "") {
        showPopup("Validation Error", "Illness field is required.", "warning");
        return;
      }

      console.log("Saving beneficiary edit with API integration...");

      const beneficiaryDataForAPI = {
        name: newBeneficiary.name,
        relationship: newBeneficiary.relationship,
        illness: newBeneficiary.illness.trim(),
      };

      await updateIntimationAPI(beneficiaryDataForAPI);

      const claimAmount = await fetchClaimAmount(claimDetails.claimNo);

      const updatedBeneficiaries = beneficiaries.map((item) =>
        item.id === selectedBeneficiary.id
          ? { ...item, ...newBeneficiary, amount: claimAmount }
          : item
      );

      setBeneficiaries(updatedBeneficiaries);

      setEditBeneficiaryModalVisible(false);
      setDropdownVisible(false);
      setSelectedMember(null);
      setNewBeneficiary({
        name: "",
        relationship: "",
        illness: "",
        amount: "",
      });

      showPopup(
        "Success",
        "Beneficiary information updated successfully!",
        "success"
      );

      console.log("Beneficiary edit saved successfully with API integration");
    } catch (error) {
      console.error("Error in handleSaveBeneficiaryEdit:", error);

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
          "error",
          true,
          async () => {
            hidePopup();
            const claimNo = claimDetails.claimNo;
            if (claimNo) {
              await retrieveBeneficiaryData(claimNo);
            }
            setEditBeneficiaryModalVisible(false);
            setDropdownVisible(false);
            setSelectedMember(null);
            setNewBeneficiary({
              name: "",
              relationship: "",
              illness: "",
              amount: "",
            });
          }
        );
      } else {
        showPopup(
          "Update Error",
          `Failed to update beneficiary information: ${error.message}`,
          "error"
        );
      }
    }
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

  // State for claim details
  const [claimDetails, setClaimDetails] = useState({
    claimNo: claimNo || claimNumber || claim?.claimNo || "",
    enteredBy: patientName || claim?.enteredBy || "Loading...",
    status: "Submission for Approval Pending",
    claimType: claimType || claim?.claimType || "",
    createdOn:
      createdOn || claim?.createdOn || new Date().toLocaleDateString("en-GB"),
    claimAmount: claimAmount || claim?.claimAmount || "0.00",
  });

  // Other state variables
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [claimTypes, setClaimType] = useState("");
  const [claimNo2, setClaimNo] = useState("");

  const [loadingStates, setLoadingStates] = useState({
    claimDetails: true,
    beneficiaryData: true,
    employeeInfo: true,
    documents: true,
  });

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [isAddDocumentModalVisible, setAddDocumentModalVisible] =
    useState(false);
  const [isEditDocumentModalVisible, setEditDocumentModalVisible] =
    useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState(new Map());

  const [newDocument, setNewDocument] = useState({
    type: "",
    date: "",
    amount: "",
  });

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

  const handleDeleteClaim = async () => {
    showPopup(
      "Delete Claim",
      "Are you sure you want to delete this claim?",
      "confirm",
      true,
      async () => {
        try {
          console.log("Deleting claim:", claimDetails.claimNo);

          if (!claimDetails.claimNo) {
            showPopup("Error", "Claim claim number not found.", "error");
            return;
          }

          const deleteClaimData = {
            claimNo: claimDetails.claimNo,
          };

          console.log("Delete claim request data:", deleteClaimData);

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
            await SecureStore.deleteItemAsync("edit_claimNo");
            await SecureStore.deleteItemAsync("edit_claimType");
            await SecureStore.deleteItemAsync("edit_createdOn");
            await SecureStore.deleteItemAsync("edit_enteredBy");
            await SecureStore.deleteItemAsync("edit_relationship");
            await SecureStore.deleteItemAsync("edit_illness");
            await SecureStore.deleteItemAsync("edit_beneficiary_amount");
            await SecureStore.deleteItemAsync("referenNo");
            await SecureStore.deleteItemAsync("stored_claim_seq_no");
            await SecureStore.deleteItemAsync("stored_claim_type");
            await SecureStore.deleteItemAsync("stored_patient_name");
            await SecureStore.deleteItemAsync("stored_illness_description");
            await SecureStore.deleteItemAsync("stored_relationship");
            await SecureStore.deleteItemAsync("stored_claim_amount");

            // Set refresh flag for home page
            await SecureStore.setItemAsync("should_refresh_home", "true");
          } catch (storageError) {
            console.warn("Error clearing stored data:", storageError);
          }

          hidePopup();
          hidePopup();
          showPopup(
            "Success",
            "Claim has been deleted successfully.",
            "success",
            false,
            null // Remove the onConfirm callback
          );

          // Auto-close after 2 seconds and navigate
          setTimeout(() => {
            hidePopup();
            navigateToHome();
          }, 2000);
        } catch (error) {
          console.error("Error deleting claim:", error);

          hidePopup();
          if (error.message.includes("404")) {
            showPopup(
              "Not Found",
              "The claim could not be found in the system. It may have already been deleted.",
              "error",
              false,
              () => {
                hidePopup();
                navigateToHome();
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
  const navigateToHome = () => {
    try {
      // Reset navigation stack and go to home
      navigation.reset({
        index: 0,
        routes: [{ name: "home" }],
      });
    } catch (error) {
      console.warn(
        "Reset navigation failed, trying regular navigation:",
        error
      );
      // Fallback to regular navigation
      navigation.navigate("home");
    }
  };
  // Helper function to format amount to 2 decimal places
  const formatAmount = (amount) => {
    if (!amount) {
      return "0.00";
    }

    // Remove commas first before parsing
    const cleanAmount = amount.toString().replace(/,/g, "");

    if (isNaN(parseFloat(cleanAmount))) {
      return "0.00";
    }

    const numericAmount = parseFloat(cleanAmount);
    return numericAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper function to update loading states
  const updateLoadingState = (key, value) => {
    setLoadingStates((prev) => {
      const newStates = { ...prev, [key]: value };
      const allLoaded = Object.values(newStates).every((state) => !state);
      if (allLoaded) {
        setInitialLoading(false);
      }
      return newStates;
    });
  };

  const handleBackPress = () => {
    showPopup(
      "Exit Claim",
      "Do you want to exit? Your claim will be saved in saved claims.",
      "confirm",
      true,
      () => {
        // Hide the first popup
        setPopup((prev) => ({ ...prev, visible: false }));

        // Show success message and navigate
        setTimeout(() => {
          showPopup(
            "Claim Saved",
            "Your claim has been saved in saved claims.",
            "success",
            false,
            null // No onConfirm needed, will handle in onClose
          );

          // Auto-close after 2 seconds and navigate
          setTimeout(() => {
            setPopup((prev) => ({ ...prev, visible: false }));
            navigation.navigate("home");
          }, 2000);
        }, 300);
      }
    );
  };

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

  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>Loading New Claim Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return "";
      }

      // Convert to string if it's not already
      const dateStr = dateString.toString().trim();

      // If it's already in DD/MM/YYYY format, return as is
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        return dateStr;
      }

      // If it's in DD/MM/YY format, convert to DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateStr)) {
        const parts = dateStr.split("/");
        const day = parts[0];
        const month = parts[1];
        const year = parseInt(parts[2]);

        // Convert 2-digit year to 4-digit year
        // Assume years 00-49 are 2000-2049, years 50-99 are 1950-1999
        const fullYear = year <= 49 ? 2000 + year : 1900 + year;

        return `${day}/${month}/${fullYear}`;
      }

      // For other formats, try to parse as Date object
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date format:", dateStr);
        return dateStr; // Return original if can't parse
      }

      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error, "Input:", dateString);
      return dateString || "";
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      setLoadingDocumentTypes(true);
      const response = await fetch(
        `${API_BASE_URL}/RequiredDocumentsCon/Outdoor`,
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

      const docTypesData = await response.json();
      setDocumentTypes(docTypesData);
    } catch (error) {
      console.error("Error fetching document types:", error);
      showPopup(
        "Error",
        "Failed to load document types. Please try again.",
        "error"
      );
      setDocumentTypes([
        { docId: "O01", docDesc: "BILL" },
        { docId: "O02", docDesc: "PRESCRIPTION" },
        { docId: "O03", docDesc: "DIAGNOSIS CARD" },
        { docId: "O04", docDesc: "OTHER" },
      ]);
    } finally {
      setLoadingDocumentTypes(false);
    }
  };

  const parseClmMemSeqNo = (clmMemSeqNo) => {
    try {
      if (!clmMemSeqNo || typeof clmMemSeqNo !== "string") {
        return { memId: 0, seqNo: 0 };
      }

      const parts = clmMemSeqNo.split("-");
      if (parts.length !== 2) {
        return { memId: 0, seqNo: 0 };
      }

      const memId = parseInt(parts[0], 10);
      const seqNo = parseInt(parts[1], 10);

      if (isNaN(memId) || isNaN(seqNo)) {
        return { memId: 0, seqNo: 0 };
      }

      return { memId, seqNo };
    } catch (error) {
      console.error("Error parsing clmMemSeqNo:", error);
      return { memId: 0, seqNo: 0 };
    }
  };

  const deleteDocumentFromAPI = async (document) => {
    try {
      const { memId, seqNo } = parseClmMemSeqNo(document.clmMemSeqNo);
      const requestBody = {
        claimNo: claimDetails.claimNo,
        memId: memId,
        seqNo: seqNo,
      };

      const response = await fetch(`${API_BASE_URL}/Document/deletedocument`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error deleting document from API:", error);
      throw error;
    }
  };

  const fetchDocuments = async (claimNo) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ClaimDocuments/${claimNo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && Array.isArray(result.data)) {
        const transformedDocuments = result.data.map((doc, index) => ({
          id: doc.clmMemSeqNo || `doc_${index}`,
          clmMemSeqNo: doc.clmMemSeqNo,
          type: doc.docType || "Unknown",
          date: formatDate(doc.docDate), // This will now format correctly
          amount: formatAmount(doc.docAmount),
          imagePath: doc.imagePath || "0",
          // FIXED: Always set hasImage to true since imgContent is null in response
          // Let the view API determine if image actually exists
          hasImage: true,
          imageLoaded: false,
          imgContent: doc.imgContent || null,
        }));

        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      showPopup(
        "Documents Loading Error",
        `Unable to fetch documents. Error: ${error.message}`,
        "error"
      );
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
      updateLoadingState("documents", false);
    }
  };

  const refreshPatientDetails = async () => {
    try {
      const claimNo = claimDetails.claimNo || claim?.claimNo;
      if (!claimNo) return;

      console.log("Refreshing patient details for claimNo:", claimNo);

      // Force fetch fresh patient details from API
      const patientDetails = await fetchPatientDetails(claimNo);

      if (
        patientDetails.patient_Name ||
        patientDetails.illness ||
        patientDetails.relationship
      ) {
        // Update beneficiaries with fresh data
        const claimAmount = await fetchClaimAmount(claimNo);

        const updatedBeneficiary = {
          id: "1",
          name: patientDetails.patient_Name || beneficiaries[0]?.name || "",
          relationship:
            patientDetails.relationship ||
            beneficiaries[0]?.relationship ||
            "Self",
          illness: patientDetails.illness || beneficiaries[0]?.illness || "",
          amount: formatAmount(claimAmount),
        };

        setBeneficiaries([updatedBeneficiary]);

        // Update stored values with fresh API data
        if (patientDetails.patient_Name) {
          await SecureStore.setItemAsync(
            "stored_patient_name",
            patientDetails.patient_Name
          );
        }
        if (patientDetails.illness) {
          await SecureStore.setItemAsync(
            "stored_illness_description",
            patientDetails.illness
          );
        }
        if (patientDetails.relationship) {
          await SecureStore.setItemAsync(
            "stored_relationship",
            patientDetails.relationship
          );
        }

        console.log("Patient details refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing patient details:", error);
    }
  };

  const loadDocumentImage = async (document) => {
    try {
      setImageLoadingStates((prev) => new Map(prev.set(document.id, true)));

      const response = await fetch(
        `${API_BASE_URL}/ClaimDocuments/view/${document.clmMemSeqNo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result;
        setSelectedImageUri(base64String);
        setImageModalVisible(true);
        setImageLoadingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(document.id);
          return newMap;
        });
      };

      reader.onerror = () => {
        showPopup("Error", "Failed to load image", "error");
        setImageLoadingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(document.id);
          return newMap;
        });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading document image:", error);
      showPopup("Error", "Failed to load image", "error");
      setImageLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(document.id);
        return newMap;
      });
    }
  };

  const fetchClaimAmount = async (claimNo) => {
    try {
      if (!claimNo || claimNo.trim() === "") {
        const fallbackClaimNo =
          (await SecureStore.getItemAsync("stored_claim_seq_no")) ||
          (await SecureStore.getItemAsync("edit_claimNo")) ||
          claimDetails.claimNo;

        if (!fallbackClaimNo || fallbackClaimNo.trim() === "") {
          return "0.00";
        }
        claimNo = fallbackClaimNo;
      }

      console.log("Fetching claim amount for claimNo:", claimNo);

      const requestBody = { seqNo: claimNo.trim() };

      // Add timestamp to prevent caching
      const response = await fetch(
        `${API_BASE_URL}/ClaimAmount/GetClaimAmount?t=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return "0.00";
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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

      const formattedAmount = parseFloat(claimAmount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      console.log("Fetched claim amount:", formattedAmount);
      return formattedAmount;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      return "0.00";
    }
  };

  const refreshClaimAmount = async () => {
    try {
      setClaimAmountLoading(true);

      const claimNo = claimDetails.claimNo || claim?.claimNo;
      if (!claimNo) {
        console.warn("No claim number available for claim amount refresh");
        return;
      }

      console.log("Refreshing claim amount for claimNo:", claimNo);

      // Force fetch from API regardless of current state
      const updatedAmount = await fetchClaimAmount(claimNo);

      console.log("Updated claim amount:", updatedAmount);

      // Update claimDetails state with the new amount
      setClaimDetails((prev) => ({
        ...prev,
        claimAmount: updatedAmount,
      }));

      // Update beneficiaries with new amount
      if (beneficiaries.length > 0) {
        const updatedBeneficiaries = beneficiaries.map((beneficiary) => ({
          ...beneficiary,
          amount: updatedAmount,
        }));
        setBeneficiaries(updatedBeneficiaries);
        console.log("Beneficiaries updated with new amount:", updatedAmount);
      }

      // Also update the stored claim amount if needed
      try {
        await SecureStore.setItemAsync(
          "stored_claim_amount",
          updatedAmount.toString()
        );
      } catch (storageError) {
        console.warn("Could not store claim amount:", storageError);
      }
    } catch (error) {
      console.error("Error refreshing claim amount:", error);
    } finally {
      setClaimAmountLoading(false);
    }
  };

  const retrieveClaimDetails = async () => {
    try {
      const storedClaimNo = await SecureStore.getItemAsync("edit_claimNo");
      const storedClaimType = await SecureStore.getItemAsync("edit_claimType");
      const storedCreatedOn = await SecureStore.getItemAsync("edit_createdOn");
      const storedClaimSeqNo = await SecureStore.getItemAsync(
        "stored_claim_seq_no"
      );

      const finalClaimNo =
        claimNo ||
        claimNumber ||
        claim?.claimNo ||
        storedClaimSeqNo ||
        storedClaimNo ||
        "";
      const finalClaimType =
        claimType || claim?.claimType || storedClaimType || "";
      const finalCreatedOn =
        createdOn ||
        claim?.createdOn ||
        storedCreatedOn ||
        new Date().toLocaleDateString("en-GB");

      setClaimDetails((prev) => ({
        ...prev,
        claimNo: finalClaimNo,
        claimType: finalClaimType,
        createdOn: finalCreatedOn,
      }));

      setClaimNo(finalClaimNo);
      return finalClaimNo;
    } catch (error) {
      console.error("Error retrieving claim details:", error);
      const fallbackClaimNo = claimNo || claimNumber || claim?.claimNo || "";
      setClaimDetails((prev) => ({
        ...prev,
        claimNo: fallbackClaimNo,
        claimType: claimType || claim?.claimType || "",
        createdOn:
          createdOn ||
          claim?.createdOn ||
          new Date().toLocaleDateString("en-GB"),
      }));
      return fallbackClaimNo;
    } finally {
      updateLoadingState("claimDetails", false);
    }
  };

  const retrieveBeneficiaryData = async (claimNo) => {
    try {
      const [storedPatientName, storedIllness, storedRelationship] =
        await Promise.all([
          SecureStore.getItemAsync("stored_patient_name"),
          SecureStore.getItemAsync("stored_illness_description"),
          SecureStore.getItemAsync("stored_relationship"),
        ]);

      const [storedEnteredBy, storedEditRelationship, storedEditIllness] =
        await Promise.all([
          SecureStore.getItemAsync("edit_enteredBy"),
          SecureStore.getItemAsync("edit_relationship"),
          SecureStore.getItemAsync("edit_illness"),
        ]);

      // NEW: Fetch patient details from API if we have a claim number
      let patientDetails = { patient_Name: "", relationship: "", illness: "" };
      if (claimNo) {
        patientDetails = await fetchPatientDetails(claimNo);
      }

      // Use API data first, then stored data, then props
      const finalPatientName =
        patientDetails.patient_Name ||
        storedPatientName ||
        storedEnteredBy ||
        "";
      const finalIllness =
        patientDetails.illness || storedIllness || storedEditIllness || "";
      const finalRelationship =
        patientDetails.relationship ||
        storedRelationship ||
        storedEditRelationship ||
        "Self";

      if (finalPatientName) {
        const claimAmount = await fetchClaimAmount(claimNo);

        const beneficiary = {
          id: "1",
          name: finalPatientName,
          relationship: finalRelationship,
          illness: finalIllness,
          amount: formatAmount(claimAmount),
        };

        setBeneficiaries([beneficiary]);

        // Update stored values with API data if we got new information
        if (patientDetails.patient_Name) {
          await SecureStore.setItemAsync(
            "stored_patient_name",
            patientDetails.patient_Name
          );
        }
        if (patientDetails.illness) {
          await SecureStore.setItemAsync(
            "stored_illness_description",
            patientDetails.illness
          );
        }
        if (patientDetails.relationship) {
          await SecureStore.setItemAsync(
            "stored_relationship",
            patientDetails.relationship
          );
        }
      } else {
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error("Error retrieving beneficiary data:", error);
      setBeneficiaries([]);
    } finally {
      updateLoadingState("beneficiaryData", false);
    }
  };

  const getDatePickerHelpText = () => {
    if (!documentDateRange) return "Loading date range...";

    const formatDateForHelp = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    if (documentDateRange.isPolicyExpired) {
      return `Policy expired on ${formatDateForHelp(
        documentDateRange.policyEndDate
      )}. You can only select document dates within 90 days before the policy expiry date: ${formatDateForHelp(
        documentDateRange.minDate
      )} to ${formatDateForHelp(documentDateRange.maxDate)}`;
    } else {
      return `You can select document dates from the last 90 days: ${formatDateForHelp(
        documentDateRange.minDate
      )} to ${formatDateForHelp(documentDateRange.maxDate)}`;
    }
  };

  const fetchEmployeeInfo = async () => {
    try {
      setLoading(true);

      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!memberNumber || !policyNumber) {
        setClaimDetails((prev) => ({ ...prev, enteredBy: "Unknown Member" }));
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNumber}&memberNo=${memberNumber}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEmployeeInfo(data);

      setClaimDetails((prev) => ({
        ...prev,
        enteredBy: data.memberName || "Unknown Member",
      }));
    } catch (error) {
      console.error("Error fetching employee info:", error);
      showPopup("Error", "Failed to fetch employee information", "error");
      setClaimDetails((prev) => ({ ...prev, enteredBy: "Unknown Member" }));
    } finally {
      setLoading(false);
      updateLoadingState("employeeInfo", false);
    }
  };

  useEffect(() => {
    const calculateDateRange = async () => {
      const dateRange = await getDocumentDateRange();
      setDocumentDateRange(dateRange);

      console.log("Document date range calculated:", {
        minDate: dateRange.minDate?.toDateString(),
        maxDate: dateRange.maxDate?.toDateString(),
        isPolicyExpired: dateRange.isPolicyExpired,
        policyEndDate: dateRange.policyEndDate?.toDateString(),
      });
    };

    calculateDateRange();
  }, []);

  const storeClaimDetails = async () => {
    try {
      const actualClaimNo =
        (await SecureStore.getItemAsync("stored_claim_seq_no")) ||
        claimDetails.claimNo ||
        claimNo ||
        claimNumber ||
        claim?.claimNo;

      const actualClaimType =
        (await SecureStore.getItemAsync("stored_claim_type")) ||
        claimDetails.claimType ||
        claimType ||
        claim?.claimType;

      await SecureStore.setItemAsync(
        "edit_claimNo",
        String(actualClaimNo || "")
      );
      await SecureStore.setItemAsync(
        "edit_claimType",
        String(actualClaimType || "")
      );
      await SecureStore.setItemAsync(
        "edit_createdOn",
        String(claimDetails.createdOn || "")
      );

      setClaimDetails((prev) => ({
        ...prev,
        claimNo: actualClaimNo || prev.claimNo,
        claimType: actualClaimType || prev.claimType,
      }));

      setClaimType(actualClaimType || "");
      setClaimNo(actualClaimNo || "");
    } catch (error) {
      console.error("Error storing claim details:", error);
    }
  };

  const submitFinalClaim = async (claimNo) => {
    try {
      const requestBody = { claimSeqNo: claimNo };

      const response = await fetch(
        `${API_BASE_URL}/FinalClaimSub/submitfinalclaim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error submitting final claim:", error);
      throw error;
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const claimNo = await retrieveClaimDetails();

        const loadingPromises = [
          retrieveBeneficiaryData(claimNo), // This will now fetch patient details from API
          fetchEmployeeInfo(),
          storeClaimDetails(),
          fetchDocumentTypes(),
          fetchDependents(),
        ];

        if (claimNo) {
          loadingPromises.push(fetchDocuments(claimNo));
        } else {
          updateLoadingState("documents", false);
        }

        await Promise.all(loadingPromises);
      } catch (error) {
        console.error("Error initializing component:", error);
        setInitialLoading(false);
      }
    };

    initializeComponent();
  }, []);

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchDataOnFocus = async () => {
        if (!initialLoading) {
          let claimNo = claimDetails.claimNo || claim?.claimNo;

          if (!claimNo) {
            try {
              claimNo =
                (await SecureStore.getItemAsync("stored_claim_seq_no")) ||
                (await SecureStore.getItemAsync("edit_claimNo"));
            } catch (error) {
              console.error("Error getting claim number from storage:", error);
            }
          }

          if (claimNo && claimNo !== "") {
            setDocumentsLoading(true);

            try {
              // Always refresh all data when screen comes into focus
              await Promise.all([
                fetchDocuments(claimNo),
                refreshClaimAmount(),
                refreshPatientDetails(),
              ]);
            } catch (error) {
              console.error("Error fetching data on focus:", error);
            } finally {
              setDocumentsLoading(false);
            }
          }
        }
      };

      fetchDataOnFocus();
    }, [claimDetails.claimNo, claim?.claimNo, initialLoading])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      const routes = navigation.getState()?.routes;
      const currentRoute = routes[routes.length - 1];

      // Always refresh when coming back from any screen
      console.log("Screen focused, refreshing all data...");
      await handleScreenRefresh();

      // Clear any navigation parameters that might have triggered the refresh
      if (
        currentRoute?.params?.fromUploadDocuments ||
        currentRoute?.params?.refreshClaimAmount
      ) {
        navigation.setParams({
          fromUploadDocuments: undefined,
          refreshClaimAmount: undefined,
        });
      }
    });

    return unsubscribe;
  }, [navigation, claimDetails.claimNo]);

  const handleNavigateToUploadDocuments = () => {
    const currentClaimAmount =
      claimDetails.claimAmount ||
      (beneficiaries.length > 0 ? beneficiaries[0].amount : "0.00");

    navigation.navigate("UploadDocuments", {
      claim: claim,
      beneficiaries: beneficiaries,
      documents: documents,
      fromEditClaim: true,
      currentClaimAmount: currentClaimAmount,
      claimNo: claimDetails.claimNo,
      patientName: claimDetails.enteredBy,
      claimType: claimDetails.claimType,
      illness: beneficiaries.length > 0 ? beneficiaries[0].illness : "",
      claimId: claimDetails.claimNo,
    });
  };

  const handleAddDocument = () => {
    if (newDocument.type && newDocument.date) {
      setDocuments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...newDocument,
          amount: formatAmount(newDocument.amount),
          hasImage: false,
        },
      ]);
      setNewDocument({ type: "", date: "", amount: "" });
      setAddDocumentModalVisible(false);
    }
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);

    const docType = documentTypes.find(
      (type) => type.docDesc === document.type
    );
    setEditDocumentType(docType ? docType.docId : "");
    setEditDocumentDate(new Date());

    setNewDocument({
      type: document.type,
      date: document.date,
      amount: document.amount,
    });

    setEditDocumentModalVisible(true);
  };

  const handleEditDocTypeSelect = (docType) => {
    if (docType.docId === "O01") {
      const billExists = documents.some(
        (doc) => doc.type === "BILL" && doc.id !== selectedDocument?.id
      );

      if (billExists) {
        showPopup(
          "Document Type Restriction",
          "A BILL document already exists. Only one BILL document is allowed per claim.",
          "warning"
        );
        return;
      }
    }

    setEditDocumentType(docType.docId);

    setNewDocument((prev) => ({
      ...prev,
      type: docType.docDesc,
      // Set amount based on document type
      amount:
        docType.docId === "O02" || docType.docId === "O03"
          ? "0.00"
          : prev.amount,
    }));

    setEditDocTypeDropdownVisible(false);
  };

  const handleEditDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || editDocumentDate;
    setShowEditDatePicker(Platform.OS === "ios");

    if (documentDateRange) {
      // Check if selected date is within allowed range
      // Convert dates to start of day for proper comparison
      const selectedDateStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      );
      const minDateStart = new Date(
        documentDateRange.minDate.getFullYear(),
        documentDateRange.minDate.getMonth(),
        documentDateRange.minDate.getDate()
      );
      const maxDateStart = new Date(
        documentDateRange.maxDate.getFullYear(),
        documentDateRange.maxDate.getMonth(),
        documentDateRange.maxDate.getDate()
      );

      if (
        selectedDateStart < minDateStart ||
        selectedDateStart > maxDateStart
      ) {
        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        console.log("Date validation failed:", {
          selectedDate: formatDate(selectedDateStart),
          minDate: formatDate(minDateStart),
          maxDate: formatDate(maxDateStart),
          selectedDateStart,
          minDateStart,
          maxDateStart,
        });

        showPopup(
          "Invalid Date Selection",
          `Please select a date between ${formatDate(
            documentDateRange.minDate
          )} and ${formatDate(documentDateRange.maxDate)}`,
          "warning"
        );
        return;
      }
    }

    setEditDocumentDate(currentDate);

    const formattedDate = formatDate(currentDate);
    setNewDocument((prev) => ({
      ...prev,
      date: formattedDate,
    }));
  };

  const showEditDatePickerModal = () => {
    setShowEditDatePicker(true);
  };

  const handleEditAmountChange = (text) => {
    if (editDocumentType !== "O01" && editDocumentType !== "O04") {
      return; // Only BILL and OTHER types are editable
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
    setNewDocument((prev) => ({
      ...prev,
      amount: formattedAmount, // Store clean amount without commas
    }));
  };

  const isEditAmountEditable = () => {
    return editDocumentType === "O01" || editDocumentType === "O04";
  };

  const validateEditAmount = (amountString, docType) => {
    if (docType === "O02" || docType === "O03") {
      return true; // Always valid for these types
    }

    if (docType === "O01") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }
      const cleanAmount = removeCommasFromAmount(amountString);
      const amount = parseFloat(cleanAmount);
      return !isNaN(amount) && amount > 0;
    }

    if (docType === "O04") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }
      const cleanAmount = removeCommasFromAmount(amountString);
      const amount = parseFloat(cleanAmount);
      return !isNaN(amount) && amount >= 0;
    }

    return false;
  };

  const updateDocumentAPI = async (documentData) => {
    try {
      const formData = new FormData();

      formData.append("ClmSeqNo", documentData.ClmSeqNo);
      formData.append("ClmMemSeqNo", documentData.ClmMemSeqNo.toString());
      formData.append("DocSeq", documentData.DocSeq.toString());
      formData.append("NewDocRef", documentData.NewDocRef);
      formData.append("DocDate", documentData.DocDate);
      formData.append("DocAmount", documentData.DocAmount.toString());
      formData.append("CreatedBy", documentData.CreatedBy);
      formData.append("ImgName", documentData.ImgName);

      if (documentData.ImgContent && documentData.ImgContent !== "") {
        try {
          const base64Data = documentData.ImgContent.replace(
            /^data:image\/[a-z]+;base64,/,
            ""
          );

          const imageFile = {
            uri: `data:image/jpeg;base64,${base64Data}`,
            type: "image/jpeg",
            name: documentData.ImgName + ".jpg",
          };

          formData.append("ImgContent", imageFile);
        } catch (imageError) {
          console.error("Error processing image:", imageError);
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/UpdateDocuments/UpdateDocument`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating document via API:", error);
      throw error;
    }
  };

  const formatDateForAPI = (date) => {
    try {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date for API:", error);
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const year = today.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const handleSaveDocumentEdit = async () => {
    try {
      if (!editDocumentType) {
        showPopup(
          "Validation Error",
          "Please select a document type.",
          "warning"
        );
        return;
      }

      // Updated validation using the new function
      if (!validateEditAmount(newDocument.amount, editDocumentType)) {
        if (editDocumentType === "O01") {
          showPopup(
            "Validation Error",
            "Amount is required and must be greater than 0 for Bill type.",
            "warning"
          );
        } else if (editDocumentType === "O04") {
          showPopup(
            "Validation Error",
            "Amount is required for Other document type.",
            "warning"
          );
        }
        return;
      }

      // Rest of the function remains the same...
      const storedNic = await SecureStore.getItemAsync("user_nic");
      if (!storedNic) {
        showPopup(
          "Error",
          "User information not found. Please login again.",
          "error"
        );
        return;
      }

      const { memId: clmMemSeqNo, seqNo: docSeq } = parseClmMemSeqNo(
        selectedDocument.clmMemSeqNo
      );

      const originalDocData = documents.find(
        (doc) => doc.id === selectedDocument.id
      );

      // Remove commas from amount before sending to API
      const cleanAmount = removeCommasFromAmount(newDocument.amount);

      const updateDocumentData = {
        ClmSeqNo: claimDetails.claimNo,
        ClmMemSeqNo: parseInt(clmMemSeqNo),
        DocSeq: parseInt(docSeq),
        NewDocRef: editDocumentType,
        DocDate: formatDateForAPI(editDocumentDate),
        ImgContent: originalDocData?.imgContent || "",
        DocAmount: parseFloat(cleanAmount || "0"),
        CreatedBy: storedNic,
        ImgName: `${claimDetails.claimNo}_${clmMemSeqNo}_${docSeq}_${editDocumentType}`,
      };

      await updateDocumentAPI(updateDocumentData);

      const updatedDocument = {
        ...newDocument,
        amount: formatAmount(newDocument.amount),
      };

      setDocuments((prev) =>
        prev.map((item) =>
          item.id === selectedDocument.id
            ? { ...item, ...updatedDocument }
            : item
        )
      );

      setEditDocumentModalVisible(false);
      setNewDocument({ type: "", date: "", amount: "" });
      setEditDocumentType("");
      setEditDocumentDate(new Date());

      showPopup("Success", "Document updated successfully!", "success");

      const claimNo = claimDetails.claimNo || claim?.claimNo;
      if (claimNo) {
        await fetchDocuments(claimNo);
      }

      await refreshClaimAmount();
    } catch (error) {
      // Error handling remains the same...
      console.error("Error in handleSaveDocumentEdit:", error);

      if (error.message.includes("404")) {
        showPopup(
          "Document Not Found",
          "The document could not be found in the system. It may have been deleted or moved.\n\nWould you like to refresh the document list?",
          "error",
          true,
          async () => {
            hidePopup();
            const claimNo = claimDetails.claimNo || claim?.claimNo;
            if (claimNo) {
              await fetchDocuments(claimNo);
            }
            setEditDocumentModalVisible(false);
            setNewDocument({ type: "", date: "", amount: "" });
            setEditDocumentType("");
            setEditDocumentDate(new Date());
          }
        );
      } else {
        showPopup(
          "Update Error",
          `Failed to update document: ${error.message}\n\nWould you like to save the changes locally?`,
          "error",
          true,
          () => {
            hidePopup();
            const updatedDocument = {
              ...newDocument,
              amount: formatAmount(newDocument.amount),
            };
            setDocuments((prev) =>
              prev.map((item) =>
                item.id === selectedDocument.id
                  ? { ...item, ...updatedDocument }
                  : item
              )
            );
            setEditDocumentModalVisible(false);
            setNewDocument({ type: "", date: "", amount: "" });
            setEditDocumentType("");
            setEditDocumentDate(new Date());
          }
        );
      }
    }
  };

  const handleDeleteDocument = (documentId) => {
    const documentToDelete = documents.find((doc) => doc.id === documentId);

    if (!documentToDelete) {
      showPopup("Error", "Document not found.", "error");
      return;
    }

    showPopup(
      "Confirm Delete",
      "Are you sure you want to delete this document?",
      "confirm",
      true,
      async () => {
        hidePopup();
        try {
          setDocumentsLoading(true);

          if (documentToDelete.clmMemSeqNo) {
            await deleteDocumentFromAPI(documentToDelete);
            showPopup(
              "Success",
              "Document deleted successfully from server.",
              "success"
            );
          }

          setDocuments((prev) => prev.filter((item) => item.id !== documentId));

          const claimNo = claimDetails.claimNo || claim?.claimNo;
          if (claimNo) {
            await fetchDocuments(claimNo);
          }

          await refreshClaimAmount();
        } catch (error) {
          console.error("Error deleting document:", error);

          showPopup(
            "Delete Error",
            `Failed to delete from server: ${error.message}\n\nWould you like to remove it locally?`,
            "error",
            true,
            async () => {
              hidePopup();
              setDocuments((prev) =>
                prev.filter((item) => item.id !== documentId)
              );
              await refreshClaimAmount();
            }
          );
        } finally {
          setDocumentsLoading(false);
        }
      }
    );
  };

  const handleScreenRefresh = async () => {
    try {
      const claimNo = claimDetails.claimNo || claim?.claimNo;
      if (claimNo) {
        console.log("Refreshing screen data for claimNo:", claimNo);

        setClaimAmountLoading(true);
        setDocumentsLoading(true);

        await Promise.all([
          refreshClaimAmount(),
          refreshPatientDetails(),
          fetchDocuments(claimNo),
        ]);

        console.log("Screen refresh completed");
      }
    } catch (error) {
      console.error("Error refreshing screen data:", error);
    } finally {
      setClaimAmountLoading(false);
      setDocumentsLoading(false);
    }
  };

  const handleSubmitClaim = () => {
    showPopup(
      "Submit Claim",
      "Are you sure you want to submit this claim?",
      "confirm",
      true,
      async () => {
        // Hide the first popup
        setPopup((prev) => ({ ...prev, visible: false }));

        try {
          if (!claimDetails.claimNo) {
            showPopup("Error", "Claim claim number not found.", "error");
            return;
          }

          await submitFinalClaim(claimDetails.claimNo);

          // Show success message and navigate
          setTimeout(() => {
            showPopup(
              "Success",
              "Claim submitted successfully!",
              "success",
              false,
              null
            );

            // Auto-close after 2 seconds and navigate
            setTimeout(() => {
              setPopup((prev) => ({ ...prev, visible: false }));
              navigation.navigate("home");
            }, 2000);
          }, 300);
        } catch (error) {
          console.error("Error submitting claim:", error);

          if (error.message.includes("404")) {
            showPopup(
              "Claim Not Found",
              "The claim could not be found in the system. Please refresh and try again.",
              "error"
            );
          } else if (error.message.includes("400")) {
            showPopup(
              "Invalid Request",
              "The claim cannot be submitted. Please check all required fields and try again.",
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
              "Submit Error",
              `Failed to submit claim: ${error.message}\n\nPlease try again or contact support if the problem persists.`,
              "error"
            );
          }
        }
      }
    );
  };

  const isSubmitDisabled = () => {
    if (beneficiaries.length === 0) {
      return true;
    }

    return beneficiaries.some((beneficiary) => {
      const amount = removeCommasFromAmount(beneficiary.amount);
      const numericAmount = parseFloat(amount);
      return (
        !amount ||
        amount.trim() === "" ||
        isNaN(numericAmount) ||
        numericAmount <= 0
      );
    });
  };

  const fetchPatientDetails = async (claimNo) => {
    try {
      console.log("Fetching patient details for claimNo:", claimNo);

      if (!claimNo || claimNo.trim() === "") {
        console.warn("Invalid claimNo provided:", claimNo);
        return { patient_Name: "", relationship: "", illness: "" };
      }

      const requestBody = { seqNo: claimNo.trim() };

      // Add timestamp to prevent caching
      const response = await fetch(
        `${API_BASE_URL}/ClaimAmount/GetPatientDetails?t=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("No patient details found for claimNo:", claimNo);
          return { patient_Name: "", relationship: "", illness: "" };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Patient Details API Response:", data);

      return {
        patient_Name: data.patient_Name || "",
        relationship: data.relationship || "",
        illness: data.illness || "",
      };
    } catch (error) {
      console.error("Error fetching patient details:", error);
      return { patient_Name: "", relationship: "", illness: "" };
    }
  };

  const getDocumentDateRange = async () => {
    try {
      const policyEndDate = await getPolicyEndDate();
      const currentDate = new Date();

      if (!policyEndDate) {
        // If no policy end date available, allow current date and 90 days back
        const minDate = new Date(currentDate);
        minDate.setDate(currentDate.getDate() - 90);
        return {
          minDate,
          maxDate: currentDate,
          isPolicyExpired: false,
        };
      }

      const isExpired = isPolicyExpired(policyEndDate, currentDate);

      if (isExpired) {
        // Policy is expired - allow ONLY 90 days before policy end date up to policy end date
        const maxDate = new Date(policyEndDate);
        const minDate = new Date(policyEndDate);
        minDate.setDate(policyEndDate.getDate() - 90);

        return {
          minDate,
          maxDate,
          isPolicyExpired: true,
          policyEndDate,
        };
      } else {
        // Policy is not expired - allow from current date back to 90 days before current date
        const maxDate = currentDate;
        const minDate = new Date(currentDate);
        minDate.setDate(currentDate.getDate() - 90);

        return {
          minDate,
          maxDate,
          isPolicyExpired: false,
          policyEndDate,
        };
      }
    } catch (error) {
      console.error("Error calculating document date range:", error);
      // Fallback to current date and 90 days back
      const currentDate = new Date();
      const minDate = new Date(currentDate);
      minDate.setDate(currentDate.getDate() - 90);
      return {
        minDate,
        maxDate: currentDate,
        isPolicyExpired: false,
      };
    }
  };

  const handleSubmitLater = () => {
    showPopup(
      "Save Claim",
      "Do you want to save this claim for later submission?",
      "confirm",
      true,
      () => {
        // Hide the first popup and show success
        setPopup((prev) => ({ ...prev, visible: false }));

        // Show success message and navigate
        setTimeout(() => {
          showPopup(
            "Claim Saved",
            "Your claim has been saved for later submission.",
            "success",
            false,
            null
          );

          // Auto-close after 2 seconds and navigate
          setTimeout(() => {
            setPopup((prev) => ({ ...prev, visible: false }));
            navigation.navigate("home");
          }, 2000);
        }, 300);
      }
    );
  };

  const renderDocumentImage = (document) => {
    const isLoadingThisImage = imageLoadingStates.get(document.id) || false;

    return (
      <TouchableOpacity
        style={styles.documentImageIconContainer}
        onPress={() => {
          if (document.hasImage) {
            loadDocumentImage(document);
          } else {
            showPopup(
              "No Image",
              "This document doesn't have an associated image.",
              "info"
            );
          }
        }}
        disabled={isLoadingThisImage}
      >
        <View
          style={[
            styles.imageIconWrapper,
            { backgroundColor: document.hasImage ? "#4DD0E1" : "#E0E0E0" },
          ]}
        >
          {isLoadingThisImage ? (
            <Animated.View style={{ transform: [{ rotate: "45deg" }] }}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <Ionicons
              name={document.hasImage ? "image" : "document-outline"}
              size={20}
              color={document.hasImage ? "#FFFFFF" : "#999"}
            />
          )}
        </View>
        <Text style={styles.imageIconText}>
          {isLoadingThisImage
            ? "Loading..."
            : document.hasImage
            ? "View"
            : "No Image"}
        </Text>
      </TouchableOpacity>
    );
  };

  if (initialLoading) {
    return (
      <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHE Claim Intimation</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Claim Details Section */}
        <View style={styles.claimDetailsSection}>
          <TouchableOpacity
            style={styles.claimDeleteButton}
            onPress={handleDeleteClaim}
          >
            <Ionicons name="trash-outline" size={28} color="#2E7D7D" />
          </TouchableOpacity>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Claim No</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{claimNo2}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entered By</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>
              {loading ? "Loading..." : claimDetails.enteredBy}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{claimDetails.status}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Claim Type</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{claimTypes}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Edit on</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{claimDetails.createdOn}</Text>
          </View>
        </View>

        {/* Beneficiaries Title */}
        <View style={styles.beneficiariesTitleContainer}>
          <Text style={styles.beneficiariesTitle}>Beneficiaries for Claim</Text>
        </View>

        {/* Beneficiaries Section */}
        <View style={styles.beneficiariesSection}>
          {beneficiaries.length > 0 ? (
            beneficiaries.map((beneficiary) => (
              <View key={beneficiary.id} style={styles.beneficiaryCard}>
                <View style={styles.beneficiaryContent}>
                  <View style={styles.beneficiaryRow}>
                    <Text style={styles.beneficiaryLabel}>Patient Name</Text>
                    <Text style={styles.beneficiaryColon}>:</Text>
                    <Text style={styles.beneficiaryValue}>
                      {beneficiary.name}
                    </Text>
                  </View>
                  <View style={styles.beneficiaryRow}>
                    <Text style={styles.beneficiaryLabel}>Relationship</Text>
                    <Text style={styles.beneficiaryColon}>:</Text>
                    <Text style={styles.beneficiaryValue}>
                      {beneficiary.relationship}
                    </Text>
                  </View>
                  <View style={styles.beneficiaryRow}>
                    <Text style={styles.beneficiaryLabel}>Illness</Text>
                    <Text style={styles.beneficiaryColon}>:</Text>
                    <Text style={styles.beneficiaryValue}>
                      {beneficiary.illness}
                    </Text>
                  </View>
                  <View style={styles.beneficiaryRow}>
                    <Text style={styles.beneficiaryLabel}>Amount</Text>
                    <Text style={styles.beneficiaryColon}>:</Text>
                    <Text style={styles.beneficiaryValue}>
                      {beneficiary.amount}
                    </Text>
                  </View>
                </View>
                <View style={styles.beneficiaryActionIcons}>
                  <TouchableOpacity
                    style={styles.beneficiaryIconButton}
                    onPress={() => handleEditBeneficiary(beneficiary)}
                  >
                    <Ionicons name="create-outline" size={28} color="#2E7D7D" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noBeneficiariesContainer}>
              <Text style={styles.noBeneficiariesText}>
                No beneficiaries found. Please add a beneficiary.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addBeneficiaryButton}
            onPress={handleNavigateToUploadDocuments}
          >
            <Text style={styles.addBeneficiaryText}>Add More Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Documents Section */}
        <View style={styles.documentsSection}>
          {documentsLoading && !initialLoading ? (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <LoadingIcon />
                <Text style={styles.loadingText}>Loading Documents...</Text>
                <Text style={styles.loadingSubText}>Please wait a moment</Text>
              </View>
            </View>
          ) : documents.length > 0 ? (
            documents.map((document) => (
              <View key={document.id} style={styles.documentCard}>
                {renderDocumentImage(document)}
                <View style={styles.documentContent}>
                  <View style={styles.documentRow}>
                    <Text style={styles.documentLabel}>Document Type</Text>
                    <Text style={styles.documentColon}>:</Text>
                    <Text style={styles.documentValue}>{document.type}</Text>
                  </View>
                  <View style={styles.documentRow}>
                    <Text style={styles.documentLabel}>Date of Document</Text>
                    <Text style={styles.documentColon}>:</Text>
                    <Text style={styles.documentValue}>{document.date}</Text>
                  </View>
                  <View style={styles.documentRow}>
                    <Text style={styles.documentLabel}>Amount</Text>
                    <Text style={styles.documentColon}>:</Text>
                    <Text style={styles.documentValue}>{document.amount}</Text>
                  </View>
                </View>
                <View style={styles.documentActionIcons}>
                  <TouchableOpacity
                    style={styles.documentIconButton}
                    onPress={() => handleEditDocument(document)}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.documentIconButton}
                    onPress={() => handleDeleteDocument(document.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDocumentsContainer}>
              <Text style={styles.noDocumentsText}>No documents found.</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitDisabled() && styles.submitButtonDisabled,
            ]}
            onPress={isSubmitDisabled() ? null : handleSubmitClaim}
            disabled={isSubmitDisabled()}
          >
            <Text
              style={[
                styles.submitButtonText,
                isSubmitDisabled() && styles.submitButtonTextDisabled,
              ]}
            >
              Submit Claim
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitLaterButton}
            onPress={handleSubmitLater}
          >
            <Text style={styles.submitLaterButtonText}>Submit Later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Add Document Modal */}
      <Modal
        visible={isAddDocumentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddDocumentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Document</Text>
            <TextInput
              style={styles.modalInput}
              value={newDocument.type}
              onChangeText={(value) =>
                setNewDocument((prev) => ({ ...prev, type: value }))
              }
              placeholder="Enter document type (e.g., JPG, Diagnosis Card)"
            />
            <TextInput
              style={styles.modalInput}
              value={newDocument.date}
              onChangeText={(value) =>
                setNewDocument((prev) => ({ ...prev, date: value }))
              }
              placeholder="Enter date (DD/MM/YYYY)"
            />
            <TextInput
              style={styles.modalInput}
              value={newDocument.amount}
              onChangeText={(value) =>
                setNewDocument((prev) => ({ ...prev, amount: value }))
              }
              placeholder="Enter amount"
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setAddDocumentModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddDocument}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit Document Modal */}
      <Modal
        visible={isEditDocumentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditDocumentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.documentModalContent}>
            <ScrollView
              contentContainerStyle={styles.documentModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Edit Document</Text>

              {/* Document Type Dropdown */}
              <Text style={styles.documentFieldLabel}>Document Type</Text>
              <TouchableOpacity
                style={[
                  styles.documentDropdownButton,
                  loadingDocumentTypes && styles.dropdownButtonDisabled,
                ]}
                onPress={() =>
                  !loadingDocumentTypes &&
                  setEditDocTypeDropdownVisible(!isEditDocTypeDropdownVisible)
                }
                disabled={loadingDocumentTypes}
              >
                <Text style={styles.dropdownButtonText}>
                  {loadingDocumentTypes
                    ? "Loading document types..."
                    : editDocumentType
                    ? documentTypes.find(
                        (type) => type.docId === editDocumentType
                      )?.docDesc || "Select Document Type"
                    : "Select Document Type"}
                </Text>
                <Ionicons
                  name={
                    isEditDocTypeDropdownVisible ? "chevron-up" : "chevron-down"
                  }
                  size={20}
                  color={loadingDocumentTypes ? "#ccc" : "#666"}
                />
              </TouchableOpacity>

              {/* Document Type Dropdown Options */}
              {isEditDocTypeDropdownVisible && !loadingDocumentTypes && (
                <View style={styles.documentDropdownOptions}>
                  {documentTypes.map((docType) => {
                    const isBillDisabled =
                      docType.docId === "O01" &&
                      documents.some(
                        (doc) =>
                          doc.type === "BILL" && doc.id !== selectedDocument?.id
                      );

                    return (
                      <TouchableOpacity
                        key={docType.docId}
                        style={[
                          styles.documentDropdownOption,
                          editDocumentType === docType.docId &&
                            styles.selectedDropdownOption,
                          isBillDisabled && styles.disabledDropdownOption,
                        ]}
                        onPress={() => handleEditDocTypeSelect(docType)}
                        disabled={isBillDisabled}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            editDocumentType === docType.docId &&
                              styles.selectedDropdownOptionText,
                            isBillDisabled && styles.disabledDropdownOptionText,
                          ]}
                        >
                          {docType.docDesc}
                          {isBillDisabled && " (Already exists)"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Document Date */}
              <Text style={styles.documentFieldLabel}>Document Date</Text>
              <TouchableOpacity
                style={styles.documentDropdownButton}
                onPress={showEditDatePickerModal}
              >
                <Text style={styles.dropdownButtonText}>
                  {formatDate(editDocumentDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>

              {/* Help text showing allowed date range */}
              <Text style={styles.helpText}>{getDatePickerHelpText()}</Text>

              {showEditDatePicker && documentDateRange && (
                <DateTimePicker
                  testID="editDateTimePicker"
                  value={editDocumentDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={handleEditDateChange}
                  minimumDate={documentDateRange.minDate}
                  maximumDate={documentDateRange.maxDate}
                />
              )}

              {/* Document Amount */}
              <Text style={styles.documentFieldLabel}>
                Document Amount
                {(editDocumentType === "O01" || editDocumentType === "O04") && (
                  <Text style={styles.requiredAsterisk}> *</Text>
                )}
              </Text>
              <TextInput
                style={[
                  styles.documentModalInput,
                  !isEditAmountEditable() && styles.textInputDisabled,
                  (editDocumentType === "O01" || editDocumentType === "O04") &&
                    !validateEditAmount(newDocument.amount, editDocumentType) &&
                    styles.textInputError,
                ]}
                placeholder={
                  !editDocumentType
                    ? "Select document type first"
                    : isEditAmountEditable()
                    ? "Enter amount"
                    : "0.00"
                }
                placeholderTextColor="#B0B0B0"
                value={newDocument.amount}
                onChangeText={handleEditAmountChange}
                keyboardType="decimal-pad"
                editable={isEditAmountEditable()}
              />

              {/* Help text for amount field */}
              {editDocumentType === "O02" || editDocumentType === "O03" ? (
                <Text style={styles.helpText}>
                  Amount is automatically set to 0.00 for{" "}
                  {getDocumentTypeLabel(editDocumentType)}
                </Text>
              ) : editDocumentType === "O01" ? (
                <Text
                  style={[
                    styles.helpText,
                    !validateEditAmount(newDocument.amount, editDocumentType) &&
                      styles.errorText,
                  ]}
                >
                  {!validateEditAmount(newDocument.amount, editDocumentType)
                    ? "Amount is required and must be greater than 0 for Bill type"
                    : "Amount is required for Bill type"}
                </Text>
              ) : editDocumentType === "O04" ? (
                <Text
                  style={[
                    styles.helpText,
                    !validateEditAmount(newDocument.amount, editDocumentType) &&
                      styles.errorText,
                  ]}
                >
                  {!validateEditAmount(newDocument.amount, editDocumentType)
                    ? "Amount is required for Other document type"
                    : "Enter amount for Other document type"}
                </Text>
              ) : !editDocumentType ? (
                <Text style={styles.helpText}>
                  Please select a document type first
                </Text>
              ) : null}
            </ScrollView>

            <View style={styles.documentModalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setEditDocumentModalVisible(false);
                  setEditDocTypeDropdownVisible(false);
                  setEditDocumentType("");
                  setEditDocumentDate(new Date());
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveDocumentEdit}
                style={[
                  styles.saveBtn,
                  !validateEditAmount(newDocument.amount, editDocumentType) &&
                    styles.saveBtnDisabled,
                ]}
                disabled={
                  !validateEditAmount(newDocument.amount, editDocumentType)
                }
              >
                <Text
                  style={[
                    styles.saveText,
                    !validateEditAmount(newDocument.amount, editDocumentType) &&
                      styles.saveTextDisabled,
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Image Preview Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImageUri && (
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.enlargedImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={isEditBeneficiaryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditBeneficiaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.beneficiaryModalContent}>
            <Text style={styles.modalTitle}>Edit Beneficiary</Text>

            {/* Member Name Dropdown */}
            <Text style={styles.fieldLabel}>Member Name</Text>
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
                  : "Select Member"}
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
              style={styles.beneficiaryModalInput}
              value={newBeneficiary.illness}
              onChangeText={(value) =>
                setNewBeneficiary((prev) => ({ ...prev, illness: value }))
              }
              placeholder="Enter illness"
              multiline
              numberOfLines={3}
            />

            <View style={styles.beneficiaryModalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setEditBeneficiaryModalVisible(false);
                  setDropdownVisible(false);
                  setSelectedMember(null);
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBeneficiaryEdit}
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
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D7D",
    flex: 1,
    textAlign: "center",
  },
  scrollContainer: {
    paddingHorizontal: 0,
    paddingBottom: 30,
  },

  // Loading Styles
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

  // Claim Details Section
  claimDetailsSection: {
    backgroundColor: "rgba(77, 208, 225, 0.1)",
    borderRadius: 15,
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#4DD0E1",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  colon: {
    fontSize: 13,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 20,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "400",
    flex: 1,
  },

  // Beneficiaries Section
  beneficiariesTitleContainer: {
    backgroundColor: "#6DD3D3",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 15,
  },
  beneficiariesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  beneficiariesSection: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: "#4DD0E1",
  },
  beneficiaryCard: {
    borderRadius: 10,
    padding: 12,
    position: "relative",
    marginBottom: 5,
  },
  beneficiaryContent: {
    paddingRight: 60,
  },
  beneficiaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  beneficiaryLabel: {
    fontSize: 13,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 90,
    flexShrink: 0,
  },
  beneficiaryColon: {
    fontSize: 13,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 20,
    textAlign: "center",
  },
  beneficiaryValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "400",
    flex: 1,
  },
  addBeneficiaryButton: {
    backgroundColor: "#2E7D7D",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: "flex-end",
    marginRight: 5,
    marginBottom: 5,
    marginTop: 5,
  },
  addBeneficiaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  // Documents Section
  documentsSection: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  documentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    marginBottom: 15,
    padding: 5,
    borderWidth: 1,
    borderColor: "#4DD0E1",
    position: "relative",
    minHeight: 120,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  documentContent: {
    flex: 1,
    paddingRight: 60,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  documentLabel: {
    fontSize: 13,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  documentColon: {
    fontSize: 13,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 20,
    textAlign: "center",
  },
  documentValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "400",
    flex: 1,
  },
  documentActionIcons: {
    position: "absolute",
    top: 70,
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  documentIconButton: {
    backgroundColor: "#2E7D7D",
    borderRadius: 12,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Action Buttons
  buttonContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  submitButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#0A4C51",
    fontSize: 16,
    fontWeight: "600",
  },
  submitLaterButton: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitLaterButtonText: {
    color: "#0A4C51",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#2E7D7D",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelBtn: {
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  cancelText: {
    color: "#888",
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#4DD0E1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  saveText: {
    color: "#fff",
    fontWeight: "500",
  },

  // Document Modal Styles
  documentModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    maxHeight: "60%",
    minHeight: "50%",
  },
  documentModalScrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  documentModalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 14,
    minHeight: 35,
  },
  documentModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "white",
  },
  documentFieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2E7D7D",
    marginBottom: 3,
    marginTop: 5,
  },
  documentDropdownButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    minHeight: 35,
  },
  documentDropdownOptions: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
    maxHeight: 160,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentDropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  disabledDropdownOption: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  disabledDropdownOptionText: {
    color: "#999",
    fontStyle: "italic",
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
  dropdownButtonText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  dropdownButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  textInputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#888",
  },
  textInputError: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  helpText: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    marginBottom: 10,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    marginBottom: 10,
  },
  requiredAsterisk: {
    color: "#FF6B6B",
    fontSize: 16,
  },

  // Document Image Styles
  documentImageIconContainer: {
    width: 50,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginRight: 10,
  },
  imageIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageIconText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },

  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  enlargedImage: {
    width: "90%",
    height: "80%",
    borderRadius: 10,
  },

  // Empty State Styles
  noBeneficiariesContainer: {
    padding: 20,
    alignItems: "center",
  },
  noBeneficiariesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  noDocumentsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDocumentsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
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
  claimDeleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 45,
  },

  beneficiaryActionIcons: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },

  beneficiaryIconButton: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 45,
  },
  saveBtnDisabled: {
    backgroundColor: "#B0B0B0",
  },
  saveTextDisabled: {
    color: "#666",
  },
  beneficiaryModalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    maxHeight: "75%",
    minHeight: "40%",
  },
  beneficiaryModalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 14,
    minHeight: 60, // Larger for multiline illness input
    textAlignVertical: "top",
  },
  beneficiaryModalButtons: {
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
  submitButtonDisabled: {
    backgroundColor: "#B0B0B0",
    opacity: 0.6,
  },
  submitButtonTextDisabled: {
    color: "#666",
  },
});

export default EditClaimIntimation;
