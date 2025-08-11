import { StyleSheet } from 'react-native';

import Home from './home.jsx';
import LoginRequestOTP from './loginRequestOTP.jsx';
import Email from './email.jsx'
import ForgotPassword from './ForgotPassword.jsx';
import OTPVerification from './OTPVerification.jsx';



export default function HomeScreen() {
  return (
    <OTPVerification/>
  );
}
const styles = StyleSheet.create({
  
});
