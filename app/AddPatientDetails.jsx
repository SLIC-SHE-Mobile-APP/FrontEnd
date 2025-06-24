import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Import useNavigation hook
import { useNavigation } from '@react-navigation/native';

const AddPatientDetails = ({ onClose, onNext }) => {
  // Use the navigation hook
  const navigation = useNavigation();
  
  const [patientName, setPatientName] = useState('');
  const [illness, setIllness] = useState('');
  const [patientNameError, setPatientNameError] = useState('');

  const validatePatientName = (name) => {
    if (!name.trim()) {
      return 'Patient name is required';
    }
    if (name.trim().length < 2) {
      return 'Patient name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Patient name should only contain letters and spaces';
    }
    return '';
  };

  const handleNextPress = () => {
    // Validate patient name
    const nameError = validatePatientName(patientName);
    setPatientNameError(nameError);

    if (nameError) {
      Alert.alert('Validation Error', nameError);
      return;
    }

    console.log('Patient Name:', patientName.trim());
    console.log('Illness:', illness);
    
    // Prepare patient data
    const patientData = { 
      patientName: patientName.trim(), 
      illness 
    };

    try {
      // Navigate to UploadDocuments screen
      navigation.navigate('UploadDocuments', { patientData });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to onNext callback if navigation fails
      if (onNext) {
        onNext(patientData);
      }
    }
  };

  const handlePatientNameChange = (text) => {
    setPatientName(text);
    // Clear error when user starts typing
    if (patientNameError) {
      setPatientNameError('');
    }
  };

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    } else {
      // Fallback to navigation goBack if onClose is not provided
      navigation.goBack();
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.overlayBackground} 
        activeOpacity={1} 
        onPress={handleBackPress}
      />
      <View style={styles.popupContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Patient Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Patient Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                patientNameError ? styles.textInputError : null
              ]}
              placeholder="Enter patient name"
              placeholderTextColor="#B0B0B0"
              value={patientName}
              onChangeText={handlePatientNameChange}
            />
            {patientNameError ? (
              <Text style={styles.errorText}>{patientNameError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Illness</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter illness description"
              placeholderTextColor="#B0B0B0"
              value={illness}
              onChangeText={setIllness}
              multiline={true}
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNextPress}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
    padding: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#13646D',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#13646D',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#F9F9F9',
    minHeight: 30,
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
  nextButton: {
    backgroundColor: '#00C4CC',
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 20,
    shadowColor: '#00C4CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AddPatientDetails;