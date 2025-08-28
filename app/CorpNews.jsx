import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from "expo-router";

const CorpNews = () => {
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {

        if (router.canGoBack()) {
          router.back();
          return true;
        }


        return false;
      };


      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const handleBackPress = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {

      router.replace("/(tabs)/home");
    }
  }, []);


  return (
    <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Corporate News</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.notFoundContainer}>
          <Image
            source={require('../assets/images/notfound.png')}
            style={styles.notFoundImage}
            resizeMode="contain"
          />
          <Text style={styles.notFoundTitle}>Page is not found</Text>
          <Text style={styles.notFoundSubtitle}>
            The page you were looking for does not exist.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 20,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notFoundContainer: {
    alignItems: 'center',
    marginBottom: 100, // Adjust to center vertically
  },
  notFoundImage: {
    width: 120,
    height: 120,
    marginBottom: 30,
    opacity: 0.8,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90A4',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: '#6B8E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CorpNews;