import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const OnlineClaimIntimation1 = ({ route }) => {
  const navigation = useNavigation();
  const submittedData = route?.params?.submittedData || {};
  
  const [claimData, setClaimData] = useState({
    referenceNo: 'M000428',
    enteredBy: 'Member',
    status: 'Submission for Approval Pending',
    claimType: 'Out-door',
    createdOn: '24-12-2020'
  });

  const [beneficiaryData, setBeneficiaryData] = useState({
    name: 'H.M.M.K Herath',
    relationship: '1.00',
    illness: 'gg',
    amount: '1.00'
  });

  // Function to generate a random reference number
  const generateReferenceNumber = () => {
    const prefix = 'M';
    const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 6 digit number
    return `${prefix}${randomNumber}`;
  };

  // Function to map document type to claim type
  const getClaimType = (documentType) => {
    switch (documentType) {
      case 'bill':
        return 'Out-door';
      case 'prescription':
        return 'Prescription';
      case 'diagnosis':
        return 'Diagnosis';
      case 'other':
        return 'Other';
      default:
        return 'Out-door';
    }
  };

  useEffect(() => {
    console.log('Received submitted data:', submittedData);
    
    if (submittedData && Object.keys(submittedData).length > 0) {
      // Update beneficiary data with submitted information
      setBeneficiaryData(prev => ({
        ...prev,
        name: submittedData.patientData?.patientName || prev.name,
        illness: submittedData.patientData?.illness || prev.illness,
        amount: submittedData.amount || prev.amount,
        relationship: submittedData.patientData?.relationship || prev.relationship
      }));
      
      // Update claim data with current date and document type
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
      
      setClaimData(prev => ({
        ...prev,
        referenceNo: generateReferenceNumber(),
        createdOn: submittedData.documentDate || formattedDate,
        claimType: getClaimType(submittedData.documentType)
      }));
    }
  }, [submittedData]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSubmitClaim = () => {
    // Prepare final claim data
    const finalClaimData = {
      claimInfo: claimData,
      beneficiary: beneficiaryData,
      documentType: submittedData.documentType,
      documentDate: submittedData.documentDate,
      documents: submittedData.documents || [],
      patientData: submittedData.patientData || {}
    };

    console.log('Final claim data for submission:', finalClaimData);

    Alert.alert(
      'Submit Claim',
      'Are you sure you want to submit this claim?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert(
              'Success',
              `Claim ${claimData.referenceNo} submitted successfully!`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to home or claims list
                    navigation.navigate('Home');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleSubmitLater = () => {
    // Prepare draft data
    const draftData = {
      claimInfo: claimData,
      beneficiary: beneficiaryData,
      documentType: submittedData.documentType,
      documentDate: submittedData.documentDate,
      documents: submittedData.documents || [],
      patientData: submittedData.patientData || {},
      isDraft: true
    };

    console.log('Draft data saved:', draftData);

    Alert.alert(
      'Save Draft',
      'Claim saved as draft. You can submit it later.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home');
          }
        }
      ]
    );
  };

  const handleIconPress = (iconType) => {
    switch (iconType) {
      case 'edit':
        // Navigate back to UploadDocuments with current data for editing
        navigation.navigate('UploadDocuments', { 
          patientData: submittedData.patientData,
          editMode: true,
          existingData: submittedData
        });
        break;
      case 'copy':
        Alert.alert('Copy', 'Copy functionality coming soon');
        break;
      case 'delete':
        Alert.alert(
          'Delete',
          'Are you sure you want to delete this claim?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Deleted', 'Claim deleted successfully');
                navigation.goBack();
              }
            }
          ]
        );
        break;
      case 'download':
        Alert.alert('Download', 'Download functionality coming soon');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FAFAFA', '#6DD3D3']}
        style={styles.gradient}
      >
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
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference No</Text>
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
            {submittedData.documentType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Document Type</Text>
                <Text style={styles.infoValue}>{submittedData.documentType}</Text>
              </View>
            )}
            {submittedData.documents && submittedData.documents.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Documents</Text>
                <Text style={styles.infoValue}>{submittedData.documents.length} file(s)</Text>
              </View>
            )}
          </View>

          {/* Beneficiaries Section */}
          <View style={styles.beneficiariesSection}>
            <Text style={styles.sectionTitle}>Beneficiaries for Claim</Text>
            
            <View style={styles.beneficiaryCard}>
              <View style={styles.beneficiaryRow}>
                <Text style={styles.beneficiaryLabel}>Name</Text>
                <Text style={styles.beneficiaryValue}>{beneficiaryData.name}</Text>
              </View>
              <View style={styles.beneficiaryRow}>
                <Text style={styles.beneficiaryLabel}>Relationship</Text>
                <Text style={styles.beneficiaryValue}>{beneficiaryData.relationship}</Text>
              </View>
              <View style={styles.beneficiaryRow}>
                <Text style={styles.beneficiaryLabel}>Illness</Text>
                <Text style={styles.beneficiaryValue}>{beneficiaryData.illness}</Text>
              </View>
              <View style={styles.beneficiaryRow}>
                <Text style={styles.beneficiaryLabel}>Amount</Text>
                <Text style={styles.beneficiaryValue}>LKR {beneficiaryData.amount}</Text>
              </View>
              {submittedData.documentDate && (
                <View style={styles.beneficiaryRow}>
                  <Text style={styles.beneficiaryLabel}>Document Date</Text>
                  <Text style={styles.beneficiaryValue}>{submittedData.documentDate}</Text>
                </View>
              )}

              {/* Action Icons */}
              <View style={styles.actionIcons}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleIconPress('edit')}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleIconPress('copy')}
                >
                  <Ionicons name="copy-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleIconPress('delete')}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleIconPress('download')}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submitted Documents Summary */}
          {submittedData.documents && submittedData.documents.length > 0 && (
            <View style={styles.documentsSection}>
              <Text style={styles.sectionTitle}>Uploaded Documents</Text>
              <View style={styles.documentsCard}>
                {submittedData.documents.map((doc, index) => (
                  <View key={doc.id || index} style={styles.documentRow}>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{doc.name}</Text>
                      <Text style={styles.documentSize}>
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                      </Text>
                    </View>
                    <View style={styles.documentTypeIndicator}>
                      <Text style={styles.documentTypeText}>{doc.type || 'Unknown'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#00C4CC',
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
    color: '#00C4CC',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  beneficiariesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    backgroundColor: '#00C4CC',
    paddingVertical: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginBottom: 0,
  },
  beneficiaryCard: {
    backgroundColor: '#E6F9FA',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beneficiaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  beneficiaryLabel: {
    fontSize: 14,
    color: '#00C4CC',
    fontWeight: '500',
    flex: 1,
  },
  beneficiaryValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  actionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#00C4CC',
  },
  iconButton: {
    backgroundColor: '#00C4CC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentsSection: {
    marginBottom: 30,
  },
  documentsCard: {
    backgroundColor: '#E6F9FA',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#B3E5FC',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  documentTypeIndicator: {
    backgroundColor: '#00C4CC',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  documentTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  actionButtons: {
    paddingBottom: 30,
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#00C4CC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitLaterButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitLaterButtonText: {
    color: '#00C4CC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OnlineClaimIntimation1;