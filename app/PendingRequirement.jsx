import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

const PendingRequirement = ({ onClose }) => {
  const [pendingRequirements, setPendingRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom Loading Animation Component
  const LoadingIcon = () => {
    const [rotateAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(1));

    useEffect(() => {
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
            <Icon name="heartbeat" size={20} color="#FFFFFF" />
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
        <Text style={styles.loadingText}>Loading Pending Requirements...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  useEffect(() => {
    fetchPendingRequirements();
  }, []);

  const fetchPendingRequirements = async () => {
    try {
      setLoading(true);
      
      // Get policy and member numbers from SecureStore
      const policyNumber = await SecureStore.getItemAsync("selected_policy_number");
      const memberNumber = await SecureStore.getItemAsync("selected_member_number");
      
      if (!policyNumber || !memberNumber) {
        Alert.alert('Error', 'Policy or member information not found');
        setLoading(false);
        return;
      }

      // API call
      const response = await fetch(`${API_BASE_URL}/DocumentLogCon/GetDocumentLogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          polNo: policyNumber,
          memId: memberNumber
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API data to match the expected format
      const transformedData = data.map((item, index) => ({
        id: index + 1,
        claimNumber: item.claimNo.trim(), // Remove extra spaces
        requiredDocuments: item.documents.map(doc => doc.description),
        requiredDate: formatDate(item.reqDate),
        
        // Keep original API data for passing to next screen
        polNo: item.polNo,
        trnsNo: item.trnsNo,
        originalReqDate: item.reqDate, // Keep original ISO date
        documents: item.documents // Keep full document objects with codes
      }));

      setPendingRequirements(transformedData);
      
    } catch (error) {
      console.error('Error fetching pending requirements:', error);
      Alert.alert('Error', 'Failed to fetch pending requirements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Store individual fields in SecureStore
  const storeIndividualData = async (data) => {
    try {
      await SecureStore.setItemAsync('current_claim_number', data.claimNumber);
      await SecureStore.setItemAsync('current_pol_no', data.polNo);
      await SecureStore.setItemAsync('current_trns_no', data.trnsNo);
      await SecureStore.setItemAsync('current_required_date', data.requiredDate);
      await SecureStore.setItemAsync('current_original_req_date', data.originalReqDate);
      await SecureStore.setItemAsync('current_documents', JSON.stringify(data.documents));
      await SecureStore.setItemAsync('current_required_documents', JSON.stringify(data.requiredDocuments));
      await SecureStore.setItemAsync('current_requirement_id', data.id.toString());
      
      console.log('All fields stored successfully in SecureStore');
    } catch (error) {
      console.error('Error storing individual data:', error);
      throw error;
    }
  };

  const handleSendPress = async (requirement) => {
    try {
      console.log('Navigating with data:', requirement);
      
      // Store all individual fields in SecureStore
      await storeIndividualData(requirement);
      
      // Close the current modal/page first
      if (onClose) {
        onClose();
      }
      
      // Add a small delay to ensure modal closes properly
      setTimeout(() => {
        router.push({
          pathname: '/PendingRequirement1',
          params: { 
            // Minimal params for immediate access - main data is in SecureStore
            requirementId: requirement.id.toString(),
            claimNumber: requirement.claimNumber,
            dataSource: 'securestore' // Flag to indicate data is in SecureStore
          }
        });
      }, 100);
      
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to store requirement data. Please try again.');
    }
  };

  const renderRequirementCard = (requirement) => (
    <View key={requirement.id} style={styles.requirementCard}>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Claim Number</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{requirement.claimNumber}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Required Documents</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{requirement.requiredDocuments.join(', ')}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Required Date</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{requirement.requiredDate}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.sendButton}
        onPress={() => handleSendPress(requirement)}
        activeOpacity={0.7}
      >
        <Ionicons name="send" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingScreen />;
    }

    if (pendingRequirements.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={60} color="#00ADBB" />
          <Text style={styles.emptyText}>No pending requirements found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPendingRequirements}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {pendingRequirements.map(requirement => renderRequirementCard(requirement))}
      </ScrollView>
    );
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Pending Requirement</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden'
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
  // Custom Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minWidth: 200,
    minHeight: 150,
  },
  customLoadingIcon: {
    marginBottom: 15,
  },
  loadingIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16858D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6DD3D3',
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17ABB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requirementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00ADBB',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#00ADBB',
    fontWeight: '500',
    width: 120,
  },
  colon: {
    marginHorizontal: 5,
    fontSize: 14,
    color: '#13646D',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#13646D',
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#00ADBB',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#13646D',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00ADBB',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PendingRequirement;