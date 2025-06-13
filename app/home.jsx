import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function PolicyHome() {
  const navigation = useNavigation();
  const [policyDetails, setPolicyDetails] = useState(null);

  const handleInfoPress = () => {
    navigation.navigate('PolicyMemberDetails');
  };


  useEffect(() => {
    // Simulate fetching policy details
    setPolicyDetails({
      insuranceCover: 'Rs. 0.00',
      policyNumber: 'G/010/SHE/16666/25',
      policyPeriod: '2020-02-13 - 2020-02-13',
    });
  }, []);

  const handleNavigation = (label) => {
    if (label === 'Policy Details') {
      navigation.navigate('HealthPolicyDetails');
    } else if (label === 'Add') {
      // Handle plus button action
      console.log('Plus button pressed');
      // You can navigate to add screen or show modal
      // navigation.navigate('AddScreen');
    }
    // Add other navigation cases here as needed
    // else if (label === 'Profile') {
    //   navigation.navigate('Profile');
    // }
    // else if (label === 'Notification') {
    //   navigation.navigate('Notification');
    // }
  };

  const handleAddUser = () => {
    // Handle add user functionality
    console.log('Add user pressed');
    // You can navigate to add user screen or show modal
    // navigation.navigate('AddUser');
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/userDetails')}>
            <Icon name="bars" size={24} color="#13515C" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            <Text style={styles.sheText}>SHE </Text>Home
          </Text>
          <TouchableOpacity onPress={handleAddUser}>
            <Icon name="" size={24} color="#13515C" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Body */}
      <ScrollView contentContainerStyle={styles.body}>
        {/* Logo Banner */}
        <View style={styles.bannerContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.banner} resizeMode="contain" />
        </View>

        {/* Member Section */}
        <Text style={styles.sectionTitle}>MEMBER</Text>
        <View style={styles.memberCard}>
          <View style={styles.memberRow}>
            <Text style={styles.memberName}>H.M.Menaka Herath</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalText}>Total </Text>
              <Text style={styles.totalNumber}>05</Text>
            </View>
          </View>
        </View>

        {/* Policy Details */}
        <Text style={styles.sectionTitle}>POLICY DETAILS</Text>
        <View style={styles.cardOutline}>
          <View style={styles.insuranceCard}>
            <View style={styles.policyHeader}>
              <View style={styles.policyInfo}>
                <Text style={styles.insuranceText}>Policy Number : <Text style={styles.boldText}>{policyDetails?.policyNumber}</Text></Text>
                <Text style={styles.insuranceText}>Policy Period : <Text style={styles.boldText}>{policyDetails?.policyPeriod}</Text></Text>
              </View>
              <View style={styles.policyIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={handleInfoPress}>
                  <Icon name="info-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Icon name="trash-o" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type Section */}
        <Text style={styles.sectionTitle}>TYPE</Text>
        <View style={styles.typeContainer}>
          {renderType('Outdoor', 'stethoscope')}
          {renderType('Indoor', 'bed')}
          {renderType('Dental', 'heartbeat')}
          {renderType('Spectacles', 'eye')}
        </View>

        {/* Health Card */}
        <Text style={styles.sectionTitle}>HEALTH CARD</Text>
        <View style={styles.healthCardContainer}>
          <Image source={require('../assets/images/healthcard.png')} style={styles.healthCard} resizeMode="contain" />
        </View>
      </ScrollView>

      {/* Bottom NavBar */}
      <View style={styles.navbar}>
        {renderNavItem('home', 'Home', handleNavigation)}
        {renderNavItem('bell', 'Notification', handleNavigation)}
        {renderPlusNavItem('Add', handleNavigation)}
        {renderNavItem('file-text', 'Policy Details', handleNavigation)}
        {renderNavItem('user', 'Profile', handleNavigation)}
      </View>
    </LinearGradient>
  );
}

// Helpers
const renderType = (label, iconName) => (
  <TouchableOpacity style={styles.typeItem} key={label}>
    <View style={styles.iconBackground}>
      <Icon name={iconName} size={30} color="#000000" />
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
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13515C',
  },
  sheText: {
    color: '#E12427',
  },
  body: {
    padding: 15,
  },
  bannerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  banner: {
    width: 200,
    height: 60,
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
  memberName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  totalBadge: {
    backgroundColor: '#16858D',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
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
  policyInfo: {
    flex: 1,
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
    height: 180,
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
});