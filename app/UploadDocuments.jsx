import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const UploadDocuments = ({ route }) => {
  const navigation = useNavigation();
  const patientData = route?.params?.patientData || {};

  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [amount, setAmount] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  
  // Image popup state
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Sample images with local image sources
  const [sampleImages] = useState([
    { 
      id: 1, 
      source: require('../assets/images/sample1.jpg'),
      description: 'Medical Bill Sample'
    },
    { 
      id: 2, 
      source: require('../assets/images/sample2.jpg'),
      description: 'Prescription Sample'
    },
    { 
      id: 3, 
      source: require('../assets/images/sample3.jpg'),
      description: 'Diagnosis Report Sample'
    },
  ]);

  useEffect(() => {
    console.log('Patient Data received:', patientData);
  }, [patientData]);

  const documentTypes = [
    { id: 'bill', label: 'Bill', icon: 'receipt-outline' },
    { id: 'prescription', label: 'Prescription', icon: 'medical-outline' },
    { id: 'diagnosis', label: 'Diagnosis', icon: 'document-text-outline' },
    { id: 'other', label: 'Other', icon: 'folder-outline' },
  ];

  const handleDocumentTypeSelect = (type) => {
    setSelectedDocumentType(type);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || documentDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDocumentDate(currentDate);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAmountChange = (text) => {
    // Remove any non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanedText.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Format the amount
    let formattedAmount = cleanedText;
    
    // If there's a decimal point, ensure only 2 decimal places
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        formattedAmount = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    setAmount(formattedAmount);
  };

  const validateAmount = (amountString) => {
    if (!amountString || amountString.trim() === '') {
      return false;
    }
    
    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount <= 0) {
      return false;
    }
    
    // Check if it has proper decimal format
    const decimalParts = amountString.split('.');
    if (decimalParts.length === 2 && decimalParts[1].length !== 2) {
      return false;
    }
    
    return true;
  };

  const formatAmountForDisplay = (amountString) => {
    if (!amountString) return '';
    
    const amount = parseFloat(amountString);
    if (isNaN(amount)) return amountString;
    
    return amount.toFixed(2);
  };

  const handleBrowseFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newDocument = {
          id: Date.now(),
          name: file.name,
          uri: file.uri,
          type: file.mimeType,
          size: file.size,
        };
        setUploadedDocuments(prev => [...prev, newDocument]);
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        const newDocument = {
          id: Date.now(),
          name: `Photo_${Date.now()}.jpg`,
          uri: photo.uri,
          type: 'image/jpeg',
          size: photo.fileSize || 0,
        };
        setUploadedDocuments(prev => [...prev, newDocument]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRemoveDocument = (documentId) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedDocuments(prev =>
              prev.filter(doc => doc.id !== documentId)
            );
          },
        },
      ]
    );
  };

  const handleAddDocument = () => {
    if (!selectedDocumentType) {
      Alert.alert('Validation Error', 'Please select a document type');
      return;
    }

    if (uploadedDocuments.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one document');
      return;
    }

    if (!validateAmount(amount)) {
      Alert.alert('Validation Error', 'Please enter a valid amount in format XX.XX (e.g., 100.00)');
      return;
    }

    const documentInfo = {
      patientData,
      documentType: selectedDocumentType,
      amount: formatAmountForDisplay(amount),
      documentDate: formatDate(documentDate),
      documents: uploadedDocuments,
    };

    console.log('Document submission data:', documentInfo);

    // Navigate to OnlineClaimIntimation1 page with the data
    navigation.navigate('OnlineClaimIntimation1', { 
      submittedData: documentInfo 
    });
  };

  const handleBackPress = () => {
    console.log('Back button pressed');
    try {
      navigation.goBack();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle image popup
  const handleImagePress = (image) => {
    setSelectedImage(image);
    setShowImagePopup(true);
  };

  const closeImagePopup = () => {
    setShowImagePopup(false);
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FAFAFA', '#6DD3D3']}
        style={[styles.gradient]}
      >
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
              <Text style={styles.patientName}>Name: {patientData.patientName}</Text>
              {patientData.illness && (
                <Text style={styles.patientIllness}>Illness: {patientData.illness}</Text>
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
                    selectedDocumentType === type.id && styles.documentTypeSelected,
                  ]}
                  onPress={() => handleDocumentTypeSelect(type.id)}
                >
                  <View style={styles.radioContainer}>
                    <View style={[
                      styles.radioButton,
                      selectedDocumentType === type.id && styles.radioButtonSelected,
                    ]}>
                      {selectedDocumentType === type.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.documentTypeText,
                      selectedDocumentType === type.id && styles.documentTypeTextSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={[
                styles.textInput,
                !validateAmount(amount) && amount !== '' && styles.textInputError
              ]}
              placeholder="Enter amount"
              placeholderTextColor="#B0B0B0"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
            />
            
          </View>

          {/* Sample Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sample Images</Text>
            <Text style={styles.sectionSubtitle}>Any document without "Submitted to SLICGL on [Date],[Policy No],[MemberID]" will be rejected by SLICGL</Text>
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
                      <Text style={styles.sampleImageDescription}>{image.description}</Text>
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
            <Text style={styles.sectionTitle}>Document</Text>
            <Text style={styles.sectionSubtitle}>Allowed formats: JPG, JPEG, TIFF, PNG</Text>

            <View style={styles.uploadContainer}>
              <View style={styles.uploadArea}>
                <Ionicons name="cloud-upload-outline" size={40} color="#00C4CC" />
                <Text style={styles.uploadText}>Upload your documents here</Text>

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

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <View style={styles.uploadedDocuments}>
                <Text style={styles.uploadedDocumentsTitle}>Uploaded Documents:</Text>
                {uploadedDocuments.map((doc) => (
                  <View key={doc.id} style={styles.documentItem}>
                    {doc.type?.startsWith('image/') && (
                      <Image source={{ uri: doc.uri }} style={styles.documentThumbnail} />
                    )}
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.documentSize}>
                        {formatFileSize(doc.size)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveDocument(doc.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

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
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeImagePopup}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
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
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black', 
  },
  gradient: {
    flex: 1,
    backgroundColor: '#6DD3D3',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
    borderRadius: 20, 
    minWidth: 34, 
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#13646D',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#13646D',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  patientIllness: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#13646D',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
  },
  documentTypeContainer: {
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00C4CC',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#00C4CC',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C4CC',
  },
  documentTypeText: {
    fontSize: 15,
    color: '#333',
  },
  documentTypeTextSelected: {
    color: '#00C4CC',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#13646D',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 15,
    color: '#333',
  },
  textInputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  datePickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 15,
    color: '#333',
  },
  sampleImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sampleImageCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sampleImageWrapper: {
    position: 'relative',
  },
  sampleImage: {
    width: '100%',
    height: 120,
  },
  sampleImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sampleImageName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  sampleImageDescription: {
    fontSize: 8,
    color: '#fff',
    opacity: 0.9,
    flex: 1,
  },
  expandIcon: {
    marginLeft: 5,
  },
  uploadContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 15,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  uploadButton: {
    backgroundColor: '#00C4CC',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadedDocuments: {
    marginTop: 20,
  },
  uploadedDocumentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#13646D',
    marginBottom: 10,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
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
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: '#888',
  },
  removeButton: {
    padding: 5,
  },
  addDocumentButton: {
    backgroundColor: '#00C4CC',
    borderRadius: 15,
    paddingVertical: 18,
    marginVertical: 30,
    shadowColor: '#00C4CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addDocumentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: screenHeight * 0.6,
    borderRadius: 10,
  },
  modalImageInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  modalImageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalImageSubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default UploadDocuments;