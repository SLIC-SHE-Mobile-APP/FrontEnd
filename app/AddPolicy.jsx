import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const AddPolicy = () => {
    const [policyNumber, setPolicyNumber] = useState('');
    const [policyList, setPolicyList] = useState([]);
    const [deletedPolicies, setDeletedPolicies] = useState([]);
    const navigation = useNavigation();

    const handleAddPolicy = () => {
        if (!policyNumber.trim()) {
            Alert.alert('Validation', 'Please enter a policy number');
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

                <TextInput
                    style={styles.input}
                    placeholder="G/010/SHE/18666/25"
                    value={policyNumber}
                    onChangeText={setPolicyNumber}
                />

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
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
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
});
