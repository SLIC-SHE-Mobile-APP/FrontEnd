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
  Alert,
} from 'react-native';

const DependentDetails = ({ onClose, policyNo = 'G/010/SHE/17087/22', memberNo = '000682' }) => {
  const [dependentsData, setDependentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format date from API response
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
  };

  // Function to fetch dependents data from API
  const fetchDependentsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://203.115.11.229:1002/api/Dependents/WithEmployee?policyNo=${policyNo}&memberNo=${memberNo}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API data to match component structure
      const transformedData = data.map((dependent, index) => ({
        id: index + 1,
        name: dependent.dependentName || 'N/A',
        dateOfBirth: formatDate(dependent.depndentBirthDay),
        enrollmentDate: formatDate(dependent.effectiveDate),
        relationship: dependent.relationship || 'N/A',
      }));

      setDependentsData(transformedData);
    } catch (err) {
      console.error('Error fetching dependents data:', err);
      setError(err.message);
      Alert.alert(
        'Error',
        'Failed to load dependent details. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchDependentsData();
  }, [policyNo, memberNo]);

  // Retry function
  const handleRetry = () => {
    fetchDependentsData();
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
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Dependent Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#13646D" />
          <Text style={styles.loadingText}>Loading dependent details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : dependentsData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#13646D" />
          <Text style={styles.emptyText}>No dependents found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.centeredContainer}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableRowHeader}>
                <Text style={styles.tableHeaderText}>Name</Text>
                <Text style={styles.tableHeaderText}>Date of Birth</Text>
                <Text style={styles.tableHeaderText}>Enrollment Date</Text>
                <Text style={styles.tableHeaderText}>Relationship</Text>
              </View>

              {/* Table Rows */}
              {dependentsData.map((dependent) => (
                <View key={dependent.id} style={styles.tableRow}>
                  <Text style={styles.tableCellText}>{dependent.name}</Text>
                  <Text style={styles.tableCellText}>{dependent.dateOfBirth}</Text>
                  <Text style={styles.tableCellText}>{dependent.enrollmentDate}</Text>
                  <Text style={styles.tableCellText}>{dependent.relationship}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: '#2EC6C6',
    borderWidth: 2,
    width: '100%',
    maxHeight: '100%',
    marginTop: 10,
    marginBottom: 5
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#2EC6C6',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableCellText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#13646D',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#13646D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#13646D',
    textAlign: 'center',
  },
});

export default DependentDetails;