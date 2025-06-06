import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const DependentDetails = () => {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15 }}>
        {/* Back Icon + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="arrow-back" size={24} color="#13646D" style={{ marginRight: 1, marginLeft: 12 }} />
          <Text style={{
            fontSize: 26,
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
          height: 150,
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

        {/* Rectangle 26 Background Card */}
        <View style={{
          borderRadius: 35,
          backgroundColor: '#FFFF',
          marginTop: 40,
          marginHorizontal: 20,
          padding: 20,
          alignItems: 'center'
        }}>
          {/* Buttons */}
          {[
            'Health Insurance Card',
            'Dependent Details',
            'Bank Details',
            'Claim Payments',
            'Download Claim Forms',
            'Hospitals List',
            'Claim Documents Required',
            'Claim Intimations'
          ].map((label, index) => (
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
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default DependentDetails;
