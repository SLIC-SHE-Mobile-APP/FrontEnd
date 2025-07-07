import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PendingIntimations = ({ onClose, onEditClaim }) => {
  const navigation = useNavigation();
  
  const [pendingClaims, setPendingClaims] = useState([
    {
      id: '1',
      referenceNo: 'M000428',
      enteredBy: 'D.A.R.C Dahanayake',
      relationship: 'Son',
      claimType: 'Out-door',
      createdOn: '24-12-2020',
      status: 'Status',
    },
    {
      id: '2',
      referenceNo: 'M000429',
      enteredBy: 'D.A.R.C Dahanayake',
      relationship: 'Son',
      claimType: 'In-door',
      createdOn: '25-12-2020', 
      status: 'Status',
    },
    {
      id: '3',
      referenceNo: 'M000429',
      enteredBy: 'D.A.R.C Dahanayake',
      relationship: 'Son',
      claimType: 'In-door',
      createdOn: '25-12-2020', 
      status: 'Status',
    },
  ]);

  const handleEdit = (claim) => {
    try {
      if (onEditClaim) {
        onEditClaim(claim);
      }
      
      navigation.navigate('EditClaimIntimation', { 
        claimData: claim,
        onUpdate: (updatedClaim) => {
          setPendingClaims(prev => 
            prev.map(item => 
              item.id === updatedClaim.id ? updatedClaim : item
            )
          );
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Could not navigate to edit page');
    }
  };

  // Handle Delete
  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this claim?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPendingClaims((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Pending Intimations</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#2E7D7D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {pendingClaims.map((claim) => (
          <View key={claim.id} style={styles.claimCard}>
            <View style={styles.claimContent}>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Reference No :</Text>
                <Text style={styles.claimValue}>{claim.referenceNo}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Patient Name :</Text>
                <Text style={styles.claimValue}>{claim.enteredBy}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Relationship :</Text>
                <Text style={styles.claimValue}>{claim.relationship}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Claim Type :</Text>
                <Text style={styles.claimValue}>{claim.claimType}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Created on :</Text>
                <Text style={styles.claimValue}>{claim.createdOn}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Status :</Text>
                <Text style={styles.claimValue}>{claim.status}</Text>
              </View>
            </View>

            <View style={styles.actionIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleEdit(claim)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDelete(claim.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#2E7D7D',
    textAlign: 'left',
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 20
  },
  claimCard: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimContent: {
    flex: 1,
  },
  claimRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: '#4DD0E1',
    fontWeight: '500',
    width: 100,
    flexShrink: 0,
  },
  claimValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 1,
    marginLeft: 10,
  },
  actionIcons: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#2E7D7D',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
});

export default PendingIntimations;