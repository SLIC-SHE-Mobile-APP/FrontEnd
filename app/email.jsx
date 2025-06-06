import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EmailVerification() {
    const [email, setEmail] = useState('');

    const handleSubmit = () => {
        // Handle email submission logic here
        console.log('Email submitted:', email);
    };

    const handleSkip = () => {
        // Handle skip logic here
        console.log('Skip pressed');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#6DD3D3', '#FAFAFA']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.innerContainer}>
                        {/* Header Section */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>SLIC</Text>
                            <View style={styles.generalBox}>
                                <Text style={styles.generalText}>GENERAL</Text>
                            </View>
                        </View>

                        {/* Content Section */}
                        <View style={styles.contentContainer}>
                            <Text style={styles.instructionText}>
                                Enter your email address to verify your registration
                            </Text>

                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.submitButtonText}>Submit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={handleSkip}
                            >
                                <Text style={styles.skipButtonText}>Skip</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                Contact us through <Text style={styles.phoneNumber}>0112252596</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#6DD3D3',
    },
    gradient: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    innerContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '100%',
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    title: {
        fontSize: 100,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Arial' : 'Abhaya Libre ExtraBold',
        letterSpacing: 2,
    },
    generalBox: {
        backgroundColor: 'rgba(255,0,0,1)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 4,
    },
    generalText: {
        fontSize: 30,
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    instructionText: {
        fontSize: 18,
        color: 'rgba(19,100,109,1)',
        textAlign: 'center',
        marginBottom: 40,
        marginTop:20,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    input: {
        width: 297,
        height: 52,
        borderColor: '#6DD3D3',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 20,
        marginBottom: 20,
        fontSize: 16,

    },
    submitButton: {
        backgroundColor: 'rgba(23,171,183,1)',
        paddingVertical: 15,
        borderRadius: 25,
        width: 300, 
        height: 48,
        display:'flex',
        alignItems: 'center',
        justifyContent:'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        backgroundColor: 'rgba(23,171,183,0.8)',
        paddingVertical: 15,
        borderRadius: 25,
        width: 300, height: 48,
        display:'flex',
        alignItems: 'center',
        justifyContent:'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footerContainer: {
        marginTop:100,
        alignItems: 'center',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(19,100,109,1)',
        textAlign: 'center',
    },
    phoneNumber: {
        color: 'rgba(23,171,183,1)',
        fontWeight: '600',
    },
});