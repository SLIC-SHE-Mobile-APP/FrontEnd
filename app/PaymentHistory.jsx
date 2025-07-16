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
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const PaymentHistory = ({ onClose }) => {
  const {
    policyNo: paramPolicyNo = '',
    memberNo: paramMemberNo = '',
  } = useLocalSearchParams();

  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialising, setInitialising] = useState(true);
  const [policyNo, setPolicyNo] = useState('');
  const [memberNo, setMemberNo] = useState('');
  const [apiError, setApiError] = useState(null);

  // ✅ Format as DD-MMM-YY (e.g., 16-JUL-25)
  const formatForApi = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][dateObj.getMonth()];
    const year = String(dateObj.getFullYear()).slice(-2); // use last 2 digits of year
    return `${day}-${month}-${year}`;
  };

  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  const toDate = formatForApi(today);
  const fromDate = formatForApi(sixMonthsAgo);

  const formatDisplayDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '-');

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

  useEffect(() => {
    if (initialising || !policyNo || !memberNo) return;

    (async () => {
      try {
        setLoading(true);
        setApiError(null);

        const url = 'http://203.115.11.229:1002/api/ClaimHistory/GetHistory';
        const params = { policyNo, memberNo, fromDate, toDate };

        console.log('GET', url, params); // for debugging

        const { data } = await axios.get(url, { params });

        const list = Array.isArray(data) ? data : [data];
        setPaymentData(
          list.map((item) => ({
            claimNumber: item.claiM_NO,
            receivedOn: formatDisplayDate(item.receiveD_ON),
            transactionNo: item.transactioN_NUMBER,
            treatmentDate: formatDisplayDate(item.datE_OF_TREATMENT),
            claimAmount: `Rs.${item.claiM_AMOUNT?.toFixed(2)}`,
            paidAmount: `Rs.${item.paiD_AMOUNT?.toFixed(2)}`,
            payeeName: '-',
            patientName: item.patienT_NAME,
            referenceNo: item.referencE_NUMBER,
            bhtNo: item.bhT_NUMBER || '-',
            claimStatus: item.paiD_AMOUNT > 0 ? 'Accept' : 'Reject',
            chequeNo: '-',
            paidDate: formatDisplayDate(item.paiD_DATE),
          }))
        );
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setApiError('Something went wrong. Please try again later.');
        setPaymentData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [initialising, policyNo, memberNo, fromDate, toDate]);

  if (initialising) {
    return (
      <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.centered}>
        <ActivityIndicator size="large" color="#13646D" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
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
          <Text style={styles.dateRange}>From: {fromDate}   To: {toDate}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#13646D" style={{ marginTop: 20 }} />
        ) : apiError ? (
          <Text style={styles.error}>{apiError}</Text>
        ) : paymentData.length === 0 ? (
          <Text style={styles.empty}>No payment records found for the selected period.</Text>
        ) : (
          paymentData.map((p, i) => (
            <View key={i} style={styles.paymentCard}>
              {[
                ['Claim Number', p.claimNumber, 'Patient Name', p.patientName],
                ['Received On', p.receivedOn, 'Reference No', p.referenceNo],
                ['Transaction No', p.transactionNo, 'B.H.T. No', p.bhtNo],
                ['Treatment Date', p.treatmentDate, 'Claim Status', p.claimStatus],
                ['Claim Amount', p.claimAmount, 'Cheque No', p.chequeNo],
                ['Paid Amount', p.paidAmount, 'Paid Date', p.paidDate],
                ['Payee Name', p.payeeName, '', ''],
              ].map(([l1, v1, l2, v2]) => (
                <View style={styles.row} key={l1}>
                  <View style={styles.leftColumn}>
                    <Text style={styles.label}>{l1} :</Text>
                    <Text
                      style={[
                        styles.value,
                        l1 === 'Claim Status' && (v1 === 'Accept' ? styles.accept : styles.reject),
                      ]}
                    >
                      {v1}
                    </Text>
                  </View>
                  {l2 ? (
                    <View style={styles.rightColumn}>
                      <Text style={styles.label}>{l2} :</Text>
                      <Text
                        style={[
                          styles.value,
                          l2 === 'Claim Status' && (v2 === 'Accept' ? styles.accept : styles.reject),
                        ]}
                      >
                        {v2}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.rightColumn} />
                  )}
                </View>
              ))}
            </View>
          ))
        )}
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
  centered: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  dateRange: {
    fontSize: 14,
    color: '#13646D',
    fontStyle: 'italic',
  },
  paymentCard: {
    backgroundColor: 'rgba(129,206,206,0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(129,206,206,0.5)',
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
  accept: {
    color: '#2E7D32',
  },
  reject: {
    color: '#D32F2F',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#13646D',
  },
  error: {
    textAlign: 'center',
    marginTop: 20,
    color: '#D32F2F',
  },
});

export default PaymentHistory;
