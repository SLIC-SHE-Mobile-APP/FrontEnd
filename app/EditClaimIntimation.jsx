import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import { SafeAreaView } from "react-native-safe-area-context";


const EditClaimIntimation = ({ route}) => {
    const navigation = useNavigation();
    const { claim } = route?.params || {};

    // Claim details (read-only display)
    const claimDetails = {
        referenceNo: claim?.referenceNo || 'M000428',
        enteredBy: claim?.enteredBy || 'Member',
        status: claim?.status || 'Submission for Approval Pending',
        claimType: claim?.claimType || 'Out-door',
        createdOn: claim?.createdOn || '24-12-2020',
    };

    // Beneficiaries state
    const [beneficiaries, setBeneficiaries] = useState([
        {
            id: '1',
            name: 'H.M.M.K Herath',
            relationship: '1.00',
            illness: 'gg',
            amount: '1.00',
        }
    ]);

    // Documents state
    const [documents, setDocuments] = useState([
        {
            id: '1',
            type: 'Diagnosis Card',
            date: '06/07/2025',
            amount: '2.00',
        }
    ]);

    // Modal states
    const [isAddBeneficiaryModalVisible, setAddBeneficiaryModalVisible] = useState(false);
    const [isAddDocumentModalVisible, setAddDocumentModalVisible] = useState(false);
    const [isEditBeneficiaryModalVisible, setEditBeneficiaryModalVisible] = useState(false);
    const [isEditDocumentModalVisible, setEditDocumentModalVisible] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // New beneficiary form
    const [newBeneficiary, setNewBeneficiary] = useState({
        name: '',
        relationship: '',
        illness: '',
        amount: '',
    });

    // New document form
    const [newDocument, setNewDocument] = useState({
        type: '',
        date: '',
        amount: '',
    });

    // Navigate to UploadDocuments page
    const handleNavigateToUploadDocuments = () => {
        navigation.navigate('UploadDocuments', {
            claim: claim,
            beneficiaries: beneficiaries,
            documents: documents,
            fromEditClaim: true
        });
    };

    // Add beneficiary
    const handleAddBeneficiary = () => {
        if (newBeneficiary.name && newBeneficiary.relationship) {
            setBeneficiaries(prev => [...prev, {
                id: Date.now().toString(),
                ...newBeneficiary
            }]);
            setNewBeneficiary({ name: '', relationship: '', illness: '', amount: '' });
            setAddBeneficiaryModalVisible(false);
        }
    };

    // Edit beneficiary
    const handleEditBeneficiary = (beneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setNewBeneficiary(beneficiary);
        setEditBeneficiaryModalVisible(true);
    };

    // Save beneficiary edit
    const handleSaveBeneficiaryEdit = () => {
        setBeneficiaries(prev => prev.map(item =>
            item.id === selectedBeneficiary.id ? { ...item, ...newBeneficiary } : item
        ));
        setEditBeneficiaryModalVisible(false);
        setNewBeneficiary({ name: '', relationship: '', illness: '', amount: '' });
    };

    // Delete beneficiary
    const handleDeleteBeneficiary = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this beneficiary?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setBeneficiaries(prev => prev.filter(item => item.id !== id));
                    },
                },
            ]
        );
    };

    // Add document
    const handleAddDocument = () => {
        if (newDocument.type && newDocument.date) {
            setDocuments(prev => [...prev, {
                id: Date.now().toString(),
                ...newDocument
            }]);
            setNewDocument({ type: '', date: '', amount: '' });
            setAddDocumentModalVisible(false);
        }
    };

    // Edit document
    const handleEditDocument = (document) => {
        setSelectedDocument(document);
        setNewDocument(document);
        setEditDocumentModalVisible(true);
    };

    // Save document edit
    const handleSaveDocumentEdit = () => {
        setDocuments(prev => prev.map(item =>
            item.id === selectedDocument.id ? { ...item, ...newDocument } : item
        ));
        setEditDocumentModalVisible(false);
        setNewDocument({ type: '', date: '', amount: '' });
    };

    // Delete document
    const handleDeleteDocument = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setDocuments(prev => prev.filter(item => item.id !== id));
                    },
                },
            ]
        );
    };

    // Handle submit
    const handleSubmitClaim = () => {
        Alert.alert(
            'Submit Claim',
            'Are you sure you want to submit this claim?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: () => {
                        Alert.alert('Success', 'Claim submitted successfully!');
                        navigation?.goBack();
                    },
                },
            ]
        );
    };

    // Handle submit later
    const handleSubmitLater = () => {
        Alert.alert('Saved', 'Claim saved for later submission.');
        navigation?.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#FFFFFF', '#6DD3D3']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SHE Claim Intimation</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Claim Details Section - Read Only */}
                <View style={styles.claimDetailsSection}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reference No</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.detailValue}>{claimDetails.referenceNo}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Entered By</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.detailValue}>{claimDetails.enteredBy}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.detailValue}>{claimDetails.status}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Claim Type</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.detailValue}>{claimDetails.claimType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Created on</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.detailValue}>{claimDetails.createdOn}</Text>
                    </View>
                </View>

                {/* Beneficiaries Title - Full Width */}
                <View style={styles.beneficiariesTitleContainer}>
                    <Text style={styles.beneficiariesTitle}>Beneficiaries for Claim</Text>
                </View>

                {/* Beneficiaries Section */}
                <View style={styles.beneficiariesSection}>
                    {beneficiaries.map((beneficiary) => (
                        <View key={beneficiary.id} style={styles.beneficiaryCard}>
                            <View style={styles.beneficiaryContent}>
                                <View style={styles.beneficiaryRow}>
                                    <Text style={styles.beneficiaryLabel}>Name</Text>
                                    <Text style={styles.beneficiaryColon}>:</Text>
                                    <Text style={styles.beneficiaryValue}>{beneficiary.name}</Text>
                                </View>
                                <View style={styles.beneficiaryRow}>
                                    <Text style={styles.beneficiaryLabel}>Relationship</Text>
                                    <Text style={styles.beneficiaryColon}>:</Text>
                                    <Text style={styles.beneficiaryValue}>{beneficiary.relationship}</Text>
                                </View>
                                <View style={styles.beneficiaryRow}>
                                    <Text style={styles.beneficiaryLabel}>Illness</Text>
                                    <Text style={styles.beneficiaryColon}>:</Text>
                                    <Text style={styles.beneficiaryValue}>{beneficiary.illness}</Text>
                                </View>
                                <View style={styles.beneficiaryRow}>
                                    <Text style={styles.beneficiaryLabel}>Amount</Text>
                                    <Text style={styles.beneficiaryColon}>:</Text>
                                    <Text style={styles.beneficiaryValue}>{beneficiary.amount}</Text>
                                </View>
                            </View>
                            <View style={styles.beneficiaryActionIcons}>
                                
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addBeneficiaryButton}
                        onPress={handleNavigateToUploadDocuments}
                    >
                        <Text style={styles.addBeneficiaryText}>Add More Documents</Text>
                    </TouchableOpacity>
                </View>

                {/* Documents Section */}
                <View style={styles.documentsSection}>
                    {documents.map((document) => (
                        <View key={document.id} style={styles.documentCard}>
                            <View style={styles.documentImagePlaceholder}>
                                <Ionicons name="document-outline" size={24} color="#4DD0E1" />
                            </View>
                            <View style={styles.documentContent}>
                                <View style={styles.documentRow}>
                                    <Text style={styles.documentLabel}>Document Type</Text>
                                    <Text style={styles.documentColon}>:</Text>
                                    <Text style={styles.documentValue}>{document.type}</Text>
                                </View>
                                <View style={styles.documentRow}>
                                    <Text style={styles.documentLabel}>Date of Document</Text>
                                    <Text style={styles.documentColon}>:</Text>
                                    <Text style={styles.documentValue}>{document.date}</Text>
                                </View>
                                <View style={styles.documentRow}>
                                    <Text style={styles.documentLabel}>Amount</Text>
                                    <Text style={styles.documentColon}>:</Text>
                                    <Text style={styles.documentValue}>{document.amount}</Text>
                                </View>
                            </View>
                            <View style={styles.documentActionIcons}>
                                <TouchableOpacity
                                    style={styles.documentIconButton}
                                    onPress={() => handleEditDocument(document)}
                                >
                                    <Ionicons name="create-outline" size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.documentIconButton}
                                    onPress={() => handleDeleteDocument(document.id)}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmitClaim}>
                        <Text style={styles.submitButtonText}>Submit Claim</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.submitLaterButton} onPress={handleSubmitLater}>
                        <Text style={styles.submitLaterButtonText}>Submit Later</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Add Beneficiary Modal */}
            <Modal
                visible={isAddBeneficiaryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddBeneficiaryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Beneficiary</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.name}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, name: value }))}
                            placeholder="Enter name"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.relationship}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, relationship: value }))}
                            placeholder="Enter relationship"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.illness}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, illness: value }))}
                            placeholder="Enter illness"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.amount}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, amount: value }))}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setAddBeneficiaryModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddBeneficiary} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Beneficiary Modal */}
            <Modal
                visible={isEditBeneficiaryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditBeneficiaryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Beneficiary</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.name}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, name: value }))}
                            placeholder="Enter name"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.relationship}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, relationship: value }))}
                            placeholder="Enter relationship"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.illness}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, illness: value }))}
                            placeholder="Enter illness"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newBeneficiary.amount}
                            onChangeText={(value) => setNewBeneficiary(prev => ({ ...prev, amount: value }))}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setEditBeneficiaryModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveBeneficiaryEdit} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Document Modal */}
            <Modal
                visible={isAddDocumentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddDocumentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Document</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newDocument.type}
                            onChangeText={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
                            placeholder="Enter document type (e.g., JPG, Diagnosis Card)"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newDocument.date}
                            onChangeText={(value) => setNewDocument(prev => ({ ...prev, date: value }))}
                            placeholder="Enter date (DD/MM/YYYY)"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newDocument.amount}
                            onChangeText={(value) => setNewDocument(prev => ({ ...prev, amount: value }))}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setAddDocumentModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddDocument} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Document Modal */}
            <Modal
                visible={isEditDocumentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditDocumentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Document</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newDocument.type}
                            onChangeText={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
                            placeholder="Enter document type (e.g., JPG, Diagnosis Card)"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newDocument.date}
                            onChangeText={(value) => setNewDocument(prev => ({ ...prev, date: value }))}
                            placeholder="Enter date (DD/MM/YYYY)"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newDocument.amount}
                            onChangeText={(value) => setNewDocument(prev => ({ ...prev, amount: value }))}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setEditDocumentModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveDocumentEdit} style={styles.saveBtn}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient></SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'black', 
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2E7D7D',
        flex: 1,
        textAlign: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 0,
        paddingBottom: 30,
    },
    
    // Claim Details Section - Fixed alignment
    claimDetailsSection: {
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
        borderRadius: 15,
        marginBottom: 20,
        marginHorizontal: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: '#4DD0E1',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#4DD0E1',
        fontWeight: '500',
        width: 100,
        flexShrink: 0,
    },
    colon: {
        fontSize: 13,
        color: '#4DD0E1',
        fontWeight: '500',
        width: 20,
        textAlign: 'center',
    },
    detailValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '400',
        flex: 1,
    },
    
    // Beneficiaries Title - Full Width Background
    beneficiariesTitleContainer: {
        backgroundColor: '#6DD3D3',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginBottom: 15,
    },
    beneficiariesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    
    // Beneficiaries Section - Fixed alignment
    beneficiariesSection: {
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 20,
        marginHorizontal: 20,
        padding: 5,
        borderWidth: 1,
        borderColor: '#4DD0E1',
    },
    beneficiaryCard: {
        borderRadius: 10,
        padding: 12,
        position: 'relative',
        marginBottom: 5,
    },
    beneficiaryContent: {
        paddingRight: 60,
    },
    beneficiaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    beneficiaryLabel: {
        fontSize: 13,
        color: '#4DD0E1',
        fontWeight: '500',
        width: 90,
        flexShrink: 0,
    },
    beneficiaryColon: {
        fontSize: 13,
        color: '#4DD0E1',
        fontWeight: '500',
        width: 20,
        textAlign: 'center',
    },
    beneficiaryValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '400',
        flex: 1,
    },
    beneficiaryActionIcons: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        gap: 8,
    },
    beneficiaryIconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    addBeneficiaryButton: {
        backgroundColor: '#2E7D7D',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignSelf: 'flex-end',
        marginRight: 5,
        marginBottom: 5,
        marginTop: 5,
    },
    addBeneficiaryText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    
    // Documents Section - Fixed alignment
    documentsSection: {
        marginBottom: 20,
        marginHorizontal: 20,
    },
    documentCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        marginBottom: 15,
        padding: 12,
        borderWidth: 1,
        borderColor: '#4DD0E1',
        position: 'relative',
        minHeight: 100,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    documentImagePlaceholder: {
        width: 50,
        height: 60,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#4DD0E1',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
    },
    documentContent: {
        flex: 1,
        paddingRight: 60,
    },
    documentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    documentLabel: {
        fontSize: 13,
        color: '#4DD0E1',
        fontWeight: '500',
        width: 120,
        flexShrink: 0,
    },
    documentColon: {
        fontSize: 13,
        color: '#4DD0E1',
        fontWeight: '500',
        width: 20,
        textAlign: 'center',
    },
    documentValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '400',
        flex: 1,
    },
    documentActionIcons: {
        position: 'absolute',
        Top:50,
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        gap: 8,
    },
    documentIconButton: {
        backgroundColor: '#2E7D7D',
        borderRadius: 12,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: 35,
        height: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    addDocumentButton: {
        backgroundColor: '#2E7D7D',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    addDocumentText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    
    // Action Buttons
    buttonContainer: {
        marginTop: 20,
        marginHorizontal: 20,
    },
    submitButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonText: {
        color: '#0A4C51',
        fontSize: 16,
        fontWeight: '600',
    },
    submitLaterButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitLaterButtonText: {
        color: '#0A4C51',
        fontSize: 16,
        fontWeight: '600',
    },
    
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        color: '#2E7D7D',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 15,
        fontSize: 14,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cancelBtn: {
        marginRight: 15,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    cancelText: {
        color: '#888',
        fontWeight: '500',
    },
    saveBtn: {
        backgroundColor: '#4DD0E1',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    saveText: {
        color: '#fff',
        fontWeight: '500',
    },
});

export default EditClaimIntimation;