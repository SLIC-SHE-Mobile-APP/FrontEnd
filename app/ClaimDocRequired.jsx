import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../constants/index.js';

const ClaimDocRequired = ({ onClose }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [documents, setDocuments] = useState({
    opd: [],
    spectacles: [],
    hospitalization: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const [opdRes, specRes, hospRes] = await Promise.all([
        axios.get( `${API_BASE_URL}/ClaimDocumentsCon/Outpatient`),
        axios.get( `${API_BASE_URL}/ClaimDocumentsCon/Spectacles`),
        axios.get( `${API_BASE_URL}/ClaimDocumentsCon/Hospitalization`),
      ]);

      setDocuments({
        opd: opdRes.data.map((item, index) => `${index + 1}. ${item.description}`),
        spectacles: specRes.data.map((item, index) => `${index + 1}. ${item.description}`),
        hospitalization: hospRes.data.map((item, index) => `${index + 1}. ${item.description}`),
      });
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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
          {loading ? (
            <ActivityIndicator size="large" color="#00ADBB" style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={{ color: 'red', marginTop: 40 }}>{error}</Text>
          ) : (
            <>
              {renderSection("OUTPATIENT (OPD)", documents.opd, "opd")}
              {renderSection("SPECTACLES", documents.spectacles, "spectacles")}
              {renderSection("HOSPITALIZATION", documents.hospitalization, "hospitalization")}
            </>
          )}
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
