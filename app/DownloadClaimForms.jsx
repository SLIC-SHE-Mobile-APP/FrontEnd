import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

const DownloadClaimForms = ({ onClose }) => {
  const forms = [
    {
      title: 'Outdoor Medical Claim Form (English)',
      apiUrl: 'https://shemobileapi.slicgeneral.com/api/ReqClaimDocs/OpdClaimForm',
    },
    {
      title: 'Outdoor Medical Claim Form (Sinhala)',
      apiUrl: 'https://shemobileapi.slicgeneral.com/api/ReqClaimDocs/OutdoorMedicalSin',
    },
    {
      title: 'Hospital Expenses Claim Form (English)',
      apiUrl: 'https://shemobileapi.slicgeneral.com/api/ReqClaimDocs/ClaimFormSurgical',
    },
    {
      title: 'Hospital Expenses Claim Form (Sinhala)',
      apiUrl: 'https://shemobileapi.slicgeneral.com/api/ReqClaimDocs/SheClaimSinhala',
    },
  ];

  const downloadForm = async (form) => {
    try {
      // Open the API URL directly in the browser for download
      await WebBrowser.openBrowserAsync(form.apiUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: true,
        toolbarColor: '#13646D',
      });
    } catch (error) {
      console.error('Error downloading form:', error);
      Alert.alert(
        'Download Error',
        'Unable to download the form. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
      }}
    >
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Download Claim Forms</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Select the claim form you want to download</Text>
            <Text style={styles.subtitle}>
              Tap any button below to download the corresponding claim form
            </Text>
            {forms.map((form, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.button} 
                onPress={() => downloadForm(form)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>{form.title}</Text>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'left',
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color: '#657070',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#8A9090',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#00C4CC',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#00C4CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
});

export default DownloadClaimForms;