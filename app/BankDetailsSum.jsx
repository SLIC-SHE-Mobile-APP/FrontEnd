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

const BankDetailsSum = ({ onClose }) => {
  // Utility to mask string with only first 2 and last 2 characters visible
  const maskValue = (value) => {
    if (!value || value.length <= 4) return value;
    const first = value.slice(0, 2);
    const last = value.slice(-2);
    return `${first}${'*'.repeat(value.length - 4)}${last}`;
  };

  const bankDetails = {
    bankName: 'Bank Of Ceylon',
    branchName: 'Kurunegala',
    accountNumber: '1234567890420',
    mobileNumber: '0712345678',
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
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Bank Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.centeredContainer}>
          <View style={styles.card}>
            <View style={styles.leftColumn}>
              <Text style={styles.label}>Bank Name</Text>
              <Text style={styles.label}>Branch Name</Text>
              <Text style={styles.label}>Account Number</Text>
              <Text style={styles.label}>Mobile Number</Text>
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.value}>{maskValue(bankDetails.bankName)}</Text>
              <Text style={styles.value}>{maskValue(bankDetails.branchName)}</Text>
              <Text style={styles.value}>{maskValue(bankDetails.accountNumber)}</Text>
              <Text style={styles.value}>{maskValue(bankDetails.mobileNumber)}</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 5,
    width: '100%',
    marginTop: 30,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#003B4A',
  },
  value: {
    marginBottom: 15,
  },
  viewDetailsText: {
    color: '#13646D',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default BankDetailsSum;
