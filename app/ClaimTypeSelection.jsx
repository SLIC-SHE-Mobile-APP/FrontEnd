import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ClaimTypeSelection = ({ visible, onClose, onNext }) => {
  const [selectedClaimType, setSelectedClaimType] = useState('');
  const [patientName, setPatientName] = useState('');
  const [illness, setIllness] = useState('');
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  const claimTypes = [
    { id: 'outdoor', label: 'Outdoor', icon: '🏃‍♂️' },
    { id: 'indoor', label: 'Indoor', icon: '🏠' },
    { id: 'dental', label: 'Dental', icon: '🦷' },
    { id: 'spectacles', label: 'Spectacles', icon: '👓' },
  ];

  const handleClaimTypeSelect = (type) => {
    setSelectedClaimType(type);
    setShowPatientDetails(true);
  };

  const handleNext = () => {
    if (patientName.trim() && illness.trim()) {
      onNext({
        claimType: selectedClaimType,
        patientName: patientName.trim(),
        illness: illness.trim(),
      });
      // Reset form
      setSelectedClaimType('');
      setPatientName('');
      setIllness('');
      setShowPatientDetails(false);
    }
  };

  const handleClose = () => {
    setSelectedClaimType('');
    setPatientName('');
    setIllness('');
    setShowPatientDetails(false);
    onClose();
    router.back(); // Added router.back() to close the modal
  };

  const renderClaimTypeModal = () => (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Claim Type</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.claimTypeGrid}>
        {claimTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.claimTypeButton,
              selectedClaimType === type.id && styles.selectedClaimType
            ]}
            onPress={() => handleClaimTypeSelect(type.id)}
          >
            <Text style={styles.claimTypeIcon}>{type.icon}</Text>
            <Text style={[
              styles.claimTypeLabel,
              selectedClaimType === type.id && styles.selectedClaimTypeLabel
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPatientDetailsModal = () => (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        
        <Text style={styles.headerTitle}>Claim Type</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={25} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.selectedTypeIndicator}>
        <View style={styles.claimTypeGrid}>
          {claimTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.claimTypeButton,
                selectedClaimType === type.id && styles.selectedClaimType
              ]}
              disabled={true}
            >
              <Text style={styles.claimTypeIcon}>{type.icon}</Text>
              <Text style={[
                styles.claimTypeLabel,
                selectedClaimType === type.id && styles.selectedClaimTypeLabel
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.patientDetailsSection}>
        <Text style={styles.sectionTitle}>Add Patient Details</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Patient Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Select Name"
            value={patientName}
            onChangeText={setPatientName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Illness</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Illness"
            value={illness}
            onChangeText={setIllness}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!patientName.trim() || !illness.trim()) && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!patientName.trim() || !illness.trim()}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {showPatientDetails ? renderPatientDetailsModal() : renderClaimTypeModal()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
        minHeight: height * 0.6,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  claimTypeButton: {
    width: (width - 80) / 4,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedClaimType: {
    backgroundColor: '#20b2aa',
    borderColor: '#20b2aa',
  },
  claimTypeIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  claimTypeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedClaimTypeLabel: {
    color: 'white',
  },
  selectedTypeIndicator: {
    marginBottom: 20,
  },
  patientDetailsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  nextButton: {
    backgroundColor: '#20b2aa',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonDisabled: {
    // backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClaimTypeSelection;