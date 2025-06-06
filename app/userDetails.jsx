import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function UserDetailsScreen() {
  // Animation value for fade-in effect
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start the fade-in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const menuItems = [
    { icon: 'person-outline', label: 'View / Edit Profile', route: '/profile', top: 240, backgroundColor:'black' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings', top: 310 },
    { icon: 'person-outline', label: 'Help', route: '/help', top: 380 },
    { icon: 'shield-outline', label: 'Privacy Policy', route: '/privacy-policy', top: 450 },
    { icon: 'call-outline', label: 'Contact Us', route: '/contact', top: 520 },
    { icon: 'newspaper-outline', label: 'Corporate News', route: '/news', top: 590 },
    { icon: 'log-out-outline', label: 'Logout', route: '/loginRequestOTP', top: 660 }
  ];

  return (
    <LinearGradient
      colors={['#FFFFFF', '#6DD3D3']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerBackground} />
        
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={24} color="#075349" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <Image
            source={require('@/assets/images/default-avatar.png')}
            style={styles.avatar}
          />
          <ThemedText style={styles.userName}>Mr. Sanjeewa De Silva</ThemedText>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.menuItem, { top: item.top }]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.label === 'Logout') {
                  router.replace(item.route);
                } else {
                  router.push(item.route);
                }
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={24} color="#075349" />
              </View>
              <ThemedText style={styles.menuItemText}>{item.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 46,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerBackground: {
    position: 'absolute',
    width: '100%',
    height: height * 0.25,
    backgroundColor: '#FFFFFF',
    top: -2,
  },
  backButton: {
    position: 'absolute',
    left: width * 0.05,
    top: height * 0.07,
    zIndex: 10,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    position: 'absolute',
    alignItems: 'center',
    left: width * 0.35,
    top: height * 0.08,
  },
  avatar: {
    width: width * 0.22,
    height: width * 0.22,
    borderRadius: width * 0.11,
    borderWidth: 2,
    borderColor: '#E8F8F8',
  },
  userName: {
    position: 'absolute',
    width: 239,
    top: 92,
    fontFamily: 'Actor',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: '#13646D',
  },
  menuList: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    
  },
  menuItem: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    left: 40,
    height: 50,
    width: width * 0.8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F8F8',
    borderRadius: 20,
    marginRight: 10,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.38,
    color: '#075349',
    fontFamily: 'Actor',
  },
});