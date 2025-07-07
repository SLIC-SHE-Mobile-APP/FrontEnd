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
} from "react-native";
import * as SecureStore from "expo-secure-store";

const HealthInsuCard = ({ onClose }) => {
  const [memberData, setMemberData] = useState(null);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policyNumber, setPolicyNumber] = useState("");
  const [memberNumber, setMemberNumber] = useState("");

  useEffect(() => {
    fetchMemberData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchMemberData = async () => {
    try {
      setLoading(true);

      // Get policy and member numbers from SecureStore
      const policyNum = await SecureStore.getItemAsync(
        "selected_policy_number"
      );
      const memberNum = await SecureStore.getItemAsync(
        "selected_member_number"
      );

      // Store the numbers in state for display
      setPolicyNumber(policyNum || "");
      setMemberNumber(memberNum || "");

      if (!policyNum || !memberNum) {
        setError("Policy or member number not found");
        setLoading(false);
        return;
      }

      // Fetch employee info from API
      const memberResponse = await fetch(
        `http://203.115.11.229:1002/api/EmployeeInfo/GetEmployeeInfo?policyNo=${policyNum}&memberNo=${memberNum}`
      );

      if (!memberResponse.ok) {
        throw new Error(`HTTP error! status: ${memberResponse.status}`);
      }

      const memberData = await memberResponse.json();
      setMemberData(memberData);

      // Fetch policy info from API
      const policyResponse = await fetch(
        `http://203.115.11.229:1002/api/PolicyInfo/GetPolicyInfo?policyNo=${policyNum}`
      );

      if (!policyResponse.ok) {
        throw new Error(`HTTP error! status: ${policyResponse.status}`);
      }

      const policyData = await policyResponse.json();
      // The API returns an array, so we take the first item
      setPolicyInfo(policyData[0] || null);

      // Fetch dependents from API
      const dependentsResponse = await fetch(
        `http://203.115.11.229:1002/api/Dependents/WithoutEmployee?policyNo=${policyNum}&memberNo=${memberNum}`
      );

      if (!dependentsResponse.ok) {
        throw new Error(`HTTP error! status: ${dependentsResponse.status}`);
      }

      const dependentsData = await dependentsResponse.json();
      setDependents(dependentsData || []);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load information");
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

    if (dependents.length === 0) {
      return <Text style={styles.dependentNameText}>No Dependents</Text>;
    }

    return dependents.map((dependent, index) => (
      <Text key={index} style={styles.dependentNameText}>
        {dependent.dependentName}
      </Text>
    ));
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

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
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
                {loading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : (
                  <Text style={styles.memberNameText}>
                    {memberData?.memberName || "Member Name"}
                  </Text>
                )}
              </View>

              {/* Company Name Overlay */}
              <View style={styles.companyNameOverlay}>
                {loading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <Text style={styles.companyNameText}>
                    {policyInfo?.name || "Company Name"}
                  </Text>
                )}
              </View>

              {/* End Date Overlay */}
              <View style={styles.endDateOverlay}>
                {loading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <Text style={styles.endDateText}>
                    {formatDate(policyInfo?.endDate) || "End Date"}
                  </Text>
                )}
              </View>

              {/* Policy Number Overlay */}
              <View style={styles.policyNumberOverlay}>
                {loading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <Text style={styles.policyNumberText}>
                    {policyNumber || "Policy Number"}
                  </Text>
                )}
              </View>

              {/* Member Number Overlay */}
              <View style={styles.memberNumberOverlay}>
                {loading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <Text style={styles.memberNumberText}>
                    {memberNumber || "Member Number"}
                  </Text>
                )}
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
              <View style={styles.hotlineColumn}>
                <TouchableOpacity
                  style={styles.hotlineButton}
                  onPress={() => makePhoneCall("0114357357")}
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color="#2E5A87"
                    style={styles.callIcon}
                  />
                  <Text style={styles.hotline}>0114357357</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    fontSize: 9,
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
    top: "71%",
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
