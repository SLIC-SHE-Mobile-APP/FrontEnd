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

const PendingIntimations = ({ onClose }) => {
    const pendingClaims = [
        {
            referenceNo: 'M000428',
            enteredBy: 'Member',
            relationship: 'Daughter',
            claimType: 'Out-door',
            createdOn: '24-12-2020'
        },
        {
            referenceNo: 'M000428',
            enteredBy: 'Member',
            relationship: 'Daughter',
            claimType: 'Out-door',
            createdOn: '24-12-2020'
        },
        {
            referenceNo: 'M000428',
            enteredBy: 'Member',
            relationship: 'Daughter',
            claimType: 'Out-door',
            createdOn: '24-12-2020'
        },
        {
            referenceNo: 'M000428',
            enteredBy: 'Member',
            relationship: 'Daughter',
            claimType: 'Out-door',
            createdOn: '24-12-2020'
        }
    ];

    return (
        <LinearGradient
            colors={['#FFFFFF', '#6DD3D3']}
            style={styles.container}
        >
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={{ width: 26 }} />
                <Text style={styles.headerTitle}>Pending Intimations</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={26} color="#2E7D7D" style={{ marginRight: 15 }} />
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                {pendingClaims.map((claim, index) => (
                    <View key={index} style={styles.claimCard}>
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
                            </View>
                        </View>

                        <View style={styles.actionIcons}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="create" size={20} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="trash" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    claimCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        marginBottom: 15,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
        alignItems: 'flex-start',
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginLeft: 10,
    },
    iconButton: {
        padding: 8,
        marginBottom: 8,
    },
});

export default PendingIntimations;
