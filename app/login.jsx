import React, { useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import LoginAPI from '@/apis/loginApi';

function LoginContent() {
  const [nic, setNIC] = useState('');
  const [mobile, setMobile] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const makePhoneCall = () => {
    Linking.openURL('tel:0112252596').catch(err => {
      console.error('Phone call error:', err);
    });
  };

  const handleRequestOTP = () => {
    LoginAPI(); // Your login logic
  };

  return (
    <LinearGradient
      colors={['#6DD3D3', '#FAFAFA']}
      style={[styles.gradient, { paddingBottom: insets.bottom }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Welcome</Text>

          <View style={styles.box}>
            <Text style={styles.subtitle}>SHE Digital</Text>
          </View>

          <TextInput
            placeholder="User Name"
            style={styles.input}
            value={nic}
            onChangeText={setNIC}
            placeholderTextColor="#666"
          />
          <TextInput
            placeholder="Password"
            keyboardType="numeric"
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            placeholderTextColor="#666"
          />

          <TouchableOpacity style={styles.button} onPress={handleRequestOTP}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={() => router.push('/ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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

export default function Login() {
  return (
    <SafeAreaProvider>
      <LoginContent />
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
    marginTop: 160,
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
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'rgba(23,171,183,1)',
    fontWeight: '500',marginTop: 10,
    marginBottom: 40,
  },
  footerContainer: {
    alignItems: 'center',marginTop: 160,
  },
  troubleText: {
    fontSize: 15,
    color: 'rgba(23,171,183,1)',
  },
  footer: {
    marginTop: 5,
    fontSize: 16,
    color: 'rgba(19,100,109,1)',
  },
});
