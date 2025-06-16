import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';

const ClaimDocRequired = ({ onClose }) => {
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
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
      }}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Claim Documents Required</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {renderSection("OUTPATIENT (OPD)", opdContent, "opd")}
          {renderSection("SPECTACLES", spectaclesContent, "spectacles")}
          {renderSection("HOSPITALIZATION", hospitalizationContent, "hospitalization")}
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
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:30,
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
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 5,
    width: '100%',
    marginTop: 30,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#003B4A',
  },
  value: {
    marginBottom: 15,
  },
  viewDetailsText: {
    color: '#13646D',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ClaimDocRequired;