import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = new Animated.Value(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -100, // Slide up by 100 pixels
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        Animated.timing(slideAnim, {
          toValue: 0, // Slide back to original position
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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

  // Handle NIC input with validation
  const handleNICChange = (text) => {
    // Remove any spaces and convert to uppercase
    const cleaned = text.replace(/\s/g, '').toUpperCase();

    // Allow only digits and V for the old format
    const validChars = cleaned.replace(/[^0-9V]/g, '');

    // Limit length based on format
    if (validChars.length <= 12) {
      // If it contains V, it should be max 10 characters (9 digits + V)
      if (validChars.includes('V')) {
        if (validChars.length <= 10 && validChars.indexOf('V') === validChars.length - 1) {
          setNIC(validChars);
        }
      } else {
        // Pure digits, allow up to 12
        setNIC(validChars);
      }
    }
  };

  // Validate NIC format
  const validateNIC = (nicValue) => {
    if (!nicValue) {
      return false;
    }

    // Check for 12-digit format (new NIC format)
    if (/^\d{12}$/.test(nicValue)) {
      return true;
    }

    // Check for 10-character format with V at the end (old NIC format)
    if (/^\d{9}V$/.test(nicValue)) {
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
      Alert.alert('', 'Please enter a valid NIC number\n\nValid formats:\n• 12 digits (e.g., 200XXXXXXX42)\n• 9 digits + V (e.g., 60XXXXXX3V)');
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
    <View style={styles.container}>
      {/* Top Section with Gradient and City Skyline */}
      <LinearGradient
        colors={['#CDEAED', '#6DD3D3', '#6DD3D3']}
        style={[styles.topSection, isKeyboardVisible && styles.topSectionKeyboard]}
      >
        {/* Header with SLIC Logo */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.skylineContainer}>
          <Image
            source={require('@/assets/images/cover.png')}
            style={styles.cover}
          />
        </View>
      </LinearGradient>

      {/* Bottom Section with Form */}
      <Animated.View 
        style={[
          styles.bottomSection, 
          {
            transform: [{ translateY: slideAnim }],
            marginBottom: isKeyboardVisible ? keyboardHeight - 100 : 0
          }
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Welcome To</Text>
            <View style={styles.sheDigitalBadge}>
              <Text style={styles.sheDigitalText}>SHE Digital</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
           
            {/* NIC Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('@/assets/images/Idicon.png')}
                    style={styles.inputIcon}
                  />
                </View>
                <TextInput
                  placeholder="NIC"
                  style={styles.input}
                  value={nic}
                  onChangeText={handleNICChange}
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Mobile Number Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('@/assets/images/phoneicon.png')}
                    style={styles.inputIcon}
                  />
                </View>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+94</Text>
                </View>
                <TextInput
                  placeholder="000 000 000"
                  keyboardType="numeric"
                  style={styles.phoneInput}
                  value={mobile}
                  onChangeText={handleMobileChange}
                  placeholderTextColor="#999"
                  maxLength={9}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Already Registered Link */}
            <TouchableOpacity onPress={handlePress} disabled={loading} style={styles.linkContainer}>
              <Text style={styles.alreadyRegisteredText}>
                Already Registered? <Text style={styles.loginLinkText}>Login</Text>
              </Text>
            </TouchableOpacity>

            {/* Request OTP Button */}
            <TouchableOpacity
              style={[styles.requestButton, loading && styles.buttonDisabled]}
              onPress={handleRequestOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.requestButtonText}>Request OTP</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.troubleText}>Having Trouble ?</Text>
              <TouchableOpacity onPress={makePhoneCall}>
                <Text style={styles.contactText}>
                  Contact Us 011 - 2252596
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    flex: 0.6,
    paddingTop: 50,
  },
  topSectionKeyboard: {
    flex: 0.3, // Reduce top section when keyboard is visible
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 10,
  },
  cover: {
    width: '100%',
    height: '100%'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  slicText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generalBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  generalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skylineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  skylineText: {
    fontSize: 40,
    opacity: 0.3,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -120,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 25,
    color: '#13646D',
    marginBottom: 10,
    fontWeight: '500',
  },
  sheDigitalBadge: {
    width: 192,
    height: 44,
    backgroundColor: '#FF4757',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheDigitalText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
 
  logInText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 15,
    height: 50,
  },
  iconContainer: {
    marginRight: 10,
  },
  inputIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  countryCodeContainer: {
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  linkContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  alreadyRegisteredText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkText: {
    color: '#4ECDC4',
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  troubleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 45,
  },
  contactText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },
});