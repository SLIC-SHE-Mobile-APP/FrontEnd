import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

export default function UserDetailsScreen() {
  // Animation value for fade-in effect
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [userName, setUserName] = useState("Loading...");
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
        <ThemedText style={styles.loadingText}>Loading Profile...</ThemedText>
        <ThemedText style={styles.loadingSubText}>
          Please wait a moment
        </ThemedText>
      </View>
    </View>
  );

  // Function to determine gender from NIC
  const getGenderFromNIC = (nic) => {
    if (!nic || nic.length < 10) return "Mr."; // Default to Mr. if NIC is invalid

    // Extract the gender digit (10th character for old format, 12th for new format)
    let genderDigit;
    if (nic.length === 10) {
      // Old NIC format (9 digits + 1 letter)
      genderDigit = parseInt(nic.charAt(2)); // Day of birth digit
      // If day > 500, it's female
      const dayOfBirth = parseInt(nic.substring(2, 5));
      return dayOfBirth > 500 ? "Mrs." : "Mr.";
    } else if (nic.length === 12) {
      // New NIC format (12 digits)
      const dayOfBirth = parseInt(nic.substring(4, 7));
      return dayOfBirth > 500 ? "Mrs." : "Mr.";
    }

    return "Mr."; // Default fallback
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
        let title = "Mr.";

        // Determine gender from NIC if available
        if (data.nic) {
          title = getGenderFromNIC(data.nic);
        } else if (storedNic) {
          title = getGenderFromNIC(storedNic);
        }

        // Set the formatted user name
        setUserName(`${title} ${data.memberName || "User"}`);
      } else {
        // Fallback to stored NIC if API fails
        if (storedNic) {
          const title = getGenderFromNIC(storedNic);
          setUserName(`${title} User`);
        } else {
          setUserName("Mr. User");
        }
      }
    } catch (error) {
      console.error("Error fetching employee info:", error);
      // Fallback handling
      try {
        const storedNic = await SecureStore.getItemAsync("user_nic");
        if (storedNic) {
          const title = getGenderFromNIC(storedNic);
          setUserName(`${title} User`);
        } else {
          setUserName("Mr. User");
        }
      } catch (secureStoreError) {
        setUserName("Mr. User");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch employee info when component mounts
    fetchEmployeeInfo();

    // Start the fade-in animation after loading is complete
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const menuItems = [
    {
      icon: "person-outline",
      label: "View / Edit Profile",
      route: "/ViewProfile",
      top: 240,
      backgroundColor: "black",
    },
    {
      icon: "add-circle-outline",
      label: "Manage Policy",
      route: "/AddPolicy",
      top: 310,
    },
    { icon: "help-circle-outline", label: "Help", route: "/Help", top: 380 },
    {
      icon: "shield-outline",
      label: "Privacy Policy",
      route: "/PrivacyPolicy",
      top: 450,
    },
    { icon: "call-outline", label: "Contact Us", route: "/contact", top: 520 },
    {
      icon: "newspaper-outline",
      label: "Corporate News",
      route: "/CorpNews",
      top: 590,
    },
    {
      icon: "log-out-outline",
      label: "Logout",
      route: "/loginRequestOTP",
      top: 660,
    },
  ];

  // Show loading screen while fetching data
  if (isLoading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <LoadingScreen />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.headerBackground} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2E7D7D" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <Image
            source={require("@/assets/images/userhome.png")}
            style={styles.avatar}
          />
          <ThemedText style={styles.userName}>{userName}</ThemedText>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { top: item.top }]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.label === "Logout") {
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
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  headerBackground: {
    position: "absolute",
    width: "100%",
    height: height * 0.25,
    backgroundColor: "#FFFFFF",
    top: -2,
  },
  backButton: {
    position: "absolute",
    left: width * 0.05,
    top: height * 0.07,
    zIndex: 10,
  },
  profileSection: {
    display:'flex',
    alignItems: "center",
    justifyContent:'center',
    marginTop:65
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: width * 0.11,
    borderWidth: 2,
    borderColor: "#E8F8F8",
  },
  userName: {
    position: "absolute",
    width: 239,
    top: 92,
    fontFamily: "Actor",
    fontSize: 20,
    lineHeight: 24,
    textAlign: "center",
    color: "#13646D",
  },
  menuList: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  menuItem: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    left: 40,
    height: 50,
    width: width * 0.8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F8F8",
    borderRadius: 20,
    marginRight: 10,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.38,
    color: "#075349",
    fontFamily: "Actor",
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