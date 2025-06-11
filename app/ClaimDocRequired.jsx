import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ClaimDocRequired = () => {
  const navigation = useNavigation();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSection = (title, content, sectionKey) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity 
        style={styles.sectionButton}
        onPress={() => toggleSection(sectionKey)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
      </TouchableOpacity>
      
      {expandedSection === sectionKey && (
        <View style={styles.expandedContent}>
          {content.map((item, index) => (
            <Text key={index} style={styles.contentText}>
              {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const opdContent = [
    "1. Duly completed OPD Claim form (Reimbursement Only)",
    "2. Original or certified copy of the Prescription",
    "3. Original bill (pharmacy) with paid seal",
    "4. Original Channeling receipts"
  ];

  const spectaclesContent = [
    "1. Duly completed Spectacles Claim form",
    "2. Original prescription from qualified Eye Specialist",
    "3. Original bill with paid seal",
    "4. Copy of National Identity Card"
  ];

  const hospitalizationContent = [
    "1. Duly completed Hospitalization Claim form",
    "2. Original discharge summary",
    "3. Original bills with paid seal",
    "4. Investigation reports",
    "5. Pre-authorization form (if applicable)"
  ];

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Documents Required</Text>
          <View style={{ width: 26 }}></View>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {renderSection("OUTPATIENT (OPD)", opdContent, "opd")}
          {renderSection("SPECTACLES", spectaclesContent, "spectacles")}
          {renderSection("HOSPITALIZATION", hospitalizationContent, "hospitalization")}
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
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
    marginLeft: 6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 20,
    width: '100%',
  },
  sectionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#6DD3D3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#13646D',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  expandedContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#6DD3D3',
  },
  contentText: {
    fontSize: 14,
    color: '#13646D',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ClaimDocRequired;