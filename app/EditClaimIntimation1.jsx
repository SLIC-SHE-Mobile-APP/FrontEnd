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
              onPress={showConfirmButton ? onClose : onConfirm || onClose}
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

const EditClaimIntimation1 = ({ route }) => {
  const navigation = useNavigation();
  const { claim, submittedData } = route?.params || {};
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [documentDateRange, setDocumentDateRange] = useState(null);

  // Document types state
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
  const [editDocumentType, setEditDocumentType] = useState("");
  const [editDocumentDate, setEditDocumentDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [isEditDocTypeDropdownVisible, setEditDocTypeDropdownVisible] =
    useState(false);

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
    claimNo: "",
    enteredBy: "Loading...",
    status: "Submission for Approval Pending",
    claimType: "",
    createdOn: "",
  });

  // Employee info state
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Track all loading states
  const [loadingStates, setLoadingStates] = useState({
    claimDetails: true,
    beneficiaryData: true,
    employeeInfo: true,
    documents: true,
  });

  // Beneficiaries state - Initialize as empty array
  const [beneficiaries, setBeneficiaries] = useState([]);

  // Documents state - Initialize as empty array (will be populated from API)
  const [documents, setDocuments] = useState([]);

  // Modal states
  const [isAddBeneficiaryModalVisible, setAddBeneficiaryModalVisible] =
    useState(false);
  const [isAddDocumentModalVisible, setAddDocumentModalVisible] =
    useState(false);
  const [isEditBeneficiaryModalVisible, setEditBeneficiaryModalVisible] =
    useState(false);
  const [isEditDocumentModalVisible, setEditDocumentModalVisible] =
    useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Image modal states
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState(new Map());

  // New beneficiary form
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: "",
    relationship: "",
    illness: "",
    amount: "",
  });

  const removeCommasFromAmount = (amount) => {
    if (!amount) return "";
    return amount.toString().replace(/,/g, "");
  };

  const toSentenceCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
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
        // Policy is not expired - allow from current date to 90 days before current date
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
        maxDate,
        isPolicyExpired: false,
      };
    }
  };

  const getDatePickerHelpText = () => {
    if (!documentDateRange) return "Loading date range...";

    const formatDateForDisplay = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    if (documentDateRange.isPolicyExpired) {
      return `Policy expired on ${formatDateForDisplay(
        documentDateRange.policyEndDate
      )}. You can only select document dates within 90 days before the policy expiry date: ${formatDateForDisplay(
        documentDateRange.minDate
      )} to ${formatDateForDisplay(documentDateRange.maxDate)}`;
    } else {
      return `You can select document dates from the last 90 days: ${formatDateForDisplay(
        documentDateRange.minDate
      )} to ${formatDateForDisplay(documentDateRange.maxDate)}`;
    }
  };

  // Add this useEffect to calculate date range on component mount
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

  const isPolicyExpired = (policyEndDate, currentDate = new Date()) => {
    if (!policyEndDate) return false;
    return currentDate > policyEndDate;
  };

  const getDocumentTypeLabel = (docId) => {
    const docType = documentTypes.find((type) => type.docId === docId);
    return docType ? toSentenceCase(docType.docDesc) : toSentenceCase(docId);
  };

  // New document form
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

  // Helper function to format amount to 2 decimal places
  const formatAmount = (amount) => {
    if (!amount || isNaN(parseFloat(amount))) {
      return "0.00";
    }
    return parseFloat(amount).toFixed(2);
  };

  // Helper function to update loading states
  const updateLoadingState = (key, value) => {
    setLoadingStates((prev) => {
      const newStates = { ...prev, [key]: value };

      // Check if all loading states are false
      const allLoaded = Object.values(newStates).every((state) => !state);
      if (allLoaded) {
        setInitialLoading(false);
      }

      return newStates;
    });
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

  // Loading Screen Component with Custom Icon
  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>Loading Saved Claim Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Format date from API response (e.g., "2025-03-04T00:00:00" to "04/03/2025")
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
      console.log("Fetching document types...");

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
      console.log("Document types API response:", docTypesData);

      setDocumentTypes(docTypesData);
    } catch (error) {
      console.error("Error fetching document types:", error);
      showPopup(
        "Error",
        "Failed to load document types. Please try again.",
        "error"
      );

      // Set fallback data in case of error
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

  const fetchDependents = async () => {
    try {
      setLoadingMembers(true);
      console.log("Fetching dependents data...");

      // Get policy number and member number from SecureStore
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

      // Transform API data to match the expected format
      const transformedMembers = dependentsData.map((dependent, index) => ({
        id: index + 1, // or use memberCode if unique
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

      // Set fallback data in case of error
      setMemberOptions([
        { id: 1, name: "Unknown Member", relationship: "Self" },
      ]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Helper function to parse clmMemSeqNo
  const parseClmMemSeqNo = (clmMemSeqNo) => {
    try {
      if (!clmMemSeqNo || typeof clmMemSeqNo !== "string") {
        console.warn("Invalid clmMemSeqNo:", clmMemSeqNo);
        return { memId: 0, seqNo: 0 };
      }

      const parts = clmMemSeqNo.split("-");
      if (parts.length !== 2) {
        console.warn("Invalid clmMemSeqNo format:", clmMemSeqNo);
        return { memId: 0, seqNo: 0 };
      }

      const memId = parseInt(parts[0], 10);
      const seqNo = parseInt(parts[1], 10);

      if (isNaN(memId) || isNaN(seqNo)) {
        console.warn("Invalid numeric values in clmMemSeqNo:", clmMemSeqNo);
        return { memId: 0, seqNo: 0 };
      }

      return { memId, seqNo };
    } catch (error) {
      console.error("Error parsing clmMemSeqNo:", error);
      return { memId: 0, seqNo: 0 };
    }
  };

  // Delete document from API
  const deleteDocumentFromAPI = async (document) => {
    try {
      const { memId, seqNo } = parseClmMemSeqNo(document.clmMemSeqNo);

      console.log("Deleting document with:", {
        claimNo: claimDetails.claimNo,
        memId,
        seqNo,
        originalClmMemSeqNo: document.clmMemSeqNo,
      });

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
        console.error("Delete Document API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Delete document API response:", result);

      return result;
    } catch (error) {
      console.error("Error deleting document from API:", error);
      throw error;
    }
  };

  const fetchDocuments = async (claimNo) => {
    try {
      console.log("Fetching documents for claimNo:", claimNo);

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
        const errorText = await response.text();
        console.error("Documents API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();

      if (result.success && result.data && Array.isArray(result.data)) {
        // Transform API data to match component structure
        const transformedDocuments = result.data.map((doc, index) => {
          // Fix: Check if document has an image by trying to load it
          // Since imgContent is null in the response, assume all documents have images
          // and let the view API determine if image exists
          return {
            id: doc.clmMemSeqNo || `doc_${index}`,
            clmMemSeqNo: doc.clmMemSeqNo,
            type: doc.docType || "Unknown",
            date: formatDate(doc.docDate),
            amount: formatAmount(doc.docAmount),
            imagePath: doc.imagePath || "0",
            hasImage: true, // Changed: Assume all documents have images and let view API handle it
            imageLoaded: false,
            imgContent: doc.imgContent || null,
          };
        });

        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        claimNo: claimNo,
      });

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

  const loadDocumentImage = async (document) => {
    try {
      // Set loading state for this specific document
      setImageLoadingStates((prev) => new Map(prev.set(document.id, true)));

      console.log("Loading image for document:", document.clmMemSeqNo);

      const response = await fetch(
        `${API_BASE_URL}/ClaimDocuments/view/${document.clmMemSeqNo}`,
        {
          method: "GET",
          headers: {
            Accept: "image/*", // Changed: Specify we expect image data
          },
        }
      );

      if (!response.ok) {
        // If 404 or similar, the image doesn't exist
        if (response.status === 404) {
          showPopup(
            "No Image",
            "This document doesn't have an associated image.",
            "info"
          );

          // Update document to reflect no image available
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === document.id ? { ...doc, hasImage: false } : doc
            )
          );

          // Clear loading state
          setImageLoadingStates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(document.id);
            return newMap;
          });
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type to determine how to handle the response
      const contentType = response.headers.get("content-type");
      console.log("Response content type:", contentType);

      if (contentType && contentType.startsWith("image/")) {
        // Handle as binary image data
        const blob = await response.blob();

        // Convert blob to base64 using FileReader
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          console.log(
            "Image loaded successfully, base64 length:",
            base64String.length
          );
          setSelectedImageUri(base64String);
          setImageModalVisible(true);

          // Clear loading state
          setImageLoadingStates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(document.id);
            return newMap;
          });
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          showPopup("Error", "Failed to process image data", "error");

          // Clear loading state
          setImageLoadingStates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(document.id);
            return newMap;
          });
        };
        reader.readAsDataURL(blob);
      } else if (contentType && contentType.includes("application/json")) {
        // Handle JSON response (might contain base64 encoded image)
        const jsonResponse = await response.json();
        console.log("JSON response:", jsonResponse);

        if (jsonResponse.imgContent) {
          // If the response contains base64 image data
          const base64String = jsonResponse.imgContent.startsWith("data:")
            ? jsonResponse.imgContent
            : `data:image/jpeg;base64,${jsonResponse.imgContent}`;

          setSelectedImageUri(base64String);
          setImageModalVisible(true);
        } else {
          showPopup(
            "No Image",
            "This document doesn't have an associated image.",
            "info"
          );

          // Update document to reflect no image available
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === document.id ? { ...doc, hasImage: false } : doc
            )
          );
        }

        // Clear loading state
        setImageLoadingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(document.id);
          return newMap;
        });
      } else {
        // Handle as text/other response
        const textResponse = await response.text();
        console.log("Text response:", textResponse);

        // Try to determine if it's base64 encoded image
        if (textResponse && textResponse.length > 100) {
          const base64String = textResponse.startsWith("data:")
            ? textResponse
            : `data:image/jpeg;base64,${textResponse}`;

          setSelectedImageUri(base64String);
          setImageModalVisible(true);
        } else {
          showPopup(
            "No Image",
            "This document doesn't have an associated image.",
            "info"
          );

          // Update document to reflect no image available
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === document.id ? { ...doc, hasImage: false } : doc
            )
          );
        }

        // Clear loading state
        setImageLoadingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(document.id);
          return newMap;
        });
      }
    } catch (error) {
      console.error("Error loading document image:", error);

      if (error.message.includes("404")) {
        showPopup(
          "No Image",
          "This document doesn't have an associated image.",
          "info"
        );

        // Update document to reflect no image available
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === document.id ? { ...doc, hasImage: false } : doc
          )
        );
      } else {
        showPopup("Error", `Failed to load image: ${error.message}`, "error");
      }

      // Clear loading state
      setImageLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(document.id);
        return newMap;
      });
    }
  };

  // Fetch claim amount from API
  const fetchClaimAmount = async (claimNo) => {
    try {
      console.log("Fetching claim amount for claimNo:", claimNo);

      const requestBody = {
        seqNo: claimNo,
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
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();

      const formattedAmount = formatAmount(data.claimAmount); // Format with 2 decimal places

      return formattedAmount;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        claimNo: claimNo,
      });

      // Show user-friendly error message
      showPopup(
        "Network Error",
        `Unable to fetch claim amount. Using default amount. Error: ${error.message}`,
        "error"
      );

      return "0.00"; // Default fallback amount
    }
  };

  const refreshClaimAmount = async () => {
    try {
      console.log(
        "Refreshing claim amount and patient details for beneficiaries..."
      );

      if (!claimDetails.claimNo) {
        console.warn("No claim number available for refreshing claim amount");
        return;
      }

      // Fetch updated claim amount
      const updatedAmount = await fetchClaimAmount(claimDetails.claimNo);

      // Try to fetch updated patient details as well
      try {
        const updatedPatientDetails = await fetchPatientDetails(
          claimDetails.claimNo
        );

        // Update beneficiaries with both new amount and refreshed patient details
        if (beneficiaries.length > 0) {
          const updatedBeneficiaries = beneficiaries.map((beneficiary) => ({
            ...beneficiary,
            name: updatedPatientDetails.patientName || beneficiary.name,
            relationship:
              updatedPatientDetails.relationship || beneficiary.relationship,
            illness: updatedPatientDetails.illness || beneficiary.illness,
            amount: updatedAmount,
          }));

          setBeneficiaries(updatedBeneficiaries);
          await storeBeneficiaryData(updatedBeneficiaries);

          console.log(
            "Claim amount and patient details refreshed successfully:",
            {
              amount: updatedAmount,
              patientDetails: updatedPatientDetails,
            }
          );
        }
      } catch (patientDetailsError) {
        console.warn(
          "Could not refresh patient details, updating amount only:",
          patientDetailsError
        );

        // Fallback: only update amount if patient details fetch fails
        if (beneficiaries.length > 0) {
          const updatedBeneficiaries = beneficiaries.map((beneficiary) => ({
            ...beneficiary,
            amount: updatedAmount,
          }));

          setBeneficiaries(updatedBeneficiaries);
          await storeBeneficiaryData(updatedBeneficiaries);

          console.log(
            "Claim amount refreshed successfully (amount only):",
            updatedAmount
          );
        }
      }
    } catch (error) {
      console.error("Error refreshing claim amount:", error);
    }
  };

  // Store initial claim details when component first loads
  const storeInitialClaimDetails = async (claimData) => {
    try {
      console.log("Storing initial claim details:", claimData);

      // Store claim details
      await SecureStore.setItemAsync(
        "edit_claimNo",
        String(claimData.claimNo || "")
      );
      await SecureStore.setItemAsync(
        "edit_claimType",
        String(claimData.claimType || "")
      );
      await SecureStore.setItemAsync(
        "edit_createdOn",
        String(claimData.createdOn || "")
      );

      // Store additional needed data
      await SecureStore.setItemAsync(
        "referenNo",
        String(claimData.claimNo || "")
      );

      console.log("Initial claim details stored successfully");
    } catch (error) {
      console.error("Error storing initial claim details:", error);
    }
  };

  // Store beneficiary data
  const storeBeneficiaryData = async (beneficiaryData) => {
    try {
      console.log("Storing beneficiary data:", beneficiaryData);

      if (beneficiaryData && beneficiaryData.length > 0) {
        const firstBeneficiary = beneficiaryData[0];

        // Store with the correct field names to match API response
        await SecureStore.setItemAsync(
          "edit_enteredBy",
          String(firstBeneficiary.name || "")
        );
        await SecureStore.setItemAsync(
          "edit_relationship",
          String(firstBeneficiary.relationship || "")
        );
        await SecureStore.setItemAsync(
          "edit_illness",
          String(firstBeneficiary.illness || "")
        );
        await SecureStore.setItemAsync(
          "edit_beneficiary_amount",
          String(firstBeneficiary.amount || "0.00")
        );

        // Also store patient details separately for easy access
        await SecureStore.setItemAsync(
          "patient_name",
          String(firstBeneficiary.name || "")
        );
        await SecureStore.setItemAsync(
          "patient_relationship",
          String(firstBeneficiary.relationship || "")
        );
        await SecureStore.setItemAsync(
          "patient_illness",
          String(firstBeneficiary.illness || "")
        );
      }

      console.log("Beneficiary data stored successfully");
    } catch (error) {
      console.error("Error storing beneficiary data:", error);
    }
  };

  // Retrieve claim details from SecureStore
  const retrieveClaimDetails = async () => {
    try {
      // First check if we have data from route params (initial load)
      if (claim?.claimNo) {
        console.log("Using claim data from route params:", claim);

        const claimData = {
          claimNo: claim.claimNo,
          claimType: claim.claimType,
          createdOn: claim.createdOn,
        };

        // Store the initial data for future retrievals
        await storeInitialClaimDetails(claimData);

        setClaimDetails((prev) => ({
          ...prev,
          ...claimData,
        }));

        return claim.claimNo;
      }

      // If no route params, try to retrieve from storage (subsequent loads)
      const storedClaimNo = await SecureStore.getItemAsync("edit_claimNo");
      const storedClaimType = await SecureStore.getItemAsync("edit_claimType");
      const storedCreatedOn = await SecureStore.getItemAsync("edit_createdOn");

      console.log("Retrieved stored claim details:", {
        storedClaimNo,
        storedClaimType,
        storedCreatedOn,
      });

      if (storedClaimNo) {
        setClaimDetails((prev) => ({
          ...prev,
          claimNo: storedClaimNo,
          claimType: storedClaimType || "",
          createdOn: storedCreatedOn || "",
        }));

        return storedClaimNo;
      }

      console.warn("No claim data found in params or storage");
      return null;
    } catch (error) {
      console.error("Error retrieving claim details:", error);
      return null;
    } finally {
      updateLoadingState("claimDetails", false);
    }
  };

  // Retrieve beneficiary data from SecureStore
  const retrieveBeneficiaryData = async (claimNo) => {
    try {
      console.log("Retrieving beneficiary data for claimNo:", claimNo);

      if (!claimNo) {
        console.warn(
          "No claim number provided for retrieving beneficiary data"
        );
        setBeneficiaries([]);
        return;
      }

      // First try to fetch patient details from the API
      try {
        const patientDetails = await fetchPatientDetails(claimNo);
        console.log("Fetched patient details from API:", patientDetails);

        // Fetch claim amount for this beneficiary
        const claimAmount = await fetchClaimAmount(claimNo);

        // Create beneficiary object from API data
        const beneficiary = {
          id: "1",
          name: patientDetails.patientName,
          relationship: patientDetails.relationship,
          illness: patientDetails.illness,
          amount: claimAmount,
        };

        setBeneficiaries([beneficiary]);

        // Store the beneficiary data for future use
        await storeBeneficiaryData([beneficiary]);

        console.log("Beneficiary data set from API:", beneficiary);
        return;
      } catch (apiError) {
        console.warn("API fetch failed, trying stored data:", apiError);

        // Fallback to stored data if API fails
        const storedEnteredBy = await SecureStore.getItemAsync(
          "edit_enteredBy"
        );
        const storedRelationship = await SecureStore.getItemAsync(
          "edit_relationship"
        );
        const storedIllness = await SecureStore.getItemAsync("edit_illness");

        console.log("Retrieved stored beneficiary data:", {
          storedEnteredBy,
          storedRelationship,
          storedIllness,
        });

        // If we have stored beneficiary data, create a beneficiary object
        if (storedEnteredBy && storedRelationship) {
          // Fetch claim amount for this beneficiary
          const claimAmount = await fetchClaimAmount(claimNo);

          const beneficiary = {
            id: "1",
            name: storedEnteredBy,
            relationship: storedRelationship,
            illness: storedIllness || "",
            amount: claimAmount,
          };

          setBeneficiaries([beneficiary]);

          // Store the beneficiary data for future use
          await storeBeneficiaryData([beneficiary]);

          console.log("Beneficiary data set from stored data:", beneficiary);
        } else {
          // If no stored data either, initialize with empty array
          setBeneficiaries([]);
          console.log(
            "No beneficiary data found from API or storage, setting empty array"
          );
        }
      }
    } catch (error) {
      console.error("Error retrieving beneficiary data:", error);
      setBeneficiaries([]);
    } finally {
      updateLoadingState("beneficiaryData", false);
    }
  };

  // Fetch employee information
  const fetchEmployeeInfo = async () => {
    try {
      setLoading(true);

      // Get stored employee info
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      console.log("Employee info from storage:", {
        policyNumber,
        memberNumber,
      });

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
      console.log("Employee info from API:", data);

      setEmployeeInfo(data);

      // Update claim details with member name
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

  // Submit final claim API function
  const submitFinalClaim = async (claimNo) => {
    try {
      console.log("Submitting final claim:", claimNo);

      const requestBody = {
        claimSeqNo: claimNo,
      };

      console.log("Submit final claim request data:", requestBody);

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
        console.error("Submit Final Claim API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Submit final claim API response:", result);
      return result;
    } catch (error) {
      console.error("Error submitting final claim:", error);
      throw error;
    }
  };

  // useEffect to fetch employee info and retrieve claim details on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log("Initializing component with route params:", route?.params);

        // First retrieve stored claim details
        const claimNo = await retrieveClaimDetails();

        if (!claimNo) {
          console.error("No claim number found, cannot continue");
          setInitialLoading(false);
          return;
        }

        console.log("Using claim number:", claimNo);

        // Start all loading operations in parallel
        const loadingPromises = [
          retrieveBeneficiaryData(claimNo),
          fetchEmployeeInfo(),
          fetchDocuments(claimNo),
          fetchDependents(),
          fetchDocumentTypes(),
        ];

        // Wait for all operations to complete
        await Promise.all(loadingPromises);
      } catch (error) {
        console.error("Error initializing component:", error);
        showPopup(
          "Initialization Error",
          "Failed to load claim data. Please try again.",
          "error"
        );
      } finally {
        // Ensure loading screen disappears even on error
        setInitialLoading(false);
      }
    };

    initializeComponent();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchDocumentsOnFocus = async () => {
        // Only fetch documents on focus if not in initial loading state
        if (!initialLoading) {
          console.log("Fetching documents on focus");
          const claimNo = claimDetails.claimNo || claim?.claimNo;

          // Check if claim number exists and is not empty
          if (claimNo && claimNo !== "") {
            setDocumentsLoading(true);

            try {
              await fetchDocuments(claimNo);

              // Only refresh claim amount if documents fetch was successful
              console.log("Refreshing claim amount after navigation...");
              await refreshClaimAmount();
            } catch (error) {
              console.error("Error fetching documents on focus:", error);
              setDocumentsLoading(false);
            }
          } else {
            console.log("No valid claim number found, skipping document fetch");
          }
        }
      };

      fetchDocumentsOnFocus();
    }, [claimDetails.claimNo, claim?.claimNo, initialLoading])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      // Check if we're returning from UploadDocumentsSaved
      const routes = navigation.getState()?.routes;
      const currentRoute = routes[routes.length - 1];

      if (currentRoute?.params?.fromUploadDocuments) {
        console.log(
          "Returned from UploadDocumentsSaved, refreshing claim amount..."
        );
        await refreshClaimAmount();

        // Clear the flag to prevent multiple refreshes
        navigation.setParams({ fromUploadDocuments: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Check if we can go back in navigation stack
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true; // Prevent default behavior
        }

        // If no previous screen, allow default behavior (minimize app)
        return false;
      };

      // Add hardware back button listener
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [navigation])
  );

  // Enhanced back button handler
  const handleBackPress = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate to home screen or handle gracefully
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }], // Replace 'Home' with your actual home screen name
      });
    }
  }, [navigation]);

  // Navigate to UploadDocuments page
  const handleNavigateToUploadDocuments = () => {
    // Store current beneficiary data before navigation
    if (beneficiaries.length > 0) {
      storeBeneficiaryData(beneficiaries);
    }

    navigation.navigate("UploadDocumentsSaved", {
      claim: {
        claimNo: claimDetails.claimNo,
        claimType: claimDetails.claimType,
        createdOn: claimDetails.createdOn,
      },
      beneficiaries: beneficiaries,
      documents: documents,
      fromEditClaim: true,
      patientData:
        beneficiaries.length > 0
          ? {
              patientName: beneficiaries[0].name,
              illness: beneficiaries[0].illness,
            }
          : {},
    });
  };

  const fetchPatientDetails = async (claimNo) => {
    try {
      console.log("Fetching patient details for claimNo:", claimNo);

      const requestBody = {
        seqNo: claimNo,
      };

      const response = await fetch(
        `${API_BASE_URL}/ClaimAmount/GetPatientDetails`,
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
        console.error("Get Patient Details API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Patient details API response:", data);

      return {
        patientName: data.patient_Name || "",
        relationship: data.relationship || "",
        illness: data.illness || "",
      };
    } catch (error) {
      console.error("Error fetching patient details:", error);
      throw error;
    }
  };

  // Add beneficiary
  const handleAddBeneficiary = async () => {
    if (newBeneficiary.name && newBeneficiary.relationship) {
      // Fetch claim amount for the new beneficiary
      const claimAmount = await fetchClaimAmount(claimDetails.claimNo);

      const newBeneficiaryData = {
        id: Date.now().toString(),
        ...newBeneficiary,
        amount: claimAmount, // Set formatted amount from API
      };

      setBeneficiaries((prev) => [...prev, newBeneficiaryData]);

      // Store the updated beneficiary data
      await storeBeneficiaryData([...beneficiaries, newBeneficiaryData]);

      setNewBeneficiary({
        name: "",
        relationship: "",
        illness: "",
        amount: "",
      });
      setAddBeneficiaryModalVisible(false);
    }
  };

  // Edit beneficiary
  const handleEditBeneficiary = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);

    // Find the member from options if it exists
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

  // Add this function to handle member selection
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
        isUpdate: true,
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

  // Save beneficiary edit
  const handleSaveBeneficiaryEdit = async () => {
    try {
      // Validate required fields
      if (!newBeneficiary.name || !newBeneficiary.relationship) {
        showPopup(
          "Validation Error",
          "Patient name and relationship are required.",
          "warning"
        );
        return;
      }

      console.log("Saving beneficiary edit with API integration...");

      // Prepare beneficiary data for API call
      const beneficiaryDataForAPI = {
        name: newBeneficiary.name,
        relationship: newBeneficiary.relationship,
        illness: newBeneficiary.illness.trim(),
      };

      // Call the UpdateIntimation API
      await updateIntimationAPI(beneficiaryDataForAPI);

      // Fetch updated claim amount
      const claimAmount = await fetchClaimAmount(claimDetails.claimNo);

      // Update local state
      const updatedBeneficiaries = beneficiaries.map((item) =>
        item.id === selectedBeneficiary.id
          ? { ...item, ...newBeneficiary, amount: claimAmount }
          : item
      );

      setBeneficiaries(updatedBeneficiaries);

      // Store the updated beneficiary data
      await storeBeneficiaryData(updatedBeneficiaries);

      // Close modal and reset form
      setEditBeneficiaryModalVisible(false);
      setDropdownVisible(false);
      setSelectedMember(null);
      setNewBeneficiary({
        name: "",
        relationship: "",
        illness: "",
        amount: "",
      });

      // Show success message
      showPopup(
        "Success",
        "Beneficiary information updated successfully!",
        "success"
      );

      // Refresh patient details from API to ensure data consistency
      try {
        const refreshedPatientDetails = await fetchPatientDetails(
          claimDetails.claimNo
        );
        console.log(
          "Refreshed patient details after edit:",
          refreshedPatientDetails
        );
      } catch (refreshError) {
        console.warn("Could not refresh patient details:", refreshError);
      }

      console.log("Beneficiary edit saved successfully with API integration");
    } catch (error) {
      console.error("Error in handleSaveBeneficiaryEdit:", error);

      // Handle different types of errors
      if (error.message.includes("Required user information not found")) {
        showPopup(
          "Authentication Error",
          "User information not found. Please logout and login again.",
          "error",
          false,
          () => {
            hidePopup();
          }
        );
      } else if (error.message.includes("404")) {
        showPopup(
          "Not Found Error",
          "The claim could not be found in the system. Please refresh and try again.",
          "error",
          true,
          async () => {
            // Refresh patient details from API
            try {
              const claimNo = claimDetails.claimNo;
              if (claimNo) {
                await retrieveBeneficiaryData(claimNo);
              }
            } catch (refreshError) {
              console.error("Error refreshing data:", refreshError);
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
            hidePopup();
          }
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
          "error",
          true,
          async () => {
            // Save locally without API call as fallback
            const claimAmount = await fetchClaimAmount(claimDetails.claimNo);
            const updatedBeneficiaries = beneficiaries.map((item) =>
              item.id === selectedBeneficiary.id
                ? { ...item, ...newBeneficiary, amount: claimAmount }
                : item
            );
            setBeneficiaries(updatedBeneficiaries);
            await storeBeneficiaryData(updatedBeneficiaries);
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
              "Saved",
              "Changes saved locally. Will sync when server is available.",
              "success"
            );
          }
        );
      } else {
        showPopup(
          "Update Error",
          `Failed to update beneficiary information: ${error.message}\n\nWould you like to save locally?`,
          "error",
          true,
          async () => {
            // Save locally without API call as fallback
            const claimAmount = await fetchClaimAmount(claimDetails.claimNo);
            const updatedBeneficiaries = beneficiaries.map((item) =>
              item.id === selectedBeneficiary.id
                ? { ...item, ...newBeneficiary, amount: claimAmount }
                : item
            );
            setBeneficiaries(updatedBeneficiaries);
            await storeBeneficiaryData(updatedBeneficiaries);
            setEditBeneficiaryModalVisible(false);
            setDropdownVisible(false);
            setSelectedMember(null);
            setNewBeneficiary({
              name: "",
              relationship: "",
              illness: "",
              amount: "",
            });
            showPopup("Saved", "Changes saved locally.", "success");
          }
        );
      }
    }
  };

  // Edit document
  const handleEditDocument = (document) => {
    setSelectedDocument(document);

    // Set the document type ID based on the document type string
    const docType = documentTypes.find(
      (type) => type.docDesc === document.type
    );
    setEditDocumentType(docType ? docType.docId : "");

    // Set to today's date instead of parsing existing date
    setEditDocumentDate(new Date());

    // Set the amount and keep existing date for display
    setNewDocument({
      type: document.type,
      date: document.date,
      amount: document.amount,
    });

    setEditDocumentModalVisible(true);
  };

  // Helper functions for document modal
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
        const formatDateForDisplay = (date) => {
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        console.log("Date validation failed:", {
          selectedDate: formatDateForDisplay(selectedDateStart),
          minDate: formatDateForDisplay(minDateStart),
          maxDate: formatDateForDisplay(maxDateStart),
          selectedDateStart,
          minDateStart,
          maxDateStart,
        });

        showPopup(
          "Invalid Date Selection",
          `Please select a date between ${formatDateForDisplay(
            documentDateRange.minDate
          )} and ${formatDateForDisplay(documentDateRange.maxDate)}`,
          "warning"
        );
        return;
      }
    }

    setEditDocumentDate(currentDate);

    // Update newDocument date
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
      console.log("Updating document via API:", documentData);

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add all fields to FormData
      formData.append("ClmSeqNo", documentData.ClmSeqNo);
      formData.append("ClmMemSeqNo", documentData.ClmMemSeqNo.toString());
      formData.append("DocSeq", documentData.DocSeq.toString());
      formData.append("NewDocRef", documentData.NewDocRef);
      formData.append("DocDate", documentData.DocDate);
      formData.append("DocAmount", documentData.DocAmount.toString());
      formData.append("CreatedBy", documentData.CreatedBy);
      formData.append("ImgName", documentData.ImgName);

      // Handle image content if available - React Native compatible approach
      if (documentData.ImgContent && documentData.ImgContent !== "") {
        try {
          // For React Native, create file object directly from base64
          const base64Data = documentData.ImgContent.replace(
            /^data:image\/[a-z]+;base64,/,
            ""
          );

          // Create file object compatible with React Native FormData
          const imageFile = {
            uri: `data:image/jpeg;base64,${base64Data}`,
            type: "image/jpeg",
            name: documentData.ImgName + ".jpg",
          };

          formData.append("ImgContent", imageFile);
          console.log("Image file prepared for upload");
        } catch (imageError) {
          console.error("Error processing image:", imageError);
          // Continue without image if there's an error
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
        console.error("Update Document API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Update document API response:", result);
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
      return `${day}/${month}/${year}`; // DD/MM/YYYY format for Oracle
    } catch (error) {
      console.error("Error formatting date for API:", error);
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const year = today.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // Save document edit with claim amount refresh
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
    // Find the document to get its details
    const documentToDelete = documents.find((doc) => doc.id === documentId);

    if (!documentToDelete) {
      showPopup("Error", "Document not found.", "error");
      return;
    }

    showPopup(
      "Confirm Delete",
      "Are you sure you want to delete this document?",
      "warning",
      true,
      async () => {
        try {
          // Show loading indicator (optional)
          setDocumentsLoading(true);

          // Only call API if document has clmMemSeqNo (exists in backend)
          if (documentToDelete.clmMemSeqNo) {
            console.log("Deleting document from API:", documentToDelete);
            await deleteDocumentFromAPI(documentToDelete);

            // Show success message
            showPopup(
              "Success",
              "Document deleted successfully from server.",
              "success"
            );
          }

          // Remove from local state regardless of API call success
          setDocuments((prev) => prev.filter((item) => item.id !== documentId));

          // Optionally refresh documents from API
          const claimNo = claimDetails.claimNo || claim?.claimNo;
          if (claimNo) {
            await fetchDocuments(claimNo);
          }

          // Refresh claim amount after deleting document
          console.log("Document deleted, refreshing claim amount...");
          await refreshClaimAmount();

          hidePopup();
        } catch (error) {
          console.error("Error deleting document:", error);

          // Show error but still ask if user wants to remove locally
          hidePopup();
          showPopup(
            "Delete Error",
            `Failed to delete from server: ${error.message}\n\nWould you like to remove it locally?`,
            "error",
            true,
            async () => {
              setDocuments((prev) =>
                prev.filter((item) => item.id !== documentId)
              );
              // Still refresh claim amount even for local deletion
              await refreshClaimAmount();
              hidePopup();
            }
          );
        } finally {
          setDocumentsLoading(false);
        }
      }
    );
  };

  // Handle submit - Updated with API integration
  const handleSubmitClaim = () => {
    showPopup(
      "Submit Claim",
      "Are you sure you want to submit this claim?",
      "info",
      true,
      async () => {
        try {
          console.log("Submitting claim...");

          // Validate that we have a claim number
          if (!claimDetails.claimNo) {
            showPopup("Error", "Claim claim number not found.", "error");
            return;
          }

          // Call the submit final claim API
          await submitFinalClaim(claimDetails.claimNo);

          // Show success message and navigate back
          hidePopup();
          showPopup(
            "Success",
            "Claim submitted successfully!",
            "success",
            false,
            () => {
              hidePopup();
              navigation?.goBack();
            }
          );
        } catch (error) {
          console.error("Error submitting claim:", error);

          hidePopup();
          // Handle different types of errors
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

  // Handle submit later
  const handleSubmitLater = () => {
    showPopup(
      "Saved",
      "Claim saved for later submission.",
      "success",
      false,
      () => {
        hidePopup();
        navigation?.goBack();
      }
    );
  };

  // Document icon with image loading on click
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

  const isSubmitEnabled = () => {
    if (beneficiaries.length === 0) {
      return false;
    }

    const firstBeneficiary = beneficiaries[0];
    if (!firstBeneficiary || !firstBeneficiary.amount) {
      return false;
    }

    const cleanAmount = removeCommasFromAmount(firstBeneficiary.amount);
    const amount = parseFloat(cleanAmount);
    return !isNaN(amount) && amount > 0;
  };

  // Delete claim function with API integration
  // Fixed handleDeleteClaim function with goBack navigation
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
          } catch (storageError) {
            console.warn("Error clearing stored data:", storageError);
          }

          hidePopup();
          showPopup(
            "Success",
            "Claim has been deleted successfully.",
            "success",
            false,
            () => {
              hidePopup();
              navigation.goBack();
            }
          );
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
                navigation.goBack();
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

  // Show loading screen while initializing
  if (initialLoading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHE Claim Intimation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Claim Details Section - Read Only */}
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
            <Text style={styles.detailValue}>{claimDetails.claimNo}</Text>
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
            <Text style={styles.detailValue}>{claimDetails.claimType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Edit on</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{claimDetails.createdOn}</Text>
          </View>
        </View>

        {/* Beneficiaries Title - Full Width */}
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
              !isSubmitEnabled() && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitClaim}
            disabled={!isSubmitEnabled()}
          >
            <Text
              style={[
                styles.submitButtonText,
                !isSubmitEnabled() && styles.submitButtonTextDisabled,
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

      {/* Add Beneficiary Modal */}
      <Modal
        visible={isAddBeneficiaryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddBeneficiaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Beneficiary</Text>
            <TextInput
              style={styles.modalInput}
              value={newBeneficiary.name}
              onChangeText={(value) =>
                setNewBeneficiary((prev) => ({ ...prev, name: value }))
              }
              placeholder="Enter name"
            />
            <TextInput
              style={styles.modalInput}
              value={newBeneficiary.relationship}
              onChangeText={(value) =>
                setNewBeneficiary((prev) => ({
                  ...prev,
                  relationship: value,
                }))
              }
              placeholder="Enter relationship"
            />
            <TextInput
              style={styles.modalInput}
              value={newBeneficiary.illness}
              onChangeText={(value) =>
                setNewBeneficiary((prev) => ({ ...prev, illness: value }))
              }
              placeholder="Enter illness"
            />
            <TextInput
              style={styles.modalInput}
              value={newBeneficiary.amount}
              onChangeText={(value) =>
                setNewBeneficiary((prev) => ({ ...prev, amount: value }))
              }
              placeholder="Amount will be set automatically"
              keyboardType="numeric"
              editable={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setAddBeneficiaryModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddBeneficiary}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Beneficiary Modal */}
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
                    // Check if BILL type already exists (excluding current document being edited)
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

  // Claim Details Section - Fixed alignment
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

  // Beneficiaries Title - Full Width Background
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

  // Beneficiaries Section
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
  beneficiaryActionIcons: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
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

  beneficiaryIconButton: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 45,
  },

  // Add More Documents button
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

  // Documents Section styles
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
    minHeight: 110, // Decreased from 140 to 110
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
    top: 65, // Adjusted position down from 80
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
  addDocumentButton: {
    backgroundColor: "#2E7D7D",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  addDocumentText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
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

  // Modal styles - Separate containers for Beneficiary and Document
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Edit Beneficiary Modal Styles
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

  // Edit Document Modal Styles
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

  // Document-specific field styles
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
    maxHeight: 160, // Increased from 120 to 160 to show all options
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
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
    minHeight: 45,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
    paddingTop: 10,
  },
  cancelBtn: {
    marginRight: 15,
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 20, // Increased padding
  },
  cancelText: {
    color: "#888",
    fontWeight: "500",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#4DD0E1",
    borderRadius: 8,
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 20, // Increased padding
  },
  saveText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },

  // Document image styles
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

  // Image modal styles
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
  saveBtnDisabled: {
    backgroundColor: "#B0B0B0",
  },
  saveTextDisabled: {
    color: "#666",
  },
  submitButtonDisabled: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonTextDisabled: {
    color: "#999999",
  },
});

export default EditClaimIntimation1;
