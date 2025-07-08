import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PendingRequirement1 = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Get requirement data from route params
  const params = useLocalSearchParams();
  const requiredDocuments = params?.requiredDocuments
    ? JSON.parse(params.requiredDocuments)
    : ['Prescription'];

  const requirementData = {
    claimNumber: params?.claimNumber || 'G/010/12334/525',
    requiredDocuments: requiredDocuments,
    requiredDate: params?.requiredDate || '12/05/2025',
    requirementId: params?.requirementId || '1'
  };

  const handleClose = () => {
    router.back();
  };

  const allowedFormats = ['JPG', 'JPEG', 'TIFF', 'PNG'];

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  const handleBrowseFiles = async () => {
    if (!selectedDocument) {
      Alert.alert('Select Document', 'Please select a required document first.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'],
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
        };
        setUploadedDocuments(prev => [...prev, newDocument]);
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleTakePhoto = async () => {
    if (!selectedDocument) {
      Alert.alert('Select Document', 'Please select a required document first.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
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
          name: `${selectedDocument}_${Date.now()}.jpg`,
          uri: photo.uri,
          type: 'image/jpeg',
          size: photo.fileSize || 0,
          documentType: selectedDocument,
        };
        setUploadedDocuments(prev => [...prev, newDocument]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleDeleteDocument = (documentId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
            Alert.alert('Deleted', 'Document deleted successfully!');
          }
        }
      ]
    );
  };

  const handleSubmit = () => {
    if (uploadedDocuments.length === 0) {
      Alert.alert('No Documents', 'Please upload at least one document before submitting.');
      return;
    }

    Alert.alert(
      'Submit Documents',
      `Are you sure you want to submit ${uploadedDocuments.length} document(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Submitted', 'Documents submitted successfully!', [
              { text: 'OK', onPress: handleClose }
            ]);
          }
        }
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
        <TouchableOpacity onPress={() => handleDeleteDocument(document.id)}>
          <Ionicons name="trash" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFFFFF', '#6DD3D3']}
        style={styles.container}
      >
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
              <Text style={styles.claimValue}>{requirementData.claimNumber}</Text>
            </View>
            <View style={styles.claimRow}>
              <Text style={styles.claimLabel}>Required Date</Text>
              <Text style={styles.claimColon}>:</Text>
              <Text style={styles.claimValue}>{requirementData.requiredDate}</Text>
            </View>
          </View>

          {/* Required Documents Section */}
          {/* <View style={styles.requiredDocumentsSection}>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            <View style={styles.requiredDocumentsBox}>
              {requirementData.requiredDocuments.map((doc, index) => (
                <View key={index} style={styles.requiredDocItem}>
                  <Text style={styles.requiredDocText}>• {doc}</Text>
                </View>
              ))}
            </View>
          </View> */}


          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>Document Upload</Text>


            {/* Document Selection Dropdown */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Select Required Document:</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsDropdownOpen(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedDocument || 'Choose document type...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#00ADBB" />
              </TouchableOpacity>
            </View>
            <Text style={styles.allowedFormats}>Allowed formats: {allowedFormats.join(', ')}</Text>

            <View style={styles.uploadArea}>
              <View style={styles.uploadIcon}>
                <Ionicons name="cloud-upload-outline" size={40} color="#00ADBB" />
              </View>

              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadButton} onPress={handleBrowseFiles}>
                  <Text style={styles.uploadButtonText}>Browse files</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
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
                uploadedDocuments.map((doc, i) => renderUploadedDocument(doc, i))
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No documents uploaded yet</Text>
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
              {requirementData.requiredDocuments.map((doc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedDocument(doc);
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
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15, 
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00ADBB',
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: '#00ADBB',
    fontWeight: '500',
    width: 120,
  },
  claimColon: {
    marginHorizontal: 5,
    fontSize: 14,
    color: '#13646D',
  },
  claimValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#13646D',
    flex: 1,
  },
  requiredDocumentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#13646D',
    marginBottom: 10,
  },
  requiredDocumentsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#00ADBB',
  },
  requiredDocItem: {
    marginBottom: 5,
  },
  requiredDocText: {
    fontSize: 14,
    color: '#13646D',
    fontWeight: '500',
  },
  documentSection: {
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#13646D',
    marginBottom: 5,
  },
  allowedFormats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#13646D',
    fontWeight: '500',
    marginBottom: 5,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00ADBB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    color: '#13646D',
    flex: 1,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#00ADBB',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  uploadIcon: { marginBottom: 15 },
  uploadButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#00ADBB',
  },
  uploadButtonText: {
    color: '#00ADBB',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadedSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  uploadedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#13646D',
    marginBottom: 15,
  },
  documentsTable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00ADBB',
  },
  headerDescriptionCell: {
    flex: 2,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#FFFFFF',
  },
  headerImageCell: {
    flex: 2,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#FFFFFF',
  },
  headerDeleteCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  headerCellText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  documentRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  documentDescriptionCell: {
    flex: 2,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  documentImageCell: {
    flex: 2,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  documentDeleteCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentCellText: {
    color: '#13646D',
    fontSize: 12,
    textAlign: 'center',
  },
  documentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  emptyRow: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#00ADBB',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    minWidth: 250,
    maxWidth: 300,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#13646D',
    textAlign: 'center',
  },
  // New styles for image modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: width * 0.9,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

export default PendingRequirement1;