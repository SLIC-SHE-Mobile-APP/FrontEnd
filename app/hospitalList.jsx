import { FontAwesome, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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

// API endpoints mapped by category id
const API_ENDPOINTS = {
  approved: 'http://203.115.11.229:1002/api/HospitalListAppCon/GetHospitalList',
  notApproved: 'http://203.115.11.229:1002/api/HospitalListNonAppCon/GetNotApprovedHospitals',
  dental: 'http://203.115.11.229:1002/api/UnapprovedProviders/dentals',
  pharmacy: 'http://203.115.11.229:1002/api/UnapprovedProviders/pharmacies',
  optical: 'http://203.115.11.229:1002/api/UnapprovedProviders/opticians',
  medical: 'http://203.115.11.229:1002/api/UnapprovedProviders/medicals',
};

// Navigation items with icons and titles
const navigationItems = [
  { id: 'approved', title: 'Approved Hospital', icon: 'shield-checkmark' },
  { id: 'notApproved', title: 'Not Approved Hospital', icon: 'shield-half' },
  { id: 'dental', title: 'Dental Care', icon: 'medical' },
  { id: 'pharmacy', title: 'Pharmacy', icon: 'fitness' },
  { id: 'optical', title: 'Optical / Eye Care', icon: 'eye' },
  { id: 'medical', title: 'Medical Services', icon: 'heart' },
];

const HospitalList = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('approved');
  const [searchText, setSearchText] = useState('');
  const [dataMap, setDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});

  const sidebarScrollRef = useRef(null);
  const contentScrollRef = useRef(null);

  // Fetch data for the active section from API
  const fetchData = async (sectionId) => {
    // If already loading or data exists, skip fetching again
    if (loadingMap[sectionId] || dataMap[sectionId]) return;

    setLoadingMap(prev => ({ ...prev, [sectionId]: true }));
    setErrorMap(prev => ({ ...prev, [sectionId]: null }));

    try {
      const response = await axios.get(API_ENDPOINTS[sectionId]);

      // Normalize data for each section
      let normalizedData = [];
      switch (sectionId) {
        case 'approved':
          // API returns array of { hosp_Name, district, contact_No1 }
          normalizedData = response.data.map((item, index) => ({
            id: index.toString(),
            name: item.hosp_Name || 'N/A',
            location: item.district || 'N/A',
            phone: item.contact_No1 || '',
          }));
          break;
        case 'notApproved':
          // API returns array of { name }
          normalizedData = response.data.map((item, index) => ({
            id: index.toString(),
            name: item.name || 'N/A',
            location: '',
            phone: '',
          }));
          break;
        case 'dental':
          // API returns array of { refNoD, dentalName, address }
          normalizedData = response.data.map((item) => ({
            id: item.refNoD?.toString() || Math.random().toString(),
            name: item.dentalName || 'N/A',
            location: item.address || '',
            phone: '',
          }));
          break;
        case 'pharmacy':
          // API returns array of { refNoP, pharmName, address }
          normalizedData = response.data.map((item) => ({
            id: item.refNoP?.toString() || Math.random().toString(),
            name: item.pharmName || 'N/A',
            location: item.address || '',
            phone: '',
          }));
          break;
        case 'optical':
          // API returns array of { refNoO, opticianName, address }
          normalizedData = response.data.map((item) => ({
            id: item.refNoO?.toString() || Math.random().toString(),
            name: item.opticianName || 'N/A',
            location: item.address || '',
            phone: '',
          }));
          break;
        case 'medical':
          // API returns array of { refNoM, medicalName, address }
          normalizedData = response.data.map((item) => ({
            id: item.refNoM?.toString() || Math.random().toString(),
            name: item.medicalName || 'N/A',
            location: item.address || '',
            phone: '',
          }));
          break;
        default:
          normalizedData = [];
      }

      setDataMap(prev => ({ ...prev, [sectionId]: normalizedData }));
    } catch (error) {
      setErrorMap(prev => ({ ...prev, [sectionId]: 'Failed to load data' }));
      console.error(`Error fetching ${sectionId} data:`, error);
    } finally {
      setLoadingMap(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  // Fetch data whenever activeSection changes
  React.useEffect(() => {
    fetchData(activeSection);
    setSearchText('');
    // Scroll content list to top
    contentScrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [activeSection]);

  // Get filtered data based on search
  const filteredData = (dataMap[activeSection] || []).filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Sidebar item renderer
  const renderSidebarItem = ({ item }) => {
    const isActive = activeSection === item.id;
    return (
      <TouchableOpacity
        style={[styles.sidebarItem, isActive && styles.activeSidebarItem]}
        onPress={() => setActiveSection(item.id)}
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

  // Hospital/item card renderer
  const renderHospitalItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <Text style={styles.hospitalName}>{item.name}</Text>
        {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
        {item.phone ? (
          <TouchableOpacity
            style={styles.phoneContainer}
            onPress={() => Linking.openURL(`tel:${item.phone.replace(/[^0-9]/g, '')}`)}
          >
            <FontAwesome name="phone" size={16} color="#00ADBB" />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Get current title for header
  const getCurrentTitle = () => {
    const currentItem = navigationItems.find(item => item.id === activeSection);
    return currentItem ? currentItem.title : 'Hospital List';
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
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
            keyExtractor={item => item.id}
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
            <Text style={styles.sectionCount}>
              ({loadingMap[activeSection] ? 'Loading...' : `${filteredData.length} found`})
            </Text>
          </View>

          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />

          {/* Loading Indicator */}
          {loadingMap[activeSection] && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color="#00ADBB" />
            </View>
          )}

          {/* Error Message */}
          {errorMap[activeSection] && (
            <View style={{ padding: 20 }}>
              <Text style={{ color: 'red', textAlign: 'center' }}>{errorMap[activeSection]}</Text>
            </View>
          )}

          {/* Hospital List */}
          {!loadingMap[activeSection] && !errorMap[activeSection] && (
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
          )}
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
  // activeIndicatorVisible: {
  //   height: 20,
  // },
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
