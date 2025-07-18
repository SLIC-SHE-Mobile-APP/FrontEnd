import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import * as SecureStore from "expo-secure-store";

const EditClaimIntimation = ({ route }) => {
  const navigation = useNavigation();
  const { claim } = route?.params || {};

  // State for claim details
  const [claimDetails, setClaimDetails] = useState({
    referenceNo: claim?.referenceNo || "M000428",
    enteredBy: "Loading...", // Will be updated from API
    status: "Submission for Approval Pending", // Hard-coded as specified
    claimType: claim?.claimType || "Out-door",
    createdOn: claim?.createdOn || "24-12-2020",
  });

  // Employee info state
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);

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

  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

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

  // Fetch documents from API
  const fetchDocuments = async (referenceNo) => {
    try {
      setDocumentsLoading(true);
      console.log("Fetching documents for referenceNo:", referenceNo);

      const response = await fetch(
        `http://203.115.11.229:1002/api/ClaimDocuments/${referenceNo}`,
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
      console.log("Documents API Response:", result);

      if (result.success && result.data && Array.isArray(result.data)) {
        // Transform API data to match component structure
        const transformedDocuments = result.data.map((doc, index) => {
          console.log(`Processing document ${index}:`, {
            id: doc.clmMemSeqNo,
            type: doc.docType,
            hasImgContent: !!doc.imgContent,
            imgContentType: typeof doc.imgContent,
            imgContentLength: doc.imgContent?.length,
          });

          return {
            id: doc.clmMemSeqNo || `doc_${index}`,
            type: doc.docType || "Unknown",
            date: formatDate(doc.docDate),
            amount: doc.docAmount ? doc.docAmount.toString() : "0.00",
            imagePath: doc.imagePath || "0",
            // Convert byte array to base64 string if imgContent exists
            imgContent: doc.imgContent
              ? arrayBufferToBase64(doc.imgContent)
              : null,
            originalImgContent: doc.imgContent, // Keep original for debugging
          };
        });

        setDocuments(transformedDocuments);
        console.log(
          "Transformed documents:",
          transformedDocuments.map((doc) => ({
            id: doc.id,
            type: doc.type,
            hasImgContent: !!doc.imgContent,
            imgContentLength: doc.imgContent?.length,
          }))
        );
      } else {
        console.log("No documents found or invalid response structure");
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
    }
  };

  // Add this helper function at the top of your component (before the component definition)
  const arrayBufferToBase64 = (buffer) => {
    try {
      console.log("Converting buffer to base64, buffer type:", typeof buffer);
      console.log("Buffer value:", buffer);

      // If buffer is already a string (base64), return it
      if (typeof buffer === "string") {
        console.log("Buffer is already a string, length:", buffer.length);
        return buffer;
      }

      // If buffer is null or undefined
      if (!buffer) {
        console.log("Buffer is null or undefined");
        return null;
      }

      // If buffer is an array of bytes
      if (Array.isArray(buffer)) {
        console.log("Buffer is an array, length:", buffer.length);
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        console.log("Converted array to base64, length:", base64.length);
        return base64;
      }

      // If buffer is ArrayBuffer or similar
      if (buffer instanceof ArrayBuffer) {
        console.log("Buffer is ArrayBuffer, byteLength:", buffer.byteLength);
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        console.log("Converted ArrayBuffer to base64, length:", base64.length);
        return base64;
      }

      // If buffer is a typed array
      if (buffer.buffer instanceof ArrayBuffer) {
        console.log("Buffer is typed array, length:", buffer.length);
        let binary = "";
        for (let i = 0; i < buffer.length; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64 = btoa(binary);
        console.log("Converted typed array to base64, length:", base64.length);
        return base64;
      }

      console.log("Unknown buffer type, trying JSON.stringify:", typeof buffer);
      console.log("Buffer constructor:", buffer.constructor.name);

      // Last resort: try to convert object to array
      if (typeof buffer === "object" && buffer !== null) {
        const keys = Object.keys(buffer);
        console.log("Buffer object keys:", keys.slice(0, 10)); // Show first 10 keys

        // Check if it's an object with numeric keys (like {0: 255, 1: 216, ...})
        const isNumericKeys = keys.every((key) => !isNaN(key));
        if (isNumericKeys) {
          console.log("Buffer appears to be an object with numeric keys");
          const array = keys.map((key) => buffer[key]);
          const bytes = new Uint8Array(array);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          console.log("Converted object to base64, length:", base64.length);
          return base64;
        }
      }

      console.log("Could not convert buffer to base64");
      return null;
    } catch (error) {
      console.error("Error converting buffer to base64:", error);
      return null;
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
        "http://203.115.11.229:1002/api/ClaimAmount/GetClaimAmount",
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

  // Retrieve claim details from SecureStore
  const retrieveClaimDetails = async () => {
    try {
      const storedReferenceNo = await SecureStore.getItemAsync(
        "edit_referenceNo"
      );
      const storedClaimType = await SecureStore.getItemAsync("edit_claimType");
      const storedCreatedOn = await SecureStore.getItemAsync("edit_createdOn");

      // Update state with retrieved values, fallback to route params or defaults
      setClaimDetails((prev) => ({
        ...prev,
        referenceNo: storedReferenceNo || claim?.referenceNo || "M000428",
        claimType: storedClaimType || claim?.claimType || "Out-door",
        createdOn: storedCreatedOn || claim?.createdOn || "24-12-2020",
      }));

      // Return the reference number for use in other functions
      return storedReferenceNo || claim?.referenceNo || "M000428";
    } catch (error) {
      console.error("Error retrieving claim details:", error);
      // Fallback to route params or defaults if SecureStore fails
      setClaimDetails((prev) => ({
        ...prev,
        referenceNo: claim?.referenceNo || "M000428",
        claimType: claim?.claimType || "Out-door",
        createdOn: claim?.createdOn || "24-12-2020",
      }));
      return claim?.referenceNo || "M000428";
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

      // If we have stored beneficiary data, create a beneficiary object
      if (storedEnteredBy && storedRelationship) {
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
      } else {
        // If no stored data, initialize with empty array
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error("Error retrieving beneficiary data:", error);
      setBeneficiaries([]);
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
        console.log("Missing memberNumber or policyNumber in SecureStore");
        setClaimDetails((prev) => ({ ...prev, enteredBy: "Unknown Member" }));
        return;
      }

      const response = await fetch(
        `http://203.115.11.229:1002/api/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNumber}&memberNo=${memberNumber}`
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
    }
  };

  // Store claim details in SecureStore
  const storeClaimDetails = async () => {
    try {
      await SecureStore.setItemAsync(
        "edit_referenceNo",
        claimDetails.referenceNo
      );
      await SecureStore.setItemAsync("edit_claimType", claimDetails.claimType);
      await SecureStore.setItemAsync("edit_createdOn", claimDetails.createdOn);
    } catch (error) {
      console.error("Error storing claim details:", error);
    }
  };

  // useEffect to fetch employee info and retrieve claim details on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      // First retrieve stored claim details
      const referenceNo = await retrieveClaimDetails();
      // Retrieve beneficiary data from SecureStore and fetch claim amount
      await retrieveBeneficiaryData(referenceNo);
      // Fetch documents from API
      await fetchDocuments(referenceNo);
      // Then fetch employee info
      await fetchEmployeeInfo();
      // Store the claim details (in case they came from route params)
      await storeClaimDetails();
    };

    initializeComponent();
  }, []);

  // Navigate to UploadDocuments page
  const handleNavigateToUploadDocuments = () => {
    navigation.navigate("UploadDocuments", {
      claim: claim,
      beneficiaries: beneficiaries,
      documents: documents,
      fromEditClaim: true,
    });
  };

  // Add beneficiary
  const handleAddBeneficiary = async () => {
    if (newBeneficiary.name && newBeneficiary.relationship) {
      // Fetch claim amount for the new beneficiary
      const claimAmount = await fetchClaimAmount(claimDetails.referenceNo);

      setBeneficiaries((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...newBeneficiary,
          amount: claimAmount, // Set amount from API
        },
      ]);
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
    setNewBeneficiary(beneficiary);
    setEditBeneficiaryModalVisible(true);
  };

  // Save beneficiary edit
  const handleSaveBeneficiaryEdit = async () => {
    // Fetch updated claim amount
    const claimAmount = await fetchClaimAmount(claimDetails.referenceNo);

    setBeneficiaries((prev) =>
      prev.map((item) =>
        item.id === selectedBeneficiary.id
          ? { ...item, ...newBeneficiary, amount: claimAmount }
          : item
      )
    );
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
          onPress: () => {
            setBeneficiaries((prev) => prev.filter((item) => item.id !== id));
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
        },
      ]);
      setNewDocument({ type: "", date: "", amount: "" });
      setAddDocumentModalVisible(false);
    }
  };

  // Edit document
  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setNewDocument(document);
    setEditDocumentModalVisible(true);
  };

  // Save document edit
  const handleSaveDocumentEdit = () => {
    setDocuments((prev) =>
      prev.map((item) =>
        item.id === selectedDocument.id ? { ...item, ...newDocument } : item
      )
    );
    setEditDocumentModalVisible(false);
    setNewDocument({ type: "", date: "", amount: "" });
  };

  // Delete document
  const handleDeleteDocument = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDocuments((prev) => prev.filter((item) => item.id !== id));
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

  const renderDocumentImage = (document) => {
    console.log("=== Rendering document image ===");
    console.log("Document ID:", document.id);
    console.log("Document type:", document.type);
    console.log("Has imgContent:", !!document.imgContent);
    console.log("ImgContent type:", typeof document.imgContent);
    console.log("ImgContent length:", document.imgContent?.length);

    if (document.imgContent) {
      // Test if it's valid base64
      try {
        const testDecode = atob(document.imgContent.substring(0, 100));
        console.log("Base64 decode test successful");
      } catch (error) {
        console.error("Base64 decode test failed:", error);
      }

      const imageUri = `data:image/jpeg;base64,${document.imgContent}`;
      console.log("Image URI length:", imageUri.length);
      console.log("Image URI preview:", imageUri.substring(0, 50) + "...");

      return (
        <TouchableOpacity
          style={styles.documentImageContainer}
          onPress={() => {
            setSelectedImageUri(imageUri);
            setImageModalVisible(true);
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.documentImage}
            resizeMode="cover"
            onError={(error) => {
              console.error("❌ Image load error for document:", document.id);
              console.error("Error details:", error.nativeEvent?.error);
              console.log("Failed image URI length:", imageUri.length);
              console.log(
                "ImgContent first 50 chars:",
                document.imgContent.substring(0, 50)
              );
              console.log("Original imgContent:", document.originalImgContent);
            }}
            onLoad={() => {
              console.log(
                "✅ Image loaded successfully for document:",
                document.id
              );
            }}
            onLoadStart={() => {
              console.log("🔄 Image load started for document:", document.id);
            }}
            onLoadEnd={() => {
              console.log("🏁 Image load ended for document:", document.id);
            }}
          />
        </TouchableOpacity>
      );
    } else {
      console.log("No image content for document:", document.id);
      return (
        <View style={styles.documentImagePlaceholder}>
          <Ionicons name="document-outline" size={24} color="#4DD0E1" />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      );
    }
  };

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
            <Text style={styles.beneficiariesTitle}>
              Beneficiaries for Claim
            </Text>
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
                  <View style={styles.beneficiaryActionIcons}></View>
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
            {documentsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading documents...</Text>
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
                      <Text style={styles.documentValue}>
                        {document.amount}
                      </Text>
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
                placeholder="Amount will be updated automatically"
                keyboardType="numeric"
                editable={false}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setEditBeneficiaryModalVisible(false)}
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Document</Text>
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
                  onPress={() => setEditDocumentModalVisible(false)}
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
  beneficiaryActionIcons: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  beneficiaryIconButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    width: 120,
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
    Top: 50,
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
  documentImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginTop: 10,
    marginRight: 5,
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  documentImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  noImageText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  // Add these to the existing styles object
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
});

export default EditClaimIntimation;
