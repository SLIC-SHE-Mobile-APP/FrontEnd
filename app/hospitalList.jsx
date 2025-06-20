import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef } from 'react';
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Sample data for different sections
const approvedHospitals = [
  { id: '1', name: 'Lanka Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '0114 - 530 010' },
  { id: '2', name: 'Hemas Hospitals (Pvt) Ltd.', location: 'Wattala', phone: '0114 - 530 057' },
  { id: '3', name: 'Asiri Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '0114 - 530 018' },
  { id: '4', name: 'Leasons Hospitals (Pvt) Ltd.', location: 'Ragama', phone: '0114 - 530 058' },
  { id: '5', name: 'Ninewells Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '0114 - 530 028' },
  { id: '6', name: 'Nawaloka Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '0114 - 530 000' },
  { id: '7', name: 'Durdans Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '0114 - 530 000' },
  { id: '8', name: 'Kings Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '0114 - 530 000' },
];

const notApprovedHospitals = [
  { id: '1', name: 'Number 1 Hospital', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '2', name: 'Number 2 Hospital', location: 'Wattala', phone: '011 - 4530 000' },
  { id: '3', name: 'Number 3 Hospital', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '4', name: 'Number 4 Hospital', location: 'Ragama', phone: '011 - 4530 000' },
  { id: '5', name: 'Number 5 Hospital', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '6', name: 'Number 6 Hospital', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '7', name: 'Number 7 Hospital', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '8', name: 'Number 8 Hospital', location: 'Colombo', phone: '011 - 4530 000' },
];

const dentalCare = [
  { id: '1', name: 'Micro Dental Care', location: 'Dental Town', phone: '011 - 2345 678' },
  { id: '2', name: 'Elite Dental Clinic', location: 'Colombo', phone: '011 - 2345 679' },
  { id: '3', name: 'Prime Dental Care', location: 'Kandy', phone: '011 - 2345 680' },
];

const pharmacy = [
  { id: '1', name: 'New Lanka Medicare (Pvt) Ltd', location: 'Kandy', phone: '011 - 3456 789' },
  { id: '2', name: 'Health Plus Pharmacy', location: 'Colombo', phone: '011 - 3456 790' },
  { id: '3', name: 'Care Pharmacy', location: 'Galle', phone: '011 - 3456 791' },
];

const optical = [
  { id: '1', name: 'Eyescape Optical', location: '61, New Kandy Road Ratmalana', phone: '011 - 4567 892' },
  { id: '2', name: 'Vision Care Optical', location: 'Colombo', phone: '011 - 4567 893' },
  { id: '3', name: 'Clear Sight Optical', location: 'Kandy', phone: '011 - 4567 894' },
];

const medical = [
  { id: '1', name: 'Medcare Medical Services', location: 'Katunayake', phone: '011 - 5678 903' },
  { id: '2', name: 'Prime Medical Center', location: 'Colombo', phone: '011 - 5678 904' },
  { id: '3', name: 'Health First Medical', location: 'Kandy', phone: '011 - 5678 905' },
];

const navigationItems = [
  { id: 'approved', title: 'Approved\nHospital', data: approvedHospitals },
  { id: 'notApproved', title: 'Not Approved\nHospital', data: notApprovedHospitals },
  { id: 'dental', title: 'Dental', data: dentalCare },
  { id: 'pharmacy', title: 'Pharmacy', data: pharmacy },
  { id: 'optical', title: 'Optical / Eye', data: optical },
  { id: 'medical', title: 'Medical', data: medical },
];

const HospitalList = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('approved');
  const [searchText, setSearchText] = useState('');
  const horizontalScrollRef = useRef(null);
  const contentScrollRef = useRef(null);

  const getCurrentData = () => {
    const currentItem = navigationItems.find(item => item.id === activeSection);
    return currentItem ? currentItem.data : [];
  };

  const filteredData = getCurrentData().filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleNavItemPress = (sectionId, index) => {
    setActiveSection(sectionId);
    setSearchText('');
    
    // Scroll to center the selected item using scrollToIndex
    try {
      horizontalScrollRef.current?.scrollToIndex({
        index: index,
        animated: true,
        viewPosition: 0.5, // Center the item
      });
    } catch (error) {
      // Fallback to scrollToOffset if scrollToIndex fails
      const itemWidth = 120;
      const scrollToX = Math.max(0, (index * itemWidth) - (screenWidth / 2) + (itemWidth / 2));
      horizontalScrollRef.current?.scrollToOffset({ offset: scrollToX, animated: true });
    }
  };

  const renderNavItem = ({ item, index }) => {
    const isActive = activeSection === item.id;
    return (
      <TouchableOpacity
        style={[styles.navItem, isActive && styles.activeNavItem]}
        onPress={() => handleNavItemPress(item.id, index)}
        activeOpacity={0.7}
      >
        <Text style={[styles.navItemText, isActive && styles.activeNavItemText]}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHospitalItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <Text style={styles.hospitalName}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
        {item.phone && (
          <TouchableOpacity
            style={styles.phoneContainer}
            onPress={() => Linking.openURL(`tel:${item.phone.replace(/[^0-9]/g, '')}`)}
          >
            <FontAwesome name="phone" size={16} color="#00ADBB" />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={styles.container}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Hospital List</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Navigation */}
      <View style={styles.navigationContainer}>
        <FlatList
          ref={horizontalScrollRef}
          data={navigationItems}
          renderItem={renderNavItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navContentContainer}
          style={styles.horizontalNav}
        />
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Hospital List */}
        <FlatList
          ref={contentScrollRef}
          data={filteredData}
          keyExtractor={(item) => `${activeSection}-${item.id}`}
          renderItem={renderHospitalItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'left',
    flex: 1,
  },
  navigationContainer: {
    backgroundColor: '#E8F8F8',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D0E8E8',
  },
  horizontalNav: {
    flexGrow: 0,
  },
  navContentContainer: {
    paddingHorizontal: 10,
  },
  navItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B2DFDF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeNavItem: {
    backgroundColor: '#00ADBB',
    borderColor: '#0093A4',
  },
  navItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#13646D',
    textAlign: 'center',
    lineHeight: 16,
  },
  activeNavItemText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchInput: {
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginVertical: 15,
    height: 40,
    borderColor: '#B2B2B2',
    borderWidth: 0.5,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderColor: '#16858D',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003B4A',
    textAlign: 'center',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    marginLeft: 5,
    color: '#00ADBB', 
    fontWeight: 'bold',
  },
});

export default HospitalList;