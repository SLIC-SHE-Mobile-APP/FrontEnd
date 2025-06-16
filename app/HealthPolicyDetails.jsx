import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import your separate page components
import BankDetailsSum from './BankDetailsSum';
import ClaimDocRequired from './ClaimDocRequired';
import DependentDetails from './dependentDetails';
import DownloadClaimForms from './DownloadClaimForms';
import HealthInsuCard from './HealthInsuCard';
import HospitalList from './hospitalList';
import OnlineClaimIntimations from './OnlineClaimIntimations';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const HealthPolicyDetails = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Calculate available height (screen height minus safe areas)
  const availableHeight = screenHeight - insets.top - insets.bottom;

  // Define heights with multiple strategies for different devices
  const getPageHeight = (pageName) => {
    const pageConfigs = {
      'Dependent Details': {
        minHeight: 100,        // Minimum height in pixels
        maxHeight: 350,        // Maximum height in pixels
        preferredRatio: 0.5,   // Preferred ratio of available screen
        contentBased: true     // Allow content to determine height
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
  };

  const handleButtonPress = (buttonLabel) => {
    setCurrentPage(buttonLabel);
    setModalVisible(true);
    
    // Animate slide in from bottom
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    // Animate slide out to bottom
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setCurrentPage('');
    });
  };

  const renderModalContent = () => {
    const commonProps = { 
      onClose: handleCloseModal,
      availableHeight: getPageHeight(currentPage) - 100 // Reserve space for header
    };

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
      default:
        return <PlaceholderPage title={currentPage} onClose={handleCloseModal} />;
    }
  };

  const buttons = [
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
  ];

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{ flex: 1 }}
    >
      {/* Fixed Header Section */}
      <View style={{ paddingHorizontal: 15 }}>
        {/* Back Icon + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={23} color="#13646D" style={{ marginRight: 1, marginLeft: 12 }} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 22,
            fontFamily: 'Adamina',
            fontWeight:'800',
            color: '#13646D',
            letterSpacing: 0.38,
            lineHeight: 30,
            flex: 1,
            textAlign: 'center'
          }}>
            Health Policy Details
          </Text>
        </View>

        {/* Policy Info Card */}
        <View style={{
          backgroundColor: '#51A7AE80',
          borderRadius: 15,
          padding: 20,
          marginTop: 30,
          marginHorizontal: 13,
          height: 130,
          justifyContent: 'space-between'
        }}>
          {[
            'G/010/SHE/ 19400/24',
            'H M M K Herath',
            'M/S. Board of Investment Sri Lanka'
          ].map((item, idx) => (
            <Text
              key={idx}
              style={{
                fontSize: 15,
                fontFamily: 'Adamina',
                fontWeight: '400',
                color: '#FFFFFF',
                textAlign: 'left',
                letterSpacing: 0.38
              }}
            >
              {item}
            </Text>
          ))}
        </View>
      </View>

      {/* Scrollable Buttons Section */}
      <View style={{ flex: 1, marginTop: 35, marginBottom:30 }}>
        <View style={{
          borderRadius: 30,
          backgroundColor: '#FFFF',
          marginHorizontal: 30,
          flex: 1,
          overflow: 'hidden'
        }}>
          <ScrollView 
            contentContainerStyle={{ 
              padding: 20,
              paddingBottom: 30 
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Buttons */}
            {buttons.map((label, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: '#17ABB7',
                  width: '100%',
                  fontFamily: 'Adamina',
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                  alignItems: 'center'
                }}
                onPress={() => handleButtonPress(label)}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'AbhayaLibreMedium',
                  fontWeight: '500'
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Modal for displaying pages */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        {/* Dark overlay background */}
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          
          {/* Animated modal content with responsive height */}
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
        <Text style={styles.modalHeaderTitle}>{title}</Text>
        <View style={{ width: 26 }}></View>
      </View>
      
      <ScrollView 
        style={styles.placeholderScrollContainer}
        contentContainerStyle={styles.placeholderContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.placeholderText}>
          {title} content will be displayed here
        </Text>
        <Text style={styles.placeholderSubText}>
          This modal is now responsive and will adjust to different screen sizes automatically.
        </Text>
      </ScrollView>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
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
});

export default HealthPolicyDetails;