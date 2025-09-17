import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";

const { width, height } = Dimensions.get("window");

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
const LoadingScreen = ({
  loadingMessage = "Loading Pending requirement data...",
}) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContainer}>
      <LoadingIcon />
      <Text style={styles.loadingText}>{loadingMessage}</Text>
      <Text style={styles.loadingSubText}>Please wait a moment</Text>
    </View>
  </View>
);

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

const PendingRequirement1 = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedDocumentCode, setSelectedDocumentCode] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [initialDataLoaded, setInitialDataLoaded] = useState(false); // Track if initial data is loaded
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading requirement data..."
  );
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

  // Popup state
  const [popup, setPopup] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    showConfirmButton: false,
    onConfirm: null,
  });

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Check if we can go back in router
        if (router.canGoBack()) {
          router.back();
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
    }, [])
  );

  // Get requirement data from route params
  const params = useLocalSearchParams();

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

  // Enhanced logging function
  const logWithTimestamp = (label, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${label}:`, data);
  };

  const loadRequirementData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Loading requirement data...");
      logWithTimestamp("=== STARTING DATA LOAD PROCESS ===", {
        dataSource: params?.dataSource,
      });

      if (params?.dataSource === "securestore") {
        logWithTimestamp(
          "=== LOADING DATA FROM SECURESTORE ===",
          "Starting SecureStore retrieval"
        );

        const claimNumber = await SecureStore.getItemAsync(
          "current_claim_number"
        );
        const polNo = await SecureStore.getItemAsync("current_pol_no");
        const trnsNo = await SecureStore.getItemAsync("current_trns_no");
        const requiredDate = await SecureStore.getItemAsync(
          "current_required_date"
        );
        const originalReqDate = await SecureStore.getItemAsync(
          "current_original_req_date"
        );
        const requirementId = await SecureStore.getItemAsync(
          "current_requirement_id"
        );
        const documentsStr = await SecureStore.getItemAsync(
          "current_documents"
        );
        const requiredDocumentsStr = await SecureStore.getItemAsync(
          "current_required_documents"
        );

        let documents = [];
        try {
          documents = documentsStr ? JSON.parse(documentsStr) : [];
        } catch (parseError) {
          logWithTimestamp("SecureStore - Documents Parse Error", parseError);
        }

        let requiredDocuments = [];
        try {
          requiredDocuments = requiredDocumentsStr
            ? JSON.parse(requiredDocumentsStr)
            : [];
        } catch (parseError) {
          logWithTimestamp(
            "SecureStore - Required Documents Parse Error",
            parseError
          );
        }

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

        setRequirementData(newRequirementData);
      } else {
        logWithTimestamp(
          "=== LOADING DATA FROM PARAMS ===",
          "Starting params retrieval"
        );

        let requiredDocuments = [];
        try {
          requiredDocuments = params?.requiredDocuments
            ? JSON.parse(params.requiredDocuments)
            : [];
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

        setRequirementData((prevData) => ({ ...prevData, ...paramsData }));
      }

      setInitialDataLoaded(true);
    } catch (error) {
      logWithTimestamp("=== DATA LOAD ERROR ===", error);
      console.error("Error loading requirement data:", error);
      showPopup("Error", "Failed to load requirement data", "error");
      setInitialDataLoaded(true);
    }
  };

  const fetchPendingDocuments = async () => {
    try {
      setLoadingMessage("Loading pending documents...");
      setLoadingDocuments(true);

      const cacheBuster = Date.now();
      const response = await fetch(
        `${API_BASE_URL}/UploadDocumentRespo/pending-documents?polNo=${encodeURIComponent(
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
        setPendingDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching pending documents:", error);
    } finally {
      setLoadingDocuments(false);
      // Only set main loading to false after all initial data is loaded
      if (initialDataLoaded) {
        setLoading(false);
      }
    }
  };

  const fetchDocumentViewInfo = async (polNo, clmNo, docCode, seqNo) => {
    try {
      const cacheBuster = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const response = await fetch(
        `${API_BASE_URL}/UploadDocumentRespo/view-info?polNo=${encodeURIComponent(
          polNo
        )}&clmNo=${encodeURIComponent(clmNo)}&docCode=${encodeURIComponent(
          docCode
        )}&seqNo=${seqNo}&t=${cacheBuster}`,
        {
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
        const viewUrl = data.viewUrl;
        const separator = viewUrl.includes("?") ? "&" : "?";
        return `${viewUrl}${separator}t=${cacheBuster}&doc=${docCode}&seq=${seqNo}`;
      }
      return null;
    } catch (error) {
      console.error("Error fetching document view info:", error);
      return null;
    }
  };

  const handleDocumentImageClick = async (document) => {
    setDocumentImageUrl("");
    setViewingDocument(null);
    setIsDocumentImageModalOpen(false);

    setTimeout(async () => {
      const viewUrl = await fetchDocumentViewInfo(
        document.PolNo,
        document.ClaimNo,
        document.DocCode,
        document.SeqNo
      );

      if (viewUrl) {
        setDocumentImageUrl(viewUrl);
        setViewingDocument(document);
        setIsDocumentImageModalOpen(true);
      } else {
        showPopup("Error", "Failed to load document image", "error");
      }
    }, 100);
  };

  const handleDeletePendingDocument = async (document) => {
    showPopup(
      "Delete Document",
      "Are you sure you want to delete this document?",
      "warning",
      true,
      async () => {
        try {
          hidePopup();
          setLoadingDocuments(true);

          const requestBody = {
            polNo: document.PolNo,
            claimNo: document.ClaimNo,
            docCode: document.DocCode,
            seqNo: document.SeqNo,
          };

          const response = await fetch(
            `${API_BASE_URL}/UploadPendingDocumentCon/delete`,
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

          if (response.ok) {
            if (
              viewingDocument &&
              viewingDocument.DocCode === document.DocCode &&
              viewingDocument.SeqNo === document.SeqNo
            ) {
              handleCloseDocumentImageModal();
            }

            setPendingDocuments((prevDocs) =>
              prevDocs.filter(
                (doc) =>
                  !(
                    doc.DocCode === document.DocCode &&
                    doc.SeqNo === document.SeqNo
                  )
              )
            );

            await fetchPendingDocuments();
            showPopup("Success", "Document deleted successfully!", "success");
          } else {
            showPopup(
              "Error",
              "Failed to delete document. Please try again.",
              "error"
            );
          }
        } catch (error) {
          showPopup(
            "Error",
            "Failed to delete document. Please check your connection.",
            "error"
          );
        } finally {
          setLoadingDocuments(false);
        }
      }
    );
  };

  const handleCloseDocumentImageModal = () => {
    setIsDocumentImageModalOpen(false);
    setDocumentImageUrl("");
    setViewingDocument(null);
  };

  const handleBrowseFiles = async () => {
    if (!selectedDocument) {
      showPopup(
        "Select Document",
        "Please select a required document first.",
        "warning"
      );
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Processing document...");

      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/jpg", "image/png", "image/tiff"],
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];

        const processedImageUri = await resizeImageIfNeeded(
          file.uri,
          file.size
        );
        if (!processedImageUri) {
          return;
        }

        const maxSeqNo = await getMaxSeqNo(
          requirementData.claimNumber,
          selectedDocumentCode
        );
        if (maxSeqNo === null) {
          showPopup(
            "Error",
            "Failed to get sequence number. Please try again.",
            "error"
          );
          return;
        }

        const newSeqNo = maxSeqNo + 1;
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
          await fetchPendingDocuments();
          showPopup("Success", "Document uploaded successfully!", "success");
        } else {
          showPopup(
            "Error",
            `Failed to upload document: ${uploadResult.error}`,
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showPopup(
        "Error",
        "Failed to upload document. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!selectedDocument) {
      showPopup(
        "Select Document",
        "Please select a required document first.",
        "warning"
      );
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Processing photo...");

      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        showPopup(
          "Permission needed",
          "Camera permission is required to take photos",
          "warning"
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

        const processedImageUri = await resizeImageIfNeeded(
          photo.uri,
          photo.fileSize
        );
        if (!processedImageUri) {
          return;
        }

        const maxSeqNo = await getMaxSeqNo(
          requirementData.claimNumber,
          selectedDocumentCode
        );
        if (maxSeqNo === null) {
          showPopup(
            "Error",
            "Failed to get sequence number. Please try again.",
            "error"
          );
          return;
        }

        const newSeqNo = maxSeqNo + 1;
        const fileName = `${selectedDocument}_${Date.now()}.jpg`;

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
          await fetchPendingDocuments();
          showPopup("Success", "Photo uploaded successfully!", "success");
        } else {
          showPopup(
            "Error",
            `Failed to upload photo: ${uploadResult.error}`,
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showPopup("Error", "Failed to upload photo. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getMaxSeqNo = async (claimNo, docCode) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/UploadPendingDocument/max-seqno?clmNo=${encodeURIComponent(
          claimNo
        )}&doc=${encodeURIComponent(docCode)}`
      );

      if (response.ok) {
        const data = await response.json();
        return data.maxSeqNo;
      }
      return null;
    } catch (error) {
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
        `${API_BASE_URL}/UploadPendingDocument/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        const errorData = await response.text();
        return { success: false, error: errorData };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async () => {
    if (pendingDocuments.length === 0) {
      showPopup(
        "No Documents",
        "Please upload at least one document before submitting.",
        "warning"
      );
      return;
    }

    showPopup(
      "Submit Documents",
      `Are you sure you want to submit ${pendingDocuments.length} document(s)?`,
      "warning",
      true,
      async () => {
        try {
          hidePopup();
          setLoading(true);
          setLoadingMessage("Submitting documents...");

          // Group documents by DocCode and get unique submissions with their metadata
          const docGroups = pendingDocuments.reduce((groups, doc) => {
            const key = doc.DocCode;
            if (!groups[key]) {
              groups[key] = {
                docCode: doc.DocCode,
                memId: doc.MemberId,
                trnsNo: doc.TransactionNo,
                documents: [],
              };
            }
            groups[key].documents.push(doc);
            return groups;
          }, {});

          const submitPromises = Object.values(docGroups).map(async (group) => {
            const requestBody = {
              claimNo: requirementData.claimNumber,
              docCode: group.docCode,
              polNo: requirementData.polNo,
              memId: group.memId,
              trnsNo: group.trnsNo,
            };

            console.log("Submitting with payload:", requestBody);

            const response = await fetch(
              `${API_BASE_URL}/DocumentLog/SubmitDocs`,
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

            if (response.ok) {
              const responseData = await response.json();
              return {
                success: true,
                docCode: group.docCode,
                data: responseData,
              };
            } else {
              const errorData = await response.text();
              return {
                success: false,
                docCode: group.docCode,
                error: errorData,
              };
            }
          });

          const results = await Promise.all(submitPromises);
          const successfulSubmissions = results.filter(
            (result) => result.success
          );
          const failedSubmissions = results.filter((result) => !result.success);

          setLoading(false);

          if (failedSubmissions.length === 0) {
            await fetchPendingDocuments();

            // Show success popup with navigation
            showPopup(
              "Success",
              `All ${successfulSubmissions.length} document type(s) submitted successfully!`,
              "success",
              false,
              null
            );

            // Navigate to home after showing success message
            setTimeout(() => {
              hidePopup();
              setTimeout(() => {
                console.log("Navigating to home page...");
                router.push("/home");
              }, 100);
            }, 2000);
          } else {
            const failedDocCodes = failedSubmissions
              .map((f) => f.docCode)
              .join(", ");
            showPopup(
              "Partial Success",
              `${successfulSubmissions.length} document type(s) submitted successfully.\n\nFailed to submit: ${failedDocCodes}\n\nPlease try again for the failed documents.`,
              "warning"
            );
            await fetchPendingDocuments();
          }
        } catch (error) {
          setLoading(false);
          console.error("Submit error:", error);
          showPopup(
            "Error",
            "Failed to submit documents. Please check your connection and try again.",
            "error"
          );
        }
      }
    );
  };

  // Update the CustomPopup component's OK button behavior
  const CustomPopupWithNavigation = ({
    visible,
    title,
    message,
    type = "info",
    onClose,
    onConfirm,
    showConfirmButton = false,
    navigateToHome = false, // New prop
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

    const handleOkPress = () => {
      onClose();
      if (navigateToHome) {
        setTimeout(() => {
          router.push("/home");
        }, 300);
      }
    };

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
            onPress={navigateToHome ? handleOkPress : onClose}
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
                onPress={navigateToHome ? handleOkPress : onClose}
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

  const resizeImageIfNeeded = async (imageUri, originalSize) => {
    try {
      if (originalSize > 5 * 1024 * 1024) {
        showPopup(
          "Image Too Large",
          "The selected image is larger than 5MB. Please select a smaller image.",
          "warning"
        );
        return null;
      }

      if (originalSize > 1 * 1024 * 1024) {
        let compressionRatio = (1 * 1024 * 1024) / originalSize;
        compressionRatio = Math.min(compressionRatio * 0.8, 0.8);

        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1920 } }],
          {
            compress: compressionRatio,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          }
        );

        return resizedImage.uri;
      }

      return imageUri;
    } catch (error) {
      throw error;
    }
  };

  const handleDocumentSelection = (document) => {
    if (document.description) {
      setSelectedDocument(document.description);
      setSelectedDocumentCode(document.code);
    } else {
      setSelectedDocument(document);
      setSelectedDocumentCode("");
    }
    setIsDropdownOpen(false);
  };

  const handleClose = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Navigate to home screen or handle gracefully
      router.replace("/(tabs)/home"); // Replace with your actual home route
    }
  }, []);

  const allowedFormats = ["JPG", "JPEG", "TIFF", "PNG"];

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

  // Enhanced useEffect for initial data loading
  useEffect(() => {
    const initializeData = async () => {
      await loadRequirementData();
    };

    initializeData();
  }, []);

  // Effect to fetch pending documents after requirement data is loaded
  useEffect(() => {
    if (
      initialDataLoaded &&
      requirementData.polNo &&
      requirementData.claimNumber
    ) {
      fetchPendingDocuments();
    }
  }, [initialDataLoaded, requirementData.polNo, requirementData.claimNumber]);

  // Show loading screen while initial data is being loaded or during operations
  if (loading || !initialDataLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#FFFFFF", "#6DD3D3"]}
          style={styles.container}
        >
          <LoadingScreen loadingMessage={loadingMessage} />
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
          <View style={styles.headerSpacer} />
        </View>

        {/* ScrollView with content */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Claim Info */}
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

          {/* Document Upload Section */}
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
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              {requirementData.documents && requirementData.documents.length > 0
                ? requirementData.documents.map((doc, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => handleDocumentSelection(doc)}
                    >
                      <Text style={styles.modalItemText}>
                        {doc.description}
                      </Text>
                    </TouchableOpacity>
                  ))
                : pendingDocuments.length > 0
                ? pendingDocuments.map((doc, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedDocument(doc.DocDescription);
                        setSelectedDocumentCode(doc.DocCode);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>
                        {doc.DocDescription}
                      </Text>
                    </TouchableOpacity>
                  ))
                : requirementData.requiredDocuments.map((doc, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedDocument(doc);
                        setSelectedDocumentCode("");
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{doc}</Text>
                    </TouchableOpacity>
                  ))}
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
                    showPopup(
                      "Error",
                      "Failed to load document image",
                      "error"
                    );
                  }}
                />
              )}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  // Custom Loading Styles (from DependentDetails)
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  loadingSubText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
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
    fontWeight: "800",
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
  uploadIcon: {
    marginBottom: 15,
  },
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
  // Image modal styles
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
});

export default PendingRequirement1;
