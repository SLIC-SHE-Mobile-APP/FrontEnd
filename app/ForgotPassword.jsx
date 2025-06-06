import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';

export default function ForgotPassword() {
  const [emailOrNo, setEmailOrNo] = useState('');
  const navigation = useNavigation();

  const handleReset = () => {
    // Add your password reset logic here (e.g., API call)
    alert('Password reset instructions sent!');
  };

  return (
    <LinearGradient colors={['#6DD3D3', '#FAFAFA']} style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Phone number or Email"
        placeholderTextColor="#666"
        value={emailOrNo}
        onChangeText={setEmailOrNo}
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  input: {
    width: 300,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#6DD3D3',
    borderWidth: 1,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    fontSize: 14,
    color: 'rgba(19,100,109,1)',
    textDecorationLine: 'underline',
  },
});
