import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {Alert,Image,SafeAreaView,ScrollView,StyleSheet,Text,TouchableOpacity,View,Modal,Dimensions,ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");

const PendingRequirement1 = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedDocumentCode, setSelectedDocumentCode] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [requirementData, setRequirementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [loadingExistingDocuments, setLoadingExistingDocuments] = useState(false);

  // Get requirement data from route params
  const params = useLocalSearchParams();

  // Base API URL
  const BASE_API_URL = "http://203.115.11.229:1002/api";

  // Document options with codes and descriptions
  const documentOptions = [
    {
      code: "DOC301",
      description: "Need certified copy of pregnancy report",
    },
    {
      code: "DOC302",
      description: "Need completed claim form with Doctor's part.",
    },
    {
      code: "DOC303",
      description: "Need completed claims form with employee's signature",
    },
    {
      code: "DOC304",
      description: "Need original diagnosis card with doctor's seal",
    },
    {
      code: "DOC305",
      description: "Need original payment receipts",
    },
    {
      code: "DOC306",
      description: "Need original final detail bill",
    },
  ];

  useEffect(() => {
    loadRequirementData();
  }, []);

  // Load existing documents from API
  const loadExistingDocuments = async (polNo, clmNo) => {
    if (!polNo || !clmNo) {
      console.log("Missing polNo or clmNo, skipping document loading");
      return;
    }

    try {
      setLoadingExistingDocuments(true);
      console.log("=== LOADING EXISTING DOCUMENTS ===");
      console.log("Policy Number:", polNo);
      console.log("Claim Number:", clmNo);

      const response = await fetch(
        `${BASE_API_URL}/UploadDocumentRespo/documents?polNo=${polNo}&clmNo=${clmNo}`,
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

      const existingDocuments = await response.json();
      console.log("Existing Documents Response:", existingDocuments);

      if (existingDocuments && existingDocuments.length > 0) {
        // Transform API response to match our document format
        const transformedDocuments = existingDocuments.map((doc, index) => {
          // Find matching document description
          const matchingDoc = documentOptions.find(opt => opt.code === doc.docCode);
          const description = matchingDoc ? matchingDoc.description : `Document ${doc.docCode}`;

          // Create data URI from base64
          const imageUri = `data:image/jpeg;base64,${doc.docContent}`;

          return {
            id: `existing_${doc.docCode}_${doc.seqNo}`,
            name: `${doc.docCode}_${doc.seqNo}.jpg`,
            uri: imageUri,
            type: "image/jpeg",
            size: 0, // Size not available from API
            documentType: description,
            documentCode: doc.docCode,
            claimNumber: doc.claimNo,
            seqNo: doc.seqNo,
            uploaded: true,
            isExisting: true, // Flag to identify existing documents
            uploadedAt: new Date().toISOString(),
          };
        });

        console.log("Transformed Documents:", transformedDocuments);
        setUploadedDocuments(transformedDocuments);
      } else {
        console.log("No existing documents found");
      }

      console.log("===================================");
    } catch (error) {
      console.error("Error loading existing documents:", error);
      // Don't show alert for this error, just log it
    } finally {
      setLoadingExistingDocuments(false);
    }
  };

  const loadRequirementData = async () => {
    try {
      setLoading(true);

      // Check if data should be loaded from SecureStore
      if (params?.dataSource === "securestore") {
        // Load from SecureStore and log everything
        console.log("=== LOADING DATA FROM SECURESTORE ===");

        const claimNumber = await SecureStore.getItemAsync(
          "current_claim_number"
        );
        console.log("Claim Number:", claimNumber);

        const polNo = await SecureStore.getItemAsync("current_pol_no");
        console.log("Policy Number:", polNo);

        const trnsNo = await SecureStore.getItemAsync("current_trns_no");
        console.log("Transaction Number:", trnsNo);

        const requiredDate = await SecureStore.getItemAsync(
          "current_required_date"
        );
        console.log("Required Date:", requiredDate);

        const originalReqDate = await SecureStore.getItemAsync(
          "current_original_req_date"
        );
        console.log("Original Required Date:", originalReqDate);

        const requirementId = await SecureStore.getItemAsync(
          "current_requirement_id"
        );
        console.log("Requirement ID:", requirementId);

        const documentsStr = await SecureStore.getItemAsync(
          "current_documents"
        );
        console.log("Documents String:", documentsStr);
        const documents = documentsStr ? JSON.parse(documentsStr) : [];
        console.log("Documents Array:", documents);

        // Check if data should be loaded from SecureStore
        const requiredDocumentsStr = await SecureStore.getItemAsync(
          "current_required_documents"
        );
        console.log("Required Documents String:", requiredDocumentsStr);
        const requiredDocuments = requiredDocumentsStr
          ? JSON.parse(requiredDocumentsStr)
          : documentOptions; // Use full document options as fallback
        console.log("Required Documents Array:", requiredDocuments);
        console.log("Required Documents Type:", typeof requiredDocuments[0]);

        // Log all data together
        const allSecureStoreData = {
          claimNumber,
          polNo,
          trnsNo,
          requiredDate,
          originalReqDate,
          requirementId,
          documents,
        };
        console.log("=== ALL SECURESTORE DATA ===");
        console.log(JSON.stringify(allSecureStoreData, null, 2));

        const requirementDataObj = {
          claimNumber: claimNumber || params?.claimNumber,
          polNo: polNo,
          trnsNo: trnsNo,
          requiredDocuments: requiredDocuments,
          requiredDate: requiredDate || params?.requiredDate,
          originalReqDate: originalReqDate,
          requirementId: requirementId || params?.requirementId,
          documents: documents,
        };

        setRequirementData(requirementDataObj);

        // Load existing documents after setting requirement data
        await loadExistingDocuments(polNo, claimNumber);
      } else {
        // Load from params (fallback)
        console.log("=== LOADING DATA FROM PARAMS ===");
        console.log("Route Params:", params);

        const requiredDocuments = params?.requiredDocuments
          ? JSON.parse(params.requiredDocuments)
          : documentOptions; // Use full document options as fallback

        console.log("Required Documents from params:", requiredDocuments);
        console.log("Required Documents Type:", typeof requiredDocuments[0]);

        const paramsData = {
          claimNumber: params?.claimNumber,
          polNo: params?.polNo,
          requiredDocuments: requiredDocuments,
          requiredDate: params?.requiredDate,
          requirementId: params?.requirementId,
        };
        console.log("Params Data:", paramsData);

        setRequirementData(paramsData);

        // Load existing documents after setting requirement data
        await loadExistingDocuments(params?.polNo, params?.claimNumber);
      }
    } catch (error) {
      console.error("Error loading requirement data:", error);
      Alert.alert("Error", "Failed to load requirement data");
    } finally {
      setLoading(false);
    }
  };

  // Function to get max sequence number from API
  const getMaxSeqNo = async (claimNo, docCode) => {
    try {
      console.log("=== GETTING MAX SEQ NO ===");
      console.log("Claim Number:", claimNo);
      console.log("Document Code:", docCode);

      const response = await fetch(
        `${BASE_API_URL}/UploadPendingDocument/max-seqno?clmNo=${claimNo}&doc=${docCode}`,
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

      const data = await response.json();
      console.log("Max Seq No Response:", data);
      console.log("========================");

      return data.maxSeqNo;
    } catch (error) {
      console.error("Error getting max seq no:", error);
      throw error;
    }
  };

  // Function to convert file to base64
  const convertToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting file to base64:", error);
      throw error;
    }
  };

  // Alternative function to upload document as file object
  const uploadDocumentToAPI = async (polNo, claimNo, docCode, seqNo, fileUri, fileName, mimeType) => {
    try {
      console.log("=== UPLOADING DOCUMENT TO API ===");
      console.log("Policy Number:", polNo);
      console.log("Claim Number:", claimNo);
      console.log("Document Code:", docCode);
      console.log("Sequence Number:", seqNo);
      console.log("File URI:", fileUri);
      console.log("File Name:", fileName);
      console.log("MIME Type:", mimeType);

      const formData = new FormData();
      formData.append('PolNo', polNo);
      formData.append('ClaimNo', claimNo);
      formData.append('DocCode', docCode);
      formData.append('SeqNo', seqNo.toString());
      
      // Upload as file object instead of base64
      formData.append('DocContent', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      });

      const response = await fetch(
        `${BASE_API_URL}/UploadPendingDocument/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload Response:", result);
      console.log("================================");
      
      return result;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  const processDocumentUpload = async (documentData) => {
    try {
      setUploadingDocument(true);
      
      const { claimNumber, polNo } = requirementData;
      const { documentCode, uri, name, type } = documentData;

      // Step 1: Get max sequence number
      const maxSeqNo = await getMaxSeqNo(claimNumber, documentCode);
      const nextSeqNo = maxSeqNo + 1;

      // Step 2: Upload document as file object (no base64 conversion needed)
      await uploadDocumentToAPI(
        polNo,
        claimNumber,
        documentCode,
        nextSeqNo,
        uri,
        name,
        type
      );

      // Step 3: Update document with sequence number
      const updatedDocument = {
        ...documentData,
        seqNo: nextSeqNo,
        uploaded: true,
        uploadedAt: new Date().toISOString(),
      };

      return updatedDocument;
    } catch (error) {
      console.error("Error processing document upload:", error);
      throw error;
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const allowedFormats = ["JPG", "JPEG", "TIFF", "PNG"];

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  // Modified function to handle document selection
  const handleDocumentSelection = (documentOption) => {
    // Handle different data formats
    let selectedDesc, selectedCode;

    if (typeof documentOption === "string") {
      // If it's just a string, find the matching option from documentOptions
      const matchedOption = documentOptions.find(
        (opt) =>
          opt.description
            .toLowerCase()
            .includes(documentOption.toLowerCase()) ||
          documentOption.toLowerCase().includes(opt.description.toLowerCase())
      );

      if (matchedOption) {
        selectedDesc = matchedOption.description;
        selectedCode = matchedOption.code;
      } else {
        // If no match found, use the string as description and generate a code
        selectedDesc = documentOption;
        selectedCode = "CUSTOM_" + Date.now();
      }
    } else if (documentOption.description && documentOption.code) {
      // If it's an object with description and code
      selectedDesc = documentOption.description;
      selectedCode = documentOption.code;
    } else {
      // Fallback - use the first available option
      selectedDesc = documentOptions[0].description;
      selectedCode = documentOptions[0].code;
    }

    setSelectedDocument(selectedDesc);
    setSelectedDocumentCode(selectedCode);
    setIsDropdownOpen(false);

    // Log the selected document code and claim number
    console.log("=== DOCUMENT SELECTION ===");
    console.log("Selected Document Code:", selectedCode);
    console.log("Selected Document Description:", selectedDesc);
    console.log("Claim Number:", requirementData?.claimNumber);
    console.log("Original documentOption:", documentOption);
    console.log("==========================");
  };

  const handleBrowseFiles = async () => {
    if (!selectedDocument) {
      Alert.alert(
        "Select Document",
        "Please select a required document first."
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/jpg", "image/png", "image/tiff"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        const newDocument = {
          id: Date.now().toString(),
          name: file.name,
          uri: file.uri,
          type: file.mimeType,
          size: file.size,
          documentType: selectedDocument,
          documentCode: selectedDocumentCode,
          claimNumber: requirementData?.claimNumber,
          uploaded: false,
        };

        try {
          // Process upload (get seq no and upload to API)
          const uploadedDocument = await processDocumentUpload(newDocument);

          setUploadedDocuments((prev) => [...prev, uploadedDocument]);

          // Log the document with code and claim number
          console.log("=== DOCUMENT UPLOADED ===");
          console.log("Document Code:", selectedDocumentCode);
          console.log("Claim Number:", requirementData?.claimNumber);
          console.log("Document Details:", uploadedDocument);
          console.log("Sequence Number:", uploadedDocument.seqNo);
          console.log("========================");

          Alert.alert("Success", "Document uploaded successfully!");
        } catch (uploadError) {
          console.error("Upload failed:", uploadError);
          Alert.alert(
            "Upload Error",
            "Failed to upload document to server. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleTakePhoto = async () => {
    if (!selectedDocument) {
      Alert.alert(
        "Select Document",
        "Please select a required document first."
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const photo = result.assets[0];
        const newDocument = {
          id: Date.now().toString(),
          name: `${selectedDocumentCode}_${Date.now()}.jpg`,
          uri: photo.uri,
          type: "image/jpeg",
          size: photo.fileSize || 0,
          documentType: selectedDocument,
          documentCode: selectedDocumentCode,
          claimNumber: requirementData?.claimNumber,
          uploaded: false,
        };

        try {
          // Process upload (get seq no and upload to API)
          const uploadedDocument = await processDocumentUpload(newDocument);

          setUploadedDocuments((prev) => [...prev, uploadedDocument]);

          // Log the document with code and claim number
          console.log("=== PHOTO TAKEN ===");
          console.log("Document Code:", selectedDocumentCode);
          console.log("Claim Number:", requirementData?.claimNumber);
          console.log("Document Details:", uploadedDocument);
          console.log("Sequence Number:", uploadedDocument.seqNo);
          console.log("==================");

          Alert.alert("Success", "Photo uploaded successfully!");
        } catch (uploadError) {
          console.error("Upload failed:", uploadError);
          Alert.alert(
            "Upload Error",
            "Failed to upload photo to server. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleDeleteDocument = (documentId) => {
    const document = uploadedDocuments.find(doc => doc.id === documentId);
    
    // Check if it's an existing document
    if (document?.isExisting) {
      Alert.alert(
        "Cannot Delete",
        "This document was previously uploaded and cannot be deleted from here."
      );
      return;
    }

    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setUploadedDocuments((prev) =>
              prev.filter((doc) => doc.id !== documentId)
            );
            Alert.alert("Deleted", "Document deleted successfully!");
          },
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (uploadedDocuments.length === 0) {
      Alert.alert(
        "No Documents",
        "Please upload at least one document before submitting."
      );
      return;
    }

    // Check if all documents are uploaded
    const pendingUploads = uploadedDocuments.filter((doc) => !doc.uploaded);
    if (pendingUploads.length > 0) {
      Alert.alert(
        "Upload Pending",
        "Some documents are still being uploaded. Please wait for all uploads to complete."
      );
      return;
    }

    // Log all documents with their codes and claim numbers before submission
    console.log("=== SUBMITTING DOCUMENTS ===");
    console.log("Claim Number:", requirementData?.claimNumber);
    console.log("Total Documents:", uploadedDocuments.length);
    uploadedDocuments.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, {
        code: doc.documentCode,
        description: doc.documentType,
        claimNumber: doc.claimNumber,
        fileName: doc.name,
        seqNo: doc.seqNo,
        uploaded: doc.uploaded,
        isExisting: doc.isExisting || false,
      });
    });
    console.log("============================");

    Alert.alert(
      "Submit Documents",
      `Are you sure you want to submit ${uploadedDocuments.length} document(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            Alert.alert("Submitted", "Documents submitted successfully!", [
              { text: "OK", onPress: handleClose },
            ]);
          },
        },
      ]
    );
  };

  const renderUploadedDocument = (document, index) => (
    <View key={document.id} style={styles.documentRow}>
      <View style={styles.documentDescriptionCell}>
        <Text style={styles.documentCellText}>{document.documentType}</Text>
      </View>
      <View style={styles.documentImageCell}>
        <TouchableOpacity onPress={() => handleImagePress(document.uri)}>
          <Image source={{ uri: document.uri }} style={styles.documentImage} />
        </TouchableOpacity>
      </View>
      <View style={styles.documentDeleteCell}>
        <TouchableOpacity 
          onPress={() => handleDeleteDocument(document.id)}
          style={document.isExisting ? styles.deleteButtonDisabled : null}
        >
          <Ionicons 
            name="trash" 
            size={20} 
            color={document.isExisting ? "#999" : "#D32F2F"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show loading while data is being loaded
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#FFFFFF", "#6DD3D3"]}
          style={styles.container}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00ADBB" />
            <Text style={styles.loadingText}>Loading requirement data...</Text>
            {loadingExistingDocuments && (
              <Text style={styles.loadingText}>Loading existing documents...</Text>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show error if no data
  if (!requirementData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#FFFFFF", "#6DD3D3"]}
          style={styles.container}
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading requirement data</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadRequirementData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pending Requirement</Text>
        </View>

        {/* Loading overlay for document upload */}
        {uploadingDocument && (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#00ADBB" />
              <Text style={styles.uploadingText}>Uploading document...</Text>
            </View>
          </View>
        )}

        {/* ScrollView with content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Claim Info - Show all available data */}
          <View style={styles.claimCard}>
            <View style={styles.claimRow}>
              <Text style={styles.claimLabel}>Claim Number</Text>
              <Text style={styles.claimColon}>:</Text>
              <Text style={styles.claimValue}>
                {requirementData.claimNumber}
              </Text>
            </View>
            {requirementData.polNo && (
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Policy Number</Text>
                <Text style={styles.claimColon}>:</Text>
                <Text style={styles.claimValue}>{requirementData.polNo}</Text>
              </View>
            )}
            {requirementData.trnsNo && (
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Transaction Number</Text>
                <Text style={styles.claimColon}>:</Text>
                <Text style={styles.claimValue}>{requirementData.trnsNo}</Text>
              </View>
            )}
            <View style={styles.claimRow}>
              <Text style={styles.claimLabel}>Required Date</Text>
              <Text style={styles.claimColon}>:</Text>
              <Text style={styles.claimValue}>
                {requirementData.requiredDate}
              </Text>
            </View>
          </View>

          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>Document Upload</Text>

            {/* Document Selection Dropdown */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>
                Select Required Document:
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsDropdownOpen(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedDocument || "Choose document type..."}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#00ADBB" />
              </TouchableOpacity>
            </View>
            <Text style={styles.allowedFormats}>
              Allowed formats: {allowedFormats.join(", ")}
            </Text>

            <View style={styles.uploadArea}>
              <View style={styles.uploadIcon}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={40}
                  color="#00ADBB"
                />
              </View>

              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    uploadingDocument && styles.uploadButtonDisabled,
                  ]}
                  onPress={handleBrowseFiles}
                  disabled={uploadingDocument}
                >
                  <Text style={styles.uploadButtonText}>Browse files</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    uploadingDocument && styles.uploadButtonDisabled,
                  ]}
                  onPress={handleTakePhoto}
                  disabled={uploadingDocument}
                >
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Uploaded Documents Table */}
          <View style={styles.uploadedSection}>
            <Text style={styles.uploadedTitle}>Uploaded Documents</Text>
            <View style={styles.documentsTable}>
              <View style={styles.tableHeader}>
                <View style={styles.headerDescriptionCell}>
                  <Text style={styles.headerCellText}>Description</Text>
                </View>
                <View style={styles.headerImageCell}>
                  <Text style={styles.headerCellText}>Image</Text>
                </View>
                <View style={styles.headerDeleteCell}>
                  <Text style={styles.headerCellText}>Delete</Text>
                </View>
              </View>

              {uploadedDocuments.length > 0 ? (
                uploadedDocuments.map((doc, i) =>
                  renderUploadedDocument(doc, i)
                )
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    No documents uploaded yet
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              uploadingDocument && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={uploadingDocument}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Dropdown Modal */}
        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              {(requirementData.requiredDocuments.length > 0
                ? requirementData.requiredDocuments
                : documentOptions
              ).map((doc, index) => {
                // Handle different data formats for display
                const displayText =
                  typeof doc === "string" ? doc : doc.description || doc;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => handleDocumentSelection(doc)}
                  >
                    <Text style={styles.modalItemText}>{displayText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          visible={isImageModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseImageModal}
        >
          <View style={styles.imageModalOverlay}>
            <TouchableOpacity
              style={styles.imageModalCloseButton}
              onPress={handleCloseImageModal}
            >
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.imageModalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  documentCodeText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  modalItemCode: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#13646D",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 30,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  claimCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00ADBB",
  },
  claimRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: "#00ADBB",
    fontWeight: "500",
    width: 120,
  },
  claimColon: {
    marginHorizontal: 5,
    fontSize: 14,
    color: "#13646D",
  },
  claimValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#13646D",
    flex: 1,
  },
  requiredDocumentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#13646D",
    marginBottom: 10,
  },
  requiredDocumentsBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#00ADBB",
  },
  requiredDocItem: {
    marginBottom: 5,
  },
  requiredDocText: {
    fontSize: 14,
    color: "#13646D",
    fontWeight: "500",
  },
  documentSection: {
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#13646D",
    marginBottom: 5,
  },
  allowedFormats: {
    fontSize: 12,
    color: "#666",
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownLabel: {
    fontSize: 14,
    color: "#13646D",
    fontWeight: "500",
    marginBottom: 5,
  },
  dropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#00ADBB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 14,
    color: "#13646D",
    flex: 1,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#00ADBB",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  uploadIcon: { marginBottom: 15 },
  uploadButtons: {
    flexDirection: "row",
    gap: 15,
  },
  uploadButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#00ADBB",
  },
  uploadButtonText: {
    color: "#00ADBB",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadedSection: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  uploadedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#13646D",
    marginBottom: 15,
  },
  documentsTable: {
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00ADBB",
  },
  headerDescriptionCell: {
    flex: 2,
    padding: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#FFFFFF",
  },
  headerImageCell: {
    flex: 2,
    padding: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#FFFFFF",
  },
  headerDeleteCell: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  headerCellText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  documentRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  documentDescriptionCell: {
    flex: 2,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  documentImageCell: {
    flex: 2,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  documentDeleteCell: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  documentCellText: {
    color: "#13646D",
    fontSize: 12,
    textAlign: "center",
  },
  documentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: "cover",
  },
  emptyRow: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  submitButton: {
    backgroundColor: "#00ADBB",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    minWidth: 250,
    maxWidth: 300,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#13646D",
    textAlign: "center",
  },
  // New styles for image modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: width * 0.9,
    height: height * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
});

export default PendingRequirement1;
