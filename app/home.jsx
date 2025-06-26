import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import Fontisto from '@expo/vector-icons/Fontisto';
import IllnessPopup from './IllnessPopup';
import OnlineClaimIntimations from './OnlineClaimIntimations';

const { height: screenHeight } = Dimensions.get('window');

export default function PolicyHome() {
  const navigation = useNavigation();
  const [policyDetails, setPolicyDetails] = useState(null);
  const [showIllnessPopup, setShowIllnessPopup] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  useEffect(() => {
    setPolicyDetails({
      insuranceCover: 'Rs. 0.00',
      policyNumber: 'G/010/SHE/16666/25',
      policyPeriod: '2020-02-13 - 2020-02-13',
    });

    const membersList = [
      { id: 1, name: 'H.M.Menaka Herath', relationship: 'Self' },
      { id: 2, name: 'Kamal Perera', relationship: 'Spouse' },
      { id: 3, name: 'Saman Herath', relationship: 'Child' },
      { id: 4, name: 'Nimal Silva', relationship: 'Child' },
      { id: 5, name: 'Kamala Herath', relationship: 'Parent' },
    ];
    setMembers(membersList);
    setSelectedMember(membersList[0]);
  }, []);

  const handleNavigation = (label) => {
    if (label === 'Policy Details') {
      navigation.navigate('HealthPolicyDetails');
    } else if (label === 'Add') {
      router.push('/AddPolicy');
    } else if (label === 'Profile') {
      router.push('/userDetails');
    } 
  };

  const handleInfoPress = () => {
    navigation.navigate('PolicyMemberDetails');
  };

  const handleAddUser = () => {
    console.log('Add user pressed');
  };

  const handleTypePress = (type) => {
    if (type === 'Outdoor') {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      console.log(`${type} pressed`);
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

  const handleCloseIllnessPopup = () => {
    setShowIllnessPopup(false);
  };

  const handleIllnessNext = () => {
    console.log('Illness Next pressed');
    setShowIllnessPopup(false);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setShowMemberDropdown(false);
  };

  const toggleMemberDropdown = () => {
    setShowMemberDropdown(!showMemberDropdown);
  };

  const renderType = (label, icon, onPress) => (
    <TouchableOpacity
      style={styles.typeItem}
      key={label}
      onPress={() => onPress(label)}
    >
      <View style={styles.iconBackground}>
        {typeof icon === 'string' ? (
          <Icon name={icon} size={30} color="#000000" />
        ) : (
          icon
        )}
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

  const renderPlusNavItem = (label, onPress) => (
    <TouchableOpacity style={styles.plusNavItem} onPress={() => onPress(label)} key={label}>
      <View style={styles.plusIconContainer}>
        <Icon name="plus" size={35} color="#6DD3D3" />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.sheText}>SHE <Text style={styles.sheText1}>Digital</Text></Text>
        </View>
      

      <ScrollView contentContainerStyle={styles.body}>
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
              <View style={styles.policyIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={handleInfoPress}>
                  <Icon name="info-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TYPE</Text>
        <View style={styles.typeContainer}>
          {renderType('Outdoor', 'stethoscope', handleTypePress)}
          {renderType('Indoor', 'bed', handleTypePress)}
          {renderType('Dental', <FontAwesome6 name="tooth" size={30} color="#000000" />, handleTypePress)}
          {renderType('Spectacles', <Fontisto name="sunglasses-alt" size={30} color="#000000" />, handleTypePress)}
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
        {renderPlusNavItem('Add', handleNavigation)}
        {renderNavItem('file-text', 'Policy Details', handleNavigation)}
        {renderNavItem('user', 'Profile', handleNavigation)}
      </View>

      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleCloseModal}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleCloseModal} />
          <Animated.View style={[styles.animatedModal, { transform: [{ translateY: slideAnim }] }]}>
            <OnlineClaimIntimations onClose={handleCloseModal} selectedMember={selectedMember} />
          </Animated.View>
        </View>
      </Modal>

      <IllnessPopup visible={showIllnessPopup} onClose={handleCloseIllnessPopup} onNext={handleIllnessNext} />
    </LinearGradient>
  );
}


// Styles
const styles = StyleSheet.create({
  container: {
    flex: 2,
  },
  header: {
    height: 100,
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40
  },
  logoContainer: {
    marginLeft: 20,
  },
  headerLogo: {
    width: 120,
    height: 60,
  },
  sheText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E12427',
    marginRight: 20,
  },
  sheText1: {
    fontSize: 20,
    marginRight: 20,
    color: '#16858D',
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
    shadowOpacity: 0.1,
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
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
 
  policyIcons: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconButton: {
    marginLeft: 15,
  },
  insuranceText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14
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
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  typeItem: {
    alignItems: 'center',
  },
  typeText: {
    marginTop: 5,
    fontSize: 14,
    color: '#A79C9C',
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthCardContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  healthCard: {
    width: 300,
    height: 160,
    borderRadius: 10,
  },
  navbar: {
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
    marginBottom: 15,
    alignItems: 'center',
    height: 70,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: '#FFFFFF',
  },
  plusNavItem: {
    alignItems: 'center',
    position: 'absolute',
    top: -25,
    left: '50%',
    marginLeft: -30,
    zIndex: 10,
  },
  plusIconContainer: {
    marginTop: 12,
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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