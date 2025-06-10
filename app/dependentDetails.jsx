import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

const DependentDetails = () => {
  const navigation = useNavigation();

  const dependentsData = [
    {
      id: 1,
      name: "H M M K Herath",
      dateOfBirth: "2001/02/13",
      enrollmentDate: "2025/02/13",
      relationship: "Child"
    },
    {
      id: 2,
      name: "A B C Silva",
      dateOfBirth: "1995/05/20",
      enrollmentDate: "2025/01/15",
      relationship: "Spouse"
    },
    {
      id: 3,
      name: "D E F Fernando",
      dateOfBirth: "2010/12/08",
      enrollmentDate: "2025/03/01",
      relationship: "Child"
    }
  ];

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#13646D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dependent Details</Text>
          <View style={{ width: 26 }}></View>
        </View>

        {/* Table - Centered */}
        <View style={styles.centeredContainer}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableRowHeader}>
              <Text style={styles.tableHeaderText}>Name</Text>
              <Text style={styles.tableHeaderText}>Date of Birth</Text>
              <Text style={styles.tableHeaderText}>Enrollment Date</Text>
              <Text style={styles.tableHeaderText}>Relationship</Text>
            </View>

            {/* Table Rows - Generated from JSON data */}
            <ScrollView style={styles.tableScrollView}>
              {dependentsData.map((dependent) => (
                <View key={dependent.id} style={styles.tableRow}>
                  <Text style={styles.tableCellText}>{dependent.name}</Text>
                  <Text style={styles.tableCellText}>{dependent.dateOfBirth}</Text>
                  <Text style={styles.tableCellText}>{dependent.enrollmentDate}</Text>
                  <Text style={styles.tableCellText}>{dependent.relationship}</Text>
                </View>
              ))}
            </ScrollView>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
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
    maxHeight: '70%', // Prevents table from taking full height
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
  tableScrollView: {
    maxHeight: 300, // Allows scrolling if there are many rows
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