import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const { width, height } = Dimensions.get("window");

export default function ViewProfile() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [profileData, setProfileData] = useState({
    name: "",
    "address 1": "",
    "address 2": "",
    dateOfBirth: "",
    nicNo: "",
    gender: "",
  });

  const [userName, setUserName] = useState("Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Loading Animation Component
  const LoadingIcon = () => {
    const [rotateAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(1));

    useEffect(() => {
      const createRotateAnimation = () => {
        return Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        );
      };

      const createPulseAnimation = () => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const rotateAnimation = createRotateAnimation();
      const pulseAnimation = createPulseAnimation();

      rotateAnimation.start();
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    }, []);

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <Animated.View
        style={[
          styles.customLoadingIcon,
          {
            transform: [{ rotate: spin }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.loadingIconOuter}>
          <View style={styles.loadingIconInner}>
            <Icon name="heartbeat" size={24} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>
    );
  };

  // Loading Screen Component with Custom Icon
  const LoadingScreen = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <LoadingIcon />
        <ThemedText style={styles.loadingText}>
          Loading Profile Details...
        </ThemedText>
        <ThemedText style={styles.loadingSubText}>
          Please wait a moment
        </ThemedText>
      </View>
    </View>
  );

  // Function to determine gender from NIC
  const getGenderFromNIC = (nic) => {
    if (!nic || nic.length < 10) return "Male"; // Default to Male if NIC is invalid

    try {
      let dayOfBirth;
      if (nic.length === 10) {
        // Old NIC format (9 digits + 1 letter)
        dayOfBirth = parseInt(nic.substring(2, 5));
      } else if (nic.length === 12) {
        // New NIC format (12 digits)
        dayOfBirth = parseInt(nic.substring(4, 7));
      } else {
        return "Male"; // Default fallback
      }

      return dayOfBirth > 500 ? "Female" : "Male";
    } catch (error) {
      return "Male"; // Default fallback on error
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return dateString;
    }
  };

  // Function to fetch employee info
  const fetchEmployeeInfo = async () => {
    try {
      const storedNic = await SecureStore.getItemAsync("user_nic");
      const policyNumber = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNumber = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      if (!policyNumber || !memberNumber) {
        setUserName("User");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://shemobileapi.slicgeneral.com/api/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNumber}&memberNo=${memberNumber}`
      );

      if (response.ok) {
        const data = await response.json();

        // Determine NIC to use (API response or stored)
        const nicToUse = data.nic || storedNic || "";
        const gender = getGenderFromNIC(nicToUse);
        const genderTitle = gender === "Female" ? "Mrs." : "Mr.";

        // Set user name with appropriate title
        setUserName(`${genderTitle} ${data.memberName || "User"}`);

        // Update profile data
        setProfileData({
          name: data.memberName || "",
          "address 1": data.address1 || "",
          "address 2": data.address2 || "",
          dateOfBirth: formatDate(data.dateOfBirth),
          nicNo: nicToUse,
          gender: gender,
        });
      } else {
        // Fallback to stored data if API fails
        const gender = getGenderFromNIC(storedNic);
        const genderTitle = gender === "Female" ? "Mrs." : "Mr.";
        setUserName(`${genderTitle} User`);

        setProfileData((prev) => ({
          ...prev,
          nicNo: storedNic || "",
          gender: gender,
        }));
      }
    } catch (error) {
      console.error("Error fetching employee info:", error);

 
      try {
        const storedNic = await SecureStore.getItemAsync("user_nic");
        const gender = getGenderFromNIC(storedNic);
        const genderTitle = gender === "Female" ? "Mrs." : "Mr.";
        setUserName(`${genderTitle} User`);

        setProfileData((prev) => ({
          ...prev,
          nicNo: storedNic || "",
          gender: gender,
        }));
      } catch (secureStoreError) {
        setUserName("Mr. User");
        setProfileData((prev) => ({
          ...prev,
          gender: "Male",
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    
    fetchEmployeeInfo();
  }, []);

 
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);


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

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

 
  if (isLoading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ebebeb", "#6DD3D3"]} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("@/assets/images/defaultavatar.png")}
              style={styles.avatar}
            />
          </View>
          <ThemedText style={styles.profileName}>{userName}</ThemedText>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {[
            { label: "Name", field: "name", keyboard: "default" },
            { label: "Address 1", field: "address 1", multiline: true },
            { label: "Address 2", field: "address 2", multiline: true },
            { label: "Date Of Birth", field: "dateOfBirth" },
            { label: "NIC No", field: "nicNo" },
            { label: "Gender", field: "gender" },
          ].map(({ label, field, keyboard, multiline }, index) => (
            <View style={styles.fieldContainer} key={index}>
              <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.disabledInput]}
                  value={profileData[field] || ""}
                  onChangeText={(text) => handleInputChange(field, text)}
                  editable={isEditing && field !== "gender"} // Gender should not be editable as it's derived from NIC
                  keyboardType={keyboard}
                  placeholderTextColor="#A0A0A0"
                  multiline={multiline}
                  numberOfLines={multiline ? 2 : 1}
                  placeholder=""
                />
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#075349",
    fontFamily: "Actor",
    flex: 1,
    textAlign: "center",
  },
  profileImageSection: {
    alignItems: "center",
    paddingVertical: 10,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 95,
    height:95,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#E8F8F8",
  },
  profileName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#075349",
    fontFamily: "Actor",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#075349",
    marginBottom: 6,
    fontFamily: "Actor",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    color: "#333333",
    fontFamily: "Actor",
    minHeight: 48,
  },
  disabledInput: {
    backgroundColor: "#F8F8F8",
    color: "#666666",
  },
  // Custom Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    minWidth: 200,
    minHeight: 150,
  },
  customLoadingIcon: {
    marginBottom: 15,
  },
  loadingIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#16858D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6DD3D3",
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#17ABB7",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});