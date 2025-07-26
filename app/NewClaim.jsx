import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  FlatList
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

const NewClaim = ({ onClose, onEditClaim }) => {
  const navigation = useNavigation();
  const router = useRouter();
  const {
    policyNo: paramPolicyNo = '',
    memberNo: paramMemberNo = '',
    selectedMember,
    members,
  } = useLocalSearchParams();

  const [policyNo, setPolicyNo] = useState('');
  const [memberNo, setMemberNo] = useState('');
  const [nic, setNIC] = useState('');
  const [mobile, setMobile] = useState('');
  const [initialising, setInitialising] = useState(true);

  // Custom Loading Animation Component
  const LoadingIcon = () => {
    const [rotateAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(1));

    useEffect(() => {
      const createRotateAnimation = () => {
        return Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        );
      };

      const createPulseAnimation = () => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const rotateAnimation = createRotateAnimation();
      const pulseAnimation = createPulseAnimation();

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    }, []);

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.customLoadingIcon,
          {
            transform: [{ rotate: spin }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.loadingIconOuter}>
          <View style={styles.loadingIconInner}>
            <Icon name="heartbeat" size={20} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>
    );
  };

  // Loading Screen Component with Custom Icon
  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <Text style={styles.loadingText}>Loading Patient Details...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  useEffect(() => {
    (async () => {
      try {
        const [storedPolicyNo, storedMemberNo, storedNic, storedMobile] = await Promise.all([
          SecureStore.getItemAsync('selected_policy_number'),
          SecureStore.getItemAsync('selected_member_number'),
          SecureStore.getItemAsync('user_nic'),
          SecureStore.getItemAsync('user_mobile'),
        ]);

        setPolicyNo(storedPolicyNo || paramPolicyNo);
        setMemberNo(storedMemberNo || paramMemberNo);
        setNIC(storedNic || '');
        setMobile(storedMobile || '');
      } catch (err) {
        console.warn('SecureStore read failed:', err);
        setPolicyNo(paramPolicyNo);
        setMemberNo(paramMemberNo);
      } finally {
        setInitialising(false);
      }
    })();
  }, [paramPolicyNo, paramMemberNo]);

  const [patientName, setPatientName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [illness, setIllness] = useState('');
  const [selectedClaimType, setSelectedClaimType] = useState('outdoor');
  const [patientNameError, setPatientNameError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Main loading state

  useEffect(() => {
    if (initialising || !policyNo || !memberNo) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchMembers = async () => {
      try {
        setIsLoading(true); // Start loading
        setLoadingMembers(true);
        
        const url = `${API_BASE_URL}/Dependents/WithEmployee?policyNo=${encodeURIComponent(policyNo)}&memberNo=${encodeURIComponent(memberNo)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        const parsed = data.map((d, i) => ({
          id: i + 1,
          name: d.dependentName ?? d.dependentName,
          relationship: d.relationship,
        }));
        if (isMounted) {
          setMemberList(parsed.length ? parsed : members || []);
          const defaultMember = selectedMember || parsed[0] || (members ? members[0] : null);
          if (defaultMember) {
            setPatientName(defaultMember.name);
            setRelationship(defaultMember.relationship);
          }
          setLoadingMembers(false);
          setIsLoading(false); // End loading
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Fetch Dependents failed:', err.message);
          setMemberList(members || []);
          if (members?.length) {
            setPatientName(members[0].name);
            setRelationship(members[0].relationship);
          }
          setLoadingMembers(false);
          setIsLoading(false); // End loading even on error
          Alert.alert('Network Error', 'Could not fetch dependents list.');
        }
      }
    };

    fetchMembers();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [initialising, policyNo, memberNo, selectedMember, members]);

  // Function to store patient details in SecureStore
  const storePatientDetails = async (claimType, name, illnessDesc, clmSeqNo = null) => {
    try {
      const storePromises = [
        SecureStore.setItemAsync('stored_claim_type', claimType),
        SecureStore.setItemAsync('stored_patient_name', name),
        SecureStore.setItemAsync('stored_illness_description', illnessDesc),
      ];
      
      if (clmSeqNo) {
        storePromises.push(SecureStore.setItemAsync('stored_claim_seq_no', clmSeqNo));
      }
      
      await Promise.all(storePromises);
      console.log('Patient details stored successfully in SecureStore');
    } catch (error) {
      console.warn('Failed to store patient details:', error);
    }
  };

  const validatePatientName = (name) => {
    if (!name.trim()) return 'Patient name is required';
    if (name.trim().length < 2) return 'Patient name must be at least 2 characters';
    return '';
  };

  const indOutMap = { outdoor: 'O', indoor: 'I', dental: 'D', spectacles: 'S' };

  const handleNextPress = async () => {
    const nameError = validatePatientName(patientName);
    setPatientNameError(nameError);
    if (nameError) {
      Alert.alert('Validation Error', nameError);
      return;
    }

    // Console.log the three details
    console.log('=== PATIENT DETAILS ===');
    console.log('Claim Type:', selectedClaimType);
    console.log('Patient Name:', patientName.trim());
    console.log('Illness Description:', illness);
    console.log('=======================');

    // Store the details in SecureStore
    await storePatientDetails(selectedClaimType, patientName.trim(), illness);

    const payload = {
      policyNo,
      memId: memberNo,
      contactNo: mobile,
      createdBy: nic,
      indOut: indOutMap[selectedClaimType] || 'O',
      patientName: patientName.trim(),
      illness,
      relationship,
    };

    console.log('Sending payload:', payload);

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/Claimintimation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization headers if needed
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Claim could not be created (HTTP ${res.status}): ${errorText}`);
      }

      const data = await res.json();
      
      // Fetch claim details using member number and store clmSeqNo
      const memberNumber = await SecureStore.getItemAsync('selected_member_number');
      if (memberNumber) {
        try {
          const claimDetailsRes = await fetch(`${API_BASE_URL}/UploadedDocumentsCon/${memberNumber}`);
          if (claimDetailsRes.ok) {
            const claimDetails = await claimDetailsRes.json();
            if (claimDetails.clmSeqNo) {
              await SecureStore.setItemAsync('stored_claim_seq_no', claimDetails.clmSeqNo);
              console.log('Claim Sequence Number stored:', claimDetails.clmSeqNo);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch or store claim details:', error);
        }
      }
      
      if (onClose) onClose();
      router.push({
        pathname: '/UploadDocuments',
        params: {
          claimId: data?.claimId ?? '',
          patientName: patientName.trim(),
          illness,
          claimType: selectedClaimType,
        },
      });
    } catch (err) {
      console.warn('Intimate Claim failed:', err);
      Alert.alert('Error', err.message ?? 'Something went wrong while creating the claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const claimTypes = [
    { id: 'outdoor', label: 'Outdoor', icon: '🩺', enabled: true },
    { id: 'indoor', label: 'Indoor', icon: '🏠', enabled: false },
    { id: 'dental', label: 'Dental', icon: '🦷', enabled: false },
    { id: 'spectacles', label: 'Spectacles', icon: '👓', enabled: false },
  ];

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setPatientName(item.name);
        setRelationship(item.relationship);
        setShowDropdown(false);
        if (patientNameError) setPatientNameError('');
      }}
    >
      <View style={styles.dropdownMemberInfo}>
        <Text style={styles.dropdownMemberName}>{item.name}</Text>
        <Text style={styles.dropdownMemberRelationship}>({item.relationship})</Text>
      </View>
    </TouchableOpacity>
  );

  if (initialising || isLoading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Add Patient Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Add Patient Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons
            name="close"
            size={26}
            color="#2E7D7D"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      </View>

      {showDropdown && (
        <View style={styles.dropdownOverlay}>
          <View style={[styles.dropdownContainer, { top: 290 }]}>
            <FlatList
              data={memberList}
              keyExtractor={(item, index) => `member-${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    index === memberList.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setPatientName(item.name);
                    setRelationship(item.relationship);
                    setShowDropdown(false);
                    if (patientNameError) setPatientNameError('');
                  }}
                >
                  <View style={styles.dropdownMemberInfo}>
                    <Text style={styles.dropdownMemberName}>{item.name}</Text>
                    <Text style={styles.dropdownMemberRelationship}>({item.relationship})</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={true}
              bounces={false}
              getItemLayout={(data, index) => ({
                length: 60,
                offset: 60 * index,
                index,
              })}
            />
          </View>
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!showDropdown} // Disable main scroll when dropdown is open
        >
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Claim Type</Text>
            <View style={styles.claimTypeGrid}>
              {claimTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.claimTypeButton,
                    selectedClaimType === type.id && styles.selectedClaimType,
                    !type.enabled && styles.disabledClaimType,
                  ]}
                  onPress={() => type.enabled && setSelectedClaimType(type.id)}
                  disabled={!type.enabled}
                >
                  <Text style={[styles.claimTypeIcon, !type.enabled && styles.disabledIcon]}>
                    {type.icon}
                  </Text>
                  <Text
                    style={[
                      styles.claimTypeLabel,
                      selectedClaimType === type.id && styles.selectedClaimTypeLabel,
                      !type.enabled && styles.disabledClaimTypeLabel,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Patient Name *</Text>
            <View style={styles.inputWrapper}>
              {loadingMembers ? (
                <View style={styles.textInput}>
                  <ActivityIndicator size="small" color="#00C4CC" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.textInput,
                    styles.dropdownSelectInput,
                    patientNameError && styles.textInputError,
                  ]}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={[styles.dropdownSelectText, !patientName && styles.placeholderText]}>
                    {patientName || 'Select patient name'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Ionicons
                  name={showDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
              {/* Dropdown moved outside - now handled above KeyboardAvoidingView */}
            </View>
            {patientNameError ? <Text style={styles.errorText}>{patientNameError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Illness</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Enter illness description"
              value={illness}
              onChangeText={setIllness}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextPress}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D7D",
    textAlign: "left",
    flex: 1,
  },
  // Custom Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minWidth: 200,
    minHeight: 150,
  },
  customLoadingIcon: {
    marginBottom: 15,
  },
  loadingIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16858D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6DD3D3',
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17ABB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  inputContainer: { 
    marginBottom: 25,
  },
  inputLabel: { 
    fontSize: 15, 
    fontWeight: '500', 
    color: '#2E7D7D', 
    marginBottom: 10 
  },
  inputWrapper: { 
    position: 'relative',
    zIndex: 1000,
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
  },
  multilineInput: {
    height: 80,
  },
  textInputError: { 
    borderColor: '#FF6B6B', 
    borderWidth: 2 
  },
  dropdownSelectInput: { 
    justifyContent: 'center', 
    paddingRight: 50 
  },
  dropdownSelectText: { 
    fontSize: 15, 
    color: '#333' 
  },
  placeholderText: { 
    color: '#B0B0B0' 
  },
  dropdownButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    zIndex: 1001,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    pointerEvents: 'box-none',
  },
  dropdownContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 15,
    maxHeight: 183,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 15,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 60,
    backgroundColor: '#fff',
    borderRadius: 15
  },
  dropdownMemberInfo: { 
    flex: 1 
  },
  dropdownMemberName: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#333' 
  },
  dropdownMemberRelationship: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 2 
  },
  errorText: { 
    color: '#FF6B6B', 
    fontSize: 12, 
    marginTop: 5, 
    marginLeft: 5 
  },
  claimTypeGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    flexWrap: 'wrap', 
    marginTop: 10 
  },
  claimTypeButton: {
    width: '22%',
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  selectedClaimType: { 
    backgroundColor: '#00C4CC', 
    borderColor: '#00C4CC' 
  },
  disabledClaimType: { 
    backgroundColor: '#F0F0F0', 
    borderColor: '#D0D0D0', 
    opacity: 0.6 
  },
  claimTypeIcon: { 
    fontSize: 20, 
    marginBottom: 5 
  },
  disabledIcon: { 
    opacity: 0.5 
  },
  claimTypeLabel: { 
    fontSize: 11, 
    color: '#666', 
    fontWeight: '500', 
    textAlign: 'center' 
  },
  selectedClaimTypeLabel: { 
    color: '#fff' 
  },
  disabledClaimTypeLabel: { 
    color: '#999' 
  },
  nextButton: {
    backgroundColor: '#00C4CC',
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 10,
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
    textAlign: 'center' 
  },
});

export default NewClaim;