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
  Animated,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from '../constants/index.js';

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
  const [notFoundError, setNotFoundError] = useState(false);

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
        <Text style={styles.loadingText}>Loading Payment History...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  // Format as DD-MMM-YY (e.g., 16-JUL-25)
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

  const formatDisplayDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('en-GB');
    } catch (error) {
      return null;
    }
  };

  // Function to render field value with icon for missing data
  const renderFieldValue = (value, fieldName, isStatusField = false) => {
    const isDataMissing = !value || 
                          value === '-' || 
                          value === 'Not Available' || 
                          value === '' || 
                          value === null || 
                          value === undefined ||
                          value === 'Rs.0.00' ||
                          value === 'Rs.NaN';

    if (isDataMissing) {
      return (
        <View style={styles.missingDataContainer}>
          <Ionicons name="information-circle-outline" size={14} color="#00ADBB" />
          <Text style={styles.missingDataText}>Not Available</Text>
        </View>
      );
    }

    // Handle status field special styling
    if (isStatusField) {
      return (
        <Text style={[
          styles.value,
          value === 'Accept' ? styles.accept : styles.reject
        ]}>
          {value}
        </Text>
      );
    }

    return <Text style={styles.value}>{value}</Text>;
  };

  // Enhanced empty state component
  const EmptyStateComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="card-outline" size={60} color="#00ADBB" />
      <Text style={styles.emptyStateMessage}>
        {notFoundError 
          ? "No payment records are found for the last 6 months."
          : "No payment records are found for the last 6 months."
        }
      </Text>
    </View>
  );

  // Enhanced error component
  const ErrorComponent = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={60} color="#00ADBB" />
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorMessage}>
        Unable to load payment history. Please check your connection and try again.
      </Text>
      <Text style={styles.errorDetailText}>{apiError}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => {
        setLoading(true);
        setApiError(null);
        // Re-trigger the useEffect by forcing a state change
        setInitialising(true);
        setTimeout(() => setInitialising(false), 100);
      }}>
        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={styles.retryIcon} />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    (async () => {
      try {
        const [storedPolicy, storedMember] = await Promise.all([
          SecureStore.getItemAsync('selected_policy_number'),
          SecureStore.getItemAsync('selected_member_number'),
        ]);
        setPolicyNo(storedPolicy || paramPolicyNo || "Not Available");
        setMemberNo(storedMember || paramMemberNo || "Not Available");
      } catch (err) {
        console.warn('SecureStore read failed:', err);
        setPolicyNo(paramPolicyNo || "Not Available");
        setMemberNo(paramMemberNo || "Not Available");
      } finally {
        setInitialising(false);
      }
    })();
  }, [paramPolicyNo, paramMemberNo]);

  useEffect(() => {
    if (initialising) return;
    
    // If no policy or member data, show empty state
    if (!policyNo || policyNo === "Not Available" || !memberNo || memberNo === "Not Available") {
      setLoading(false);
      setNotFoundError(true);
      setPaymentData([]);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setApiError(null);
        setNotFoundError(false);

        const url = `${API_BASE_URL}/ClaimHistory/GetHistory`;
        const params = { policyNo, memberNo, fromDate, toDate };

        console.log('GET', url, params); // for debugging

        const { data } = await axios.get(url, { params });

        const list = Array.isArray(data) ? data : [data];
        
        // Filter out null/undefined entries
        const validPayments = list.filter(item => item && typeof item === 'object');
        
        if (validPayments.length === 0) {
          setNotFoundError(true);
          setPaymentData([]);
          return;
        }

        setPaymentData(
          validPayments.map((item) => ({
            claimNumber: item.claiM_NO || 'Not Available',
            receivedOn: formatDisplayDate(item.receiveD_ON) || 'Not Available',
            transactionNo: item.transactioN_NUMBER || 'Not Available',
            treatmentDate: formatDisplayDate(item.datE_OF_TREATMENT) || 'Not Available',
            claimAmount: item.claiM_AMOUNT ? `Rs.${item.claiM_AMOUNT.toFixed(2)}` : 'Not Available',
            paidAmount: item.paiD_AMOUNT ? `Rs.${item.paiD_AMOUNT.toFixed(2)}` : 'Not Available',
            payeeName: item.payeE_NAME || 'Not Available',
            patientName: item.patienT_NAME || 'Not Available',
            referenceNo: item.referencE_NUMBER || 'Not Available',
            bhtNo: item.bhT_NUMBER || 'Not Available',
            claimStatus: item.paiD_AMOUNT > 0 ? 'Accept' : 'Reject',
            chequeNo: item.chequE_NO || 'Not Available',
            paidDate: formatDisplayDate(item.paiD_DATE) || 'Not Available',
          }))
        );
      } catch (err) {
        // Handle 404 specifically - treat as "no data found"
        if (err.response && err.response.status === 404) {
          console.info("No payment history found for policy:", policyNo, "member:", memberNo);
          setNotFoundError(true);
          setPaymentData([]);
          setApiError(null);
        } else {
          // Only log non-404 errors
          console.error('Error fetching payment history:', {
            status: err.response?.status || 'Network Error',
            message: err.message,
            policy: policyNo,
            member: memberNo
          });
          setApiError('Unable to load payment history. Please check your connection and try again.');
          setPaymentData([]);
          setNotFoundError(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [initialising, policyNo, memberNo, fromDate, toDate]);

  if (initialising) {
    return (
      <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.centered}>
        <LoadingScreen />
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
          <Text style={styles.policyNumber}>
            {policyNo !== "Not Available" ? policyNo : "Policy Not Available"}
          </Text>
          <Text style={styles.dateRange}>From: {fromDate}   To: {toDate}</Text>
        </View>

        {loading ? (
          <LoadingScreen />
        ) : apiError && !notFoundError ? (
          <ErrorComponent />
        ) : paymentData.length === 0 ? (
          <EmptyStateComponent />
        ) : (
          <View style={styles.contentContainer}>
            {/* Status Banner */}
            <View style={styles.statusBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#00ADBB" />
              <Text style={styles.statusBannerText}>
                Showing {paymentData.length} payment record{paymentData.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            {paymentData.map((p, i) => (
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
                      {renderFieldValue(v1, l1, l1 === 'Claim Status')}
                    </View>
                    {l2 ? (
                      <View style={styles.rightColumn}>
                        <Text style={styles.label}>{l2} :</Text>
                        {renderFieldValue(v2, l2, l2 === 'Claim Status')}
                      </View>
                    ) : (
                      <View style={styles.rightColumn} />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
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
  contentContainer: {
    flex: 1,
  },
  // Status Banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 173, 187, 0.1)",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00ADBB",
  },
  statusBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#00ADBB",
    marginLeft: 8,
    fontWeight: "500",
  },
  // Policy Info
  policyInfoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#00ADBB",
  },
  policyInfoText: {
    fontSize: 12,
    color: "#13646D",
    fontWeight: "600",
    marginBottom: 2,
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
  missingDataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  missingDataText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 4,
  },
  accept: {
    color: '#2E7D32',
  },
  reject: {
    color: '#D32F2F',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  emptyStateTitle: {
    marginTop: 15,
    fontSize: 18,
    color: "#13646D",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyStateMessage: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  errorTitle: {
    marginTop: 15,
    fontSize: 18,
    color: "#FF6B6B",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorMessage: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  errorDetailText: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#13646D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Legacy styles (kept for compatibility)
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
});

export default PaymentHistory;