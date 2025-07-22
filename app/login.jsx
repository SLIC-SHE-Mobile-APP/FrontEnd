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
import LoginAPI from '@/apis/loginApi';

function LoginContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    Linking.openURL('tel:0112357357').catch(err => {
      console.error('Phone call error:', err);
    });
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('', 'Please enter your username');
      return;
    }

    if (!password.trim()) {
      Alert.alert('', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      // Call your login API
      await LoginAPI();
      // Handle successful login here
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/ForgotPassword');
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
            <Text style={styles.logInText}>Log In</Text>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('@/assets/images/usericon.png')}
                    style={styles.inputIcon}
                  />
                </View>
                <TextInput
                  placeholder="User Name"
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('@/assets/images/lockicon.png')}
                    style={styles.inputIcon}
                  />
                </View>
                <TextInput
                  placeholder="Password"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconContainer}
                >
                  <Image
                    source={showPassword ? 
                      require('../assets/images/visibilityicon.png') : 
                      require('../assets/images/hiddenicon.png')
                    }
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading} style={styles.linkContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.troubleText}>Having Trouble ?</Text>
              <TouchableOpacity onPress={makePhoneCall}>
                <Text style={styles.contactText}>
                  Contact Us 011 - 2357357
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export default function Login() {
  return (
    <SafeAreaProvider>
      <LoginContent />
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
    // flex: 0.3, // Reduce top section when keyboard is visible
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
  skylineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
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
    marginBottom: 10,
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
  formSection: {
    paddingHorizontal: 0,
  },
  logInText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
  eyeIconContainer: {
    padding: 5,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  linkContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    alignItems: 'center'
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