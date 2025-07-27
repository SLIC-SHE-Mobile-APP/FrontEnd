import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Icon from "react-native-vector-icons/FontAwesome";
import { API_BASE_URL } from "../constants/index.js";

const HealthInsuCard = ({ onClose }) => {
  const [memberData, setMemberData] = useState(null);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policyNumber, setPolicyNumber] = useState("");
  const [memberNumber, setMemberNumber] = useState("");

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
            <Icon name="heartbeat" size={20} color="#FFFFFF" />
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
        <Text style={styles.loadingText}>Loading Health Card...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

  useEffect(() => {
    fetchMemberData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not Available";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date Error";
    }
  };

  // Enhanced fetch function for employee info with 404 handling
  const fetchEmployeeInfo = async (policyNum, memberNum) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNum}&memberNo=${memberNum}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Employee info not found (404), using default values");
          return {
            memberName: "Member Information Not Available",
            memberNumber: memberNum,
            employeeId: "Not Available",
            department: "Not Available",
            designation: "Not Available",
            joinDate: "Not Available",
            email: "Not Available",
            phone: "Not Available",
            address: "Not Available",
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from employee info server");
        return {
          memberName: "Member Information Not Available",
          memberNumber: memberNum,
          employeeId: "Not Available",
        };
      }

      const result = JSON.parse(responseText);

      // Ensure we have valid data and fill in missing fields
      if (result && typeof result === "object") {
        return {
          memberName: result.memberName || "Member Name Not Available",
          memberNumber: result.memberNumber || memberNum,
          employeeId: result.employeeId || "Not Available",
          department: result.department || "Not Available",
          designation: result.designation || "Not Available",
          joinDate: result.joinDate || "Not Available",
          email: result.email || "Not Available",
          phone: result.phone || "Not Available",
          address: result.address || "Not Available",
          ...result,
        };
      }

      return {
        memberName: "Member Information Not Available",
        memberNumber: memberNum,
        employeeId: "Not Available",
      };
    } catch (err) {
      console.error("Error fetching employee info:", err);
      return {
        memberName: "Member Information Unavailable",
        memberNumber: memberNum || "Unknown",
        employeeId: "Unable to retrieve",
        department: "Unable to retrieve",
        error: err.message,
      };
    }
  };

  // Enhanced fetch function for policy info with 404 handling
  const fetchPolicyInfo = async (policyNum) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/PolicyInfo/GetPolicyInfo?policyNo=${policyNum}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Policy info not found (404), using default values");
          return {
            name: "Company Information Not Available",
            policyNumber: policyNum,
            startDate: "Not Available",
            endDate: "Not Available",
            status: "Unknown",
            coverage: "Not Available",
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from policy info server");
        return {
          name: "Company Information Not Available",
          policyNumber: policyNum,
          endDate: "Not Available",
        };
      }

      const result = JSON.parse(responseText);

      // Handle array response (take first item) or direct object
      let policyData;
      if (Array.isArray(result) && result.length > 0) {
        policyData = result[0];
      } else if (result && typeof result === "object") {
        policyData = result;
      } else {
        return {
          name: "Company Information Not Available",
          policyNumber: policyNum,
          endDate: "Not Available",
        };
      }

      // Fill in missing fields with defaults
      return {
        name: policyData.name || "Company Information Not Available",
        policyNumber: policyData.policyNumber || policyNum,
        startDate: policyData.startDate || "Not Available",
        endDate: policyData.endDate || "Not Available",
        status: policyData.status || "Unknown",
        coverage: policyData.coverage || "Not Available",
        ...policyData,
      };
    } catch (err) {
      console.error("Error fetching policy info:", err);
      return {
        name: "Company Information Unavailable",
        policyNumber: policyNum || "Unknown",
        endDate: "Unable to retrieve",
        status: "Unable to retrieve",
        error: err.message,
      };
    }
  };

  // Enhanced fetch function for dependents with 404 handling
  const fetchDependents = async (policyNum, memberNum) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Dependents/WithoutEmployee?policyNo=${policyNum}&memberNo=${memberNum}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Dependents not found (404), returning empty array");
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === "") {
        console.warn("Empty response from dependents server");
        return [];
      }

      const result = JSON.parse(responseText);

      if (Array.isArray(result)) {
        // Ensure each dependent has required fields
        return result.map((dep) => ({
          dependentName: dep.dependentName || "Dependent Name Not Available",
          relationship: dep.relationship || "Not Available",
          dateOfBirth: dep.dateOfBirth || "Not Available",
          gender: dep.gender || "Not Available",
          ...dep,
        }));
      }

      return [];
    } catch (err) {
      console.error("Error fetching dependents:", err);
      return []; // Return empty array instead of null for dependents
    }
  };

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get policy and member numbers from SecureStore
      const policyNum = await SecureStore.getItemAsync("selected_policy_number");
      const memberNum = await SecureStore.getItemAsync("selected_member_number");
      
      // Get the stored policy end date
      const storedEndDate = await SecureStore.getItemAsync("selected_policy_end_date");
      
      // Or get the entire policy data object
      const storedPolicyData = await SecureStore.getItemAsync("selected_policy_data");
      let policyDataFromStorage = null;
      
      if (storedPolicyData) {
        try {
          policyDataFromStorage = JSON.parse(storedPolicyData);
        } catch (parseError) {
          console.error("Error parsing stored policy data:", parseError);
        }
      }

      // Store the numbers in state for display
      setPolicyNumber(policyNum || "Not Available");
      setMemberNumber(memberNum || "Not Available");

      if (!policyNum || !memberNum) {
        console.warn("Policy or member number not found in storage");
        // Don't throw error, continue with available data
        setMemberData({
          memberName: "Member Information Not Available",
          memberNumber: memberNum || "Not Available",
        });
        setPolicyInfo({
          name: "Company Information Not Available",
          policyNumber: policyNum || "Not Available",
          endDate: storedEndDate || policyDataFromStorage?.endDate || "Not Available",
        });
        setDependents([]);
        setLoading(false);
        return;
      }

      // Fetch all data in parallel with enhanced error handling
      const [memberData, policyData, dependentsData] = await Promise.all([
        fetchEmployeeInfo(policyNum, memberNum),
        fetchPolicyInfo(policyNum),
        fetchDependents(policyNum, memberNum),
      ]);

      setMemberData(memberData);
      
      // Merge the fetched policy data with stored end date
      const enhancedPolicyData = {
        ...policyData,
        endDate: storedEndDate || policyDataFromStorage?.endDate || policyData?.endDate || "Not Available"
      };
      
      setPolicyInfo(enhancedPolicyData);
      setDependents(dependentsData);

      // Only set error if all critical data failed to load
      if (memberData?.error && policyData?.error) {
        setError("Some information may be incomplete due to server issues");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // Set fallback data instead of just error
      setMemberData({
        memberName: "Member Information Unavailable",
        memberNumber: memberNumber || "Unknown",
      });
      setPolicyInfo({
        name: "Company Information Unavailable",
        policyNumber: policyNumber || "Unknown",
        endDate: "Unavailable",
      });
      setDependents([]);
      setError("Unable to load complete information. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const makePhoneCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Phone calls are not supported on this device");
        }
      })
      .catch((error) => {
        console.error("Error making phone call:", error);
        Alert.alert("Error", "Unable to make phone call");
      });
  };

  const renderDependentNames = () => {
    if (loading) {
      return <ActivityIndicator size="small" color="black" />;
    }

    if (!dependents || dependents.length === 0) {
      return <Text style={styles.dependentNameText}>No Dependents</Text>;
    }

    return dependents.map((dependent, index) => (
      <Text key={index} style={styles.dependentNameText}>
        {dependent.dependentName || `Dependent ${index + 1}`}
      </Text>
    ));
  };

  const retryDataLoad = () => {
    fetchMemberData();
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#6DD3D3"]}
      style={{
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: "hidden",
      }}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Health Insurance Card</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons
            name="close"
            size={26}
            color="#13646D"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingScreen />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Icon name="exclamation-triangle" size={16} color="#FF6B6B" />
                <Text style={styles.errorBannerText}>{error}</Text>
                <TouchableOpacity
                  onPress={retryDataLoad}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.cardContainer}>
              {/* Card Image with Overlays */}
              <View style={styles.cardImageContainer}>
                <Image
                  source={require("../assets/images/healthcard.png")}
                  style={styles.cardImage}
                  resizeMode="contain"
                />

                {/* Member Name Overlay */}
                <View style={styles.memberNameOverlay}>
                  <Text style={styles.memberNameText}>
                    {memberData?.memberName &&
                    memberData.memberName !==
                      "Member Information Not Available" &&
                    memberData.memberName !== "Member Information Unavailable"
                      ? memberData.memberName
                      : "Member Name Not Available"}
                  </Text>
                </View>

                {/* Company Name Overlay */}
                <View style={styles.companyNameOverlay}>
                  <Text style={styles.companyNameText}>
                    {policyInfo?.name &&
                    policyInfo.name !== "Company Information Not Available" &&
                    policyInfo.name !== "Company Information Unavailable"
                      ? policyInfo.name
                      : "Company Name Not Available"}
                  </Text>
                </View>

                {/* End Date Overlay */}
                <View style={styles.endDateOverlay}>
                  <Text style={styles.endDateText}>
                    {formatDate(policyInfo?.endDate)}
                  </Text>
                </View>

                {/* Policy Number Overlay */}
                <View style={styles.policyNumberOverlay}>
                  <Text style={styles.policyNumberText}>
                    {policyNumber && policyNumber !== "Not Available"
                      ? policyNumber
                      : "Policy Number Not Available"}
                  </Text>
                </View>

                {/* Member Number Overlay */}
                <View style={styles.memberNumberOverlay}>
                  <Text style={styles.memberNumberText}>
                    {memberNumber && memberNumber !== "Not Available"
                      ? memberNumber
                      : "Member Number Not Available"}
                  </Text>
                </View>

                {/* Dependents Names Overlay */}
                <View style={styles.dependentsOverlay}>
                  {renderDependentNames()}
                </View>
              </View>
            </View>

            {/* Directions Section */}
            <View style={styles.directions}>
              <Text style={styles.directionsHeader}>Directions</Text>

              <Text style={styles.directionsText}>
                This digital card must be presented to the service provider with
                NIC and/or Employee ID to be eligible for the benefits.
              </Text>

              <Text style={styles.directionsText}>
                Please call our 24 hour TOLL FREE HOTLINE in the event of
                Hospitalization and Discharge.
              </Text>

              <Text style={styles.hotlinesTitle}>Hotlines:</Text>
              <View style={styles.hotlineGrid}>
                <View style={styles.hotlineColumn}>
                  <TouchableOpacity
                    style={styles.hotlineButton}
                    onPress={() => makePhoneCall("0112357357")}
                  >
                    <Ionicons
                      name="call"
                      size={18}
                      color="#2E5A87"
                      style={styles.callIcon}
                    />
                    <Text style={styles.hotline}>0112357357</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#13646D",
    textAlign: "left",
    flex: 1,
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
  // Error Banner Styles
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#FF6B6B",
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  cardContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  cardImageContainer: {
    position: "relative",
    width: "100%",
  },
  cardImage: {
    width: "100%",
    height: 250,
  },
  memberNameOverlay: {
    position: "absolute",
    top: "30%",
    left: "29%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  memberNameText: {
    fontSize: 9,
    color: "#000",
    textAlign: "center",
  },
  companyNameOverlay: {
    position: "absolute",
    top: "85%",
    left: "29%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  companyNameText: {
    fontSize: 8,
    color: "#000",
    textAlign: "center",
  },
  endDateOverlay: {
    position: "absolute",
    top: "71%",
    left: "73.5%",
    right: "13%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  endDateText: {
    fontSize: 8,
    color: "#000",
    textAlign: "center",
  },
  policyNumberOverlay: {
    position: "absolute",
    top: "77.5%",
    left: "29%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  policyNumberText: {
    fontSize: 9,
    color: "#000",
    textAlign: "center",
  },
  memberNumberOverlay: {
    position: "absolute",
    top: "70%",
    left: "29%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  memberNumberText: {
    fontSize: 9,
    color: "#000",
    textAlign: "center",
  },
  dependentsOverlay: {
    position: "absolute",
    top: "38%",
    left: "29%",
    paddingVertical: 5,
  },
  dependentNameText: {
    fontSize: 8,
    color: "#000",
    textAlign: "left",
    marginBottom: 2,
    lineHeight: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#FF0000",
    textAlign: "center",
  },
  memberInfoSection: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "#13646D",
  },
  memberInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E5A87",
    textAlign: "center",
    marginBottom: 10,
  },
  memberInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  memberInfoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  memberInfoValue: {
    fontSize: 14,
    color: "#2E5A87",
    fontWeight: "bold",
  },
  directions: {
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "#13646D",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  directionsHeader: {
    fontWeight: "bold",
    color: "#2E5A87",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 20,
  },
  directionsText: {
    marginBottom: 12,
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  hotlinesTitle: {
    fontWeight: "bold",
    color: "#2E5A87",
    fontSize: 18,
    marginBottom: 10,
    marginTop: 8,
  },
  hotlineGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hotlineColumn: {
    flex: 1,
  },
  hotlineButton: {
    flexDirection: "row",
    marginTop: 15,
  },
  callIcon: {
    marginRight: 8,
  },
  hotline: {
    fontWeight: "bold",
    color: "#2E5A87",
    fontSize: 16,
  },
});

export default HealthInsuCard;