import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; 
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const IllnessPopup = ({ visible, onClose }) => {
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter(); 

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }, 300);
    } else {
      glowAnimation.setValue(0);
    }
  }, [visible]);

  const animatedGlowStyle = {
    shadowOpacity: glowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8],
    }),
    shadowRadius: glowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 40],
    }),
    transform: [
      {
        scale: glowAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };

  const handleNext = () => {
    console.log('Navigating to illnessDetails...');
    router.replace('/illnessDetails'); // Replace so this page is removed from stack
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, animatedGlowStyle]}>
          <LinearGradient
            colors={['#FFFFFF', '#6DD3D3']}
            style={styles.gradientBackground}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="times" size={24} color="#13515C" />
            </TouchableOpacity>

            <View style={styles.contentContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Illness"
                  placeholderTextColor="#A79C9C"
                />
              </View>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    height: '40%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6DD3D3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 15,
  },
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#13515C',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButton: {
    backgroundColor: '#17ABB7',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 15,
    minWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default IllnessPopup;
