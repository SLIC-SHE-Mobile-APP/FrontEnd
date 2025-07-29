import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
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

const EditClaimIntimation1 = ({ route }) => {
  const navigation = useNavigation();
  const { claim, submittedData } = route?.params || {};
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

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
    referenceNo: "",
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

  // New document form
  const [newDocument, setNewDocument] = useState({
    type: "",
    date: "",
    amount: "",
  });

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
      Alert.alert(
        "Error",
        "Failed to load member information. Please try again."
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

  // Fetch documents from API without image processing
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
            amount: doc.docAmount ? doc.docAmount.toString() : "0.00",
            imagePath: doc.imagePath || "0",
            hasImage: doc.imgContent && doc.imgContent.length > 0, // Check if document has image content
            imageLoaded: false, // Track if image has been loaded
            imgContent: null, // Will be populated when user clicks to view
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

  // Load image on demand
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
      console.log("Fetching claim amount for referenceNo:", referenceNo);

      const requestBody = {
        seqNo: referenceNo,
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

      const formattedAmount = data.claimAmount
        ? `${data.claimAmount}.00`
        : "0.00";

      return formattedAmount;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        referenceNo: referenceNo,
      });

      // Show user-friendly error message
      Alert.alert(
        "Network Error",
        `Unable to fetch claim amount. Using default amount. Error: ${error.message}`
      );

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

        // Store the updated beneficiary data
        await storeBeneficiaryData(updatedBeneficiaries);

        console.log("Claim amount refreshed successfully:", updatedAmount);
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
        "edit_referenceNo",
        String(claimData.referenceNo || "")
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
        String(claimData.referenceNo || "")
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
      if (claim?.referenceNo) {
        console.log("Using claim data from route params:", claim);

        const claimData = {
          referenceNo: claim.referenceNo,
          claimType: claim.claimType,
          createdOn: claim.createdOn,
        };

        // Store the initial data for future retrievals
        await storeInitialClaimDetails(claimData);

        setClaimDetails((prev) => ({
          ...prev,
          ...claimData,
        }));

        return claim.referenceNo;
      }

      // If no route params, try to retrieve from storage (subsequent loads)
      const storedReferenceNo = await SecureStore.getItemAsync(
        "edit_referenceNo"
      );
      const storedClaimType = await SecureStore.getItemAsync("edit_claimType");
      const storedCreatedOn = await SecureStore.getItemAsync("edit_createdOn");

      console.log("Retrieved stored claim details:", {
        storedReferenceNo,
        storedClaimType,
        storedCreatedOn,
      });

      if (storedReferenceNo) {
        setClaimDetails((prev) => ({
          ...prev,
          referenceNo: storedReferenceNo,
          claimType: storedClaimType || "",
          createdOn: storedCreatedOn || "",
        }));

        return storedReferenceNo;
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
  const retrieveBeneficiaryData = async (referenceNo) => {
    try {
      const storedEnteredBy = await SecureStore.getItemAsync("edit_enteredBy");
      const storedRelationship = await SecureStore.getItemAsync(
        "edit_relationship"
      );
      const storedIllness = await SecureStore.getItemAsync("edit_illness");

      console.log("Retrieved beneficiary data:", {
        storedEnteredBy,
        storedRelationship,
        storedIllness,
      });

      // If we have stored beneficiary data, create a beneficiary object
      if (storedEnteredBy && storedRelationship && referenceNo) {
        // Fetch claim amount for this beneficiary
        const claimAmount = await fetchClaimAmount(referenceNo);

        const beneficiary = {
          id: "1",
          name: storedEnteredBy,
          relationship: storedRelationship,
          illness: storedIllness || "",
          amount: claimAmount, // Set amount from API
        };

        setBeneficiaries([beneficiary]);

        // Store the beneficiary data for future use
        await storeBeneficiaryData([beneficiary]);
      } else {
        // If no stored data, initialize with empty array
        setBeneficiaries([]);
        console.log("No beneficiary data found, setting empty array");
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
      Alert.alert("Error", "Failed to fetch employee information");
      setClaimDetails((prev) => ({ ...prev, enteredBy: "Unknown Member" }));
    } finally {
      setLoading(false);
      updateLoadingState("employeeInfo", false);
    }
  };

  // useEffect to fetch employee info and retrieve claim details on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log("Initializing component with route params:", route?.params);

        // First retrieve stored claim details
        const referenceNo = await retrieveClaimDetails();

        if (!referenceNo) {
          console.error("No reference number found, cannot continue");
          setInitialLoading(false);
          return;
        }

        console.log("Using reference number:", referenceNo);

        // Start all loading operations in parallel
        const loadingPromises = [
          retrieveBeneficiaryData(referenceNo),
          fetchEmployeeInfo(),
          fetchDocuments(referenceNo),
          fetchDependents(),
          fetchDocumentTypes(),
        ];

        // Wait for all operations to complete
        await Promise.all(loadingPromises);
      } catch (error) {
        console.error("Error initializing component:", error);
        Alert.alert(
          "Initialization Error",
          "Failed to load claim data. Please try again."
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
          const referenceNo = claimDetails.referenceNo || claim?.referenceNo;
          if (referenceNo) {
            setDocumentsLoading(true);
            await fetchDocuments(referenceNo);

            // ADD THIS: Refresh claim amount when returning from upload screen
            console.log("Refreshing claim amount after navigation...");
            await refreshClaimAmount();
          }
        }
      };

      fetchDocumentsOnFocus();
    }, [claimDetails.referenceNo, claim?.referenceNo, initialLoading])
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

  // Navigate to UploadDocuments page
  const handleNavigateToUploadDocuments = () => {
    // Store current beneficiary data before navigation
    if (beneficiaries.length > 0) {
      storeBeneficiaryData(beneficiaries);
    }

    navigation.navigate("UploadDocumentsSaved", {
      claim: {
        referenceNo: claimDetails.referenceNo,
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

  // Add beneficiary
  const handleAddBeneficiary = async () => {
    if (newBeneficiary.name && newBeneficiary.relationship) {
      // Fetch claim amount for the new beneficiary
      const claimAmount = await fetchClaimAmount(claimDetails.referenceNo);

      const newBeneficiaryData = {
        id: Date.now().toString(),
        ...newBeneficiary,
        amount: claimAmount, // Set amount from API
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

  // Save beneficiary edit
  const handleSaveBeneficiaryEdit = async () => {
    // Fetch updated claim amount
    const claimAmount = await fetchClaimAmount(claimDetails.referenceNo);

    const updatedBeneficiaries = beneficiaries.map((item) =>
      item.id === selectedBeneficiary.id
        ? { ...item, ...newBeneficiary, amount: claimAmount }
        : item
    );

    setBeneficiaries(updatedBeneficiaries);

    // Store the updated beneficiary data
    await storeBeneficiaryData(updatedBeneficiaries);

    setEditBeneficiaryModalVisible(false);
    setNewBeneficiary({ name: "", relationship: "", illness: "", amount: "" });
  };

  // Delete beneficiary
  const handleDeleteBeneficiary = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this beneficiary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedBeneficiaries = beneficiaries.filter(
              (item) => item.id !== id
            );
            setBeneficiaries(updatedBeneficiaries);

            // Store the updated beneficiary data
            await storeBeneficiaryData(updatedBeneficiaries);
          },
        },
      ]
    );
  };

  // Add document
  const handleAddDocument = () => {
    if (newDocument.type && newDocument.date) {
      setDocuments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...newDocument,
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

  // Save document edit with claim amount refresh
  const handleSaveDocumentEdit = async () => {
    try {
      setDocuments((prev) =>
        prev.map((item) =>
          item.id === selectedDocument.id ? { ...item, ...newDocument } : item
        )
      );
      setEditDocumentModalVisible(false);
      setNewDocument({ type: "", date: "", amount: "" });

      // Refresh claim amount after editing document
      console.log("Document edited, refreshing claim amount...");
      await refreshClaimAmount();
    } catch (error) {
      console.error("Error in handleSaveDocumentEdit:", error);
    }
  };

  // Delete document function with API integration and claim amount refresh
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

  // Handle submit
  const handleSubmitClaim = () => {
    Alert.alert("Submit Claim", "Are you sure you want to submit this claim?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: () => {
          Alert.alert("Success", "Claim submitted successfully!");
          navigation?.goBack();
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

  const handleDeleteClaim = () => {
    Alert.alert(
      "Delete Claim",
      "Are you sure you want to delete this claim? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Deleted", "Claim has been deleted successfully.", [
              {
                text: "OK",
                onPress: () => {
                  navigation?.navigate("PendingIntimations");
                },
              },
            ]);
          },
        },
      ]
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
            <Text style={styles.detailLabel}>Reference No</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detailValue}>{claimDetails.referenceNo}</Text>
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
          <View style={styles.modalContent}>
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
              style={styles.modalInput}
              value={newBeneficiary.illness}
              onChangeText={(value) =>
                setNewBeneficiary((prev) => ({ ...prev, illness: value }))
              }
              placeholder="Enter illness"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Document</Text>

            {/* Document Type Dropdown */}
            <Text style={styles.fieldLabel}>Document Type</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
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
              <View style={styles.dropdownOptions}>
                {documentTypes.map((docType) => (
                  <TouchableOpacity
                    key={docType.docId}
                    style={[
                      styles.dropdownOption,
                      editDocumentType === docType.docId &&
                        styles.selectedDropdownOption,
                    ]}
                    onPress={() => handleEditDocTypeSelect(docType)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        editDocumentType === docType.docId &&
                          styles.selectedDropdownOptionText,
                      ]}
                    >
                      {docType.docDesc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Document Date */}
            <Text style={styles.fieldLabel}>Document Date</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
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
            <Text style={styles.fieldLabel}>
              Document Amount
              {editDocumentType === "O01" && (
                <Text style={styles.requiredAsterisk}> *</Text>
              )}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
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
                  documentTypes.find((type) => type.docId === editDocumentType)
                    ?.docDesc
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

            <View style={styles.modalButtons}>
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
    maxHeight: "80%",
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
    marginBottom: 5,
    marginTop: 10,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
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
});

export default EditClaimIntimation1;
