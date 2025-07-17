import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const UploadDocuments = ({ route }) => {
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


  // Sample images with local image sources
  const [sampleImages] = useState([
    {
      id: 1,
      source: require("../assets/images/sample1.jpg"),
      description: "Prescription Sample",
    },
    {
      id: 2,
      source: require("../assets/images/sample2.jpg"),
      description: "Medical Bill Sample",
    },
    {
      id: 3,
      source: require("../assets/images/sample3.jpg"),
      description: "Diagnosis Report Sample",
    },
  ]);

  const documentTypes = [
    { id: "bill", label: "Bill", icon: "receipt-outline" },
    { id: "prescription", label: "Prescription", icon: "medical-outline" },
    { id: "diagnosis", label: "Diagnosis", icon: "document-text-outline" },
    { id: "other", label: "Other", icon: "folder-outline" },
  ];

  const handleDocumentTypeSelect = (type) => {
    setSelectedDocumentType(type);

    // Set amount based on document type
    if (type === "prescription" || type === "diagnosis") {
      setAmount("0.00");
    } else if (type === "bill") {
      setAmount(""); // Clear amount for bill type so user can enter
    } else {
      setAmount(""); // Clear for other types
    }

    // Don't clear uploaded documents when switching document types
    // setUploadedDocuments([]);
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
    // If document type is prescription or diagnosis, don't allow editing
    if (
      selectedDocumentType === "prescription" ||
      selectedDocumentType === "diagnosis"
    ) {
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

    setAmount(formattedAmount);
  };

  const handleEditAmountChange = (text) => {
    // If document type is prescription or diagnosis, don't allow editing
    if (
      editDocumentType === "prescription" ||
      editDocumentType === "diagnosis"
    ) {
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

    setEditAmount(formattedAmount);
  };

  const validateAmount = (amountString) => {
    // For prescription and diagnosis, 0.00 is valid
    if (
      selectedDocumentType === "prescription" ||
      selectedDocumentType === "diagnosis"
    ) {
      return true;
    }

    // For bill type, amount must be greater than 0
    if (selectedDocumentType === "bill") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      const amount = parseFloat(amountString);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    // For other types, any valid number is acceptable
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

  // FIXED: Check if maximum documents reached based on document type
  const canAddMoreDocuments = () => {
    if (selectedDocumentType === "bill") {
      // Count only bill-type documents
      const billDocuments = uploadedDocuments.filter(
        (doc) => doc.documentType === "bill"
      );
      return billDocuments.length < 1; // Only 1 bill document allowed
    }
    return true; // No limit for other document types
  };

  const handleBrowseFiles = async () => {
    // Add validation for document type
    if (!selectedDocumentType) {
      Alert.alert("Validation Error", "Please select a document type first");
      return;
    }

    // Add validation for bill amount
    if (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0)) {
      Alert.alert("Validation Error", "Please enter a valid amount greater than 0 for Bill type");
      return;
    }

    if (!canAddMoreDocuments()) {
      Alert.alert(
        "Document Limit",
        "You can only upload 1 document for Bill type."
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Generate custom name based on document type
        const fileExtension = file.name.split(".").pop();
        const customName = selectedDocumentType
          ? `${selectedDocumentType.charAt(0).toUpperCase() +
          selectedDocumentType.slice(1)
          }.${fileExtension}`
          : file.name;

        const newDocument = {
          id: Date.now(),
          name: customName,
          uri: file.uri,
          type: file.mimeType,
          size: file.size,
          documentType: selectedDocumentType,
          amount: formatAmountForDisplay(amount),
          date: formatDate(documentDate),
        };
        setUploadedDocuments((prev) => [...prev, newDocument]);

        // Reset form after successful upload
        setSelectedDocumentType("");
        setAmount("");
        setDocumentDate(new Date());

        Alert.alert("Success", "Document uploaded successfully!");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleTakePhoto = async () => {
    // Add validation for document type
    if (!selectedDocumentType) {
      Alert.alert("Validation Error", "Please select a document type first");
      return;
    }

    // Add validation for bill amount
    if (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0)) {
      Alert.alert("Validation Error", "Please enter a valid amount greater than 0 for Bill type");
      return;
    }

    if (!canAddMoreDocuments()) {
      Alert.alert(
        "Document Limit",
        "You can only upload 1 document for Bill type."
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos"
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

        // Generate custom name based on document type
        const customName = selectedDocumentType
          ? `${selectedDocumentType.charAt(0).toUpperCase() +
          selectedDocumentType.slice(1)
          }.jpg`
          : `Photo_${Date.now()}.jpg`;

        const newDocument = {
          id: Date.now(),
          name: customName,
          uri: photo.uri,
          type: "image/jpeg",
          size: photo.fileSize || 0,
          documentType: selectedDocumentType,
          amount: formatAmountForDisplay(amount),
          date: formatDate(documentDate),
        };
        setUploadedDocuments((prev) => [...prev, newDocument]);

        // Reset form after successful upload
        setSelectedDocumentType("");
        setAmount("");
        setDocumentDate(new Date());
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };


  const handleRemoveDocument = (documentId) => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setUploadedDocuments((prev) =>
              prev.filter((doc) => doc.id !== documentId)
            );
            Alert.alert("Success", "Document deleted successfully.");
          },
        },
      ]
    );
  };

  const handleSaveEdit = () => {
    if (!validateEditAmount(editAmount)) {
      if (editDocumentType === "bill") {
        Alert.alert(
          "Validation Error",
          "Please enter a valid amount greater than 0 for Bill type"
        );
      } else {
        Alert.alert("Validation Error", "Please enter a valid amount");
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
    Alert.alert("Success", "Document details updated successfully.");
  };

  const validateEditAmount = (amountString) => {
    // For prescription and diagnosis, 0.00 is valid
    if (
      editDocumentType === "prescription" ||
      editDocumentType === "diagnosis"
    ) {
      return true;
    }

    // For bill type, amount must be greater than 0
    if (editDocumentType === "bill") {
      if (!amountString || amountString.trim() === "") {
        return false;
      }

      const amount = parseFloat(amountString);
      if (isNaN(amount) || amount <= 0) {
        return false;
      }

      return true;
    }

    // For other types, any valid number is acceptable
    if (!amountString || amountString.trim() === "") {
      return false;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount < 0) {
      return false;
    }

    return true;
  };


  const handleAddDocument = async () => {
    if (uploadedDocuments.length === 0) {
      Alert.alert("Validation Error", "Please upload at least one document");
      return;
    }

    const invalidDocuments = uploadedDocuments.filter(doc => {
      if (!doc.documentType) {
        return true;
      }

      if (doc.documentType === "bill") {
        const amount = parseFloat(doc.amount);
        if (isNaN(amount) || amount <= 0) {
          return true;
        }
      }

      return false;
    });

    if (invalidDocuments.length > 0) {
      Alert.alert(
        "Validation Error",
        "Some uploaded documents have invalid information. Please check and re-upload if necessary."
      );
      return;
    }

    // Create document info from uploaded documents
    const documentInfo = {
      patientData,
      documents: uploadedDocuments,
    };

    console.log("Document submission data:", documentInfo);

    try {
      // Show success alert and navigate on OK
      Alert.alert("Success", "Document submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("EditClaimIntimation1", {
              submittedData: documentInfo,
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting document:", error);
      Alert.alert("Error", "Failed to submit document. Please try again.");
    }
  };

  const handleBackPress = () => {
    console.log("Back button pressed");
    try {
      navigation.goBack();
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Handle image popup
  const handleImagePress = (image) => {
    setSelectedImage(image);
    setShowImagePopup(true);
  };

  // Handle document image popup
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

  // FIXED: Get upload instruction text based on document type
  const getUploadInstructionText = () => {
    if (selectedDocumentType === "bill") {
      const billDocuments = uploadedDocuments.filter(
        (doc) => doc.documentType === "bill"
      );
      return `You can upload only 1 document for Bill type (${billDocuments.length}/1 uploaded)`;
    }
    const currentTypeDocuments = uploadedDocuments.filter(
      (doc) => doc.documentType === selectedDocumentType
    );
    return `You can upload multiple documents for this type (${currentTypeDocuments.length} uploaded)`;
  };

  // Check if amount field should be editable
  const isAmountEditable = () => {
    return (
      selectedDocumentType !== "prescription" &&
      selectedDocumentType !== "diagnosis"
    );
  };

  const isEditAmountEditable = () => {
    return (
      editDocumentType !== "prescription" && editDocumentType !== "diagnosis"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#FAFAFA", "#6DD3D3"]} style={[styles.gradient]}>
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

          {/* Document Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Type</Text>
            <View style={styles.documentTypeContainer}>
              {documentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.documentTypeOption,
                    selectedDocumentType === type.id &&
                    styles.documentTypeSelected,
                  ]}
                  onPress={() => handleDocumentTypeSelect(type.id)}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedDocumentType === type.id &&
                        styles.radioButtonSelected,
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
                      ]}
                    >
                      {type.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>
              Amount{" "}
              {selectedDocumentType === "bill" && (
                <Text style={styles.requiredAsterisk}>*</Text>
              )}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                !isAmountEditable() && styles.textInputDisabled,
                selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0) && styles.textInputError,
              ]}
              placeholder={isAmountEditable() ? "Enter amount" : "0.00"}
              placeholderTextColor="#B0B0B0"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              editable={isAmountEditable()}
            />
            {selectedDocumentType === "prescription" ||
              selectedDocumentType === "diagnosis" ? (
              <Text style={styles.helpText}>
                Amount is automatically set to 0.00 for {selectedDocumentType}
              </Text>
            ) : selectedDocumentType === "bill" ? (
              <Text style={[styles.helpText, (!amount || amount.trim() === "" || parseFloat(amount) <= 0) && styles.errorText]}>
                {(!amount || amount.trim() === "" || parseFloat(amount) <= 0)
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
                maximumDate={new Date()} // Prevent future dates
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
                        <Ionicons
                          name="expand-outline"
                          size={16}
                          color="#fff"
                        />
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
                  Allowed formats: JPG, JPEG, TIFF, PNG
                </Text>

                {/* Upload instruction based on document type */}
                <Text
                  style={[
                    styles.sectionSubtitle,
                    selectedDocumentType === "bill"
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
                            (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0))) &&
                          styles.uploadButtonDisabled,
                        ]}
                        onPress={handleBrowseFiles}
                        disabled={!canAddMoreDocuments() ||
                          (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0))}
                      >
                        <Text
                          style={[
                            styles.uploadButtonText,
                            (!canAddMoreDocuments() ||
                              (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0))) &&
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
                            (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0))) &&
                          styles.uploadButtonDisabled,
                        ]}
                        onPress={handleTakePhoto}
                        disabled={!canAddMoreDocuments() ||
                          (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0))}
                      >
                        <Text
                          style={[
                            styles.uploadButtonText,
                            (!canAddMoreDocuments() ||
                              (selectedDocumentType === "bill" && (!amount || amount.trim() === "" || parseFloat(amount) <= 0))) &&
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

          {/* Uploaded Documents List - Show after document type selection */}
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
                        Type: {doc.documentType ? doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1) : 'Unknown'}
                      </Text>
                      <Text style={styles.documentAmount}>
                        Rs {doc.amount || "0.00"}
                      </Text>
                      <Text style={styles.documentDate}>Date: {doc.date}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={() => handleRemoveDocument(doc.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={28}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Add Document Button */}
          <TouchableOpacity
            style={styles.addDocumentButton}
            onPress={handleAddDocument}
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
                    placeholder={
                      isEditAmountEditable() ? "Enter amount" : "0.00"
                    }
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
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
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
  documentSize: {
    fontSize: 12,
    color: "#888",
  },
  removeButton: {
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
});

export default UploadDocuments;
