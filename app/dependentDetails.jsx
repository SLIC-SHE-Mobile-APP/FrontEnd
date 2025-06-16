import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const DependentDetails = ({ onClose }) => {
  const dependentsData = [
    {
      id: 1,
      name: 'H M M K Herath',
      dateOfBirth: '2001/02/13',
      enrollmentDate: '2025/02/13',
      relationship: 'Child',
    },
    {
      id: 2,
      name: 'A B C Silva',
      dateOfBirth: '1995/05/20',
      enrollmentDate: '2025/01/15',
      relationship: 'Spouse',
    },
    {
      id: 3,
      name: 'D E F Fernando',
      dateOfBirth: '2010/12/08',
      enrollmentDate: '2025/03/01',
      relationship: 'Child',
    },
    {
      id: 4,
      name: 'U S Fernando',
      dateOfBirth: '2010/12/08',
      enrollmentDate: '2025/03/01',
      relationship: 'Child',
    },
    {
      id: 5,
      name: 'U S Fernando',
      dateOfBirth: '2010/12/08',
      enrollmentDate: '2025/03/01',
      relationship: 'Child',
    },
    {
      id: 6,
      name: 'U S Fernando',
      dateOfBirth: '2010/12/08',
      enrollmentDate: '2025/03/01',
      relationship: 'Child',
    },
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
        <Text style={styles.headerTitle}>Dependent Details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#13646D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
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
    marginTop:30,
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
});

export default DependentDetails;
