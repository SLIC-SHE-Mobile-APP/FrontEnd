import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import {  SafeAreaView } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');

export default function ViewProfile() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [profileData, setProfileData] = useState({
    name: 'Sanjeewa De Silva',
    email: 'udanthapermathilaka01@gmail.com',
    address: 'No32 Kandegahara Mahauthpahagama.',
    dateOfBirth: '30/06/2001',
    nicNo: '200215202762',
    gender: 'Female'
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <SafeAreaView style={{ backgroundColor: "black", flex: 1 }}>
      <LinearGradient
        colors={['#FFFFFF', '#6DD3D3']}
        style={styles.container}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <View style={styles.backButtonContainer}>
                <Ionicons name="arrow-back" size={20} color="#075349" />
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>View Profile</ThemedText>
          </View>

          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('@/assets/images/default-avatar.png')}
                style={styles.avatar}
              />
            </View>
            <ThemedText style={styles.profileName}>Mr. Sanjeewa De Silva</ThemedText>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {[
              { label: 'Name', field: 'name', keyboard: 'default' },
              { label: 'Email', field: 'email', keyboard: 'email-address' },
              { label: 'Address', field: 'address', multiline: true },
              { label: 'Date Of Birth', field: 'dateOfBirth' },
              { label: 'NIC No', field: 'nicNo' },
              { label: 'Gender', field: 'gender' }
            ].map(({ label, field, keyboard, multiline }, index) => (
              <View style={styles.fieldContainer} key={index}>
                <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, !isEditing && styles.disabledInput]}
                    value={profileData[field]}
                    onChangeText={(text) => handleInputChange(field, text)}
                    editable={isEditing}
                    keyboardType={keyboard}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                    placeholderTextColor="#A0A0A0"
                    multiline={multiline}
                    numberOfLines={multiline ? 2 : 1}
                  />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </LinearGradient></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 120,
    color: '#075349',
    fontFamily: 'Actor',
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#E8F8F8',
  },
  profileName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#075349',
    fontFamily: 'Actor',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#075349',
    marginBottom: 6,
    fontFamily: 'Actor',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Actor',
    minHeight: 48,
  },
  disabledInput: {
    backgroundColor: '#F8F8F8',
    color: '#666666',
  },
});
