import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const approvedHospitals = [
  { id: '1', name: 'Lanka Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '2', name: 'Hemas Hospitals (Pvt) Ltd.', location: 'Wattala', phone: '011 - 4530 000' },
  { id: '3', name: 'Asiri Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '4', name: 'Leasons Hospitals (Pvt) Ltd.', location: 'Ragama', phone: '011 - 4530 000' },
  { id: '5', name: 'Ninewells Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '6', name: 'Nawaloka Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '7', name: 'Durdans Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '011 - 4530 000' },
  { id: '8', name: 'Kings Hospitals (Pvt) Ltd.', location: 'Colombo', phone: '011 - 4530 000' },
];

const notApprovedHospitals = Array.from({ length: 8 }, (_, i) => ({
  id: `${i + 1}`,
  name: 'Borella Pvt Hospital',
  location: 'Colombo',
}));

const HospitalList = () => {
  const [activeTab, setActiveTab] = useState('Approved');
  const [searchApproved, setSearchApproved] = useState('');
  const [searchNotApproved, setSearchNotApproved] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(null);

  const handleCardPress = (id) => {
    if (selectedCardId !== id) {
      setSelectedCardId(id);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedCardId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.highlightedCard]}
        onPress={() => handleCardPress(item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.hospitalName}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
        {isSelected && item.phone && (
          <TouchableOpacity
            style={styles.phoneContainer}
            onPress={() => Linking.openURL(`tel:${item.phone.replace(/[^0-9]/g, '')}`)}
          >
            <FontAwesome name="phone" size={16} color="#FF0000" />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const filteredApproved = approvedHospitals.filter((h) =>
    h.name.toLowerCase().includes(searchApproved.toLowerCase())
  );
  const filteredNotApproved = notApprovedHospitals.filter((h) =>
    h.name.toLowerCase().includes(searchNotApproved.toLowerCase())
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={26} color="#003B4A" />
          <Text style={styles.headerTitle}>Hospitals</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity 
              onPress={() => setActiveTab('Approved')} 
              style={[
                styles.tabButton,
                activeTab === 'Approved' && styles.activeTabButton
              ]}
            >
              <Text style={[styles.tabText, activeTab === 'Approved' && styles.activeTabText]}>
                Approved
              </Text>
            </TouchableOpacity>
            <View style={styles.tabDivider} />
            <TouchableOpacity 
              onPress={() => setActiveTab('Not Approved')} 
              style={[
                styles.tabButton,
                activeTab === 'Not Approved' && styles.activeTabButton
              ]}
            >
              <Text style={[styles.tabText, activeTab === 'Not Approved' && styles.activeTabText]}>
                Not Approved
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Enter hospital name to search"
          placeholderTextColor="#999"
          value={activeTab === 'Approved' ? searchApproved : searchNotApproved}
          onChangeText={(text) =>
            activeTab === 'Approved' ? setSearchApproved(text) : setSearchNotApproved(text)
          }
        />

        {/* Hospital List */}
        <FlatList
          data={activeTab === 'Approved' ? filteredApproved : filteredNotApproved}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </LinearGradient>
  );
};

export default HospitalList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#13646D',
    textAlign: 'center',
    flex: 1,
  },
  tabsContainer: {
    marginVertical: 10,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#00ADBB',
    borderRadius: 10,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 2,
  },
  activeTabButton: {
    backgroundColor: '#0093A4',
  },
  tabText: {
    color: '#D7F4F5',
    fontWeight: 'bold',
    fontSize: 18,
  },
  activeTabText: {
    color: 'white',
  },
  searchInput: {
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginVertical: 10,
    height: 40,
    marginBottom:20,
    borderColor: '#B2B2B2',
    borderWidth: 0.5,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderColor: '#16858D',
    borderWidth: 0.5,
  },
  highlightedCard: {
    borderColor: '#F31E0A',
    borderWidth: 1.25,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003B4A',
  },
  location: {
    fontSize: 16,
    color: '#003B4A',
    marginBottom: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    marginLeft: 5,
    color: '#FF0000',
    fontWeight: 'bold',
  },
});