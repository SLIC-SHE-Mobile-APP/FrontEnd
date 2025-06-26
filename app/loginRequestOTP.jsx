import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function LoginRequestOTPContent() {
  const [nic, setNIC] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const makePhoneCall = () => {
    Linking.openURL('tel:0112252596').catch(err => {
      console.error('Phone call error:', err);
    });
  };

  const handlePress = () => {
    router.push('/login');
  };

  // Handle mobile number input - restrict to 9 digits
  const handleMobileChange = (text) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 9 digits
    if (cleaned.length <= 9) {
      setMobile(cleaned);
    }
  };

  // Handle NIC input with validation - Updated to handle V, v, X, x
  const handleNICChange = (text) => {
    // Remove any spaces but keep original case
    const cleaned = text.replace(/\s/g, '');
    
    // Allow only digits, V, v, X, x for the old format
    const validChars = cleaned.replace(/[^0-9VvXx]/g, '');
    
    // Limit length based on format
    if (validChars.length <= 12) {
      // If it contains V, v, X, or x, it should be max 10 characters (9 digits + V/v/X/x)
      if (validChars.includes('V') || validChars.includes('v') || validChars.includes('X') || validChars.includes('x')) {
        const lastChar = validChars.charAt(validChars.length - 1);
        const hasValidSuffix = lastChar === 'V' || lastChar === 'v' || lastChar === 'X' || lastChar === 'x';
        
        if (validChars.length <= 10 && hasValidSuffix) {
          // Ensure only one V/v/X/x at the end
          const digitPart = validChars.slice(0, -1);
          const suffixPart = validChars.slice(-1);
          
          // Check if digit part contains only digits
          if (/^\d*$/.test(digitPart)) {
            setNIC(validChars);
          }
        }
      } else {
        // Pure digits, allow up to 12
        setNIC(validChars);
      }
    }
  };

  // Validate NIC format - Updated to handle both V/v and X/x
  const validateNIC = (nicValue) => {
    if (!nicValue) {
      return false;
    }

    // Check for 12-digit format (new NIC format)
    if (/^\d{12}$/.test(nicValue)) {
      return true;
    }

    // Check for 10-character format with V/v or X/x at the end (old NIC format)
    if (/^\d{9}[VvXx]$/.test(nicValue)) {
      return true;
    }

    return false;
  };

  // Mask the phone number for privacy
  const maskPhoneNumber = (number) => {
    if (!number || number.length < 9) return number;
    
    // Keep first 2 and last 3 digits visible, mask the middle
    const firstPart = number.substring(0, 2);
    const lastPart = number.substring(number.length - 3);
    return `${firstPart}****${lastPart}`;
  };

  // API call to check NIC and mobile number availability
  const checkAvailability = async (nicNumber, mobileNumber) => {
    try {
      const response = await fetch('http://203.115.11.229:1002/api/LoginNicMnumber/CheckAvailability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nicNumber: nicNumber,
          mobileNumber: mobileNumber,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Network error. Please check your connection and try again.');
    }
  };

  const handleRequestOTP = async () => {
    // Validate NIC first
    if (!validateNIC(nic)) {
      Alert.alert('', 'Please enter a valid NIC number\n\nValid formats:\n• 12 digits (e.g., 200118202342)\n• 9 digits + V (e.g., 622020343V)\n• 9 digits + v (e.g., 622020343v)\n• 9 digits + X (e.g., 622020343X)\n• 9 digits + x (e.g., 622020343x)');
      return;
    }

    // Validate mobile number
    if (!mobile || mobile.length < 9) {
      Alert.alert('', 'Please enter a valid 9-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const result = await checkAvailability(nic, mobile);
      
      if (result.success && result.isValid && result.otpSent) {
        // Success - OTP sent
        const maskedNumber = maskPhoneNumber(mobile);
        Alert.alert('Success', `OTP sent to +94 ${maskedNumber}`);
        
        router.push({
          pathname: '/OTPVerification',
          params: { 
            contactInfo: `+94${maskedNumber}`, 
            contactType: 'phone',
            nicNumber: nic,
            mobileNumber: mobile
          }
        });
        
      } else {
        // Handle different error types
        let errorMessage = result.message || 'An error occurred. Please try again.';
        
        switch (result.errorType) {
          case 'NIC_NOT_FOUND':
            errorMessage = 'NIC number is not registered in our system. Please contact customer service.';
            break;
          case 'MOBILE_NUMBER_MISMATCH':
            errorMessage = 'The mobile number is mismatch with this NIC. Please verify your mobile number.';
            break;
          default:
            errorMessage = result.message || 'Validation failed. Please check your details and try again.';
        }
        
        Alert.alert('', errorMessage);
      }
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#6DD3D3', '#FAFAFA']}
      style={[styles.gradient, { paddingBottom: insets.bottom }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Welcome</Text>

          <View style={styles.box}>
            <Text style={styles.subtitle}>SHE Digital</Text>
          </View>

          <TextInput
            placeholder="NIC"
            style={styles.input}
            value={nic}
            onChangeText={handleNICChange}
            placeholderTextColor="#666"
            editable={!loading}
          />
          
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+94</Text>
            </View>
            <TextInput
              placeholder="Mobile Number"
              keyboardType="numeric"
              style={styles.phoneInput}
              value={mobile}
              onChangeText={handleMobileChange}
              placeholderTextColor="#666"
              maxLength={9}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRequestOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Request OTP</Text>
            )}
          </TouchableOpacity>

          {/* Already Registered */}
          <TouchableOpacity onPress={handlePress} disabled={loading}>
            <Text style={styles.link}>
              <Text style={{ color: 'rgba(23,171,183,1)' }}>Already Registered? </Text>
              <Text>Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.troubleText}>Having Trouble?</Text>
            <TouchableOpacity onPress={makePhoneCall}>
              <Text style={styles.footer}>
                <Text style={{ color: 'rgba(23,171,183,1)' }}>Contact us through</Text> 0112252596
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

export default function LoginRequestOTP() {
  return (
    <SafeAreaProvider>
      <LoginRequestOTPContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#6DD3D3',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 160
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'rgba(19,100,109,1)',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'Abhaya Libre ExtraBold',
  },
  box: {
    width: 269,
    height: 54,
    backgroundColor: 'rgba(255,0,0,1)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 32,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'Abhaya Libre ExtraBold',
  },
  phoneInputContainer: {
    width: 300,
    height: 48,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#6DD3D3',
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  countryCode: {
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
  input: {
    width: 300,
    height: 48,
    borderColor: '#6DD3D3',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: 'rgba(23,171,183,1)',
    paddingVertical: 14,
    borderRadius: 15,
    width: 300,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    color: 'rgba(19,100,109,1)',
    textAlign: 'center',
    marginBottom: 30,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  troubleText: {
    fontSize: 15,
    color: 'rgba(23,171,183,1)',
    marginTop: 135,
  },
  footer: {
    marginTop: 5,
    fontSize: 16,
    color: 'rgba(19,100,109,1)',
  },
});

