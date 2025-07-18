import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Dimensions, // Add this import
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // Add this import
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

const PendingRequirement1 = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedDocumentCode, setSelectedDocumentCode] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requirementData, setRequirementData] = useState({
    claimNumber: "G/010/12334/525",
    requiredDocuments: ["Prescription"],
    requiredDate: "12/05/2025",
    requirementId: "1",
    polNo: null,
    trnsNo: null,
    originalReqDate: null,
    documents: [],
  });
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [documentImageUrl, setDocumentImageUrl] = useState("");
  const [isDocumentImageModalOpen, setIsDocumentImageModalOpen] =
    useState(false);

  // Get requirement data from route params
  const params = useLocalSearchParams();

  // Enhanced logging function
  const logWithTimestamp = (label, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${label}:`, data);
  };

  const loadRequirementData = async () => {
    try {
      setLoading(true);
      logWithTimestamp("=== STARTING DATA LOAD PROCESS ===", {
        dataSource: params?.dataSource,
      });

      // Check if data should be loaded from SecureStore
      if (params?.dataSource === "securestore") {
        logWithTimestamp(
          "=== LOADING DATA FROM SECURESTORE ===",
          "Starting SecureStore retrieval"
        );

        // Load all data from SecureStore with detailed logging
        const claimNumber = await SecureStore.getItemAsync(
          "current_claim_number"
        );
        logWithTimestamp("SecureStore - Claim Number", {
          raw: claimNumber,
          type: typeof claimNumber,
          length: claimNumber?.length,
        });

        const polNo = await SecureStore.getItemAsync("current_pol_no");
        logWithTimestamp("SecureStore - Policy Number", {
          raw: polNo,
          type: typeof polNo,
          length: polNo?.length,
        });

        const trnsNo = await SecureStore.getItemAsync("current_trns_no");
        logWithTimestamp("SecureStore - Transaction Number", {
          raw: trnsNo,
          type: typeof trnsNo,
          length: trnsNo?.length,
        });

        const requiredDate = await SecureStore.getItemAsync(
          "current_required_date"
        );
        logWithTimestamp("SecureStore - Required Date", {
          raw: requiredDate,
          type: typeof requiredDate,
          length: requiredDate?.length,
        });

        const originalReqDate = await SecureStore.getItemAsync(
          "current_original_req_date"
        );
        logWithTimestamp("SecureStore - Original Required Date", {
          raw: originalReqDate,
          type: typeof originalReqDate,
          length: originalReqDate?.length,
        });

        const requirementId = await SecureStore.getItemAsync(
          "current_requirement_id"
        );
        logWithTimestamp("SecureStore - Requirement ID", {
          raw: requirementId,
          type: typeof requirementId,
          length: requirementId?.length,
        });

        const documentsStr = await SecureStore.getItemAsync(
          "current_documents"
        );
        logWithTimestamp("SecureStore - Documents String", {
          raw: documentsStr,
          type: typeof documentsStr,
          length: documentsStr?.length,
        });

        let documents = [];
        try {
          documents = documentsStr ? JSON.parse(documentsStr) : [];
          logWithTimestamp("SecureStore - Documents Parsed", {
            parsed: documents,
            type: typeof documents,
            isArray: Array.isArray(documents),
            length: documents?.length,
            firstItem: documents[0],
          });
        } catch (parseError) {
          logWithTimestamp("SecureStore - Documents Parse Error", parseError);
        }

        const requiredDocumentsStr = await SecureStore.getItemAsync(
          "current_required_documents"
        );
        logWithTimestamp("SecureStore - Required Documents String", {
          raw: requiredDocumentsStr,
          type: typeof requiredDocumentsStr,
          length: requiredDocumentsStr?.length,
        });

        let requiredDocuments = [];
        try {
          requiredDocuments = requiredDocumentsStr
            ? JSON.parse(requiredDocumentsStr)
            : [];
          logWithTimestamp("SecureStore - Required Documents Parsed", {
            parsed: requiredDocuments,
            type: typeof requiredDocuments,
            isArray: Array.isArray(requiredDocuments),
            length: requiredDocuments?.length,
            firstItemType: typeof requiredDocuments[0],
            firstItem: requiredDocuments[0],
          });
        } catch (parseError) {
          logWithTimestamp(
            "SecureStore - Required Documents Parse Error",
            parseError
          );
        }

        // Comprehensive SecureStore data summary
        const allSecureStoreData = {
          claimNumber,
          polNo,
          trnsNo,
          requiredDate,
          originalReqDate,
          requirementId,
          documents,
          requiredDocuments,
        };
        logWithTimestamp(
          "=== COMPLETE SECURESTORE DATA SUMMARY ===",
          allSecureStoreData
        );

        // Set the requirement data
        const newRequirementData = {
          claimNumber: claimNumber || params?.claimNumber,
          polNo: polNo,
          trnsNo: trnsNo,
          requiredDocuments: requiredDocuments,
          requiredDate: requiredDate || params?.requiredDate,
          originalReqDate: originalReqDate,
          requirementId: requirementId || params?.requirementId,
          documents: documents,
        };

        logWithTimestamp(
          "=== FINAL REQUIREMENT DATA (SecureStore) ===",
          newRequirementData
        );
        setRequirementData(newRequirementData);
      } else {
        // Load from params (fallback)
        logWithTimestamp(
          "=== LOADING DATA FROM PARAMS ===",
          "Starting params retrieval"
        );
        logWithTimestamp("Raw Route Params", params);

        let requiredDocuments = [];
        try {
          requiredDocuments = params?.requiredDocuments
            ? JSON.parse(params.requiredDocuments)
            : [];
          logWithTimestamp("Params - Required Documents Parsed", {
            parsed: requiredDocuments,
            type: typeof requiredDocuments,
            isArray: Array.isArray(requiredDocuments),
            length: requiredDocuments?.length,
            firstItemType: typeof requiredDocuments[0],
            firstItem: requiredDocuments[0],
          });
        } catch (parseError) {
          logWithTimestamp(
            "Params - Required Documents Parse Error",
            parseError
          );
        }

        const paramsData = {
          claimNumber: params?.claimNumber,
          requiredDocuments: requiredDocuments,
          requiredDate: params?.requiredDate,
          requirementId: params?.requirementId,
        };
        logWithTimestamp("=== PARAMS DATA SUMMARY ===", paramsData);

        setRequirementData((prevData) => {
          const updatedData = { ...prevData, ...paramsData };
          logWithTimestamp(
            "=== FINAL REQUIREMENT DATA (Params) ===",
            updatedData
          );
          return updatedData;
        });
      }
    } catch (error) {
      logWithTimestamp("=== DATA LOAD ERROR ===", {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      console.error("Error loading requirement data:", error);
      Alert.alert("Error", "Failed to load requirement data");
    } finally {
      setLoading(false);
      logWithTimestamp(
        "=== DATA LOAD PROCESS COMPLETED ===",
        "Loading finished"
      );
    }
  };

  const fetchPendingDocuments = async () => {
    try {
      setLoadingDocuments(true);
      logWithTimestamp("=== FETCHING PENDING DOCUMENTS ===", {
        polNo: requirementData.polNo,
        clmNo: requirementData.claimNumber,
      });

      const cacheBuster = Date.now();
      const response = await fetch(
        `http://203.115.11.229:1002/api/UploadDocumentRespo/pending-documents?polNo=${encodeURIComponent(
          requirementData.polNo
        )}&clmNo=${encodeURIComponent(
          requirementData.claimNumber
        )}&t=${cacheBuster}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        logWithTimestamp("=== PENDING DOCUMENTS RESPONSE ===", data);
        setPendingDocuments(data);
      } else {
        logWithTimestamp("=== PENDING DOCUMENTS ERROR ===", {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      logWithTimestamp("=== PENDING DOCUMENTS FETCH ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Error fetching pending documents:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchDocumentViewInfo = async (polNo, clmNo, docCode, seqNo) => {
    try {
      logWithTimestamp("=== FETCHING DOCUMENT VIEW INFO ===", {
        polNo,
        clmNo,
        docCode,
        seqNo,
      });

      // Enhanced cache busting with multiple parameters
      const cacheBuster = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const response = await fetch(
        `http://203.115.11.229:1002/api/UploadDocumentRespo/view-info?polNo=${encodeURIComponent(
          polNo
        )}&clmNo=${encodeURIComponent(clmNo)}&docCode=${encodeURIComponent(
          docCode
        )}&seqNo=${seqNo}&t=${cacheBuster}`,
        {
          // Enhanced cache control headers
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
            "If-Modified-Since": "0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        logWithTimestamp("=== DOCUMENT VIEW INFO RESPONSE ===", data);

        // Enhanced cache busting for the returned URL
        const viewUrl = data.viewUrl;
        const separator = viewUrl.includes("?") ? "&" : "?";
        const urlWithCacheBuster = `${viewUrl}${separator}t=${cacheBuster}&doc=${docCode}&seq=${seqNo}`;

        return urlWithCacheBuster;
      } else {
        logWithTimestamp("=== DOCUMENT VIEW INFO ERROR ===", {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }
    } catch (error) {
      logWithTimestamp("=== DOCUMENT VIEW INFO FETCH ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Error fetching document view info:", error);
      return null;
    }
  };

  const handleDocumentImageClick = async (document) => {
    logWithTimestamp("=== DOCUMENT IMAGE CLICKED ===", document);

    // Clear previous state immediately
    setDocumentImageUrl("");
    setViewingDocument(null);
    setIsDocumentImageModalOpen(false);

    // Small delay to ensure state is cleared
    setTimeout(async () => {
      const viewUrl = await fetchDocumentViewInfo(
        document.PolNo,
        document.ClaimNo,
        document.DocCode,
        document.SeqNo
      );

      if (viewUrl) {
        logWithTimestamp("=== SETTING NEW DOCUMENT IMAGE URL ===", {
          viewUrl,
          document: document,
        });

        setDocumentImageUrl(viewUrl);
        setViewingDocument(document);
        setIsDocumentImageModalOpen(true);
      } else {
        Alert.alert("Error", "Failed to load document image");
      }
    }, 100);
  };

  const handleDeletePendingDocument = async (document) => {
    try {
      logWithTimestamp("=== DELETE PENDING DOCUMENT INITIATED ===", document);

      Alert.alert(
        "Delete Document",
        "Are you sure you want to delete this document?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setLoadingDocuments(true);

                const requestBody = {
                  polNo: document.PolNo,
                  claimNo: document.ClaimNo,
                  docCode: document.DocCode,
                  seqNo: document.SeqNo,
                };

                logWithTimestamp("=== DELETE API REQUEST ===", requestBody);

                const response = await fetch(
                  "http://203.115.11.229:1002/api/UploadPendingDocumentCon/delete",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      // Add cache busting headers for delete request
                      "Cache-Control": "no-cache, no-store, must-revalidate",
                      Pragma: "no-cache",
                    },
                    body: JSON.stringify(requestBody),
                  }
                );

                logWithTimestamp("=== DELETE API RESPONSE ===", {
                  status: response.status,
                  statusText: response.statusText,
                });

                if (response.ok) {
                  const responseData = await response.json();
                  logWithTimestamp("=== DELETE API SUCCESS ===", responseData);

                  // Clear any cached image URL if it matches the deleted document
                  if (
                    viewingDocument &&
                    viewingDocument.DocCode === document.DocCode &&
                    viewingDocument.SeqNo === document.SeqNo
                  ) {
                    handleCloseDocumentImageModal();
                  }

                  // Remove the document from the local state
                  setPendingDocuments((prevDocs) =>
                    prevDocs.filter(
                      (doc) =>
                        !(
                          doc.DocCode === document.DocCode &&
                          doc.SeqNo === document.SeqNo
                        )
                    )
                  );

                  // Refresh pending documents to ensure consistency
                  await fetchPendingDocuments();

                  Alert.alert("Success", "Document deleted successfully!");
                } else {
                  const errorData = await response.text();
                  logWithTimestamp("=== DELETE API ERROR ===", {
                    status: response.status,
                    error: errorData,
                  });
                  Alert.alert(
                    "Error",
                    "Failed to delete document. Please try again."
                  );
                }
              } catch (error) {
                logWithTimestamp("=== DELETE API EXCEPTION ===", {
                  error: error.message,
                  stack: error.stack,
                });
                Alert.alert(
                  "Error",
                  "Failed to delete document. Please check your connection."
                );
              } finally {
                setLoadingDocuments(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      logWithTimestamp("=== DELETE PENDING DOCUMENT ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Error deleting pending document:", error);
    }
  };

  const handleCloseDocumentImageModal = () => {
    logWithTimestamp("=== CLOSING DOCUMENT IMAGE MODAL ===", {
      currentUrl: documentImageUrl,
      viewingDocument: viewingDocument,
    });

    setIsDocumentImageModalOpen(false);
    setDocumentImageUrl("");
    setViewingDocument(null);

    // Force garbage collection of the image URL
    setTimeout(() => {
      setDocumentImageUrl("");
    }, 100);
  };

  const renderPendingDocument = (document, index) => (
    <View
      key={`${document.DocCode}-${document.SeqNo}`}
      style={styles.documentRow}
    >
      <View style={styles.documentDescriptionCell}>
        <Text style={styles.documentCellText}>{document.DocDescription}</Text>
      </View>
      <View style={styles.documentImageCell}>
        <TouchableOpacity onPress={() => handleDocumentImageClick(document)}>
          <Ionicons name="image-outline" size={30} color="#00ADBB" />
        </TouchableOpacity>
      </View>
      <View style={styles.documentDeleteCell}>
        <TouchableOpacity onPress={() => handleDeletePendingDocument(document)}>
          <Ionicons name="trash" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    if (requirementData.polNo && requirementData.claimNumber) {
      fetchPendingDocuments();
    }
  }, [requirementData.polNo, requirementData.claimNumber]);

  // Load data when component mounts
  useEffect(() => {
    logWithTimestamp("=== COMPONENT MOUNTED ===", "Starting data load");
    loadRequirementData();
  }, []);

  // Enhanced logging for state changes
  useEffect(() => {
    logWithTimestamp("=== REQUIREMENT DATA STATE CHANGED ===", requirementData);
  }, [requirementData]);

  useEffect(() => {
    logWithTimestamp("=== SELECTED DOCUMENT CHANGED ===", {
      selectedDocument,
      selectedDocumentCode,
      timestamp: new Date().toISOString(),
    });
  }, [selectedDocument, selectedDocumentCode]);

  useEffect(() => {
    logWithTimestamp("=== UPLOADED DOCUMENTS CHANGED ===", {
      count: uploadedDocuments.length,
      documents: uploadedDocuments.map((doc) => ({
        id: doc.id,
        name: doc.name,
        documentType: doc.documentType,
        documentCode: doc.documentCode,
        type: doc.type,
        size: doc.size,
      })),
    });
  }, [uploadedDocuments]);

  const handleClose = () => {
    logWithTimestamp("=== HANDLE CLOSE CALLED ===", "Navigating back");
    router.back();
  };

  const allowedFormats = ["JPG", "JPEG", "TIFF", "PNG"];

  const handleBrowseFiles = async () => {
    logWithTimestamp("=== BROWSE FILES INITIATED ===", {
      selectedDocument,
      selectedDocumentCode,
    });

    if (!selectedDocument) {
      logWithTimestamp("=== BROWSE FILES ERROR ===", "No document selected");
      Alert.alert(
        "Select Document",
        "Please select a required document first."
      );
      return;
    }

    try {
      setLoading(true);
      logWithTimestamp(
        "=== DOCUMENT PICKER LAUNCHING ===",
        "Opening document picker"
      );
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/jpg", "image/png", "image/tiff"],
        copyToCacheDirectory: false,
      });

      logWithTimestamp("=== DOCUMENT PICKER RESULT ===", {
        canceled: result.canceled,
        assets: result.assets,
        assetsCount: result.assets?.length,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        logWithTimestamp("=== SELECTED FILE DETAILS ===", {
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
        });

        // Check and resize image if needed
        const processedImageUri = await resizeImageIfNeeded(
          file.uri,
          file.size
        );
        if (!processedImageUri) {
          // Image was too large or processing failed
          return;
        }

        // Get max sequence number
        const maxSeqNo = await getMaxSeqNo(
          requirementData.claimNumber,
          selectedDocumentCode
        );
        if (maxSeqNo === null) {
          Alert.alert(
            "Error",
            "Failed to get sequence number. Please try again."
          );
          return;
        }

        const newSeqNo = maxSeqNo + 1;
        logWithTimestamp("=== NEW SEQ NO ===", { maxSeqNo, newSeqNo });

        // Upload to API with processed image
        const uploadResult = await uploadDocumentToAPI(
          requirementData.polNo,
          requirementData.claimNumber,
          selectedDocumentCode,
          newSeqNo,
          processedImageUri,
          file.name,
          file.mimeType
        );

        if (uploadResult.success) {
          // Only refresh pending documents - don't store locally
          await fetchPendingDocuments();
          Alert.alert("Success", "Document uploaded successfully!");
        } else {
          Alert.alert(
            "Error",
            `Failed to upload document: ${uploadResult.error}`
          );
        }
      }
    } catch (error) {
      logWithTimestamp("=== BROWSE FILES ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to upload document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Replace the handleTakePhoto function
  const handleTakePhoto = async () => {
    logWithTimestamp("=== TAKE PHOTO INITIATED ===", {
      selectedDocument,
      selectedDocumentCode,
    });

    if (!selectedDocument) {
      logWithTimestamp("=== TAKE PHOTO ERROR ===", "No document selected");
      Alert.alert(
        "Select Document",
        "Please select a required document first."
      );
      return;
    }

    try {
      setLoading(true);
      logWithTimestamp(
        "=== REQUESTING CAMERA PERMISSION ===",
        "Requesting permission"
      );
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      logWithTimestamp("=== CAMERA PERMISSION RESULT ===", { status });

      if (status !== "granted") {
        logWithTimestamp(
          "=== CAMERA PERMISSION DENIED ===",
          "Permission not granted"
        );
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        return;
      }

      logWithTimestamp("=== LAUNCHING CAMERA ===", "Opening camera");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      logWithTimestamp("=== CAMERA RESULT ===", {
        canceled: result.canceled,
        assets: result.assets,
        assetsCount: result.assets?.length,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const photo = result.assets[0];
        logWithTimestamp("=== CAPTURED PHOTO DETAILS ===", {
          uri: photo.uri,
          fileSize: photo.fileSize,
          width: photo.width,
          height: photo.height,
        });

        // Check and resize image if needed
        const processedImageUri = await resizeImageIfNeeded(
          photo.uri,
          photo.fileSize
        );
        if (!processedImageUri) {
          // Image was too large or processing failed
          return;
        }

        // Get max sequence number
        const maxSeqNo = await getMaxSeqNo(
          requirementData.claimNumber,
          selectedDocumentCode
        );
        if (maxSeqNo === null) {
          Alert.alert(
            "Error",
            "Failed to get sequence number. Please try again."
          );
          return;
        }

        const newSeqNo = maxSeqNo + 1;
        const fileName = `${selectedDocument}_${Date.now()}.jpg`;
        logWithTimestamp("=== NEW SEQ NO ===", {
          maxSeqNo,
          newSeqNo,
          fileName,
        });

        // Upload to API with processed image
        const uploadResult = await uploadDocumentToAPI(
          requirementData.polNo,
          requirementData.claimNumber,
          selectedDocumentCode,
          newSeqNo,
          processedImageUri,
          fileName,
          "image/jpeg"
        );

        if (uploadResult.success) {
          // Only refresh pending documents - don't store locally
          await fetchPendingDocuments();
          Alert.alert("Success", "Photo uploaded successfully!");
        } else {
          Alert.alert("Error", `Failed to upload photo: ${uploadResult.error}`);
        }
      }
    } catch (error) {
      logWithTimestamp("=== TAKE PHOTO ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMaxSeqNo = async (claimNo, docCode) => {
    try {
      logWithTimestamp("=== FETCHING MAX SEQ NO ===", {
        claimNo,
        docCode,
      });

      const response = await fetch(
        `http://203.115.11.229:1002/api/UploadPendingDocument/max-seqno?clmNo=${encodeURIComponent(
          claimNo
        )}&doc=${encodeURIComponent(docCode)}`
      );

      if (response.ok) {
        const data = await response.json();
        logWithTimestamp("=== MAX SEQ NO RESPONSE ===", data);
        return data.maxSeqNo;
      } else {
        logWithTimestamp("=== MAX SEQ NO ERROR ===", {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }
    } catch (error) {
      logWithTimestamp("=== MAX SEQ NO FETCH ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      console.error("Error fetching max seq no:", error);
      return null;
    }
  };

  const uploadDocumentToAPI = async (
    polNo,
    claimNo,
    docCode,
    seqNo,
    fileUri,
    fileName,
    mimeType
  ) => {
    try {
      logWithTimestamp("=== UPLOADING DOCUMENT TO API ===", {
        polNo,
        claimNo,
        docCode,
        seqNo,
        fileName,
        mimeType,
      });

      const formData = new FormData();
      formData.append("PolNo", polNo);
      formData.append("ClaimNo", claimNo);
      formData.append("DocCode", docCode);
      formData.append("SeqNo", seqNo.toString());
      formData.append("DocContent", {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      });

      const response = await fetch(
        "http://203.115.11.229:1002/api/UploadPendingDocument/upload",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      logWithTimestamp("=== UPLOAD API RESPONSE ===", {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const responseData = await response.json();
        logWithTimestamp("=== UPLOAD API SUCCESS ===", responseData);
        return { success: true, data: responseData };
      } else {
        const errorData = await response.text();
        logWithTimestamp("=== UPLOAD API ERROR ===", {
          status: response.status,
          error: errorData,
        });
        return { success: false, error: errorData };
      }
    } catch (error) {
      logWithTimestamp("=== UPLOAD API EXCEPTION ===", {
        error: error.message,
        stack: error.stack,
      });
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async () => {
    logWithTimestamp("=== SUBMIT INITIATED ===", {
      documentCount: pendingDocuments.length,
      documents: pendingDocuments,
    });

    if (pendingDocuments.length === 0) {
      logWithTimestamp("=== SUBMIT ERROR ===", "No documents uploaded");
      Alert.alert(
        "No Documents",
        "Please upload at least one document before submitting."
      );
      return;
    }

    // Enhanced logging for submitted documents
    logWithTimestamp(
      "=== SUBMITTING DOCUMENTS DETAILED ===",
      "Processing documents for submission"
    );
    pendingDocuments.forEach((doc, index) => {
      logWithTimestamp(`=== DOCUMENT ${index + 1} SUBMISSION DATA ===`, {
        documentType: doc.DocDescription,
        documentCode: doc.DocCode,
        docNo: doc.DocNo,
        seqNo: doc.SeqNo,
        polNo: doc.PolNo,
        claimNo: doc.ClaimNo,
      });
    });

    // Summary of submission
    const submissionSummary = {
      totalDocuments: pendingDocuments.length,
      documentTypes: [
        ...new Set(pendingDocuments.map((doc) => doc.DocDescription)),
      ],
      documentCodes: [...new Set(pendingDocuments.map((doc) => doc.DocCode))],
      claimNumber: requirementData.claimNumber,
      requirementId: requirementData.requirementId,
    };
    logWithTimestamp("=== SUBMISSION SUMMARY ===", submissionSummary);

    Alert.alert(
      "Submit Documents",
      `Are you sure you want to submit ${pendingDocuments.length} document(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              setLoading(true);
              logWithTimestamp(
                "=== SUBMIT CONFIRMED ===",
                "Starting API calls"
              );

              // Get unique document codes from pending documents
              const uniqueDocCodes = [
                ...new Set(pendingDocuments.map((doc) => doc.DocCode)),
              ];

              logWithTimestamp("=== UNIQUE DOC CODES ===", {
                codes: uniqueDocCodes,
                totalCodes: uniqueDocCodes.length,
              });

              // Call the SubmitDocs API for each unique document code
              const submitPromises = uniqueDocCodes.map(async (docCode) => {
                const requestBody = {
                  claimNo: requirementData.claimNumber,
                  docCode: docCode,
                  polNo: requirementData.polNo,
                };

                logWithTimestamp("=== SUBMIT DOCS API REQUEST ===", {
                  docCode,
                  requestBody,
                });

                const response = await fetch(
                  "http://203.115.11.229:1002/api/DocumentLog/SubmitDocs",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Cache-Control": "no-cache, no-store, must-revalidate",
                      Pragma: "no-cache",
                    },
                    body: JSON.stringify(requestBody),
                  }
                );

                logWithTimestamp("=== SUBMIT DOCS API RESPONSE ===", {
                  docCode,
                  status: response.status,
                  statusText: response.statusText,
                });

                if (response.ok) {
                  const responseData = await response.json();
                  logWithTimestamp("=== SUBMIT DOCS API SUCCESS ===", {
                    docCode,
                    responseData,
                  });
                  return { success: true, docCode, data: responseData };
                } else {
                  const errorData = await response.text();
                  logWithTimestamp("=== SUBMIT DOCS API ERROR ===", {
                    docCode,
                    status: response.status,
                    error: errorData,
                  });
                  return { success: false, docCode, error: errorData };
                }
              });

              // Wait for all API calls to complete
              const results = await Promise.all(submitPromises);

              logWithTimestamp("=== ALL SUBMIT RESULTS ===", results);

              // Check if all submissions were successful
              const successfulSubmissions = results.filter(
                (result) => result.success
              );
              const failedSubmissions = results.filter(
                (result) => !result.success
              );

              if (failedSubmissions.length === 0) {
                // All submissions successful
                logWithTimestamp("=== ALL SUBMISSIONS SUCCESSFUL ===", {
                  successCount: successfulSubmissions.length,
                  totalCount: results.length,
                });

                // Refresh pending documents to reflect the changes
                await fetchPendingDocuments();

                Alert.alert(
                  "Success",
                  `All ${successfulSubmissions.length} document type(s) submitted successfully!`,
                  [{ text: "OK", onPress: handleClose }]
                );
              } else {
                // Some submissions failed
                logWithTimestamp("=== SOME SUBMISSIONS FAILED ===", {
                  successCount: successfulSubmissions.length,
                  failedCount: failedSubmissions.length,
                  failedDocCodes: failedSubmissions.map((f) => f.docCode),
                });

                const failedDocCodes = failedSubmissions
                  .map((f) => f.docCode)
                  .join(", ");
                Alert.alert(
                  "Partial Success",
                  `${successfulSubmissions.length} document type(s) submitted successfully.\n\nFailed to submit: ${failedDocCodes}\n\nPlease try again for the failed documents.`
                );

                // Refresh pending documents to show current state
                await fetchPendingDocuments();
              }
            } catch (error) {
              logWithTimestamp("=== SUBMIT API EXCEPTION ===", {
                error: error.message,
                stack: error.stack,
              });
              Alert.alert(
                "Error",
                "Failed to submit documents. Please check your connection and try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resizeImageIfNeeded = async (imageUri, originalSize) => {
    try {
      logWithTimestamp("=== CHECKING IMAGE SIZE ===", {
        originalSize,
        originalSizeMB: (originalSize / (1024 * 1024)).toFixed(2),
      });

      // Check if image is larger than 5MB
      if (originalSize > 5 * 1024 * 1024) {
        logWithTimestamp(
          "=== IMAGE TOO LARGE ===",
          "Image size exceeds 5MB limit"
        );
        Alert.alert(
          "Image Too Large",
          "The selected image is larger than 5MB. Please select a smaller image."
        );
        return null;
      }

      // If image is larger than 1MB, resize it
      if (originalSize > 1 * 1024 * 1024) {
        logWithTimestamp(
          "=== RESIZING IMAGE ===",
          "Image size > 1MB, resizing..."
        );

        // Calculate compression ratio to get under 1MB
        let compressionRatio = (1 * 1024 * 1024) / originalSize;
        // Add some buffer to ensure we stay under 1MB
        compressionRatio = Math.min(compressionRatio * 0.8, 0.8);

        logWithTimestamp("=== COMPRESSION RATIO ===", { compressionRatio });

        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            // Optionally resize dimensions if needed
            { resize: { width: 1920 } }, // Resize to max width of 1920px
          ],
          {
            compress: compressionRatio,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          }
        );

        logWithTimestamp("=== IMAGE RESIZED ===", {
          originalUri: imageUri,
          resizedUri: resizedImage.uri,
          estimatedNewSize: "Will be checked after processing",
        });

        return resizedImage.uri;
      }

      // Image is already under 1MB, no resizing needed
      logWithTimestamp("=== IMAGE SIZE OK ===", "Image size is acceptable");
      return imageUri;
    } catch (error) {
      logWithTimestamp("=== IMAGE RESIZE ERROR ===", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const handleDocumentSelection = (document) => {
    logWithTimestamp("=== DOCUMENT SELECTION INITIATED ===", {
      selectedDocument: document,
      type: typeof document,
      hasDescription: !!document.description,
      hasCode: !!document.code,
    });

    if (document.description) {
      logWithTimestamp("=== DOCUMENT SELECTION (WITH CODE) ===", {
        description: document.description,
        code: document.code,
        fullDocument: document,
      });
      setSelectedDocument(document.description);
      setSelectedDocumentCode(document.code);
    } else {
      logWithTimestamp("=== DOCUMENT SELECTION (WITHOUT CODE) ===", {
        document: document,
        type: typeof document,
      });
      setSelectedDocument(document);
      setSelectedDocumentCode("");
    }

    setIsDropdownOpen(false);
    logWithTimestamp("=== DOCUMENT SELECTION COMPLETED ===", {
      selectedDocument: document.description || document,
      selectedDocumentCode: document.code || "",
    });
  };

  // Show loading indicator while loading data
  if (loading) {
    return (
      <LinearGradient
        colors={["#FFFFFF", "#6DD3D3"]}
        style={[styles.container, styles.loadingContainer]}
      >
        <ActivityIndicator size="large" color="#00ADBB" />
        <Text style={styles.loadingText}>Loading requirement data...</Text>
      </LinearGradient>
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
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#13646D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Requirement</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ScrollView with content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Claim Info - Only show claim number and date */}
        <View style={styles.claimCard}>
          <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>Claim Number</Text>
            <Text style={styles.claimColon}>:</Text>
            <Text style={styles.claimValue}>
              {requirementData.claimNumber}
            </Text>
          </View>
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
              onPress={() => {
                logWithTimestamp("=== DROPDOWN OPENED ===", {
                  documentsAvailable: requirementData.documents?.length || 0,
                  requiredDocumentsAvailable:
                    requirementData.requiredDocuments?.length || 0,
                });
                setIsDropdownOpen(true);
              }}
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
                style={styles.uploadButton}
                onPress={handleBrowseFiles}
              >
                <Text style={styles.uploadButtonText}>Browse files</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pending Documents Table */}
        <View style={styles.uploadedSection}>
          <Text style={styles.uploadedTitle}>Pending Documents</Text>
          <View style={styles.documentsTable}>
            <View style={styles.tableHeader}>
              <View style={styles.headerDescriptionCell}>
                <Text style={styles.headerCellText}>Description</Text>
              </View>
              <View style={styles.headerImageCell}>
                <Text style={styles.headerCellText}>View Image</Text>
              </View>
              <View style={styles.headerDeleteCell}>
                <Text style={styles.headerCellText}>Action</Text>
              </View>
            </View>

            {loadingDocuments ? (
              <View style={styles.emptyRow}>
                <ActivityIndicator size="small" color="#00ADBB" />
                <Text style={styles.emptyText}>
                  Loading pending documents...
                </Text>
              </View>
            ) : pendingDocuments.length > 0 ? (
              pendingDocuments.map((doc, i) => renderPendingDocument(doc, i))
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  No pending documents found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          logWithTimestamp("=== DROPDOWN CLOSED ===", "Modal closed");
          setIsDropdownOpen(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            logWithTimestamp(
              "=== DROPDOWN OVERLAY PRESSED ===",
              "Closing dropdown"
            );
            setIsDropdownOpen(false);
          }}
        >
          <View style={styles.modalContent}>
            {(() => {
              logWithTimestamp("=== DROPDOWN MODAL RENDERING ===", {
                documentsLength: requirementData.documents?.length || 0,
                requiredDocumentsLength:
                  requirementData.requiredDocuments?.length || 0,
                documents: requirementData.documents,
                requiredDocuments: requirementData.requiredDocuments,
              });
              return null;
            })()}

            {requirementData.documents && requirementData.documents.length > 0
              ? requirementData.documents.map((doc, index) => {
                logWithTimestamp(
                  `=== RENDERING DOCUMENT OPTION ${index} ===`,
                  doc
                );
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => handleDocumentSelection(doc)}
                  >
                    <Text style={styles.modalItemText}>
                      {doc.description}
                    </Text>
                  </TouchableOpacity>
                );
              })
              : pendingDocuments.length > 0
                ? pendingDocuments.map((doc, index) => {
                  logWithTimestamp(
                    `=== RENDERING PENDING DOCUMENT OPTION ${index} ===`,
                    doc
                  );
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => {
                        logWithTimestamp(
                          "=== PENDING DOCUMENT SELECTED ===",
                          doc
                        );
                        setSelectedDocument(doc.DocDescription);
                        setSelectedDocumentCode(doc.DocCode);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>
                        {doc.DocDescription}
                      </Text>
                    </TouchableOpacity>
                  );
                })
                : // Fallback to requiredDocuments if both arrays are empty
                requirementData.requiredDocuments.map((doc, index) => {
                  logWithTimestamp(
                    `=== RENDERING REQUIRED DOCUMENT OPTION ${index} ===`,
                    doc
                  );
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => {
                        logWithTimestamp(
                          "=== FALLBACK DOCUMENT SELECTED ===",
                          doc
                        );
                        setSelectedDocument(doc);
                        setSelectedDocumentCode("");
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{doc}</Text>
                    </TouchableOpacity>
                  );
                })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={isDocumentImageModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDocumentImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={handleCloseDocumentImageModal}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.imageModalContent}>
            {documentImageUrl && (
              <Image
                source={{ uri: documentImageUrl }}
                style={styles.previewImage}
                resizeMode="contain"
                onError={(error) => {
                  logWithTimestamp(
                    "=== DOCUMENT IMAGE LOAD ERROR ===",
                    error
                  );
                  Alert.alert("Error", "Failed to load document image");
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#13646D",
    fontWeight: "500",
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
