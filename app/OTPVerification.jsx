import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function OTPVerificationContent() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Get contact info from navigation params or use placeholder
  const contactInfo = params.contactInfo || '+9475****094';
  const contactType = params.contactType || 'phone'; // 'phone' or 'email'
  
  // References for OTP input fields
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];
  
  // State for OTP digits
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60); // 60 seconds countdown
  const [canResend, setCanResend] = useState(false);
  
  // Handle timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);
  
  // Handle OTP input change
  const handleOtpChange = (text, index) => {
    // Allow only one digit
    if (text.length > 1) {
      text = text.charAt(0);
    }
    
    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Auto-focus next input if current input is filled
    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };
  
  // Handle backspace key press
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs[index - 1].current.focus();
    }
  };
  
  // Verify OTP
  const verifyOTP = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      // Here you would typically call an API to verify the OTP
      // For now, we'll just show a success message and navigate
      Alert.alert('Success', 'OTP verified successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/login') // Navigate to login after verification
        }
      ]);
    } else {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
    }
  };
  
  // Resend OTP
  const resendOTP = () => {
    if (canResend) {
      // Reset OTP fields
      setOtp(['', '', '', '']);
      inputRefs[0].current.focus();
      
      // Reset timer
      setTimer(90);
      setCanResend(false);
      
      // Show confirmation
      Alert.alert('Success', `OTP resent to ${contactInfo}`);
    }
  };
  
  // Go back to previous screen
  const goBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#6DD3D3', '#FAFAFA']}
      style={[styles.gradient, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Back button at the top */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>OTP Verification</Text>
            
            <Text style={styles.instructions}>
              Enter the verification code we just sent to your {contactType === 'phone' ? 'registered number' : 'email'}:
            </Text>
            
            <Text style={styles.contactInfo}>{contactInfo}</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.button}
              onPress={verifyOTP}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.resendButton, !canResend && styles.disabledButton]}
              onPress={resendOTP}
              disabled={!canResend}
            >
              <Text style={[styles.resendButtonText, !canResend && styles.disabledButtonText]}>
                {canResend ? 'Resend OTP' : `Resend OTP ${timer}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

export default function OTPVerification() {
  return (
    <SafeAreaProvider>
      <OTPVerificationContent />
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
  },
  innerContainer: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  topHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 35,
    color: 'rgba(19,100,109,1)',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(19,100,109,1)',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'Abhaya Libre ExtraBold',
  },
  instructions: {
    fontSize: 16,
    color: 'rgba(19,100,109,1)',
    textAlign: 'center',
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(19,100,109,1)',
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6DD3D3',
    backgroundColor: '#fff',
    fontSize: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'rgba(23,171,183,1)',
    paddingVertical: 14,
    borderRadius: 15,
    width: 300,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 10,
    width: 300,
    alignItems: 'center',
  },
  resendButtonText: {
    color: 'rgba(23,171,183,1)',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#666',
  },
});