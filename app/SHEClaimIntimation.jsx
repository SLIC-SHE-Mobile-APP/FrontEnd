import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SHEClaimIntimation = ({ route, navigation }) => {
  // Get document data from navigation params
  const documentData = route?.params?.documentData || null;
  
  const [claimData] = useState({
    referenceNo: 'M000427',
    enteredBy: 'Member',
    status: 'Submission for Approval Pending',
    claimType: 'Out-door',
    createdOn: '24-12-2020',
  });

  const [beneficiaryData] = useState({
    name: 'H.M.M.K Herath',
    relationship: '1.00',
    illness: 'RR',
    amount: '1.00',
  });

  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  useEffect(() => {
    if (documentData) {
      console.log('Document Data received:', documentData);
      // Map the received document data to the format needed for this page
      const mappedDocuments = documentData.documents?.map(doc => ({
        id: doc.id,
        documentType: getDocumentTypeLabel(documentData.documentType),
        dateOfDocument: documentData.documentDate || '06/07/2025',
        amount: documentData.amount || '2.00',
        uri: doc.uri,
        name: doc.name,
        type: doc.type,
      })) || [];
      
      setUploadedDocuments(mappedDocuments);
    }
  }, [documentData]);

  const getDocumentTypeLabel = (type) => {
    const typeMap = {
      'bill': 'Bill',
      'prescription': 'Prescription',
      'diagnosis': 'Diagnosis Card',
      'other': 'Other Document',
    };
    return typeMap[type] || 'Document';
  };

  const handleBackPress = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleAddDocument = () => {
    // Navigate to UploadDocuments page
    if (navigation) {
      navigation.navigate('UploadDocuments', {
        patientData: {
          patientName: beneficiaryData.name,
          illness: beneficiaryData.illness,
        },
      });
    }
  };

  const handleViewDocument = (document) => {
    if (document.type?.startsWith('image/')) {
      // Handle image viewing - you can implement a modal or navigate to image viewer
      Alert.alert('View Document', `Viewing ${document.name}`);
    } else {
      Alert.alert('View Document', `Opening ${document.name}`);
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
            setUploadedDocuments(prev => 
              prev.filter(doc => doc.id !== documentId)
            );
          },
        },
      ]
    );
  };

  const handleEditDocument = (document) => {
    // Navigate back to UploadDocuments with existing document data for editing
    if (navigation) {
      navigation.navigate('UploadDocuments', {
        patientData: {
          patientName: beneficiaryData.name,
          illness: beneficiaryData.illness,
        },
        editDocument: document,
      });
    }
  };

  const handleSubmitClaim = () => {
    if (uploadedDocuments.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one document before submitting the claim.');
      return;
    }

    Alert.alert(
      'Submit Claim',
      'Are you sure you want to submit this claim?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            // Handle claim submission logic here
            console.log('Submitting claim with documents:', uploadedDocuments);
            Alert.alert('Success', 'Claim submitted successfully!');
          },
        },
      ]
    );
  };

  const handleSubmitLater = () => {
    Alert.alert('Save Draft', 'Claim saved as draft. You can submit it later.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#13646D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHE Claim Intimation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Claim Information Card */}
        <View style={styles.claimInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference No.</Text>
            <Text style={styles.infoValue}>{claimData.referenceNo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entered By</Text>
            <Text style={styles.infoValue}>{claimData.enteredBy}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{claimData.status}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Claim Type</Text>
            <Text style={styles.infoValue}>{claimData.claimType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created on</Text>
            <Text style={styles.infoValue}>{claimData.createdOn}</Text>
          </View>
        </View>

        {/* Beneficiaries Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beneficiaries for Claim</Text>
          
          <View style={styles.beneficiaryCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{beneficiaryData.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Relationship</Text>
              <Text style={styles.infoValue}>{beneficiaryData.relationship}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Illness</Text>
              <Text style={styles.infoValue}>{beneficiaryData.illness}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>{beneficiaryData.amount}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleAddDocument}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="person-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Documents Section */}
        {uploadedDocuments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
            
            {uploadedDocuments.map((document) => (
              <View key={document.id} style={styles.documentCard}>
                <View style={styles.documentInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Document Type</Text>
                    <Text style={styles.infoValue}>{document.documentType}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date of Document</Text>
                    <Text style={styles.infoValue}>{document.dateOfDocument}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Amount</Text>
                    <Text style={styles.infoValue}>{document.amount}</Text>
                  </View>
                </View>

                {/* Document Action Buttons */}
                <View style={styles.documentActions}>
                  <TouchableOpacity 
                    style={styles.documentActionButton}
                    onPress={() => handleViewDocument(document)}
                  >
                    <Ionicons name="eye-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.documentActionButton}
                    onPress={() => handleDeleteDocument(document.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Document Button for empty state */}
        {uploadedDocuments.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <TouchableOpacity 
              style={styles.addDocumentEmptyButton}
              onPress={handleAddDocument}
            >
              <Ionicons name="add-circle-outline" size={40} color="#00C4CC" />
              <Text style={styles.addDocumentEmptyText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Buttons */}
        <View style={styles.submitButtonsContainer}>
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmitClaim}
          >
            <Text style={styles.submitButtonText}>Submit Claim</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.submitLaterButton}
            onPress={handleSubmitLater}
          >
            <Text style={styles.submitLaterButtonText}>Submit Later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F7F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#B8E8EA',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
    paddingTop: 20,
  },
  claimInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#00B8CC',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#13646D',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#00C4CC',
    color: '#fff',
    paddingVertical: 10,
    borderRadius: 10,
  },
  beneficiaryCard: {
    backgroundColor: '#D1F2F4',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#00C4CC',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#B8E8EA',
  },
  actionButton: {
    backgroundColor: '#00C4CC',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentCard: {
    backgroundColor: '#D1F2F4',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#00C4CC',
  },
  documentInfo: {
    marginBottom: 10,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  documentActionButton: {
    backgroundColor: '#00C4CC',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDocumentEmptyButton: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#00C4CC',
  },
  addDocumentEmptyText: {
    fontSize: 16,
    color: '#00C4CC',
    fontWeight: '500',
    marginTop: 10,
  },
  submitButtonsContainer: {
    paddingBottom: 30,
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#13646D',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitLaterButton: {
    backgroundColor: '#00C4CC',
    borderRadius: 15,
    paddingVertical: 18,
  },
  submitLaterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SHEClaimIntimation;