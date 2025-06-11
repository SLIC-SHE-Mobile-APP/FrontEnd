import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

export default function PolicyHome() {
  const navigation = useNavigation();
  const [policyDetails, setPolicyDetails] = useState(null);

  useEffect(() => {
    // Simulate fetching policy details
    setPolicyDetails({
      insuranceCover: 'Rs. 0.00',
      policyPeriod: '2020-02-13 - 2020-02-13',
    });
  }, []);

  const handleNavigation = (label) => {
    if (label === 'Policy Details') {
      navigation.navigate('HealthPolicyDetails');
    }
    // Add other navigation cases here as needed
    // else if (label === 'Profile') {
    //   navigation.navigate('Profile');
    // }
    // else if (label === 'Notification') {
    //   navigation.navigate('Notification');
    // }
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/userDetails')}>
            <Icon name="bars" size={24} color="#13515C" />
          </TouchableOpacity>
          <Text style={styles.headerText}><Text style={styles.sheText}>SHE </Text>Home</Text>
          <TouchableOpacity>
            <Icon name="plus" size={24} color="#13515C" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Body */}
      <ScrollView contentContainerStyle={styles.body}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/300x100' }} style={styles.banner} />
        </View>

        {/* Member Section */}
        <Text style={styles.sectionTitle}>MEMBER</Text>
        <View style={styles.membersContainer}>
          {renderMember('Person 1')}
          {renderMember('Person 2')}
          {renderMember('Person 3')}
          {renderMember('Person 4')}
        </View>

        {/* Insurance Details */}
        <View style={styles.cardOutline}>
          <View style={styles.insuranceCard}>
            <Text style={styles.insuranceText}>Insurance cover: <Text style={styles.boldText}>{policyDetails?.insuranceCover}</Text></Text>
            <Text style={styles.insuranceText}>Policy Period: <Text style={styles.boldText}>{policyDetails?.policyPeriod}</Text></Text>
          </View>
        </View>

        {/* Type Section */}
        <Text style={styles.sectionTitle}>TYPE</Text>
        <View style={styles.typeContainer}>
          {renderType('Outdoor', 'stethoscope')}
          {renderType('Spectacles', 'eye')}
          {renderType('Dental', 'heartbeat')}
          {renderType('Indoor', 'bed')}
        </View>

        {/* Health Card */}
        <Text style={styles.sectionTitle}>HEALTH CARD</Text>
        <View style={styles.healthCardContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/300x180' }} style={styles.healthCard} />
        </View>
      </ScrollView>
      {/* Bottom NavBar */}
      <View style={styles.navbar}>
        {renderNavItem('home', 'Home', handleNavigation)}
        {renderNavItem('bell', 'Notification', handleNavigation)}
        {renderNavItem('file-text', 'Policy Details', handleNavigation)}
        {renderNavItem('user', 'Profile', handleNavigation)}
      </View>
    </LinearGradient>
  );
}

// Helpers
const renderType = (label, iconName) => (
  <TouchableOpacity style={styles.typeItem}>
    <View style={styles.iconBackground}>
      <Icon name={iconName} size={30} color="#000000" />
    </View>
    <Text style={styles.typeText}>{label}</Text>
  </TouchableOpacity>
);

const renderMember = (name) => (
  <TouchableOpacity style={styles.memberItem}>
    <Icon name="user-circle" size={40} color="white" />
    <Text style={styles.memberText}>{name}</Text>
  </TouchableOpacity>
);

const renderNavItem = (iconName, label, onPress) => (
  <TouchableOpacity style={styles.navItem} onPress={() => onPress(label)}>
    <Icon name={iconName} size={25} color="white" />
    <Text style={styles.navText}>{label}</Text>
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
    width: 300,
    height: 100,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004D40',
    marginVertical: 10,
  },
  membersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  memberItem: {
    alignItems: 'center',
  },
  memberText: {
    marginTop: 5,
    fontSize: 14,
    color: '#A79C9C',
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
  insuranceText: {
    fontSize: 16,
    color: 'white',
  },
  boldText: {
    fontWeight: 'bold',
    color: 'white',
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
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: '#FFFFFF',
  },
});