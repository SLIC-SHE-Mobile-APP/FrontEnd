import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import ClaimHistory1 from './ClaimHistory1'; // detail screen

const ClaimHistory = ({ onClose, availableHeight }) => {
  const [claimData, setClaimData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Replace with dynamic values if needed
  const policyNo = "G/010/SHE/19410/22";
  const memberNo = "1722";

  useEffect(() => {
    const fetchClaimHistory = async () => {
      try {
        const response = await axios.get(`http://203.115.11.229:1002/api/ClaimHistoryCon?policy_no=${policyNo}&member_no=${memberNo}`);
        if (Array.isArray(response.data)) {
          setClaimData(response.data);
        } else {
          setClaimData([response.data]); // In case single object
        }
      } catch (error) {
        console.error("Error fetching claim history:", error);
        Alert.alert("Error", "Failed to fetch claim history.");
      } finally {
        setLoading(false);
      }
    };

    fetchClaimHistory();
  }, []);

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

        {/* Loading Spinner */}
        {loading ? (
          <ActivityIndicator size="large" color="#17ABB7" />
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
});

export default ClaimHistory;
