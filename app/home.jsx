import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import ClaimTypeSelection from './ClaimTypeSelection';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function PolicyHome() {
  const navigation = useNavigation();
  const [policyDetails, setPolicyDetails] = useState(null);
  const [showIllnessPopup, setShowIllnessPopup] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Policy selection modal state
  const [showPolicySelection, setShowPolicySelection] = useState(false);
  const [policySelectSlideAnim] = useState(new Animated.Value(screenHeight));
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(true);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Available policies
  const [availablePolicies, setAvailablePolicies] = useState([
    {
      id: 1,
      policyNumber: 'G/010/SHE/16666/25',
      policyPeriod: '2020-02-13 - 2025-02-13',
      policyID: '1161',
      type: 'GENERAL'
    },
    {
      id: 2,
      policyNumber: 'G/010/SHE/16667/25',
      policyPeriod: '2021-03-15 - 2026-03-15',
      policyID: '1162',
      type: 'GENERAL'
    },
    {
      id: 3,
      policyNumber: 'G/010/SHE/16668/25',
      policyPeriod: '2022-01-10 - 2027-01-10',
      policyID: '1163',
      type: 'GENERAL'
    },
    {
      id: 4,
      policyNumber: 'G/010/SHE/16669/25',
      policyPeriod: '2023-06-20 - 2028-06-20',
      policyID: '1164',
      type: 'GENERAL'
    },
    {
      id: 5,
      policyNumber: 'G/010/SHE/16670/25',
      policyPeriod: '2024-04-12 - 2029-04-12',
      policyID: '1165',
      type: 'GENERAL'
    }
  ]);

  // Initialize members and show policy selection modal on first load
  useEffect(() => {
    const membersList = [
      { id: 1, name: 'H.M.Menaka Herath', relationship: 'Self' },
      { id: 2, name: 'Kamal Perera', relationship: 'Spouse' },
      { id: 3, name: 'Saman Herath', relationship: 'Child' },
      { id: 4, name: 'Nimal Silva', relationship: 'Child' },
      { id: 5, name: 'Kamala Herath', relationship: 'Parent' },
    ];
    setMembers(membersList);
    setSelectedMember(membersList[0]);

    // Show policy selection modal only on first load and when no policy is selected
    if (isFirstTime && !selectedPolicyNumber) {
      const timer = setTimeout(() => {
        setShowPolicySelection(true);
        Animated.timing(policySelectSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isFirstTime, selectedPolicyNumber, policySelectSlideAnim]);

  const handlePolicySelection = (policy) => {
    setSelectedPolicyNumber(policy.policyNumber);
    setPolicyDetails({
      policyID: policy.policyID,
      policyNumber: policy.policyNumber,
      policyPeriod: policy.policyPeriod,
      type: policy.type
    });
    setIsFirstTime(false);



    // Close modal
    Animated.timing(policySelectSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPolicySelection(false);
    });
  };

  const handleDeletePolicy = (policyId, policyNumber) => {
    Alert.alert(
      'Delete Policy',
      `Are you sure you want to delete policy ${policyNumber} ?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Remove policy from the list
            const updatedPolicies = availablePolicies.filter(policy => policy.id !== policyId);
            setAvailablePolicies(updatedPolicies);

            // If the deleted policy was selected, reset selection
            if (selectedPolicyNumber === policyNumber) {
              setSelectedPolicyNumber(null);
              setPolicyDetails(null);
              setIsFirstTime(true);
            }

            // If no policies left, close modal
            if (updatedPolicies.length === 0) {
              handleClosePolicySelection();
            }
          },
        },
      ]
    );
  };

  const handleNavigation = (label) => {
    if (label === 'Policy Details') {
      navigation.navigate('HealthPolicyDetails');
    } else if (label === 'Add') {
      router.push('/AddPolicy');
    } else if (label === 'Profile') {
      router.push('/userDetails');
    }
  };

  const handleMoreDetails = () => {
    router.push('/PolicyMemberDetails');
  };

 

  const handleTypePress = (type) => {
    // Remove newline characters and normalize the type string
    const normalizedType = type.replace(/\n/g, ' ').trim();

    if (normalizedType === 'New Claim') {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (normalizedType === 'Saved Claims') {
      console.log('Saved Claims pressed');
      // Add your navigation logic here
    } else if (normalizedType === 'Claim History') {
      console.log('Claim History pressed');
      // Add your navigation logic here
    } else if (normalizedType === 'Pending Requirement') {
      console.log('Pending Requirement pressed');
      // Add your navigation logic here
    } else {
      console.log(`${normalizedType} pressed`);
    }
  };


  const handleCloseModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleClosePolicySelection = () => {
    if (!selectedPolicyNumber && availablePolicies.length > 0) {
      // If no policy selected, select the first one by default
      handlePolicySelection(availablePolicies[0]);
    } else {
      Animated.timing(policySelectSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPolicySelection(false);
      });
    }
  };



  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setShowMemberDropdown(false);
  };

  const toggleMemberDropdown = () => {
    setShowMemberDropdown(!showMemberDropdown);
  };

  const showPolicySelectionModal = () => {
    setShowPolicySelection(true);
    Animated.timing(policySelectSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderType = (label, imageSource, onPress) => (
    <TouchableOpacity
      style={styles.typeItem}
      key={label}
      onPress={() => onPress(label)}
    >
      <View style={styles.iconCircle}>
        <Image
          source={imageSource}
          style={styles.typeIcon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.typeText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderNavItem = (iconName, label, onPress) => (
    <TouchableOpacity style={styles.navItem} onPress={() => onPress(label)} key={label}>
      <Icon name={iconName} size={25} color="white" />
      <Text style={styles.navText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ backgroundColor: "#000000", flex: 1 }}>
      <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.userSection}>
              <Image
                source={require('../assets/images/userhome.png')}
                style={styles.userAvatar}
                resizeMode="contain"
              />
              <Text style={styles.userName}>Kumuduni Rajapakshe</Text>
              <TouchableOpacity onPress={showPolicySelectionModal}>
                <Icon name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.sectionTitle}>POLICY DETAILS</Text>
          <View style={styles.cardOutline}>
            <View style={styles.insuranceCard}>
              <View style={styles.policyHeader}>
                <View style={styles.policyInfo}>
                  <Text style={styles.insuranceText}>
                    Policy Number : <Text style={styles.boldText}>{policyDetails?.policyNumber}</Text>
                  </Text>
                  <Text style={styles.insuranceText}>
                    Policy Period : <Text style={styles.boldText}>{policyDetails?.policyPeriod}</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton} onPress={handleMoreDetails}>
                <Text style={styles.moreText}>More Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>MEMBER</Text>
          <View style={styles.memberCard}>
            <TouchableOpacity style={styles.memberRow} onPress={toggleMemberDropdown}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {selectedMember ? selectedMember.name : 'Select Member'}
                </Text>
                {selectedMember && (
                  <Text style={styles.memberRelationship}>
                    {selectedMember.relationship}
                  </Text>
                )}
              </View>
              <View style={styles.memberActions}>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalText}>Total </Text>
                  <Text style={styles.totalNumber}>
                    {members.length.toString().padStart(2, '0')}
                  </Text>
                </View>
                <Icon
                  name={showMemberDropdown ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#666"
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>

            {showMemberDropdown && (
              <View style={styles.dropdownContainer}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.dropdownItem,
                      selectedMember?.id === member.id && styles.selectedDropdownItem,
                    ]}
                    onPress={() => handleMemberSelect(member)}
                  >
                    <View style={styles.dropdownMemberInfo}>
                      <Text style={styles.dropdownMemberName}>{member.name}</Text>
                      <Text style={styles.dropdownMemberRelationship}>{member.relationship}</Text>
                    </View>
                    {selectedMember?.id === member.id && (
                      <Icon name="check" size={16} color="#16858D" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>TYPE</Text>
          <View style={styles.typeContainer}>
            {renderType('New\nClaim', require('../assets/images/newclaimicon.png'), handleTypePress)}
            {renderType('Saved\nClaims', require('../assets/images/savedclaimicon.png'), handleTypePress)}
            {renderType('Claim\nHistory', require('../assets/images/claimhistoryicon.png'), handleTypePress)}
            {renderType('Pending\nRequirement', require('../assets/images/pendingicon.png'), handleTypePress)}
          </View>

          <Text style={styles.sectionTitle}>HEALTH CARD</Text>
          <View style={styles.healthCardContainer}>
            <Image
              source={require('../assets/images/healthcard.png')}
              style={styles.healthCard}
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        <View style={styles.navbar}>
          {renderNavItem('home', 'Home', handleNavigation)}
          {renderNavItem('bell', 'Notification', handleNavigation)}
          {renderNavItem('file-text', 'Policy Details', handleNavigation)}
          {renderNavItem('user', 'Profile', handleNavigation)}
        </View>

        {/* Policy Selection Modal */}
        <Modal visible={showPolicySelection} transparent animationType="none" onRequestClose={handleClosePolicySelection}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleClosePolicySelection} />
            <Animated.View style={[styles.policySelectionModal, { transform: [{ translateY: policySelectSlideAnim }] }]}>
              <View style={styles.policyModalHeader}>
                <Text style={styles.policyModalTitle}>Select Your Policy</Text>
              </View>
              <ScrollView style={styles.policyList}>
                {availablePolicies.map((policy) => (
                  <View key={policy.id} style={styles.policyItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.policyItem,
                        selectedPolicyNumber === policy.policyNumber && styles.selectedPolicyItem
                      ]}
                      onPress={() => handlePolicySelection(policy)}
                    >
                      <View style={styles.policyContent}>
                        <Text style={styles.policyNumber}>{policy.policyNumber}</Text>
                        <Text style={styles.policyID}>{policy.policyID}</Text>
                        <Text style={styles.policyPeriod}>{policy.policyPeriod}</Text>

                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePolicy(policy.id, policy.policyNumber)}
                    >
                      <Icon name="trash" size={25} color="#E12427" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
        {/* Claim Type Selection Modal */}
        <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleCloseModal}>

          <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleCloseModal} />
          <Animated.View style={[styles.animatedModal, { transform: [{ translateY: slideAnim }] }]}>
            <ClaimTypeSelection onClose={handleCloseModal} />
          </Animated.View>
        </Modal>
      </LinearGradient></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  logoContainer: {
    marginLeft: 10,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 15,
    display: 'flex',
    alignItems: 'left',
    justifyContent: 'center'
  },
  logo: {
    width: 130,
    height: 30,
  },

  sligBadge: {
    backgroundColor: '#16858D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  sligText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  generalBadge: {
    backgroundColor: '#E12427',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  generalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
    flexDirection: 'row',
    alignItems: 'center',

  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: '#333',
    marginRight: 120,
  },
  body: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004D40',
    marginVertical: 10,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  memberRelationship: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalBadge: {
    backgroundColor: '#16858D',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  totalNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  dropdownContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
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
  cardOutline: {
    borderWidth: 1,
    borderColor: '#16858D',
    borderRadius: 10,
    marginBottom: 15,
  },
  insuranceCard: {
    backgroundColor: '#17ABB7',
    padding: 15,
    borderRadius: 10,
  },
  healthCardContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  healthCard: {
    width: 350,
    height: 200,
    borderRadius: 10,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  policyInfo: {
    flex: 1,
  },
  insuranceText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14,
  },
  moreButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  typeItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 3,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeIcon: {
    width: 30,
    height: 30,
  },
  typeText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  healthCardContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  healthCardWrapper: {
    width: screenWidth - 40,
    backgroundColor: '#16858D',
    borderRadius: 12,
    overflow: 'hidden',
  },
  healthCardHeader: {
    padding: 15,
    paddingBottom: 10,
  },
  healthCardBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  healthBadgeText: {
    color: '#16858D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sligCardBadge: {
    backgroundColor: '#E12427',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sligCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  healthCardBody: {
    padding: 15,
    paddingTop: 5,
  },
  cardHolderText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 5,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
  cardRightInfo: {
    alignItems: 'flex-end',
  },
  validUpTo: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
  },
  expiryDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#6DD3D3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
    height: 60,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: '#FFFFFF',
  },
  // Policy Selection Modal styles
  policySelectionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: screenHeight * 0.6,
    paddingBottom: 20,
  },
  policyModalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  policyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  policyList: {
    maxHeight: screenHeight * 0.4,
  },
  policyItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  policyItem: {
    flex: 1,
    padding: 20,
  },
  selectedPolicyItem: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#16858D',
  },
  policyContent: {
    flex: 1,
  },
  policyNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  policyPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  policyID: {
    fontSize: 14,
    // color: '#16858D',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 15,
    paddingLeft: 10,
    paddingRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  animatedModal: {
    height: 375,
    backgroundColor: 'transparent',
  },
});