import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useCallback, useMemo } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

// Import your separate page components
import BankDetailsSum from './BankDetailsSum';
import ClaimDocRequired from './ClaimDocRequired';
import ClaimHistory from './ClaimHistory';
import DependentDetails from './dependentDetails';
import DownloadClaimForms from './DownloadClaimForms';
import HealthInsuCard from './HealthInsuCard';
import HospitalList from './hospitalList';
import OnlineClaimIntimations from './OnlineClaimIntimations';
import PaymentHistory from './PaymentHistory';
import PendingRequirement from './PendingRequirement';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const HealthPolicyDetails = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Memoize available height calculation
  const availableHeight = useMemo(() => {
    return screenHeight - insets.top - insets.bottom - 85;
  }, [screenHeight, insets.top, insets.bottom]);

  // Define heights with multiple strategies for different devices
  const getPageHeight = useCallback((pageName) => {
    const pageConfigs = {
      'Dependent Details': {
        minHeight: 100,
        maxHeight: 350,
        preferredRatio: 0.5,
        contentBased: true
      },
      'Health Insurance Card': {
        minHeight: 500,
        maxHeight: availableHeight * 0.9,
        preferredRatio: 0.85,
        contentBased: true
      },
      'Bank Details': {
        minHeight: 300,
        maxHeight: 450,
        preferredRatio: 0.4,
        contentBased: true
      },
      'Claim Documents Required': {
        minHeight: 450,
        maxHeight: 500,
        preferredRatio: 0.9,
        contentBased: true
      },
      'Hospitals List': {
        minHeight: 650,
        maxHeight: availableHeight * 0.95,
        preferredRatio: 0.9,
        contentBased: true
      },
      'Download Claim Forms': {
        minHeight: 400,
        maxHeight: 550,
        preferredRatio: 0.6,
        contentBased: true
      },
      'Online Claim Intimations': {
        minHeight: 300,
        maxHeight: 400,
        preferredRatio: 0.75,
        contentBased: true
      },
      'Claim History': {
        minHeight: 600,
        maxHeight: availableHeight * 0.9,
        preferredRatio: 0.85,
        contentBased: true
      },
      'Pending Requirements': {
        minHeight: 450,
        maxHeight: 600,
        preferredRatio: 0.7,
        contentBased: true
      },
      'Payment History': {
        minHeight: 550,
        maxHeight: availableHeight * 0.85,
        preferredRatio: 0.8,
        contentBased: true
      }
    };

    const config = pageConfigs[pageName] || {
      minHeight: 400,
      maxHeight: availableHeight * 0.8,
      preferredRatio: 0.8,
      contentBased: true
    };

    // Calculate preferred height
    let calculatedHeight = availableHeight * config.preferredRatio;

    // Apply constraints
    calculatedHeight = Math.max(calculatedHeight, config.minHeight);
    calculatedHeight = Math.min(calculatedHeight, config.maxHeight);

    // Ensure it doesn't exceed 95% of available height
    calculatedHeight = Math.min(calculatedHeight, availableHeight * 0.95);

    return calculatedHeight;
  }, [availableHeight]);

  // Navigation handler
  const handleNavigation = useCallback((label) => {
    try {
      if (label === 'Policy Details') {
        // Already on this page, do nothing or scroll to top
        return;
      } else if (label === 'Home') {
        navigation.goBack();
      } else if (label === 'Add') {
        router.push('/AddPolicy');
      } else if (label === 'Profile') {
        router.push('/userDetails');
      } else if (label === 'Notification') {
        // Handle notification navigation
        console.log('Notification pressed');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

  const handleButtonPress = useCallback((buttonLabel) => {
    if (!buttonLabel || typeof buttonLabel !== 'string') {
      console.error('Invalid button label:', buttonLabel);
      return;
    }
    
    setCurrentPage(buttonLabel);
    setModalVisible(true);
    
    // Animate slide in from bottom
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleCloseModal = useCallback(() => {
    // Animate slide out to bottom
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setCurrentPage('');
    });
  }, [slideAnim]);

  const renderModalContent = useCallback(() => {
    if (!currentPage) {
      return null;
    }

    const commonProps = { 
      onClose: handleCloseModal,
      availableHeight: getPageHeight(currentPage) - 100
    };

    // Wrap each component in error boundary-like try-catch
    try {
      switch (currentPage) {
        case 'Dependent Details':
          return <DependentDetails {...commonProps} />;
        case 'Health Insurance Card':
          return <HealthInsuCard {...commonProps} />;
        case 'Bank Details':
          return <BankDetailsSum {...commonProps} />;
        case 'Claim Documents Required':
          return <ClaimDocRequired {...commonProps} />;
        case 'Hospitals List':
          return <HospitalList {...commonProps} />;
        case 'Download Claim Forms':
          return <DownloadClaimForms {...commonProps} />;
        case 'Online Claim Intimations':
          return <OnlineClaimIntimations {...commonProps} />;
        case 'Claim History':
          return <ClaimHistory {...commonProps} />;
        case 'Payment History':
          return <PaymentHistory {...commonProps} />;
        case 'Pending Requirements':
          return <PendingRequirement {...commonProps} />;
        default:
          return <PlaceholderPage title={currentPage} onClose={handleCloseModal} />;
      }
    } catch (error) {
      console.error('Error rendering modal content:', error);
      return <PlaceholderPage title={currentPage} onClose={handleCloseModal} />;
    }
  }, [currentPage, handleCloseModal, getPageHeight]);

  // Navigation item renderer
  const renderNavItem = useCallback((iconName, label, onPress) => {
    if (!iconName || !label || typeof label !== 'string') {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => onPress(label)} 
        key={label}
        accessible={true}
        accessibilityLabel={label}
      >
        <Icon name={iconName} size={25} color="white" />
        <Text style={styles.navText}>{label}</Text>
      </TouchableOpacity>
    );
  }, []);

  // Memoize buttons array
  const buttons = useMemo(() => [
    'Health Insurance Card',
    'Dependent Details',
    'Bank Details',
    'Claim Documents Required',
    'Hospitals List',
    'Download Claim Forms',
    'Online Claim Intimations',
    'Claim History',
    'Pending Requirements',
    'Payment History'
  ], []);

  // Policy info data
  const policyInfo = useMemo(() => [
    'G/010/SHE/ 19400/24',
    'H M M K Herath',
    'M/S. Board of Investment Sri Lanka'
  ], []);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={styles.container}
    >
      {/* Fixed Header Section */}
      <View style={styles.headerContainer}>
        {/* Back Icon + Title */}
        <View style={styles.headerRow}>
          
          <Text style={styles.headerTitle}>
            Health Policy Details
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Policy Info Card */}
        <View style={styles.policyCard}>
          {policyInfo.map((item, idx) => (
            <Text key={idx} style={styles.policyText}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      {/* Scrollable Buttons Section */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonsWrapper}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {buttons.map((label, index) => (
              <TouchableOpacity
                key={`button-${index}`}
                style={styles.button}
                onPress={() => handleButtonPress(label)}
                accessible={true}
                accessibilityLabel={label}
              >
                <Text style={styles.buttonText}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.navbar}>
        {renderNavItem('home', 'Home', handleNavigation)}
        {renderNavItem('bell', 'Notification', handleNavigation)}
        {renderNavItem('file-text', 'Policy Details', handleNavigation)}
        {renderNavItem('user', 'Profile', handleNavigation)}
      </View>

      {/* Modal for displaying pages */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          
          <Animated.View
            style={[
              styles.animatedModal,
              {
                height: getPageHeight(currentPage),
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {renderModalContent()}
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// Enhanced Placeholder component with responsive design
const PlaceholderPage = ({ title, onClose }) => (
  <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.modalContent}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={26} color="#13646D" />
        </TouchableOpacity>
        <Text style={styles.modalHeaderTitle}>{title || 'Loading...'}</Text>
        <View style={styles.modalHeaderSpacer} />
      </View>
      
      <ScrollView 
        style={styles.placeholderScrollContainer}
        contentContainerStyle={styles.placeholderContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.placeholderText}>
          {title ? `${title} content will be displayed here` : 'Loading content...'}
        </Text>
        <Text style={styles.placeholderSubText}>
          This modal is now responsive and will adjust to different screen sizes automatically.
        </Text>
      </ScrollView>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerContainer: {
    paddingHorizontal: 15
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50
  },
  backIcon: {
    marginRight: 1,
    marginLeft: 12
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#13646D',
    letterSpacing: 0.38,
    lineHeight: 30,
    flex: 1,
    textAlign: 'center',
    marginLeft:50
  },
  headerSpacer: {
    width: 35
  },
  policyCard: {
    backgroundColor: '#48bfc8',
    borderRadius: 15,
    padding: 20,
    marginTop: 30,
    marginHorizontal: 13,
    height: 130,
    justifyContent: 'space-between'
  },
  policyText: {
    fontSize: 15,
    fontFamily: 'Adamina',
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 0.38
  },
  buttonsContainer: {
    flex: 1,
    marginTop: 35,
    marginBottom: 85
  },
  buttonsWrapper: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 30,
    flex: 1,
    overflow: 'hidden'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30
  },
  button: {
    backgroundColor: '#17ABB7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'AbhayaLibreMedium',
    fontWeight: '500'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  animatedModal: {
    backgroundColor: 'transparent',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
  },
  modalHeaderSpacer: {
    width: 26
  },
  placeholderScrollContainer: {
    flex: 1,
  },
  placeholderContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#13646D',
    textAlign: 'center',
    marginBottom: 15,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
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
});

export default HealthPolicyDetails;