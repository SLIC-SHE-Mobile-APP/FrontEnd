import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const AddPolicy = () => {
    const [policyNumber, setPolicyNumber] = useState('');
    const [policyList, setPolicyList] = useState([]);
    const [deletedPolicies, setDeletedPolicies] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigation = useNavigation();

    // Required prefix for policy numbers
    const REQUIRED_PREFIX = 'G/010/SHE/';

    // Sample dropdown options - you can modify these as needed
    const dropdownOptions = [
        'G/010/SHE/18666/25',
        'G/010/SHE/18667/26',
        'G/010/SHE/18668/27',
        'G/010/SHE/18669/28',
        'G/010/SHE/18670/29',
        'G/010/SHE/18671/30',
    ];

    const handleAddPolicy = () => {
        if (!policyNumber.trim()) {
            Alert.alert('Validation', 'Please enter a policy number');
            return;
        }

        // Check if policy number starts with required prefix
        if (!policyNumber.startsWith(REQUIRED_PREFIX)) {
            Alert.alert('Invalid Format', `Policy number must start with ${REQUIRED_PREFIX}`);
            return;
        }

        const existing = policyList.find(item => item.policyNumber === policyNumber);
        if (existing) {
            Alert.alert('Duplicate', 'This policy already exists');
            return;
        }

        const newPolicy = {
            id: Date.now().toString(),
            policyNumber,
            companyName: 'ABC Company',
            memberId: '1165',
            policyPeriod: '2020-02-13 - 2020-02-13',
            contactNo: '0713158877',
            status: policyList.length % 2 === 0 ? 'Active' : 'Inactive',
        };

        setPolicyList([...policyList, newPolicy]);

        // Remove from deleted if it exists
        setDeletedPolicies(prev => prev.filter(p => p !== policyNumber));

        setPolicyNumber('');
    };

    const handleDeletePolicy = (id, policyNumber) => {
        setPolicyList(prev => prev.filter(item => item.id !== id));
        setDeletedPolicies(prev => [...prev, policyNumber]);
    };

    const handleRestoreDeleted = (number) => {
        setPolicyNumber(number);
    };

    const handleDropdownSelect = (option) => {
        setPolicyNumber(option);
        setShowDropdown(false);
    };

    // Auto-complete input with prefix and validate format
    const handleInputChange = (text) => {
        // If user is typing and hasn't included the prefix, auto-add it
        if (text.length > 0 && !text.startsWith(REQUIRED_PREFIX)) {
            // Check if the text could be part of the prefix
            if (REQUIRED_PREFIX.startsWith(text)) {
                setPolicyNumber(text);
            } else {
                setPolicyNumber(REQUIRED_PREFIX + text);
            }
        } else {
            // Validate the part after the prefix
            if (text.startsWith(REQUIRED_PREFIX)) {
                const afterPrefix = text.substring(REQUIRED_PREFIX.length);
                
                // Filter out letters after any '/' in the suffix
                const parts = afterPrefix.split('/');
                const filteredParts = parts.map(part => {
                    // Allow only numbers after '/'
                    return part.replace(/[^0-9]/g, '');
                });
                
                const cleanedAfterPrefix = filteredParts.join('/');
                setPolicyNumber(REQUIRED_PREFIX + cleanedAfterPrefix);
            } else {
                setPolicyNumber(text);
            }
        }
    };

    const renderDeletedPolicy = ({ item }) => (
        <TouchableOpacity style={styles.deletedTag} onPress={() => handleRestoreDeleted(item)}>
            <Text style={styles.deletedTagText}>{item}</Text>
        </TouchableOpacity>
    );

    const renderPolicyItem = ({ item }) => (
        <View style={styles.policyCard}>
            <View style={styles.row}>
                <Text style={styles.label}>Policy Number :</Text>
                <Text style={styles.value}>{item.policyNumber}</Text>
                <TouchableOpacity onPress={() => handleDeletePolicy(item.id, item.policyNumber)}>
                    <FontAwesome name="trash" size={18} color="white" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
            </View>
            <Text style={styles.infoText}>Company Name : {item.companyName}</Text>
            <Text style={styles.infoText}>Policy Period : {item.policyPeriod}</Text>
            <Text style={styles.infoText}>Status : {item.status}</Text>
        </View>
    );

    const renderDropdownItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => handleDropdownSelect(item)}
        >
            <Text style={styles.dropdownItemText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.gradient}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.header} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#05445E" />
                    <Text style={styles.title}>Manage Policy</Text>
                </TouchableOpacity>

                {deletedPolicies.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.sectionTitle}>Deleted Policies</Text>
                        <FlatList
                            data={deletedPolicies}
                            horizontal
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderDeletedPolicy}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10 }}
                        />
                    </View>
                )}

                <Text style={styles.sectionTitle}>ADD POLICY</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="G/010/SHE/18666/25"
                        value={policyNumber}
                        onChangeText={handleInputChange}
                    />
                    <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <Ionicons 
                            name={showDropdown ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#05445E" 
                        />
                    </TouchableOpacity>
                </View>

                {showDropdown && (
                    <View style={styles.dropdownContainer}>
                        <FlatList
                            data={dropdownOptions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderDropdownItem}
                            style={styles.dropdown}
                            nestedScrollEnabled={true}
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.addButton} onPress={handleAddPolicy}>
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>POLICY DETAILS</Text>

                <FlatList
                    data={policyList}
                    keyExtractor={item => item.id}
                    renderItem={renderPolicyItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />

                {/* Modal overlay to close dropdown when clicking outside */}
                <Modal
                    visible={showDropdown}
                    transparent={true}
                    animationType="none"
                    onRequestClose={() => setShowDropdown(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowDropdown(false)}
                    />
                </Modal>
            </View>
        </LinearGradient>
    );
};

export default AddPolicy;

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 30,
    },
    title: {
        fontSize: 20,
        color: '#05445E',
        fontWeight: 'bold',
        marginLeft: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 10,
        position: 'relative',
    },
    input: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
    },
    dropdownButton: {
        padding: 10,
        paddingLeft: 5,
    },
    dropdownContainer: {
        position: 'relative',
        zIndex: 1000,
        marginBottom: 10,
    },
    dropdown: {
        backgroundColor: 'white',
        borderRadius: 8,
        maxHeight: 150,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#05445E',
    },
    addButton: {
        backgroundColor: '#189AB4',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#05445E',
        marginBottom: 10,
        marginTop: 20,
    },
    policyCard: {
        backgroundColor: '#189AB4',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    infoText: {
        color: 'white',
        marginBottom: 4,
    },
    label: {
        color: 'white',
        fontWeight: 'bold',
    },
    value: {
        color: 'white',
        flex: 1,
        marginLeft: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    deletedTag: {
        backgroundColor: '#05445E',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    deletedTagText: {
        color: 'white',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});