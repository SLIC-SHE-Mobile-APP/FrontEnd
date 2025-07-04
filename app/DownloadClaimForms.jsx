import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Asset } from 'expo-asset';

const DownloadClaimForms = ({ onClose }) => {
  const forms = [
    {
      title: 'Outdoor Medical Claim Form (English)',
      assetPath: require('../assets/docs/OPD_CLAIM_FORM.pdf'),
    },
    {
      title: 'Outdoor Medical Claim Form (Sinhala)',
      assetPath: require('../assets/docs/Outdoor_Medical_Claim_form_Sin.pdf'),
    },
    {
      title: 'Hospital Expenses Claim Form (English)',
      assetPath: require('../assets/docs/Claim_Form_surgical_and_hospital_Expenses_Insurance.pdf'),
    },
    {
      title: 'Hospital Expenses Claim Form (Sinhala)',
      assetPath: require('../assets/docs/SHE_CLAIM_FORM_SINHALA.pdf'),
    },
  ];

  const openPDF = async (file) => {
    try {
      const asset = Asset.fromModule(file.assetPath);
      await asset.downloadAsync(); // Ensures file is ready
      const uri = asset.uri;

      if (!uri.startsWith('http')) {
        console.warn('Local files may not open in WebBrowser.');
      }

      await WebBrowser.openBrowserAsync(uri);
    } catch (err) {
      console.error('Error opening PDF:', err);
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
            <Text style={styles.title}>Select the claim form you want to open</Text>
            {forms.map((form, index) => (
              <TouchableOpacity key={index} style={styles.button} onPress={() => openPDF(form)}>
                <Text style={styles.buttonText}>{form.title}</Text>
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
    marginBottom: 20,
    color: '#657070',
  },
  button: {
    backgroundColor: '#00C4CC',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default DownloadClaimForms;