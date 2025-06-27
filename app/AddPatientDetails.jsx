import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

// ✅ Use router from Expo Router
import { useLocalSearchParams, useRouter } from 'expo-router';

const AddPatientDetails = ({ onClose }) => {
  const router = useRouter();
  const { selectedMember, members } = useLocalSearchParams();

  const [patientName, setPatientName] = useState('');
  const [illness, setIllness] = useState('');
  const [patientNameError, setPatientNameError] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberList, setMemberList] = useState([]);

  useEffect(() => {
    const defaultMembers = [
      { id: 1, name: 'H.M.Menaka Herath', relationship: 'Self' },
      { id: 2, name: 'Kamal Perera', relationship: 'Spouse' },
      { id: 3, name: 'Saman Herath', relationship: 'Child' },
      { id: 4, name: 'Nimal Silva', relationship: 'Child' },
      { id: 5, name: 'Kamala Herath', relationship: 'Parent' },
    ];

    const availableMembers = members || defaultMembers;
    setMemberList(availableMembers);

    const defaultMember = selectedMember || availableMembers[0];
    if (defaultMember) {
      setPatientName(defaultMember.name);
    }
  }, [selectedMember, members]);

  const validatePatientName = (name) => {
    if (!name.trim()) {
      return 'Patient name is required';
    }
    if (name.trim().length < 2) {
      return 'Patient name must be at least 2 characters';
    }
    return '';
  };

  const handleNextPress = () => {
    const nameError = validatePatientName(patientName);
    setPatientNameError(nameError);

    if (nameError) {
      Alert.alert('Validation Error', nameError);
      return;
    }

    const patientData = {
      patientName: patientName.trim(),
      illness
    };


    // ✅ Navigate to UploadDocuments.jsx
    router.push({
      pathname: '/UploadDocuments',
      params: { ...patientData },
    });

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
    if (patientNameError) setPatientNameError('');
  };

  const handleMemberSelect = (member) => {
    setPatientName(member.name);
    setShowMemberDropdown(false);
    if (patientNameError) setPatientNameError('');
  };

  const toggleDropdown = () => {
    setShowMemberDropdown(!showMemberDropdown);
  };

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        patientName === item.name && styles.selectedDropdownItem
      ]}
      onPress={() => handleMemberSelect(item)}
    >
      <View style={styles.dropdownMemberInfo}>
        <Text style={styles.dropdownMemberName}>{item.name}</Text>
        <Text style={styles.dropdownMemberRelationship}>{item.relationship}</Text>
      </View>
      {patientName === item.name && (
        <Icon name="check" size={16} color="#00C4CC" />
      )}
    </TouchableOpacity>
  );

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
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textInputWithDropdown,
                  patientNameError ? styles.textInputError : null
                ]}
                placeholder="Enter patient name"
                placeholderTextColor="#B0B0B0"
                value={patientName}
                onChangeText={handlePatientNameChange}
              />
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={toggleDropdown}
              >
                <Icon
                  name={showMemberDropdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {showMemberDropdown && (
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={memberList}
                  renderItem={renderMemberItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.membersList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
    position: 'relative',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#13646D',
    marginBottom: 10,
  },
  inputWrapper: {
    position: 'relative',
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
  textInputWithDropdown: {
    paddingRight: 50,
  },
  textInputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  dropdownButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 15,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  membersList: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#F0F8FF',
  },
  dropdownMemberInfo: {
    flex: 1,
  },
  dropdownMemberName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownMemberRelationship: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
    marginBottom: 25,
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
