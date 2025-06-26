import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PendingIntimations = ({ onClose }) => {
  const [pendingClaims, setPendingClaims] = useState([
    {
      id: '1',
      referenceNo: 'M000428',
      enteredBy: 'D.A.R.C Dahanayake',
      relationship: 'Son',
      claimType: 'Out-door',
      createdOn: '24-12-2020',
      status: 'Status',
    },
    {
      id: '2',
      referenceNo: 'M000429',
      enteredBy: 'D.A.R.C Dahanayake',
      relationship: 'Son',
      claimType: 'In-door',
      createdOn: '25-12-2020', 
      status: 'Status',
    },
    {
      id: '3',
      referenceNo: 'M000429',
      enteredBy: 'D.A.R.C Dahanayake',
      relationship: 'Son',
      claimType: 'In-door',
      createdOn: '25-12-2020', 
      status: 'Status',
    },
  ]);

  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');

  //  Open Edit Modal
  const handleEdit = (claim) => {
    setSelectedClaim(claim);
    setEditedName(claim.enteredBy);
    setEditModalVisible(true);
  };

  //  Save Changes
  const handleSaveEdit = () => {
    setPendingClaims((prev) =>
      prev.map((item) =>
        item.id === selectedClaim.id
          ? { ...item, enteredBy: editedName }
          : item
      )
    );
    setEditModalVisible(false);
  };

  //  Delete
  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this claim?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPendingClaims((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Pending Intimations</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={26} color="#2E7D7D" style={{ marginRight: 15 }} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {pendingClaims.map((claim) => (
          <View key={claim.id} style={styles.claimCard}>
            <View style={styles.claimContent}>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Reference No :</Text>
                <Text style={styles.claimValue}>{claim.referenceNo}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Patient Name :</Text>
                <Text style={styles.claimValue}>{claim.enteredBy}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Relationship :</Text>
                <Text style={styles.claimValue}>{claim.relationship}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Claim Type :</Text>
                <Text style={styles.claimValue}>{claim.claimType}</Text>
              </View>
              <View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Created on :</Text>
                <Text style={styles.claimValue}>{claim.createdOn}</Text>
              </View><View style={styles.claimRow}>
                <Text style={styles.claimLabel}>Status :</Text>
                <Text style={styles.claimValue}>{claim.status}</Text>
              </View>
            </View>

            <View style={styles.actionIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleEdit(claim)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDelete(claim.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Patient Name</Text>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              style={styles.input}
              placeholder="Enter new name"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E7D7D',
    textAlign: 'left',
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  claimCard: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimContent: {
    flex: 1,
  },
  claimRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: '#4DD0E1',
    fontWeight: '500',
    width: 100,
    flexShrink: 0,
  },
  claimValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 1,
    marginLeft: 10,
  },
  actionIcons: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#2E7D7D',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    marginRight: 10,
  },
  cancelText: {
    color: '#888',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#2E7D7D',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  saveText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default PendingIntimations;
