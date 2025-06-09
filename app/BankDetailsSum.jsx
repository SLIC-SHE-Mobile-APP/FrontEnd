import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BankDetailsSum = () => {
  const navigation = useNavigation();

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
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Details</Text>
          <View style={{ width: 26 }}></View>
        </View>

        {/* Details Card */}
        <View style={styles.cardContainer}>
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 5,
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
    color:'#003B4A',
  },
  value: {
    marginBottom: 15,
  },
  viewDetailsText: {
    color: '#13646D',
    fontWeight: 'bold',
    fontSize: 18
  },
});

export default BankDetailsSum;