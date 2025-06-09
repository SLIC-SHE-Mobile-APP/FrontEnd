import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HealthInsuCard = () => {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Insurance Card</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Card Section */}
        <View style={styles.card}>
          {/* Top Row with Logos */}
          <View style={styles.logoRow}>
            
          </View>

          {/* Insured Info */}
          <View style={styles.infoSection}>
            
          </View>
        </View>

        {/* Directions Section */}
        <View style={styles.directions}>
          <Text style={styles.directionsHeader}>Directions</Text>
          <Text style={styles.directionsText}>
            This digital card must be presented to the service provider with NIC and/or Employee ID to be eligible for the benefits.
          </Text>
          <Text style={styles.directionsText}>
            Please call our 24 hour TOLL FREE HOTLINE in the event of Hospitalization and Discharge.
          </Text>

          <View style={styles.hotlineRow}>
            <View>
              <Text style={styles.hotline}>0112357357</Text>
              <Text style={styles.hotline}>0711357357</Text>
            </View>
            <View>
              <Text style={styles.hotline}>0114357357</Text>
              <Text style={styles.hotline}>0721357357</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
  },
  infoSection: {
    marginTop: 10,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  directions: {
    backgroundColor: '#e0f7f7',
    padding: 16,
    borderRadius: 10,
  },
  directionsHeader: {
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    marginBottom: 10,
  },
  directionsText: {
    marginBottom: 10,
    color: '#333',
    fontSize: 14,
  },
  hotlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hotline: {
    fontWeight: 'bold',
    color: '#13646D',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default HealthInsuCard;
