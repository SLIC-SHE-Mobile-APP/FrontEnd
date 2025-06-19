import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const PendingRequirement = ({ onClose }) => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const pendingData = {
    claimNumber: 'G/010/12334/525',
    requiredDocument: 'Prescription'
  };

  const allowedFormats = ['JPG', 'JPEG', 'TIFF', 'PNG'];

  const handleBrowseFiles = async () => {
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
        };
        setUploadedDocuments(prev => [...prev, newDocument]);
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const photo = result.assets[0];
      const newDocument = {
        id: Date.now().toString(),
        name: `Photo_${Date.now()}.jpg`,
        uri: photo.uri,
        type: 'image/jpeg',
        size: photo.fileSize || 0,
      };
      setUploadedDocuments(prev => [...prev, newDocument]);
      Alert.alert('Success', 'Photo captured successfully!');
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
              { text: 'OK', onPress: onClose }
            ]);
          }
        }
      ]
    );
  };

  const renderUploadedDocument = (document, index) => (
    <View key={document.id} style={styles.documentRow}>
      <View style={styles.documentCell}>
        <Text style={styles.documentCellText}>{index + 1}</Text>
      </View>
      <View style={styles.documentCell}>
        <TouchableOpacity onPress={() => handleDeleteDocument(document.id)}>
          <Ionicons name="trash" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>
      <View style={styles.documentCell}>
        <Text style={styles.documentCellText} numberOfLines={1}>
          {document.name}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{ flex: 1, borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Pending Requirement</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* ScrollView with content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Claim Info */}
        <View style={styles.claimCard}>
          <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>Claim Number</Text>
            <Text style={styles.claimColon}>:</Text>
            <Text style={styles.claimValue}>{pendingData.claimNumber}</Text>
          </View>
          <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>Required Document</Text>
            <Text style={styles.claimColon}>:</Text>
            <Text style={styles.claimValue}>{pendingData.requiredDocument}</Text>
          </View>
        </View>

        {/* Upload UI */}
        <View style={styles.documentSection}>
          <Text style={styles.documentTitle}>Document</Text>
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

          <TouchableOpacity style={styles.addDocumentButton} onPress={handleBrowseFiles}>
            <Text style={styles.addDocumentButtonText}>Add Document</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded Documents Table */}
        <View style={styles.uploadedSection}>
          <Text style={styles.uploadedTitle}>Uploaded Documents</Text>
          <View style={styles.documentsTable}>
            <View style={styles.tableHeader}>
              <View style={styles.headerCell}><Text style={styles.headerCellText}>Seq No</Text></View>
              <View style={styles.headerCell}><Text style={styles.headerCellText}>Delete</Text></View>
              <View style={styles.headerCell}><Text style={styles.headerCellText}>Image</Text></View>
            </View>

            {uploadedDocuments.length > 0 ? (
              uploadedDocuments.map((doc, i) => renderUploadedDocument(doc, i))
            ) : (
              <View style={styles.emptyRow}><Text style={styles.emptyText}>No documents uploaded yet</Text></View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'left',
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  claimCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
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
  addDocumentButton: {
    backgroundColor: '#00ADBB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addDocumentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  headerCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#FFFFFF',
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
  },
  documentCell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  documentCellText: {
    color: '#13646D',
    fontSize: 12,
    textAlign: 'center',
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
});

export default PendingRequirement;
