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
    outputRange: ['0deg', '360deg'],
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
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent={true}>
      <Animated.View 
        style={[
          styles.popupOverlay,
          { opacity: fadeAnim }
        ]}
      >
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
      console.log("Fetching claim amount from API for referenceNo:", referenceNo);

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
        } else if (data.totalAmount !== undefined && data.totalAmount !== null) {
          claimAmount = data.totalAmount.toString();
        }
      } else if (typeof data === "number" || typeof data === "string") {
        claimAmount = data.toString();
      }

      const formattedAmount = claimAmount.includes(".")
        ? claimAmount
        : `${claimAmount}.00`;

      console.log("Formatted claim amount:", formattedAmount);
      setActualClaimAmount(formattedAmount);
      return formattedAmount;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      setActualClaimAmount("0.00");
      return "0.00";
    } finally {
      setClaimAmountLoading(false);
    }
  };

  // Fetch document types from API
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
          label: doc.docDesc,
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

        // Fallback to hardcoded types if API fails
        setDocumentTypes([
          { id: "O01", label: "BILL", icon: "receipt-outline" },
          { id: "O02", label: "PRESCRIPTION", icon: "medical-outline" },
          { id: "O03", label: "DIAGNOSIS CARD", icon: "document-text-outline" },
          { id: "O04", label: "OTHER", icon: "folder-outline" },
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
          console.log("Screen focused from EditClaim, refreshing claim amount...");
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
    formData.append("DocAmount", document.amount);
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
      const beneficiaryAmount = parseFloat(actualClaimAmount || "0");
      console.log("Checking BILL disable condition:", {
        docTypeId,
        actualClaimAmount,
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

    const cleanedText = text.replace(/[^0-9.]/g, "");
    const parts = cleanedText.split(".");
    if (parts.length > 2) {
      return;
    }

    let formattedAmount = cleanedText;
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        formattedAmount = parts[0] + "." + parts[1].substring(0, 2);
      }
    }

    setAmount(formattedAmount);
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

    const cleanedText = text.replace(/[^0-9.]/g, "");
    const parts = cleanedText.split(".");
    if (parts.length > 2) {
      return;
    }

    let formattedAmount = cleanedText;
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        formattedAmount = parts[0] + "." + parts[1].substring(0, 2);
      }
    }

    setEditAmount(formattedAmount);
  };

  const validateAmount = (amountString) => {
    if (selectedDocumentType === "O02" || selectedDocumentType === "O03") {
      return true;
    }

    if (selectedDocumentType === "O01") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      const amount = parseFloat(amountString);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    if (!amountString || amountString.trim() === "") {
      return false;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount < 0) {
      return false;
    }

    return true;
  };

  const formatAmountForDisplay = (amountString) => {
    if (!amountString) return "";

    const amount = parseFloat(amountString);
    if (isNaN(amount)) return amountString;

    return amount.toFixed(2);
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    
    if (allowedTypes.includes(mimeType)) {
      return true;
    }
    
    // Fallback check using file extension
    const extension = name.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png'].includes(extension);
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

        showPopup(
          "Success",
          "Document uploaded successfully!",
          "success"
        );
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showPopup(
        "Error",
        "Failed to pick document",
        "error"
      );
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
      showPopup(
        "Error",
        "Failed to take photo",
        "error"
      );
    }
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
        showPopup(
          "Success",
          "Document deleted successfully.",
          "success"
        );
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
        showPopup(
          "Validation Error",
          "Please enter a valid amount",
          "warning"
        );
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
    showPopup(
      "Success",
      "Document details updated successfully.",
      "success"
    );
  };

  const validateEditAmount = (amountString) => {
    if (editDocumentType === "O02" || editDocumentType === "O03") {
      return true;
    }

    if (editDocumentType === "O01") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      const amount = parseFloat(amountString);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    if (!amountString || amountString.trim() === "") {
      return false;
    }

    const amount = parseFloat(amountString);
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
      const uploadPromises = uploadedDocuments.map((doc) =>
        uploadDocumentToAPI(doc)
      );
      const results = await Promise.all(uploadPromises);

      const failedUploads = results.filter((result) => !result.success);

      if (failedUploads.length > 0) {
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
          setTimeout(() => {
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
          }, 500);
        }
      );
    } catch (error) {
      console.error("Error during document upload:", error);
      hidePopup();
      showPopup(
        "Error",
        "An unexpected error occurred while uploading documents. Please try again.",
        "error"
      );
    }
  };

  const handleAddDocumentButton = async () => {
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

  const isEditAmountEditable = () => {
    return editDocumentType !== "O02" && editDocumentType !== "O03";
  };

  const getDocumentTypeLabel = (docId) => {
    const docType = documentTypes.find((type) => type.id === docId);
    return docType ? docType.label : docId;
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
        {/* Patient Info Display */}
        {patientData.patientName && (
          <View style={styles.patientInfoCard}>
            <Text style={styles.patientInfoTitle}>Patient Information</Text>
            <Text style={styles.patientName}>
              Name: {patientData.patientName}
            </Text>
            {patientData.illness && (
              <Text style={styles.patientIllness}>
                Illness: {patientData.illness}
              </Text>
            )}
          </View>
        )}

        {/* CLAIM AMOUNT DISPLAY */}
        {fromEditClaim && (
          <View style={styles.claimAmountCard}>
            <Text style={styles.claimAmountTitle}>Current Claim Amount</Text>
            <Text style={styles.claimAmountValue}>
              Rs {claimAmountLoading ? "Loading..." : actualClaimAmount}
            </Text>
            {parseFloat(actualClaimAmount) > 0 && (
              <Text style={styles.claimAmountNote}>
                Note: BILL document type is disabled because claim amount is greater than 0
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
          ) : selectedDocumentType === "O02" || selectedDocumentType === "O03" ? (
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
                ? "Amount is required and must be greater than 0 for Bill type"
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
                Allowed formats: JPG, JPEG, PNG only
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
          style={styles.addDocumentButton}
          onPress={handleAddDocumentButton}
        >
          <Text style={styles.addDocumentButtonText}>Add Document</Text>
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

      {/* Edit Document Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Document Details</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.editModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalBody}>
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Document Type</Text>
                <Text style={styles.editValue}>
                  {editDocumentType
                    ? editDocumentType.charAt(0).toUpperCase() +
                      editDocumentType.slice(1)
                    : "Unknown"}
                </Text>
              </View>

              <View style={styles.editSection}>
                <Text style={styles.editLabel}>
                  Amount{" "}
                  {editDocumentType === "bill" && (
                    <Text style={styles.requiredAsterisk}>*</Text>
                  )}
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    !isEditAmountEditable() && styles.editInputDisabled,
                  ]}
                  placeholder={isEditAmountEditable() ? "Enter amount" : "0.00"}
                  placeholderTextColor="#B0B0B0"
                  value={editAmount}
                  onChangeText={handleEditAmountChange}
                  keyboardType="decimal-pad"
                  editable={isEditAmountEditable()}
                />
                {editDocumentType === "prescription" ||
                editDocumentType === "diagnosis" ? (
                  <Text style={styles.editHelpText}>
                    Amount is automatically set to 0.00 for {editDocumentType}
                  </Text>
                ) : editDocumentType === "bill" ? (
                  <Text style={styles.editHelpText}>
                    Amount is required for Bill type
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editSaveButtonText}>Save Changes</Text>
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
        onClose={popup.onConfirm || hidePopup}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#16858D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6DD3D3',
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17ABB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
    color: "#FF6B6B",
    fontWeight: "500",
  },
  limitInfo: {
    color: "#00C4CC",
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
    color: "#FF6B6B",
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
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  helpText: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  errorText: {
    color: "#FF6B6B",
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
});

export default UploadDocuments;