import { FontAwesome, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// API endpoints mapped by category id
const API_ENDPOINTS = {
  approved: `${API_BASE_URL}/HospitalListAppCon/GetHospitalList`,
  notApproved: `${API_BASE_URL}/HospitalListNonAppCon/GetNotApprovedHospitals`,
  dental: `${API_BASE_URL}/UnapprovedProviders/dentals`,
  pharmacy: `${API_BASE_URL}/UnapprovedProviders/pharmacies`,
  optical: `${API_BASE_URL}/UnapprovedProviders/opticians`,
  medical: `${API_BASE_URL}/UnapprovedProviders/medicals`,
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

  // Custom Loading Animation Component
  const LoadingIcon = () => {
    const [rotateAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(1));

    React.useEffect(() => {
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
            <Icon name="heartbeat" size={18} color="#FFFFFF" />
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
        <Text style={styles.loadingText}>Loading Hospital Data...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

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
  // Replace the existing filteredData logic (around line 226)
  const filteredData = React.useMemo(() => {
    const currentData = dataMap[activeSection] || [];

    if (!searchText.trim()) {
      return currentData;
    }

    const searchTerm = searchText.toLowerCase().trim();

    const filtered = currentData.filter(item => {
      // Check if name starts with search term (first priority)
      const nameStartsWith = item.name && item.name.toLowerCase().startsWith(searchTerm);

      // Check if location starts with search term (second priority)  
      const locationStartsWith = item.location && item.location.toLowerCase().startsWith(searchTerm);

      // Check if any word in name starts with search term (third priority)
      const nameWordsStartWith = item.name && item.name.toLowerCase().split(' ').some(word =>
        word.startsWith(searchTerm)
      );

      // Check if any word in location starts with search term (fourth priority)
      const locationWordsStartWith = item.location && item.location.toLowerCase().split(' ').some(word =>
        word.startsWith(searchTerm)
      );

      return nameStartsWith || locationStartsWith || nameWordsStartWith || locationWordsStartWith;
    });

    // Sort results to prioritize matches that start with the search term
    return filtered.sort((a, b) => {
      const aNameStarts = a.name && a.name.toLowerCase().startsWith(searchTerm);
      const bNameStarts = b.name && b.name.toLowerCase().startsWith(searchTerm);
      const aLocationStarts = a.location && a.location.toLowerCase().startsWith(searchTerm);
      const bLocationStarts = b.location && b.location.toLowerCase().startsWith(searchTerm);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;
      if (aLocationStarts && !bLocationStarts) return -1;
      if (!aLocationStarts && bLocationStarts) return 1;
      return 0;
    });
  }, [dataMap, activeSection, searchText]);


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
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search hospitals, locations..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing" // iOS only
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchText('')}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>


          {/* Loading Screen */}
          {loadingMap[activeSection] && <LoadingScreen />}

          {/* Error Message */}
          {errorMap[activeSection] && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMap[activeSection]}</Text>
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
                  <Text style={styles.emptyText}>
                    {searchText.trim()
                      ? `No results found for "${searchText}"`
                      : "No hospitals found"
                    }
                  </Text>
                  <Text style={styles.emptySubText}>
                    {searchText.trim()
                      ? "Try a different search term"
                      : "Try adjusting your search"
                    }
                  </Text>
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
  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingRight: 45,
    height: 40,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    fontSize: 13,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 10,
    padding: 5,
  },

  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    minWidth: 180,
    minHeight: 120,
  },
  customLoadingIcon: {
    marginBottom: 12,
  },
  loadingIconOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16858D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6DD3D3',
  },
  loadingIconInner: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#17ABB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 3,
  },
  loadingSubText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
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