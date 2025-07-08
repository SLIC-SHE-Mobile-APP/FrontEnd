import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ClaimHistory1 from './ClaimHistory1'; // Import the detail view

const ClaimHistory = ({ onClose, availableHeight }) => {
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Sample claim data - replace with actual data from your API
  const claimData = [
    {
      id: 1,
      referenceNo: 'M000428',
      patientName: 'Ganeshi Kavindya',
      relationship: 'Employee',
      status: 'Approved by HR.(Approval by SLIC Pending)',
      claimType: 'Out Door',
      claimAmount: '1500.00',
      submissionDate: '22/06/2025'
    },
    {
      id: 2,
      referenceNo: 'M000428',
      patientName: 'Ganeshi Kavindya',
      relationship: 'Employee',
      status: 'Reject',
      claimType: 'Out Door',
      claimAmount: '1500.00',
      submissionDate: '22/06/2025',
      rejectReason: 'Not cross the bill'
    },
    {
      id: 3,
      referenceNo: 'M000428',
      patientName: 'Ganeshi Kavindya',
      relationship: 'Employee',
      status: 'Approved by HR.(Approval by SLIC Pending)',
      claimType: 'Out Door',
      claimAmount: '1500.00',
      submissionDate: '22/06/2025'
    }
  ];

  const getStatusColor = (status) => {
    if (status.toLowerCase().includes('reject')) {
      return '#FF6B6B';
    } else if (status.toLowerCase().includes('approved')) {
      return '#4CAF50';
    } else if (status.toLowerCase().includes('pending')) {
      return '#FF9800';
    }
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

  const renderClaimCard = (claim) => (
    <View key={claim.id} style={styles.claimCard}>
      <View style={styles.cardContent}>
        {/* Reference Number */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Reference No</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.fieldValue}>{claim.referenceNo}</Text>
        </View>

        {/* Patient Name */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Patient Name</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.fieldValue}>{claim.patientName}</Text>
        </View>

        {/* Relationship */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Relationship</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.fieldValue}>{claim.relationship}</Text>
        </View>

        {/* Status */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Status</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={[styles.fieldValue, { color: getStatusColor(claim.status) }]}>
            {claim.status}
          </Text>
        </View>

        {/* Claim Type */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Claim Type</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.fieldValue}>{claim.claimType}</Text>
        </View>

        {/* Claim Amount */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Claim Amount</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.fieldValue}>{claim.claimAmount}</Text>
        </View>

        {/* Submission Date */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Submission Date</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.fieldValue}>{claim.submissionDate}</Text>
        </View>

        {/* Reject Reason (if applicable) */}
        {claim.rejectReason && (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Reject Reason</Text>
            <Text style={styles.separator}>:</Text>
            <Text style={[styles.fieldValue, { color: '#FF6B6B' }]}>{claim.rejectReason}</Text>
          </View>
        )}
      </View>

      {/* More button */}
      <TouchableOpacity 
        style={styles.moreButton}
        onPress={() => handleMorePress(claim)}
      >
        <Text style={styles.moreButtonText}>More</Text>
      </TouchableOpacity>
    </View>
  );

  // Show detail view if requested
  if (showDetailView) {
    return (
      <ClaimHistory1 
        onClose={handleBackFromDetail}
        claimData={selectedClaim}
      />
    );
  }

  return (
    <LinearGradient
          colors={["#FFFFFF", "#6DD3D3"]}
          style={{
            flex: 1,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            overflow: "hidden",
          }}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Claim History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
          </TouchableOpacity>
        </View>

        {/* Claims List */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {claimData.map(renderClaimCard)}
        </ScrollView>
   
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
    paddingRight:20,
    paddingLeft:20,
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
    paddingRight: 20,
    paddingLeft: 20
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 25,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    fontFamily: 'AbhayaLibreMedium',
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
    fontFamily: 'AbhayaLibreMedium',
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
    fontFamily: 'AbhayaLibreMedium',
    fontWeight: '500',
  },
});

export default ClaimHistory;