import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
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

const EditClaimIntimation = ({ route }) => {
  const navigation = useNavigation();
  const {
    claim,
    referenceNo,
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

  // State for claim details
  const [claimDetails, setClaimDetails] = useState({
    referenceNo: referenceNo || claimNumber || claim?.referenceNo || "",
    enteredBy: patientName || claim?.enteredBy || "Loading...",
    status: "Submission for Approval Pending",
    claimType: claimType || claim?.claimType || "",
    createdOn:
      createdOn || claim?.createdOn || new Date().toLocaleDateString("en-GB"),
    claimAmount: claimAmount || claim?.claimAmount || "0.00",
  });

  // Employee info state
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [claimTypes, setClaimType] = useState("");
  const [referenceNo2, setReferenceNo] = useState("");

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
  const [isAddDocumentModalVisible, setAddDocumentModalVisible] =
    useState(false);
  const [isEditDocumentModalVisible, setEditDocumentModalVisible] =
    useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Image modal states
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState(new Map());

  // New document form
  const [newDocument, setNewDocument] = useState({
    type: "",
    date: "",
    amount: "",
  });

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

  const handleBackPress = () => {
    Alert.alert(
      "Exit Claim",
      "Do you want to exit? Your claim will be saved in saved claims.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            console.log("User confirmed exit, navigating to home");

            // Show confirmation message
            Alert.alert(
              "Claim Saved",
              "Your claim has been saved in saved claims.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    // Change "Home" to "home" (lowercase)
                    navigation.navigate("home");
                  },
                },
              ]
            );
          },
        },
      ],
      { cancelable: false }
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

  // Loading Screen Component with Custom Icon
  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>Loading....</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Format date from API response (e.g., "2025-03-04T00:00:00" to "04/03/2025")
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Fetch document types
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
      Alert.alert("Error", "Failed to load document types. Please try again.");

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
        claimNo: claimDetails.referenceNo,
        memId,
        seqNo,
        originalClmMemSeqNo: document.clmMemSeqNo,
      });

      const requestBody = {
        claimNo: claimDetails.referenceNo,
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

  // Fetch documents from API
  const fetchDocuments = async (referenceNo) => {
    try {
      console.log("Fetching documents for referenceNo:", referenceNo);

      const response = await fetch(
        `${API_BASE_URL}/ClaimDocuments/${referenceNo}`,
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
        // Transform API data to match component structure without image processing
        const transformedDocuments = result.data.map((doc, index) => {
          return {
            id: doc.clmMemSeqNo || `doc_${index}`,
            clmMemSeqNo: doc.clmMemSeqNo, // Keep original for delete API and image loading
            type: doc.docType || "Unknown",
            date: formatDate(doc.docDate),
            amount: formatAmount(doc.docAmount), // Format amount with 2 decimal places
            imagePath: doc.imagePath || "0",
            hasImage: doc.imgContent && doc.imgContent.length > 0, // Check if document has image content
            imageLoaded: false, // Track if image has been loaded
            imgContent: doc.imgContent || null, // Store original image content for API calls
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
        referenceNo: referenceNo,
      });

      // Show user-friendly error message
      Alert.alert(
        "Documents Loading Error",
        `Unable to fetch documents. Error: ${error.message}`
      );

      // Set empty documents array as fallback
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
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response as blob
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        setSelectedImageUri(base64String);
        setImageModalVisible(true);
        // Clear loading state for this document
        setImageLoadingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(document.id);
          return newMap;
        });
      };
      reader.onerror = () => {
        console.error("Error reading image blob");
        Alert.alert("Error", "Failed to load image");
        // Clear loading state for this document
        setImageLoadingStates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(document.id);
          return newMap;
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading document image:", error);
      Alert.alert("Error", "Failed to load image");
      // Clear loading state for this document
      setImageLoadingStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(document.id);
        return newMap;
      });
    }
  };

  // Fetch claim amount from API
  const fetchClaimAmount = async (referenceNo) => {
    try {
      // Validate referenceNo before making API call
      if (!referenceNo || referenceNo.trim() === "") {
        console.warn(
          "Invalid referenceNo provided to fetchClaimAmount:",
          referenceNo
        );

        // Try to get referenceNo from different sources
        const fallbackReferenceNo =
          (await SecureStore.getItemAsync("stored_claim_seq_no")) ||
          (await SecureStore.getItemAsync("edit_referenceNo")) ||
          claimDetails.referenceNo;

        if (!fallbackReferenceNo || fallbackReferenceNo.trim() === "") {
          console.warn(
            "No valid referenceNo found, skipping claim amount fetch"
          );
          return "0.00";
        }

        referenceNo = fallbackReferenceNo;
      }

      console.log("Fetching claim amount for referenceNo:", referenceNo);

      const requestBody = {
        seqNo: referenceNo.trim(), // Ensure no whitespace
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

        // Handle 404 specifically for "No claim amount found"
        if (response.status === 404) {
          console.warn("No claim amount found for referenceNo:", referenceNo);
          return "0.00"; // Return default without showing error alert
        }

        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Claim Amount API Response:", data);

      // Handle different response formats
      let claimAmount = "0.00";

      if (data && typeof data === "object") {
        // If response has claimAmount property
        if (data.claimAmount !== undefined && data.claimAmount !== null) {
          claimAmount = data.claimAmount.toString();
        }
        // If response has amount property
        else if (data.amount !== undefined && data.amount !== null) {
          claimAmount = data.amount.toString();
        }
        // If response has totalAmount property
        else if (data.totalAmount !== undefined && data.totalAmount !== null) {
          claimAmount = data.totalAmount.toString();
        }
      }
      // If response is a direct number/string
      else if (typeof data === "number" || typeof data === "string") {
        claimAmount = data.toString();
      }

      // Format the amount (ensure it has .00 if it's a whole number)
      const formattedAmount = claimAmount.includes(".")
        ? claimAmount
        : `${claimAmount}.00`;

      // Update claimDetails state with the fetched amount
      setClaimDetails((prev) => ({
        ...prev,
        claimAmount: formattedAmount,
      }));

      return formattedAmount;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        referenceNo: referenceNo,
      });

      // Only show alert for non-404 errors
      if (!error.message.includes("404")) {
        Alert.alert(
          "Network Error",
          `Unable to fetch claim amount. Using default amount. Error: ${error.message}`
        );
      }

      return "0.00"; // Default fallback amount
    }
  };

  // NEW FUNCTION: Refresh claim amount and update beneficiaries
  const refreshClaimAmount = async () => {
    try {
      console.log("Refreshing claim amount for beneficiaries...");

      if (!claimDetails.referenceNo) {
        console.warn(
          "No reference number available for refreshing claim amount"
        );
        return;
      }

      // Fetch updated claim amount
      const updatedAmount = await fetchClaimAmount(claimDetails.referenceNo);

      // Update all beneficiaries with the new amount
      if (beneficiaries.length > 0) {
        const updatedBeneficiaries = beneficiaries.map((beneficiary) => ({
          ...beneficiary,
          amount: updatedAmount,
        }));

        setBeneficiaries(updatedBeneficiaries);

        console.log("Claim amount refreshed successfully:", updatedAmount);
      }
    } catch (error) {
      console.error("Error refreshing claim amount:", error);
    }
  };

  // Retrieve claim details from SecureStore
  const retrieveClaimDetails = async () => {
    try {
      const storedReferenceNo = await SecureStore.getItemAsync(
        "edit_referenceNo"
      );
      const storedClaimType = await SecureStore.getItemAsync("edit_claimType");
      const storedCreatedOn = await SecureStore.getItemAsync("edit_createdOn");

      // Also check stored_claim_seq_no which seems to contain the correct reference number
      const storedClaimSeqNo = await SecureStore.getItemAsync(
        "stored_claim_seq_no"
      );

      // Prioritize route params, then stored values, then defaults
      const finalReferenceNo =
        referenceNo ||
        claimNumber ||
        claim?.referenceNo ||
        storedClaimSeqNo ||
        storedReferenceNo ||
        "";
      const finalClaimType =
        claimType || claim?.claimType || storedClaimType || "";
      const finalCreatedOn =
        createdOn ||
        claim?.createdOn ||
        storedCreatedOn ||
        new Date().toLocaleDateString("en-GB");

      console.log("Debug - Reference number sources:", {
        routeReferenceNo: referenceNo,
        routeClaimNumber: claimNumber,
        claimReferenceNo: claim?.referenceNo,
        storedClaimSeqNo: storedClaimSeqNo,
        storedReferenceNo: storedReferenceNo,
        finalReferenceNo: finalReferenceNo,
      });

      setClaimDetails((prev) => ({
        ...prev,
        referenceNo: finalReferenceNo,
        claimType: finalClaimType,
        createdOn: finalCreatedOn,
      }));

      // Update the display reference number
      setReferenceNo(finalReferenceNo);

      console.log("Retrieved claim details:", {
        referenceNo: finalReferenceNo,
        claimType: finalClaimType,
        createdOn: finalCreatedOn,
      });

      return finalReferenceNo;
    } catch (error) {
      console.error("Error retrieving claim details:", error);
      const fallbackReferenceNo =
        referenceNo || claimNumber || claim?.referenceNo || "";
      setClaimDetails((prev) => ({
        ...prev,
        referenceNo: fallbackReferenceNo,
        claimType: claimType || claim?.claimType || "",
        createdOn:
          createdOn ||
          claim?.createdOn ||
          new Date().toLocaleDateString("en-GB"),
      }));
      return fallbackReferenceNo;
    } finally {
      updateLoadingState("claimDetails", false);
    }
  };

  // Retrieve beneficiary data from SecureStore
  const retrieveBeneficiaryData = async (referenceNo) => {
    try {
      // First try to get from stored patient details (from NewClaim page)
      const [storedPatientName, storedIllness, storedRelationship] =
        await Promise.all([
          SecureStore.getItemAsync("stored_patient_name"),
          SecureStore.getItemAsync("stored_illness_description"),
          SecureStore.getItemAsync("stored_relationship"), // This might be null
        ]);

      // Fallback to edit-specific stored data
      const [storedEnteredBy, storedEditRelationship, storedEditIllness] =
        await Promise.all([
          SecureStore.getItemAsync("edit_enteredBy"),
          SecureStore.getItemAsync("edit_relationship"),
          SecureStore.getItemAsync("edit_illness"),
        ]);

      // Use stored patient details first, then fallback to edit data
      const finalPatientName = storedPatientName || storedEnteredBy;
      const finalIllness = storedIllness || storedEditIllness;
      const finalRelationship = storedRelationship || storedEditRelationship;

      // If we have patient data, create a beneficiary object
      if (finalPatientName && finalRelationship) {
        // Fetch claim amount for this beneficiary
        const claimAmount = await fetchClaimAmount(referenceNo);

        const beneficiary = {
          id: "1",
          name: finalPatientName,
          relationship: finalRelationship,
          illness: finalIllness || "",
          amount: claimAmount,
        };

        setBeneficiaries([beneficiary]);
      } else {
        // If no stored data, initialize with empty array
        setBeneficiaries([]);
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

      // Update claim details with member name
      setClaimDetails((prev) => ({
        ...prev,
        enteredBy: data.memberName || "Unknown Member",
      }));
    } catch (error) {
      console.error("Error fetching employee info:", error);
      Alert.alert("Error", "Failed to fetch employee information");
      setClaimDetails((prev) => ({ ...prev, enteredBy: "Unknown Member" }));
    } finally {
      setLoading(false);
      updateLoadingState("employeeInfo", false);
    }
  };

  // Store claim details in SecureStore
  const storeClaimDetails = async () => {
    try {
      // Get the actual reference number from multiple sources
      const actualReferenceNo =
        (await SecureStore.getItemAsync("stored_claim_seq_no")) ||
        claimDetails.referenceNo ||
        referenceNo ||
        claimNumber ||
        claim?.referenceNo;

      const actualClaimType =
        (await SecureStore.getItemAsync("stored_claim_type")) ||
        claimDetails.claimType ||
        claimType ||
        claim?.claimType;

      console.log("Storing claim details with actual values:", {
        actualReferenceNo,
        actualClaimType,
        createdOn: claimDetails.createdOn,
      });

      // Store claim details with actual values
      await SecureStore.setItemAsync(
        "edit_referenceNo",
        String(actualReferenceNo || "")
      );
      await SecureStore.setItemAsync(
        "edit_claimType",
        String(actualClaimType || "")
      );
      await SecureStore.setItemAsync(
        "edit_createdOn",
        String(claimDetails.createdOn || "")
      );

      // Update state with the correct values
      setClaimDetails((prev) => ({
        ...prev,
        referenceNo: actualReferenceNo || prev.referenceNo,
        claimType: actualClaimType || prev.claimType,
      }));

      // Update display values
      setClaimType(actualClaimType || "");
      setReferenceNo(actualReferenceNo || "");

      console.log("Claim details stored and state updated successfully");
    } catch (error) {
      console.error("Error storing claim details:", error);
    }
  };

  // Submit final claim API function
  const submitFinalClaim = async (referenceNo) => {
    try {
      console.log("Submitting final claim:", referenceNo);

      const requestBody = {
        claimSeqNo: referenceNo,
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
        // First retrieve stored claim details
        const referenceNo = await retrieveClaimDetails();

        // Start all loading operations in parallel
        const loadingPromises = [
          retrieveBeneficiaryData(referenceNo), // This will call fetchClaimAmount internally
          fetchEmployeeInfo(),
          storeClaimDetails(),
          fetchDocumentTypes(),
        ];

        // Add document fetching if referenceNo is available
        if (referenceNo) {
          loadingPromises.push(fetchDocuments(referenceNo));
        } else {
          // If no referenceNo, mark documents as loaded
          updateLoadingState("documents", false);
        }

        // Wait for all operations to complete
        await Promise.all(loadingPromises);
      } catch (error) {
        console.error("Error initializing component:", error);
        // Ensure loading screen disappears even on error
        setInitialLoading(false);
      }
    };

    initializeComponent();
  }, []);

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchDocumentsOnFocus = async () => {
        // Only fetch documents on focus if not in initial loading state
        if (!initialLoading) {
          console.log("Fetching documents on focus");

          // Get reference number from multiple sources
          let referenceNo = claimDetails.referenceNo || claim?.referenceNo;

          // If still no reference number, try to get from SecureStore
          if (!referenceNo) {
            try {
              referenceNo =
                (await SecureStore.getItemAsync("stored_claim_seq_no")) ||
                (await SecureStore.getItemAsync("edit_referenceNo"));
            } catch (error) {
              console.error(
                "Error getting reference number from storage:",
                error
              );
            }
          }

          console.log("Reference number for document fetch:", referenceNo);

          // Check if reference number exists and is not empty
          if (referenceNo && referenceNo !== "") {
            setDocumentsLoading(true);

            try {
              await fetchDocuments(referenceNo);

              // Only refresh claim amount if documents fetch was successful
              console.log("Refreshing claim amount after navigation...");
              await refreshClaimAmount();
            } catch (error) {
              console.error("Error fetching documents on focus:", error);
              setDocumentsLoading(false);
            }
          } else {
            console.log(
              "No valid reference number found, skipping document fetch"
            );
          }
        }
      };

      fetchDocumentsOnFocus();
    }, [claimDetails.referenceNo, claim?.referenceNo, initialLoading])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      // Check if we're returning from UploadDocuments
      const routes = navigation.getState()?.routes;
      const currentRoute = routes[routes.length - 1];

      if (currentRoute?.params?.fromUploadDocuments) {
        console.log(
          "Returned from UploadDocuments, refreshing claim amount..."
        );
        await refreshClaimAmount();

        // Clear the flag to prevent multiple refreshes
        navigation.setParams({ fromUploadDocuments: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Navigate to UploadDocuments page
  const handleNavigateToUploadDocuments = () => {
    // Get the current claim amount from multiple sources
    const currentClaimAmount =
      claimDetails.claimAmount ||
      (beneficiaries.length > 0 ? beneficiaries[0].amount : "0.00");

    console.log("Navigating to UploadDocuments with data:", {
      claimDetailsAmount: claimDetails.claimAmount,
      beneficiaryAmount:
        beneficiaries.length > 0 ? beneficiaries[0].amount : "none",
      finalAmount: currentClaimAmount,
      referenceNo: claimDetails.referenceNo,
      patientName: claimDetails.enteredBy,
      claimType: claimDetails.claimType,
      illness: beneficiaries.length > 0 ? beneficiaries[0].illness : "",
      fromEditClaim: true,
    });

    navigation.navigate("UploadDocuments", {
      // Pass existing data
      claim: claim,
      beneficiaries: beneficiaries,
      documents: documents,

      // Navigation flags
      fromEditClaim: true,

      // Current claim amount - this is crucial for BILL disable logic
      currentClaimAmount: currentClaimAmount,

      // Reference and patient data
      referenceNo: claimDetails.referenceNo,
      patientName: claimDetails.enteredBy,
      claimType: claimDetails.claimType,
      illness: beneficiaries.length > 0 ? beneficiaries[0].illness : "",

      // Additional metadata
      claimId: claimDetails.referenceNo, // Use referenceNo as claimId
    });
  };

  // Add document
  const handleAddDocument = () => {
    if (newDocument.type && newDocument.date) {
      setDocuments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...newDocument,
          amount: formatAmount(newDocument.amount), // Format amount
          hasImage: false, // New documents don't have images initially
        },
      ]);
      setNewDocument({ type: "", date: "", amount: "" });
      setAddDocumentModalVisible(false);
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
    // Check if BILL type already exists and prevent selection
    if (docType.docId === "O01") {
      const billExists = documents.some(
        (doc) => doc.type === "BILL" && doc.id !== selectedDocument?.id
      );

      if (billExists) {
        Alert.alert(
          "Document Type Restriction",
          "A BILL document already exists. Only one BILL document is allowed per claim.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }
    }

    setEditDocumentType(docType.docId);

    // Update newDocument type with the description
    setNewDocument((prev) => ({
      ...prev,
      type: docType.docDesc,
    }));

    // Set amount to 0.00 for non-bill types
    if (docType.docId !== "O01") {
      setNewDocument((prev) => ({
        ...prev,
        amount: "0.00",
      }));
    }

    setEditDocTypeDropdownVisible(false);
  };

  const handleEditDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || editDocumentDate;
    setShowEditDatePicker(Platform.OS === "ios");
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
    // Only allow editing if document type is BILL (O01)
    if (editDocumentType !== "O01") {
      return;
    }

    // Remove any non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = cleanedText.split(".");
    if (parts.length > 2) {
      return;
    }

    // Format the amount
    let formattedAmount = cleanedText;

    // If there's a decimal point, ensure only 2 decimal places
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        formattedAmount = parts[0] + "." + parts[1].substring(0, 2);
      }
    }

    setNewDocument((prev) => ({
      ...prev,
      amount: formattedAmount,
    }));
  };

  const isEditAmountEditable = () => {
    return editDocumentType === "O01";
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
      // Validate required fields
      if (!editDocumentType) {
        Alert.alert("Validation Error", "Please select a document type.");
        return;
      }

      if (
        editDocumentType === "O01" &&
        (!newDocument.amount || parseFloat(newDocument.amount) <= 0)
      ) {
        Alert.alert(
          "Validation Error",
          "Amount is required and must be greater than 0 for Bill type."
        );
        return;
      }

      // Get stored user NIC
      const storedNic = await SecureStore.getItemAsync("user_nic");
      if (!storedNic) {
        Alert.alert("Error", "User information not found. Please login again.");
        return;
      }

      // Parse clmMemSeqNo to get ClmMemSeqNo and DocSeq
      const { memId: clmMemSeqNo, seqNo: docSeq } = parseClmMemSeqNo(
        selectedDocument.clmMemSeqNo
      );

      // Find the original document data to get imgContent
      const originalDocData = documents.find(
        (doc) => doc.id === selectedDocument.id
      );

      // Prepare API request data with correct data types
      const updateDocumentData = {
        ClmSeqNo: claimDetails.referenceNo, // string
        ClmMemSeqNo: parseInt(clmMemSeqNo), // int
        DocSeq: parseInt(docSeq), // int
        NewDocRef: editDocumentType, // string - This is the docId (O01, O02, etc.)
        DocDate: formatDateForAPI(editDocumentDate), // string - Format: YYYY-MM-DD
        ImgContent: originalDocData?.imgContent || "", // Will be converted to IFormFile
        DocAmount: parseFloat(newDocument.amount || "0"), // decimal
        CreatedBy: storedNic, // string
        ImgName: `${claimDetails.referenceNo}_${clmMemSeqNo}_${docSeq}_${editDocumentType}`, // string - Generate image name
      };

      console.log("Prepared update document data:", {
        ...updateDocumentData,
        ImgContent: updateDocumentData.ImgContent
          ? "Base64 data present"
          : "No image data",
      });

      // Call the update API
      await updateDocumentAPI(updateDocumentData);

      // Update local state with formatted amount
      const updatedDocument = {
        ...newDocument,
        amount: formatAmount(newDocument.amount), // Format amount
      };

      setDocuments((prev) =>
        prev.map((item) =>
          item.id === selectedDocument.id
            ? { ...item, ...updatedDocument }
            : item
        )
      );

      // Close modal and reset form
      setEditDocumentModalVisible(false);
      setNewDocument({ type: "", date: "", amount: "" });
      setEditDocumentType("");
      setEditDocumentDate(new Date());

      // Show success message
      Alert.alert("Success", "Document updated successfully!");

      // Refresh documents from API to get latest data
      const referenceNo = claimDetails.referenceNo || claim?.referenceNo;
      if (referenceNo) {
        await fetchDocuments(referenceNo);
      }

      // Refresh claim amount after editing document
      console.log("Document updated, refreshing claim amount...");
      await refreshClaimAmount();
    } catch (error) {
      console.error("Error in handleSaveDocumentEdit:", error);

      // Check if it's a 404 error (document not found)
      if (error.message.includes("404")) {
        Alert.alert(
          "Document Not Found",
          "The document could not be found in the system. It may have been deleted or moved.\n\nWould you like to refresh the document list?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Refresh Documents",
              onPress: async () => {
                const referenceNo =
                  claimDetails.referenceNo || claim?.referenceNo;
                if (referenceNo) {
                  await fetchDocuments(referenceNo);
                }
                setEditDocumentModalVisible(false);
                setNewDocument({ type: "", date: "", amount: "" });
                setEditDocumentType("");
                setEditDocumentDate(new Date());
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Update Error",
          `Failed to update document: ${error.message}\n\nWould you like to save the changes locally?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Save Locally",
              onPress: () => {
                // Save locally without API call
                const updatedDocument = {
                  ...newDocument,
                  amount: formatAmount(newDocument.amount), // Format amount
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
              },
            },
          ]
        );
      }
    }
  };

  // Updated Delete document function with API integration
  const handleDeleteDocument = (documentId) => {
    // Find the document to get its details
    const documentToDelete = documents.find((doc) => doc.id === documentId);

    if (!documentToDelete) {
      Alert.alert("Error", "Document not found.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Show loading indicator (optional)
              setDocumentsLoading(true);

              // Only call API if document has clmMemSeqNo (exists in backend)
              if (documentToDelete.clmMemSeqNo) {
                console.log("Deleting document from API:", documentToDelete);
                await deleteDocumentFromAPI(documentToDelete);

                // Show success message
                Alert.alert(
                  "Success",
                  "Document deleted successfully from server."
                );
              }

              // Remove from local state regardless of API call success
              setDocuments((prev) =>
                prev.filter((item) => item.id !== documentId)
              );

              // Optionally refresh documents from API
              const referenceNo =
                claimDetails.referenceNo || claim?.referenceNo;
              if (referenceNo) {
                await fetchDocuments(referenceNo);
              }

              // Refresh claim amount after deleting document
              console.log("Document deleted, refreshing claim amount...");
              await refreshClaimAmount();
            } catch (error) {
              console.error("Error deleting document:", error);

              // Show error but still ask if user wants to remove locally
              Alert.alert(
                "Delete Error",
                `Failed to delete from server: ${error.message}\n\nWould you like to remove it locally?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove Locally",
                    style: "destructive",
                    onPress: async () => {
                      setDocuments((prev) =>
                        prev.filter((item) => item.id !== documentId)
                      );
                      // Still refresh claim amount even for local deletion
                      await refreshClaimAmount();
                    },
                  },
                ]
              );
            } finally {
              setDocumentsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle submit - Updated with API integration
  // Handle submit - Updated with API integration and home navigation
  const handleSubmitClaim = () => {
    Alert.alert("Submit Claim", "Are you sure you want to submit this claim?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: async () => {
          try {
            console.log("Submitting claim...");

            // Validate that we have a reference number
            if (!claimDetails.referenceNo) {
              Alert.alert("Error", "Claim reference number not found.");
              return;
            }

            // Call the submit final claim API
            await submitFinalClaim(claimDetails.referenceNo);

            // Show success message and navigate to home
            Alert.alert("Success", "Claim submitted successfully!", [
              {
                text: "OK",
                onPress: () => {
                  // Navigate to home page instead of going back
                  navigation.navigate("home");
                },
              },
            ]);
          } catch (error) {
            console.error("Error submitting claim:", error);

            // Handle different types of errors
            if (error.message.includes("404")) {
              Alert.alert(
                "Claim Not Found",
                "The claim could not be found in the system. Please refresh and try again."
              );
            } else if (error.message.includes("400")) {
              Alert.alert(
                "Invalid Request",
                "The claim cannot be submitted. Please check all required fields and try again."
              );
            } else if (error.message.includes("500")) {
              Alert.alert(
                "Server Error",
                "Server is currently unavailable. Please try again later."
              );
            } else {
              Alert.alert(
                "Submit Error",
                `Failed to submit claim: ${error.message}\n\nPlease try again or contact support if the problem persists.`
              );
            }
          }
        },
      },
    ]);
  };

  // Handle submit later
  const handleSubmitLater = () => {
    Alert.alert("Saved", "Claim saved for later submission.", [
      {
        text: "OK",
        onPress: () => {
          navigation?.goBack();
        },
      },
    ]);
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
            Alert.alert(
              "No Image",
              "This document doesn't have an associated image."
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

  // Show loading screen while initializing
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
        {/* Claim Details Section - Read Only */}
        <View style={styles.claimDetailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference No</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{referenceNo2}</Text>
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
            <Text style={styles.detailLabel}>Created on</Text>
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
            style={styles.submitButton}
            onPress={handleSubmitClaim}
          >
            <Text style={styles.submitButtonText}>Submit Claim</Text>
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

              {showEditDatePicker && (
                <DateTimePicker
                  testID="editDateTimePicker"
                  value={editDocumentDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={handleEditDateChange}
                  maximumDate={new Date()} // Prevent future dates
                />
              )}

              {/* Document Amount */}
              <Text style={styles.documentFieldLabel}>
                Document Amount
                {editDocumentType === "O01" && (
                  <Text style={styles.requiredAsterisk}> *</Text>
                )}
              </Text>
              <TextInput
                style={[
                  styles.documentModalInput,
                  !isEditAmountEditable() && styles.textInputDisabled,
                  editDocumentType === "O01" &&
                    (!newDocument.amount ||
                      newDocument.amount.trim() === "" ||
                      parseFloat(newDocument.amount) <= 0) &&
                    styles.textInputError,
                ]}
                placeholder={isEditAmountEditable() ? "Enter amount" : "0.00"}
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
                  {
                    documentTypes.find(
                      (type) => type.docId === editDocumentType
                    )?.docDesc
                  }
                </Text>
              ) : editDocumentType === "O01" ? (
                <Text
                  style={[
                    styles.helpText,
                    (!newDocument.amount ||
                      newDocument.amount.trim() === "" ||
                      parseFloat(newDocument.amount) <= 0) &&
                      styles.errorText,
                  ]}
                >
                  {!newDocument.amount ||
                  newDocument.amount.trim() === "" ||
                  parseFloat(newDocument.amount) <= 0
                    ? "Amount is required and must be greater than 0 for Bill type"
                    : "Amount is required for Bill type"}
                </Text>
              ) : editDocumentType === "O04" ? (
                <Text style={styles.helpText}>
                  Enter amount for Other document type
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
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Save</Text>
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
    marginTop: 20,
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

  // Beneficiaries Section - Fixed alignment
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

  // Documents Section - Fixed alignment
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

  // Modal styles
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

  // Image Modal styles
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
});

export default EditClaimIntimation;
