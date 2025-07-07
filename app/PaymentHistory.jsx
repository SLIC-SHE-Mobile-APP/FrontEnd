import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

const PaymentHistory = ({ onClose }) => {
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(true);

  const policyNo = 'G/010/SHE/19520/24';
  const memberNo = '10289640';
  const fromDate = '01-JAN-24';
  const toDate = '01-JUN-24';

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await axios.get(
          `http://203.115.11.229:1002/api/ClaimHistory/GetHistory`,
          {
            params: {
              policyNo,
              memberNo,
              fromDate,
              toDate,
            },
          }
        );
        const data = Array.isArray(response.data) ? response.data : [response.data];

        const formatted = data.map(item => ({
          claimNumber: item.claiM_NO,
          receivedOn: formatDate(item.receiveD_ON),
          transactionNo: item.transactioN_NUMBER,
          treatmentDate: formatDate(item.datE_OF_TREATMENT),
          claimAmount: `Rs.${item.claiM_AMOUNT?.toFixed(2)}`,
          paidAmount: `Rs.${item.paiD_AMOUNT?.toFixed(2)}`,
          payeeName: '-', // Optional: If not in API
          patientName: item.patienT_NAME,
          referenceNo: item.referencE_NUMBER,
          bhtNo: item.bhT_NUMBER || '-',
          claimStatus: item.paiD_AMOUNT > 0 ? 'Accept' : 'Reject',
          chequeNo: '-', // Optional: If not in API
          paidDate: formatDate(item.paiD_DATE),
        }));

        setPaymentData(formatted);
      } catch (error) {
        console.error('Error fetching payment history:', error);
        setPaymentData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB');
  };

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
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Payment History</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Payment History For :</Text>
          <Text style={styles.policyNumber}>{policyNo}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#13646D" style={{ marginTop: 20 }} />
        ) : paymentData.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#13646D' }}>No payment records found.</Text>
        ) : (
          paymentData.map((payment, index) => (
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
                    <Text style={styles.value}>{payment.bhtNo}</Text>
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
                    <Text style={styles.label}>Claim Amount :</Text>
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
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Keep your existing styles unchanged
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
});

export default PaymentHistory;
