import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  { id: '4', name: 'Health Plus Pharmacy', location: 'Colombo', phone: '011 - 3456 790' },
  { id: '5', name: 'Care Pharmacy', location: 'Galle', phone: '011 - 3456 791' },
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
  { id: '4', name: 'Medcare Medical Services', location: 'Katunayake', phone: '011 - 5678 903' },
  { id: '5', name: 'Prime Medical Center', location: 'Colombo', phone: '011 - 5678 904' },
  
];

const navigationItems = [
  { id: 'approved', title: 'Approved Hospital', data: approvedHospitals, icon: 'shield-checkmark' },
  { id: 'notApproved', title: 'Not Approved Hospital', data: notApprovedHospitals, icon: 'shield-half' },
  { id: 'dental', title: 'Dental Care', data: dentalCare, icon: 'medical' },
  { id: 'pharmacy', title: 'Pharmacy', data: pharmacy, icon: 'fitness' },
  { id: 'optical', title: 'Optical / Eye Care', data: optical, icon: 'eye' },
  { id: 'medical', title: 'Medical Services', data: medical, icon: 'heart' },
];

const HospitalList = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('approved');
  const [searchText, setSearchText] = useState('');
  const sidebarScrollRef = useRef(null);
  const contentScrollRef = useRef(null);

  const getCurrentData = () => {
    const currentItem = navigationItems.find(item => item.id === activeSection);
    return currentItem ? currentItem.data : [];
  };

  const filteredData = getCurrentData().filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleNavItemPress = (sectionId) => {
    setActiveSection(sectionId);
    setSearchText('');
    // Reset content scroll to top when switching categories
    contentScrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderSidebarItem = ({ item }) => {
    const isActive = activeSection === item.id;
    return (
      <TouchableOpacity
        style={[styles.sidebarItem, isActive && styles.activeSidebarItem]}
        onPress={() => handleNavItemPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sidebarItemContent}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={isActive ? '#FFFFFF' : '#00ADBB'} 
            style={styles.sidebarIcon}
          />
          <Text style={[styles.sidebarItemText, isActive && styles.activeSidebarItemText]}>
            {item.title}
          </Text>
          <View style={[styles.activeIndicator, isActive && styles.activeIndicatorVisible]} />
        </View>
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

  const getCurrentTitle = () => {
    const currentItem = navigationItems.find(item => item.id === activeSection);
    return currentItem ? currentItem.title : 'Hospital List';
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

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Vertical Sidebar Navigation */}
        <View style={styles.sidebar}>
          
          <FlatList
            ref={sidebarScrollRef}
            data={navigationItems}
            renderItem={renderSidebarItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.sidebarContent}
            style={styles.sidebarList}
          />
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{getCurrentTitle()}</Text>
            <Text style={styles.sectionCount}>({filteredData.length} found)</Text>
          </View>

          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#B0B0B0" />
                <Text style={styles.emptyText}>No hospitals found</Text>
                <Text style={styles.emptySubText}>Try adjusting your search</Text>
              </View>
            }
          />
        </View>
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
    paddingBottom: 15,
    backgroundColor: 'transparent',
    zIndex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 100, 109, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    // textAlign: 'center',
    flex: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 100,
    backgroundColor: 'rgba(232, 248, 248, 0.8)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 173, 187, 0.2)',
  },
  sidebarHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 173, 187, 0.2)',
    backgroundColor: 'rgba(0, 173, 187, 0.1)',
  },
  sidebarHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
  },
  sidebarList: {
    flex: 1,
  },
  sidebarContent: {
    paddingVertical: 5,
  },
  sidebarItem: {
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeSidebarItem: {
    backgroundColor: '#00ADBB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  sidebarItemContent: {
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  sidebarIcon: {
    marginBottom: 5,
  },
  sidebarItemText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#13646D',
    textAlign: 'center',
    lineHeight: 12,
  },
  activeSidebarItemText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    width: 3,
    height: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ translateY: -10 }],
  },
  activeIndicatorVisible: {
    height: 20,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#13646D',
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 15,
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 173, 187, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phoneText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#00ADBB', 
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

export default HospitalList;