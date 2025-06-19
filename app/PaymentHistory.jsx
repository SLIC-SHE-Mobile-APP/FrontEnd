import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PaymentHistory = ({ onClose }) => {
  const paymentData = [
    {
      claimNumber: 'G/010/SHE/22200',
      receivedOn: '12/05/2025',
      transactionNo: '1234',
      treatmentDate: '12/05/2025',
      claimAmount: 'Member',
      paidAmount: 'Rs.1000.00',
      payeeName: 'Nipuni',
      patientName: 'Udhantha',
      referenceNo: '9034',
      bhtNo: '',
      claimStatus: 'Accept',
      chequeNo: '123412345',
      paidDate: '12/05/2025'
    },
    {
      claimNumber: 'G/010/SHE/22200',
      receivedOn: '12/05/2025',
      transactionNo: '1234',
      treatmentDate: '12/05/2025',
      claimAmount: 'Member',
      paidAmount: 'Rs.1000.00',
      payeeName: 'Nipuni',
      patientName: 'Udhantha',
      referenceNo: '9034',
      bhtNo: '',
      claimStatus: 'Reject',
      chequeNo: '123412345',
      paidDate: '12/05/2025',
      note: 'Pending Requirement'
    }
  ];

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Payment History</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Policy Info Card */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Payment History For :</Text>
          <Text style={styles.policyNumber}>G/010/SHE/19400/24</Text>
        </View>

        {/* Payment Cards */}
        {paymentData.map((payment, index) => (
          <View key={index} style={styles.paymentCard}>
            <View style={styles.paymentGrid}>
              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Claim Number :</Text>
                  <Text style={styles.value}>{payment.claimNumber}</Text>
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.label}>Patient Name :</Text>
                  <Text style={styles.value}>{payment.patientName}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Received On :</Text>
                  <Text style={styles.value}>{payment.receivedOn}</Text>
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.label}>Reference No :</Text>
                  <Text style={styles.value}>{payment.referenceNo}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Transaction No :</Text>
                  <Text style={styles.value}>{payment.transactionNo}</Text>
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.label}>B.H.T. No :</Text>
                  <Text style={styles.value}>{payment.bhtNo || '-'}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Treatment Date :</Text>
                  <Text style={styles.value}>{payment.treatmentDate}</Text>
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.label}>Claim Status :</Text>
                  <Text style={[
                    styles.value,
                    payment.claimStatus === 'Accept' ? styles.acceptStatus : styles.rejectStatus
                  ]}>
                    {payment.claimStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Claim amount :</Text>
                  <Text style={styles.value}>{payment.claimAmount}</Text>
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.label}>Cheque No :</Text>
                  <Text style={styles.value}>{payment.chequeNo}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Paid Amount :</Text>
                  <Text style={styles.value}>{payment.paidAmount}</Text>
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.label}>Paid Date :</Text>
                  <Text style={styles.value}>{payment.paidDate}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <Text style={styles.label}>Payee Name :</Text>
                  <Text style={styles.value}>{payment.payeeName}</Text>
                </View>
                <View style={styles.rightColumn} />
              </View>

              {payment.note && (
                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>Note : </Text>
                  <Text style={styles.noteValue}>{payment.note}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  policyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  },
  paymentCard: {
    backgroundColor: 'rgba(129, 206, 206, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(129, 206, 206, 0.5)',
  },
  paymentGrid: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 10,
  },
  label: {
    fontSize: 16,
    color: '#13646D',
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#13646D',
    fontWeight: '600',
  },
  acceptStatus: {
    color: '#2E7D32',
  },
  rejectStatus: {
    color: '#D32F2F',
  },
  noteContainer: {
    flexDirection: 'row',
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 100, 109, 0.2)',
  },
  noteLabel: {
    fontSize: 14,
    color: '#13646D',
    fontWeight: '500',
  },
  noteValue: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
    flex: 1,
  },
});

export default PaymentHistory;
