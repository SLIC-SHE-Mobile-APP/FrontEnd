import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Modal, Animated, Dimensions, Image, Linking, Alert } from 'react-native';

const HealthPolicyDetails = () => {
  const navigation = useNavigation();
  const [showHealthCardModal, setShowHealthCardModal] = useState(false);
  const [showDependentModal, setShowDependentModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [dependentSlideAnim] = useState(new Animated.Value(0));

  const { height: screenHeight } = Dimensions.get('window');

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

  const makePhoneCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((error) => {
        console.error('Error making phone call:', error);
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

  const handleButtonPress = (buttonLabel) => {
    if (buttonLabel === 'Health Insurance Card') {
      setShowHealthCardModal(true);
      // Animate the modal sliding up from bottom
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    if (buttonLabel === 'Dependent Details') {
      setShowDependentModal(true);
      // Animate the dependent modal sliding up from bottom
      Animated.timing(dependentSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    if (buttonLabel === 'Hospitals List') {
      navigation.navigate('hospitalList');
    }
    if (buttonLabel === 'Download Claim Forms') {
      navigation.navigate('DownloadClaimForms');
    }
    if (buttonLabel === 'Claim Intimations') {
      navigation.navigate('OnlineClaimIntimations');
    }
    if (buttonLabel === 'Bank Details') {
      navigation.navigate('BankDetailsSum');
    }
    if (buttonLabel === 'Claim Documents Required') {
      navigation.navigate('ClaimDocRequired');
    }
  };

  const closeModal = () => {
    // Animate the modal sliding down
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowHealthCardModal(false);
    });
  };

  const closeDependentModal = () => {
    // Animate the dependent modal sliding down
    Animated.timing(dependentSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDependentModal(false);
    });
  };

  const buttons = [
    'Health Insurance Card',
    'Dependent Details',
    'Bank Details',
    'Claim Documents Required',
    'Hospitals List',
    'Download Claim Forms',
    'Claim Intimations',
    'Claim History',
    'Pending Requirements',
    'Payment History'
  ];

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={{ flex: 1 }}
    >
      {/* Fixed Header Section */}
      <View style={{ paddingHorizontal: 15 }}>
        {/* Back Icon + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={23} color="#13646D" style={{ marginRight: 1, marginLeft: 12 }} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 22,
            fontFamily: 'Adamina',
            fontWeight:'800',
            color: '#13646D',
            letterSpacing: 0.38,
            lineHeight: 30,
            flex: 1,
            textAlign: 'center'
          }}>
            Health Policy Details
          </Text>
        </View>

        {/* Policy Info Card */}
        <View style={{
          backgroundColor: '#51A7AE80',
          borderRadius: 15,
          padding: 20,
          marginTop: 30,
          marginHorizontal: 13,
          height: 130,
          justifyContent: 'space-between'
        }}>
          {['policy No :   22222',
            'Member No :  G/010/SHE/ 19400/24',
            'Member name :   H M M K Herath',
            'Company : M/S. Board of Investment Sri Lanka'
          ].map((item, idx) => (
            <Text
              key={idx}
              style={{
                fontSize: 15,
                fontFamily: 'Adamina',
                fontWeight: '400',
                color: '#FFFFFF',
                textAlign: 'left',
                letterSpacing: 0.38
              }}
            >
              {item}
            </Text>
          ))}
        </View>
      </View>

      {/* Scrollable Buttons Section */}
      <View style={{ flex: 1, marginTop: 35, marginBottom:30 }}>
        <View style={{
          borderRadius: 30,
          backgroundColor: '#FFFF',
          marginHorizontal: 30,
          flex: 1,
          overflow: 'hidden'
        }}>
          <ScrollView 
            contentContainerStyle={{ 
              padding: 20,
              paddingBottom: 30 
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Buttons */}
            {buttons.map((label, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: '#17ABB7',
                  width: '100%',
                  fontFamily: 'Adamina',
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                  alignItems: 'center'
                }}
                onPress={() => handleButtonPress(label)}
              >
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'AbhayaLibreMedium',
                  fontWeight: '500'
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Health Insurance Card Modal Popup */}
      <Modal
        visible={showHealthCardModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        {/* Semi-transparent overlay */}
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end'
          }}
          activeOpacity={1}
          onPress={closeModal}
        >
          {/* Modal Content */}
          <Animated.View
            style={{
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, 0],
                })
              }]
            }}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 40,
                minHeight: screenHeight * 0.6,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: -3,
                },
                shadowOpacity: 0.27,
                shadowRadius: 4.65,
                elevation: 6,
              }}>
                {/* Modal Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <Text style={{
                    fontSize: 20,
                    fontFamily: 'Adamina',
                    fontWeight: '700',
                    color: '#13646D',
                    flex: 1,
                    textAlign: 'center'
                  }}>
                    Health Insurance Card
                  </Text>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={{
                      padding: 5,
                      position: 'absolute',
                      right: 0
                    }}
                  >
                    <Ionicons name="close" size={24} color="#13646D" />
                  </TouchableOpacity>
                </View>

                {/* Drag indicator */}
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#E0E0E0',
                  borderRadius: 2,
                  alignSelf: 'center',
                  position: 'absolute',
                  top: 8
                }} />

                {/* Health Insurance Card Content */}
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {/* Card Image */}
                  <View style={{
                    alignItems: 'center',
                    marginBottom: 20
                  }}>
                    <Image 
                      source={require('../assets/images/SHE.png')} 
                      style={{
                        width: '100%',
                        height: 200,
                      }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Directions Section */}
                  <View style={{
                    padding: 20,
                    borderRadius: 15,
                    borderWidth: 0.5,
                    borderColor: '#13646D',
                    backgroundColor: '#F8F9FA'
                  }}>
                    <Text style={{
                      fontWeight: 'bold',
                      color: '#2E5A87',
                      textAlign: 'center',
                      marginBottom: 15,
                      fontSize: 18,
                      fontFamily: 'Adamina'
                    }}>
                      Directions
                    </Text>
                    
                    <Text style={{
                      marginBottom: 12,
                      color: '#333',
                      fontSize: 14,
                      lineHeight: 20,
                      fontFamily: 'AbhayaLibreMedium'
                    }}>
                      This digital card must be presented to the service provider with NIC and/or Employee ID to be eligible for the benefits.
                    </Text>
                    
                    <Text style={{
                      marginBottom: 12,
                      color: '#333',
                      fontSize: 14,
                      lineHeight: 20,
                      fontFamily: 'AbhayaLibreMedium'
                    }}>
                      Please call our 24 hour TOLL FREE HOTLINE in the event of Hospitalization and Discharge.
                    </Text>

                    <Text style={{
                      fontWeight: 'bold',
                      color: '#2E5A87',
                      fontSize: 16,
                      marginBottom: 10,
                      marginTop: 8,
                      fontFamily: 'Adamina'
                    }}>
                      Hotlines:
                    </Text>

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity 
                          style={{
                            flexDirection: 'row',
                            marginTop: 15,
                            alignItems: 'center'
                          }}
                          onPress={() => makePhoneCall('0112357357')}
                        >
                          <Ionicons name="call" size={18} color="#2E5A87" style={{ marginRight: 8 }} />
                          <Text style={{
                            fontWeight: 'bold',
                            color: '#2E5A87',
                            fontSize: 16,
                            fontFamily: 'AbhayaLibreMedium'
                          }}>
                            0112357357
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity 
                          style={{
                            flexDirection: 'row',
                            marginTop: 15,
                            alignItems: 'center'
                          }}
                          onPress={() => makePhoneCall('0114357357')}
                        >
                          <Ionicons name="call" size={18} color="#2E5A87" style={{ marginRight: 8 }} />
                          <Text style={{
                            fontWeight: 'bold',
                            color: '#2E5A87',
                            fontSize: 16,
                            fontFamily: 'AbhayaLibreMedium'
                          }}>
                            0114357357
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Dependent Details Modal Popup */}
      <Modal
        visible={showDependentModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeDependentModal}
      >
        {/* Semi-transparent overlay */}
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end'
          }}
          activeOpacity={1}
          onPress={closeDependentModal}
        >
          {/* Modal Content */}
          <Animated.View
            style={{
              transform: [{
                translateY: dependentSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, 0],
                })
              }]
            }}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 40,
                minHeight: screenHeight * 0.5,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: -3,
                },
                shadowOpacity: 0.27,
                shadowRadius: 4.65,
                elevation: 6,
              }}>
                {/* Modal Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <Text style={{
                    fontSize: 20,
                    fontFamily: 'Adamina',
                    fontWeight: '700',
                    color: '#13646D',
                    flex: 1,
                    textAlign: 'center'
                  }}>
                    Dependent Details
                  </Text>
                  <TouchableOpacity
                    onPress={closeDependentModal}
                    style={{
                      padding: 5,
                      position: 'absolute',
                      right: 0
                    }}
                  >
                    <Ionicons name="close" size={24} color="#13646D" />
                  </TouchableOpacity>
                </View>

                {/* Drag indicator */}
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#E0E0E0',
                  borderRadius: 2,
                  alignSelf: 'center',
                  position: 'absolute',
                  top: 8
                }} />

                {/* Dependent Details Content */}
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <View style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 10,
                    overflow: 'hidden',
                    borderColor: '#2EC6C6',
                    borderWidth: 2,
                    width: '100%',
                    maxHeight: '80%',
                  }}>
                    {/* Table Header */}
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: '#2EC6C6',
                      paddingVertical: 12,
                      paddingHorizontal: 5,
                    }}>
                      <Text style={{
                        flex: 1,
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: 14,
                        fontFamily: 'Adamina'
                      }}>Name</Text>
                      <Text style={{
                        flex: 1,
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: 14,
                        fontFamily: 'Adamina'
                      }}>Date of Birth</Text>
                      <Text style={{
                        flex: 1,
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: 14,
                        fontFamily: 'Adamina'
                      }}>Enrollment Date</Text>
                      <Text style={{
                        flex: 1,
                        color: '#fff',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: 14,
                        fontFamily: 'Adamina'
                      }}>Relationship</Text>
                    </View>

                    {/* Table Rows - Scrollable */}
                    <ScrollView 
                      style={{ maxHeight: 300 }}
                      showsVerticalScrollIndicator={false}
                    >
                      {dependentsData.map((dependent) => (
                        <View 
                          key={dependent.id} 
                          style={{
                            flexDirection: 'row',
                            paddingVertical: 12,
                            paddingHorizontal: 5,
                            backgroundColor: '#F9F9F9',
                            borderBottomWidth: 1,
                            borderBottomColor: '#E0E0E0',
                          }}
                        >
                          <Text style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 13,
                            color: '#333',
                            fontFamily: 'AbhayaLibreMedium'
                          }}>{dependent.name}</Text>
                          <Text style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 13,
                            color: '#333',
                            fontFamily: 'AbhayaLibreMedium'
                          }}>{dependent.dateOfBirth}</Text>
                          <Text style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 13,
                            color: '#333',
                            fontFamily: 'AbhayaLibreMedium'
                          }}>{dependent.enrollmentDate}</Text>
                          <Text style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 13,
                            color: '#333',
                            fontFamily: 'AbhayaLibreMedium'
                          }}>{dependent.relationship}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

export default HealthPolicyDetails;