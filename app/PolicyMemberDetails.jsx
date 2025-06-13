import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function PolicyMemberDetails() {
  const router = useRouter();
  const [memberDetails, setMemberDetails] = useState(null);

  useEffect(() => {
    // Simulate fetching member policy details
    setMemberDetails({
      policyNumber: '1165',
      memberName: 'S1',
      contactNo: '1165',
      company: 'S1',
      memberNo: '1165',
      empCategory: 'S1',
      dateOfBirth: '2020/05/15',
      effectiveDate: '2020/05/15',
      policyPeriod: {
        from: '2001/02/15',
        to: '2020/05/15',
      },
      opdLimits: {
        yearLimit: '0.00',
        eventLimit: '0.00',
      },
      indoorLimits: {
        yearLimit: '50,000.00',
        eventLimit: '50,000.00',
      },
    });
  }, []);

  const handleBackPress = () => {
    router.push('/home'); // ✅ This navigates to app/home.jsx
  };

  if (!memberDetails) {
    return (
      <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleBackPress} 
            style={styles.backButton}
            activeOpacity={0.1}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={20} color="#13515C" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Policy Details</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={styles.body}>
        {/* Member Information */}
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Member Information</Text>
          <View style={styles.cardContent}>
            {[
              ['Policy Number', memberDetails.policyNumber],
              ['Member Number', memberDetails.memberNo],
              ['Company', memberDetails.company],
              ['Member Name', memberDetails.memberName],
              ['Contact No', memberDetails.contactNo],
              ['Emp. Category', memberDetails.empCategory],
              ['Date of birth', memberDetails.dateOfBirth],
              ['Effective date', memberDetails.effectiveDate],
            ].map(([label, value], index) => (
              <View style={styles.detailRow} key={index}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Policy Period */}
        <View style={styles.policyPeriodCard}>
          <Text style={styles.cardTitle}>Policy Period</Text>
          <View style={styles.periodContent}>
            <View style={styles.periodColumn}>
              <Text style={styles.periodLabel}>From</Text>
              <Text style={styles.periodValue}>{memberDetails.policyPeriod.from}</Text>
            </View>
            <View style={styles.periodColumn}>
              <Text style={styles.periodLabel}>To</Text>
              <Text style={styles.periodValue}>{memberDetails.policyPeriod.to}</Text>
            </View>
          </View>
        </View>

        {/* OPD Limits */}
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>OPD Limits</Text>
          <View style={styles.limitContent}>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Year Limit</Text>
              <Text style={styles.limitValue}>{memberDetails.opdLimits.yearLimit}</Text>
            </View>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Event Limit</Text>
              <Text style={styles.limitValue}>{memberDetails.opdLimits.eventLimit}</Text>
            </View>
          </View>
        </View>

        {/* Indoor Limits */}
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Indoor Limits</Text>
          <View style={styles.limitContent}>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Year Limit</Text>
              <Text style={styles.limitValue}>{memberDetails.indoorLimits.yearLimit}</Text>
            </View>
            <View style={styles.limitColumn}>
              <Text style={styles.limitLabel}>Event Limit</Text>
              <Text style={styles.limitValue}>{memberDetails.indoorLimits.eventLimit}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 5,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C5F69',
    flex: 1,
    textAlign: 'center',
    marginLeft: -36,
  },
  headerRight: {
    width: 36,
  },
  body: {
    padding: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#13515C',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    width: '48%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  policyPeriodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  periodContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  periodColumn: {
    alignItems: 'center',
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  periodValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  limitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  limitContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  limitColumn: {
    alignItems: 'center',
    flex: 1,
  },
  limitLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  limitValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
});
