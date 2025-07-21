import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../constants/index.js';
import ClaimHistory1 from './ClaimHistory1';

const ClaimHistory = ({ onClose, availableHeight }) => {
  const {
    policyNo: paramPolicyNo = '',
    memberNo: paramMemberNo = '',
  } = useLocalSearchParams();

  const [claimData, setClaimData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialising, setInitialising] = useState(true);
  const [policyNo, setPolicyNo] = useState('');
  const [memberNo, setMemberNo] = useState('');
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Initialize policy and member numbers from SecureStore or params
  useEffect(() => {
    (async () => {
      try {
        const [storedPolicy, storedMember] = await Promise.all([
          SecureStore.getItemAsync('selected_policy_number'),
          SecureStore.getItemAsync('selected_member_number'),
        ]);
        setPolicyNo(storedPolicy || paramPolicyNo);
        setMemberNo(storedMember || paramMemberNo);
      } catch (err) {
        console.warn('SecureStore read failed:', err);
        setPolicyNo(paramPolicyNo);
        setMemberNo(paramMemberNo);
      } finally {
        setInitialising(false);
      }
    })();
  }, [paramPolicyNo, paramMemberNo]);

  // Fetch claim history when policy and member numbers are available
  useEffect(() => {
    if (initialising || !policyNo || !memberNo) return;

    const fetchClaimHistory = async () => {
      try {
        setLoading(true);
        setApiError(null);

        const url = `${API_BASE_URL}/ClaimHistoryCon`;
        const params = { policy_no: policyNo, member_no: memberNo };

        console.log('GET', url, params); // for debugging

        const response = await axios.get(url, { params });
        
        if (Array.isArray(response.data)) {
          setClaimData(response.data);
        } else {
          setClaimData([response.data]); // In case single object
        }
      } catch (error) {
        console.error("Error fetching claim history:", error);
        setApiError('Failed to fetch claim history. Please try again later.');
        setClaimData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimHistory();
  }, [initialising, policyNo, memberNo]);

  const getStatusColor = (status) => {
    if (status?.toLowerCase().includes('reject')) return '#FF6B6B';
    if (status?.toLowerCase().includes('approved')) return '#4CAF50';
    if (status?.toLowerCase().includes('pending')) return '#FF9800';
    return '#17ABB7';
  };

  const handleMorePress = (claim) => {
    setSelectedClaim(claim);
    setShowDetailView(true);
  };

  const handleBackFromDetail = () => {
    setShowDetailView(false);
    setSelectedClaim(null);
  };

  const renderClaimCard = (claim, index) => (
    <View key={index} style={styles.claimCard}>
      <View style={styles.cardContent}>
        {[
          ['Reference No', claim.seqNo],
          ['Patient Name', claim.patientName],
          ['Relationship', claim.relationship],
          ['Status', claim.status],
          ['Claim Type', claim.indOut],
          ['Claim Amount', claim.claimAmount],
          ['Submission Date', new Date(claim.intimationDate).toLocaleDateString()]
        ].map(([label, value], idx) => (
          <View key={idx} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={[styles.fieldValue, label === 'Status' && { color: getStatusColor(value) }]}>{value}</Text>
          </View>
        ))}

        {/* Reject Reason */}
        {claim.slicRejectRsn ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Reject Reason</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={[styles.fieldValue, { color: '#FF6B6B' }]}>{claim.slicRejectRsn}</Text>
          </View>
        ) : null}
      </View>

      {/* More Button */}
      <TouchableOpacity style={styles.moreButton} onPress={() => handleMorePress(claim)}>
        <Text style={styles.moreButtonText}>More</Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading while initializing
  if (initialising) {
    return (
      <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#17ABB7" />
      </LinearGradient>
    );
  }

  if (showDetailView && selectedClaim) {
    return <ClaimHistory1 onClose={handleBackFromDetail} claimData={selectedClaim} />;
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Claim History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
          </TouchableOpacity>
        </View>

        {/* Policy Info Card */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Claim History For :</Text>
          <Text style={styles.policyNumber}>{policyNo}</Text>
          <Text style={styles.memberInfo}>Member No: {memberNo}</Text>
        </View>

        {/* Loading Spinner */}
        {loading ? (
          <ActivityIndicator size="large" color="#17ABB7" style={{ marginTop: 20 }} />
        ) : apiError ? (
          <Text style={styles.error}>{apiError}</Text>
        ) : claimData.length === 0 ? (
          <Text style={styles.empty}>No claim records found.</Text>
        ) : (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {claimData.map(renderClaimCard)}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  centeredContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    paddingRight: 20,
    paddingLeft: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'left',
    flex: 1,
  },
  policyCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  policyTitle: {
    fontSize: 18,
    color: '#13646D',
    marginBottom: 5,
    fontWeight: '500',
  },
  policyNumber: {
    fontSize: 18,
    color: '#13646D',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  memberInfo: {
    fontSize: 14,
    color: '#13646D',
    fontStyle: 'italic',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContent: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#17ABB7',
    fontWeight: '500',
    width: 110,
    flexShrink: 0,
  },
  separator: {
    fontSize: 14,
    color: '#17ABB7',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '400',
    flex: 1,
    flexWrap: 'wrap',
  },
  moreButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#17ABB7',
    borderRadius: 8,
  },
  moreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#13646D',
    fontSize: 16,
  },
  error: {
    textAlign: 'center',
    marginTop: 20,
    color: '#D32F2F',
    fontSize: 16,
  },
});

export default ClaimHistory;