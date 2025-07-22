import { useNavigation } from '@react-navigation/native';
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
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function ForgotPasswordContent() {
  const [contactMethod, setContactMethod] = useState('email'); 
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = new Animated.Value(0);
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        Animated.timing(slideAnim, {
          toValue: 0,
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

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation for Sri Lanka (9 digits)
  const validatePhone = (phone) => {
    return /^\d{9}$/.test(phone);
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 9) {
      setPhoneNumber(cleaned);
      if (phoneError) setPhoneError('');
    }
  };

  const makePhoneCall = () => {
    Linking.openURL("tel:0112357357").catch((err) => {
      console.error("Phone call error:", err);
    });
  };

  const handleSendOTP = async () => {
    if (contactMethod === 'email') {
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
      setEmailError('');
    } else {
      if (!validatePhone(phoneNumber)) {
        setPhoneError('Please enter a valid 9-digit Sri Lankan phone number');
        return;
      }
      setPhoneError('');
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      if (contactMethod === 'email') {
        Alert.alert('Success', `OTP sent to ${email}`);
        router.push({
          pathname: '/OTPVerification',
          params: { contactInfo: email, contactType: 'email' }
        });
      } else {
        Alert.alert('Success', `OTP sent to +94 ${phoneNumber}`);
        router.push({
          pathname: '/OTPVerification',
          params: { contactInfo: `+94${phoneNumber}`, contactType: 'phone' }
        });
      }
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#CDEAED", "#6DD3D3", "#6DD3D3"]}
        style={[
          styles.topSection,
          isKeyboardVisible && styles.topSectionKeyboard,
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.skylineContainer}>
          <Image
            source={require("../assets/images/cover.png")}
            style={styles.cover}
          />
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.bottomSection,
          {
            transform: [{ translateY: slideAnim }],
            marginBottom: isKeyboardVisible ? keyboardHeight - 100 : 0,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Account Recovery</Text>
            <View style={styles.sheDigitalBadge}>
              <Text style={styles.sheDigitalText}>Reset Password</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, contactMethod === 'email' && styles.activeToggle]}
                onPress={() => setContactMethod('email')}
                disabled={loading}
              >
                <View style={styles.toggleContent}>
                  {/* <Image
                    source={require("../assets/images/email-icon.png")}
                    style={styles.toggleIcon}
                  /> */}
                  <Text style={[styles.toggleText, contactMethod === 'email' && styles.activeToggleText]}>
                    Email
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toggleButton, contactMethod === 'phone' && styles.activeToggle]}
                onPress={() => setContactMethod('phone')}
                disabled={loading}
              >
                <View style={styles.toggleContent}>
                  {/* <Image
                    source={require("../assets/images/phoneicon.png")}
                    style={styles.toggleIcon}
                  /> */}
                  <Text style={[styles.toggleText, contactMethod === 'phone' && styles.activeToggleText]}>
                    Phone
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            {contactMethod === 'email' ? (
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={require("../assets/images/emailicon.png")}
                      style={styles.inputIcon}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={require("../assets/images/phoneicon.png")}
                      style={styles.inputIcon}
                    />
                  </View>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCodeText}>+94</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="000 000 000"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={9}
                    editable={!loading}
                  />
                </View>
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              </View>
            )}

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {contactMethod === 'email' 
                  ? "We'll send you an OTP to reset your password via email"
                  : "We'll send you an OTP to reset your password via SMS"
                }
              </Text>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.sendButtonText, { marginLeft: 10 }]}>
                    Sending OTP...
                  </Text>
                </View>
              ) : (
                <Text style={styles.sendButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.backContainer}
            >
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.troubleText}>Having Trouble?</Text>
              <TouchableOpacity onPress={makePhoneCall}>
                <Text style={styles.contactText}>Contact Us 0112 - 357357</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export default function ForgotPassword() {
  return (
    <SafeAreaProvider>
      <ForgotPasswordContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topSection: {
    flex: 0.6,
    paddingTop: 50,
  },
  topSectionKeyboard: {
    flex: 0.25,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 10,
  },
  skylineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "white",
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
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 25,
    color: "#13646D",
    marginBottom: 10,
    fontWeight: "500",
  },
  sheDigitalBadge: {
    width: 192,
    height: 44,
    backgroundColor: "#FF4757",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  sheDigitalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  formSection: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: '#666',
  },
  toggleText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 15,
    height: 55,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  inputIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  countryCodeContainer: {
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
  },
  countryCodeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: '#FF4757',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
  },
  infoContainer: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 6,
    shadowColor: "#4ECDC4",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backContainer: {
    alignItems: "center",
    marginVertical: 5,
  },
  backText: {
    fontSize: 16,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  troubleText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  contactText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
});