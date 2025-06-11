import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';

export default function ForgotPassword() {
  const [contactMethod, setContactMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const navigation = useNavigation();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation for Sri Lanka (9 digits)
  const validatePhone = (phone) => {
    return /^\d{9}$/.test(phone);
  };

  const handleSendOTP = () => {
    if (contactMethod === 'email') {
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
      setEmailError('');
      Alert.alert('Success', `OTP sent to ${email}`);
      router.push({
        pathname: '/OTPVerification',
        params: { contactInfo: email, contactType: 'email' }
      });
    } else {
      if (!validatePhone(phoneNumber)) {
        setPhoneError('Please enter a valid 9-digit Sri Lankan phone number');
        return;
      }
      setPhoneError('');
      Alert.alert('Success', `OTP sent to +94 ${phoneNumber}`);
      router.push({
        pathname: '/OTPVerification',
        params: { contactInfo: `+94${phoneNumber}`, contactType: 'phone' }
      });
    }
  };

  return (
    <LinearGradient colors={['#6DD3D3', '#FAFAFA']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Account Recovery</Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, contactMethod === 'email' && styles.activeToggle]}
              onPress={() => setContactMethod('email')}
            >
              <Text style={[styles.toggleText, contactMethod === 'email' && styles.activeToggleText]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, contactMethod === 'phone' && styles.activeToggle]}
              onPress={() => setContactMethod('phone')}
            >
              <Text style={[styles.toggleText, contactMethod === 'phone' && styles.activeToggleText]}>Phone</Text>
            </TouchableOpacity>
          </View>

          {contactMethod === 'email' ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryPickerButton}>
                  <Text style={styles.countryCodeText}>+94</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#666"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (phoneError) setPhoneError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={9}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: 'rgba(19,100,109,1)',
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'Abhaya Libre ExtraBold',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6DD3D3',
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  activeToggle: {
    backgroundColor: 'rgba(23,171,183,1)',
  },
  toggleText: {
    color: '#666',
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#fff',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    width: 300,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#6DD3D3',
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 5,
    fontSize: 16,
  },
  phoneInputContainer: {
    width: 300,
    height: 48,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#6DD3D3',
    borderWidth: 1,
    marginBottom: 5,
  },
  countryPickerButton: {
    height: '100%',
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#6DD3D3',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  button: {
    backgroundColor: 'rgba(23,171,183,1)',
    paddingVertical: 14,
    borderRadius: 15,
    width: 300,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    fontSize: 14,
    color: 'rgba(19,100,109,1)',
    // textDecorationLine: 'underline',
  },
});
