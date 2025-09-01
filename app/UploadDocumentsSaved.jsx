import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
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
              onPress={() => {
                if (showConfirmButton) {
                  // This is the "Cancel" button - just close the popup
                  onClose();
                } else {
                  // This is the single "OK" button - call onConfirm if it exists, otherwise onClose
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
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
                {showConfirmButton ? "Cancel" : "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const UploadDocumentsSaved = ({ route }) => {
  const navigation = useNavigation();
  const {
    memberNo = "",
    policyNo = "",
    patientData: initialPatientData = {},
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
  const [storedClaimNo, setStoredClaimNo] = useState("");
  const [storedNic, setStoredNic] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [storedDocAmount, setStoredDocAmount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documentDateRange, setDocumentDateRange] = useState(null);

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
      description: "Medical bill sample",
    },
    {
      id: 2,
      source: require("../assets/images/sample2.jpg"),
      description: "Prescription sample",
    },
    {
      id: 3,
      source: require("../assets/images/sample3.jpg"),
      description: "Diagnosis report sample",
    },
  ]);

  // Helper function to format amount with commas
  const formatAmountWithCommas = (amountString) => {
    if (!amountString || amountString === "") return "";

    const amount = parseFloat(amountString);
    if (isNaN(amount)) return amountString;

    // Format with commas and 2 decimal places
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper function to parse amount from comma-formatted string
  const parseAmountFromCommas = (displayAmount) => {
    if (!displayAmount || displayAmount === "") return "";

    // Remove commas and return the numeric string
    return displayAmount.replace(/,/g, "");
  };

  // Helper function to format amount input as user types
  const formatAmountInput = (text) => {
    // Remove all non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.]/g, "");

    if (cleanText === "") return "";

    const parts = cleanText.split(".");
    if (parts.length > 2) return text; // Invalid input

    // Format the integer part with commas
    const integerPart = parts[0];
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Return with decimal part if exists
    if (parts.length === 2) {
      const decimalPart = parts[1].substring(0, 2); // Limit to 2 decimal places
      return formattedInteger + "." + decimalPart;
    }

    return formattedInteger;
  };

  // Helper function to convert document type to sentence case
  const toSentenceCase = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

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
          label: toSentenceCase(doc.docDesc),
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
          { id: "O01", label: "Bill", icon: "receipt-outline" },
          { id: "O02", label: "Prescription", icon: "medical-outline" },
          { id: "O03", label: "Diagnosis card", icon: "document-text-outline" },
          { id: "O04", label: "Other", icon: "folder-outline" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    const calculateDateRange = async () => {
      const dateRange = await getDocumentDateRange();
      setDocumentDateRange(dateRange);

      // Set initial document date to max allowed date
      if (dateRange.maxDate) {
        setDocumentDate(dateRange.maxDate);
      }

      console.log("Document date range calculated:", {
        minDate: dateRange.minDate?.toDateString(),
        maxDate: dateRange.maxDate?.toDateString(),
        isPolicyExpired: dateRange.isPolicyExpired,
        policyEndDate: dateRange.policyEndDate?.toDateString(),
      });
    };

    calculateDateRange();
  }, []);

  useEffect(() => {
    const loadStoredValues = async () => {
      try {
        const claimNo = await SecureStore.getItemAsync("referenNo");
        const nic = await SecureStore.getItemAsync("user_nic");
        const docamount = await SecureStore.getItemAsync(
          "edit_beneficiary_amount"
        );

        setStoredClaimNo(claimNo || "");
        setStoredNic(nic || "");
        const parsedDocAmount = parseFloat(docamount) || 0;
        setStoredDocAmount(parsedDocAmount);

        console.log("Loaded stored values:", {
          claimNo,
          nic,
          docamount,
          parsedDocAmount,
        });
      } catch (error) {
        console.error("Error loading stored values:", error);
      }
    };

    loadStoredValues();
  }, []);

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

    formData.append("ClmSeqNo", storedClaimNo);
    formData.append("DocType", document.documentType);
    formData.append("ImgName", fileName);
    formData.append(
      "DocDate",
      formatDateForAPI(new Date(document.date.split("/").reverse().join("-")))
    );
    // Convert back from comma format to regular number for API
    const regularAmount = parseAmountFromCommas(document.amount);
    formData.append("DocAmount", regularAmount);
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

  const handleDocumentTypeSelect = (type) => {
    if (type === "O01" && storedDocAmount > 0) {
      showPopup(
        "Document Type Unavailable",
        "Bill type is not available when there is an existing document amount.",
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

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || documentDate;
    setShowDatePicker(Platform.OS === "ios");

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

    // Format the input with commas as user types
    const formattedText = formatAmountInput(text);
    setAmount(formattedText);
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

    // Format the input with commas as user types
    const formattedText = formatAmountInput(text);
    setEditAmount(formattedText);
  };

  const validateAmount = (amountString) => {
    if (selectedDocumentType === "O02" || selectedDocumentType === "O03") {
      return true;
    }

    if (selectedDocumentType === "O01") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      // Parse amount from comma-formatted string
      const cleanAmount = parseAmountFromCommas(amountString);
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    if (!amountString || amountString.trim() === "") {
      return false;
    }

    // Parse amount from comma-formatted string
    const cleanAmount = parseAmountFromCommas(amountString);
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount < 0) {
      return false;
    }

    return true;
  };

  const formatAmountForDisplay = (amountString) => {
    if (!amountString) return "";

    // If it's already formatted with commas, return as is
    if (amountString.includes(",")) {
      return amountString;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount)) return amountString;

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
      (!amount ||
        amount.trim() === "" ||
        parseFloat(parseAmountFromCommas(amount)) <= 0)
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

        showPopup("Success", "Document uploaded successfully!", "success");
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
      (!amount ||
        amount.trim() === "" ||
        parseFloat(parseAmountFromCommas(amount)) <= 0)
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
      "Any document without Submitted to SLICGL on [Date],[Policy No],[MemberID] will be rejected by SLICGL",
      "info",
      true, // showConfirmButton = true
      async () => {
        // This function only runs when "Confirm" is clicked
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

      // Parse amount from comma-formatted string
      const cleanAmount = parseAmountFromCommas(amountString);
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    if (!amountString || amountString.trim() === "") {
      return false;
    }

    // Parse amount from comma-formatted string
    const cleanAmount = parseAmountFromCommas(amountString);
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

    if (!storedClaimNo || !storedNic) {
      showPopup(
        "Error",
        "Missing required information. Please ensure you have a valid claim number and user identification.",
        "error"
      );
      return;
    }

    const invalidDocuments = uploadedDocuments.filter((doc) => {
      if (!doc.documentType) {
        return true;
      }

      if (doc.documentType === "O01") {
        // Convert from comma format back to regular number for validation
        const regularAmount = parseAmountFromCommas(doc.amount);
        const amount = parseFloat(regularAmount);
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

      const documentInfo = {
        patientData,
        documents: uploadedDocuments,
        uploadResults: results,
      };

      console.log("All documents uploaded successfully:", documentInfo);

      hidePopup();
      showPopup(
        "Success",
        "All documents uploaded successfully!",
        "success",
        false,
        () => {
          hidePopup();
          // Navigate immediately without setTimeout
          navigation.setParams({ fromUploadDocuments: true });
          navigation.goBack();
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

  const handleBackPress = React.useCallback(() => {
    console.log("Back button pressed");
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    } catch (error) {
      console.error("Navigation error:", error);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  }, [navigation]);

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
        maxDate: currentDate,
        isPolicyExpired: false,
      };
    }
  };

  // Updated help text function
  const getDatePickerHelpText = () => {
    if (!documentDateRange) return "Loading date range...";

    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    if (documentDateRange.isPolicyExpired) {
      return `Policy expired on ${formatDate(
        documentDateRange.policyEndDate
      )}. You can only select document dates within 90 days before the policy expiry date: ${formatDate(
        documentDateRange.minDate
      )} to ${formatDate(documentDateRange.maxDate)}`;
    } else {
      return `You can select document dates from the last 90 days: ${formatDate(
        documentDateRange.minDate
      )} to ${formatDate(documentDateRange.maxDate)}`;
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
    return docType ? docType.label : toSentenceCase(docId);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={[styles.gradient]}>
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
        {(patientData.patientName || storedClaimNo) && (
          <View style={styles.patientInfoCard}>
            <Text style={styles.patientInfoTitle}>Patient Information</Text>
            {storedClaimNo && (
              <Text style={styles.patientClaimNo}>
                Claim No: {storedClaimNo}
              </Text>
            )}
            {patientData.patientName && (
              <Text style={styles.patientName}>
                Name: {patientData.patientName}
              </Text>
            )}
            {patientData.illness && (
              <Text style={styles.patientIllness}>
                Illness: {patientData.illness}
              </Text>
            )}
          </View>
        )}
        {/* Document Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Type</Text>
          <View style={styles.documentTypeContainer}>
            {documentTypes.map((type) => {
              const isDisabled = type.id === "O01" && storedDocAmount > 0;

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
                (!amount ||
                  amount.trim() === "" ||
                  parseFloat(parseAmountFromCommas(amount)) <= 0) &&
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
                (!amount ||
                  amount.trim() === "" ||
                  parseFloat(parseAmountFromCommas(amount)) <= 0) &&
                  styles.errorText,
              ]}
            >
              {!amount ||
              amount.trim() === "" ||
              parseFloat(parseAmountFromCommas(amount)) <= 0
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

          {/* Help text showing allowed date range */}
          <Text style={styles.helpText}>{getDatePickerHelpText()}</Text>

          {showDatePicker && documentDateRange && (
            <DateTimePicker
              testID="dateTimePicker"
              value={documentDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleDateChange}
              minimumDate={documentDateRange.minDate}
              maximumDate={documentDateRange.maxDate}
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
                              parseFloat(parseAmountFromCommas(amount)) <=
                                0))) &&
                          styles.uploadButtonDisabled,
                      ]}
                      onPress={handleBrowseFiles}
                      disabled={
                        !canAddMoreDocuments() ||
                        (selectedDocumentType === "O01" &&
                          (!amount ||
                            amount.trim() === "" ||
                            parseFloat(parseAmountFromCommas(amount)) <= 0))
                      }
                    >
                      <Text
                        style={[
                          styles.uploadButtonText,
                          (!canAddMoreDocuments() ||
                            (selectedDocumentType === "O01" &&
                              (!amount ||
                                amount.trim() === "" ||
                                parseFloat(parseAmountFromCommas(amount)) <=
                                  0))) &&
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
                              parseFloat(parseAmountFromCommas(amount)) <=
                                0))) &&
                          styles.uploadButtonDisabled,
                      ]}
                      onPress={handleTakePhoto}
                      disabled={
                        !canAddMoreDocuments() ||
                        (selectedDocumentType === "O01" &&
                          (!amount ||
                            amount.trim() === "" ||
                            parseFloat(parseAmountFromCommas(amount)) <= 0))
                      }
                    >
                      <Text
                        style={[
                          styles.uploadButtonText,
                          (!canAddMoreDocuments() ||
                            (selectedDocumentType === "O01" &&
                              (!amount ||
                                amount.trim() === "" ||
                                parseFloat(parseAmountFromCommas(amount)) <=
                                  0))) &&
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
          onPress={handleAddDocument}
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
                    ? getDocumentTypeLabel(editDocumentType)
                    : "Unknown"}
                </Text>
              </View>

              <View style={styles.editSection}>
                <Text style={styles.editLabel}>
                  Amount{" "}
                  {editDocumentType === "O01" && (
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
                {editDocumentType === "O02" || editDocumentType === "O03" ? (
                  <Text style={styles.editHelpText}>
                    Amount is automatically set to 0.00 for{" "}
                    {getDocumentTypeLabel(editDocumentType)}
                  </Text>
                ) : editDocumentType === "O01" ? (
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
        onClose={hidePopup}
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
  sampleImageName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
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
  uploadedDocumentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#13646D",
    marginBottom: 10,
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
  documentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
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
  documentSize: {
    fontSize: 12,
    color: "#888",
  },
  removeButton: {
    padding: 5,
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
  modalCloseButton: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
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
});

export default UploadDocumentsSaved;
