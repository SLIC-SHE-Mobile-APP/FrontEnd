import { Ionicons } from '@expo/vector-icons';
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
} from 'react-native';

const UploadDocuments = ({ route, navigation }) => {
  // Get patient data from navigation params
  const patientData = route?.params?.patientData || {};

  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [amount, setAmount] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [sampleImages] = useState([
    { id: 1, uri: null, placeholder: true },
    { id: 2, uri: null, placeholder: true },
    { id: 3, uri: null, placeholder: true },
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
      // Request camera permissions
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
        Alert.alert('Success', 'Photo captured successfully!');
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

    const documentInfo = {
      patientData,
      documentType: selectedDocumentType,
      amount: amount.trim(),
      documentDate: documentDate.trim(),
      documents: uploadedDocuments,
    };

    console.log('Document submission data:', documentInfo);

    Alert.alert(
      'Success',
      'Documents added successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to next screen or go back
            if (navigation) {
              navigation.goBack(); // or navigate to next screen
            }
          },
        },
      ]
    );
  };

  const handleBackPress = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <LinearGradient
      colors={['#6DD3D3', '#FAFAFA']}
      style={[styles.gradient]}
    >
      <View style={styles.container}>
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

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter amount"
              placeholderTextColor="#B0B0B0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Document Date Input */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Document Date</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter document date (DD/MM/YYYY)"
              placeholderTextColor="#B0B0B0"
              value={documentDate}
              onChangeText={setDocumentDate}
            />
          </View>

          {/* Sample Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sample Images</Text>
            <Text style={styles.sectionSubtitle}>Only support JPG, JPEG, TIFF and PNG</Text>
            <View style={styles.sampleImagesContainer}>
              {sampleImages.map((image) => (
                <View key={image.id} style={styles.sampleImageCard}>
                  <View style={styles.sampleImagePlaceholder}>
                    <Ionicons name="image-outline" size={30} color="#B0B0B0" />
                  </View>
                </View>
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
      </View>
    </LinearGradient >
  );
};

const styles = StyleSheet.create({

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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 5,
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
  sampleImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sampleImageCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  sampleImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    borderStyle: 'dashed',
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
});

export default UploadDocuments;
