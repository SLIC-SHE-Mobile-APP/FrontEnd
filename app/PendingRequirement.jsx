import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const PendingRequirement = ({ onClose }) => {
  const [pendingRequirements] = useState([
    {
      id: 1,
      claimNumber: 'G/010/SHE/22201',
      requiredDocuments: 'Medical Report',
      requiredDate: '15/07/2025'
    },
    {
      id: 2,
      claimNumber: 'G/010/SHE/22202',
      requiredDocuments: 'Prescription',
      requiredDate: '18/07/2025'
    },
    {
      id: 3,
      claimNumber: 'G/010/SHE/22203',
      requiredDocuments: 'Lab Test Results',
      requiredDate: '20/07/2025'
    },
    {
      id: 4,
      claimNumber: 'G/010/SHE/22204',
      requiredDocuments: 'X-Ray Report',
      requiredDate: '22/07/2025'
    },
    {
      id: 5,
      claimNumber: 'G/010/SHE/22205',
      requiredDocuments: 'Discharge Summary',
      requiredDate: '25/07/2025'
    }
  ]);

  const handleSendPress = (requirement) => {
    try {
      console.log('Navigating with data:', requirement);
      
      // Close the current modal/page first
      if (onClose) {
        onClose();
      }
      
      // Add a small delay to ensure modal closes properly
      setTimeout(() => {
        router.push({
          pathname: '/PendingRequirement1',
          params: { 
            claimNumber: requirement.claimNumber,
            requiredDocuments: requirement.requiredDocuments,
            requiredDate: requirement.requiredDate,
            requirementId: requirement.id.toString()
          }
        });
      }, 100);
      
    } catch (error) {
      console.error('Navigation error:', error);
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
          <Text style={styles.value}>{requirement.requiredDocuments}</Text>
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {pendingRequirements.map(requirement => renderRequirementCard(requirement))}
      </ScrollView>
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
});

export default PendingRequirement;