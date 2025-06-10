import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const HealthPolicyDetails = () => {
  const navigation = useNavigation();

  const handleButtonPress = (buttonLabel) => {
    if (buttonLabel === 'Health Insurance Card') {
      navigation.navigate('HealthInsuCard');
    }
    if (buttonLabel === 'Dependent Details') {
      navigation.navigate('DependentDetails');
    }
    if (buttonLabel === 'Hospitals List') {
      navigation.navigate('hospitalList');
    }
    if (buttonLabel === 'Download Claim Forms') {
      navigation.navigate('DownloadClaimForms');
    }
    if (buttonLabel === 'Claim Intimations') {
      navigation.navigate('OnlineClaimIntimations');
    }
    if (buttonLabel === 'Bank Details') {
      navigation.navigate('BankDetailsSum');
    }
    if (buttonLabel === 'Claim Documents Required') {
      navigation.navigate('ClaimDocRequired');
    }
  };

  const buttons = [
    'Health Insurance Card',
    'Dependent Details',
    'Bank Details',
    'Claim Documents Required',
    'Hospitals List',
    'Download Claim Forms',
    'Claim Intimations',
    'Claim History',
    'Pending Requirements',
    'Payment History'
  ];

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{ flex: 1 }}
    >
      {/* Fixed Header Section */}
      <View style={{ paddingHorizontal: 15 }}>
        {/* Back Icon + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={23} color="#13646D" style={{ marginRight: 1, marginLeft: 12 }} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 22,
            fontFamily: 'Adamina',
            fontWeight:'800',
            color: '#13646D',
            letterSpacing: 0.38,
            lineHeight: 30,
            flex: 1,
            textAlign: 'center'
          }}>
            Health Policy Details
          </Text>
        </View>

        {/* Policy Info Card */}
        <View style={{
          backgroundColor: '#51A7AE80',
          borderRadius: 15,
          padding: 20,
          marginTop: 30,
          marginHorizontal: 13,
          height: 130,
          justifyContent: 'space-between'
        }}>
          {[
            'G/010/SHE/ 19400/24',
            'H M M K Herath',
            'M/S. Board of Investment Sri Lanka'
          ].map((item, idx) => (
            <Text
              key={idx}
              style={{
                fontSize: 15,
                fontFamily: 'Adamina',
                fontWeight: '400',
                color: '#FFFFFF',
                textAlign: 'left',
                letterSpacing: 0.38
              }}
            >
              {item}
            </Text>
          ))}
        </View>
      </View>

      {/* Scrollable Buttons Section */}
      <View style={{ flex: 1, marginTop: 35, marginBottom:30 }}>
        <View style={{
          borderRadius: 30,
          backgroundColor: '#FFFF',
          marginHorizontal: 30,
          flex: 1,
          overflow: 'hidden'
        }}>
          <ScrollView 
            contentContainerStyle={{ 
              padding: 20,
              paddingBottom: 30 
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Buttons */}
            {buttons.map((label, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: '#17ABB7',
                  width: '100%',
                  fontFamily: 'Adamina',
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                  alignItems: 'center'
                }}
                onPress={() => handleButtonPress(label)}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'AbhayaLibreMedium',
                  fontWeight: '500'
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
};

export default HealthPolicyDetails;