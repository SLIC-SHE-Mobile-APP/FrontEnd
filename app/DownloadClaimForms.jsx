import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const DownloadClaimForms = () => {
  const navigation = useNavigation();

  const forms = [
    { title: 'Outdoor Medical Claim Form (English)' },
    { title: 'Outdoor Medical Claim Form (Sinhala)' },
    { title: 'Hospital Expenses Claim Form (English)' },
    { title: 'Hospital Expenses Claim Form (Sinhala)' },
  ];

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#003B4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Forms Download</Text>
          <View style={{ width: 26 }}></View>
        </View>

        {/* Content Card - Centered */}
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Select the claims form you want to download</Text>
            {forms.map((form, index) => (
              <TouchableOpacity key={index} style={styles.button}>
                <Text style={styles.buttonText}>{form.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
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
});

export default DownloadClaimForms;