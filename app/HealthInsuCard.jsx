import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HealthInsuCard = () => {
  const navigation = useNavigation();

  const makePhoneCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((error) => {
        console.error('Error making phone call:', error);
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

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

        <View style={styles.cardContainer}>
          <Image 
            source={require('../assets/images/SHE.png')} 
            style={styles.cardImage}
            resizeMode="contain"
          />
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

          <Text style={styles.hotlinesTitle}>Hotlines:</Text>
          <View style={styles.hotlineGrid}>
            <View style={styles.hotlineColumn}>
              <TouchableOpacity 
                style={styles.hotlineButton}
                onPress={() => makePhoneCall('0112357357')}
              >
                <Ionicons name="call" size={18} color="#2E5A87" style={styles.callIcon} />
                <Text style={styles.hotline}>0112357357</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.hotlineColumn}>
              <TouchableOpacity 
                style={styles.hotlineButton}
                onPress={() => makePhoneCall('0114357357')}
              >
                <Ionicons name="call" size={18} color="#2E5A87" style={styles.callIcon} />
                <Text style={styles.hotline}>0114357357</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
  },
  cardContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: 250,
  },
  directions: {
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: '#13646D'
  },
  directionsHeader: {
    fontWeight: 'bold',
    color: '#2E5A87',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 20,
  },
  directionsText: {
    marginBottom: 12,
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  hotlinesTitle: {
    fontWeight: 'bold',
    color: '#2E5A87',
    fontSize: 18,
    marginBottom: 10,
    marginTop: 8,
  },
  hotlineGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hotlineColumn: {
    flex: 1,
  },
  hotlineButton: {
    flexDirection: 'row',
    marginTop: 15,
  },
  callIcon: {
    marginRight: 8,
  },
  hotline: {
    fontWeight: 'bold',
    color: '#2E5A87',
    fontSize: 16,
  },
});

export default HealthInsuCard;