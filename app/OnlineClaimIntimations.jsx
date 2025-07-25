import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PendingIntimations from "./PendingIntimations";
import AddPatientDetails from "./AddPatientDetails";

const { height: screenHeight } = Dimensions.get("window");

const OnlineClaimIntimations = ({ onClose }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddPatientDetails, setShowAddPatientDetails] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [currentModal, setCurrentModal] = useState("");

  const forms = [
    { title: "Go to Online Claims", action: "pending" },
    { title: "Enter New Claims", action: "new" },
  ];

  const handleButtonPress = (action) => {
    if (action === "pending") {
      // Show PendingIntimations modal
      setModalVisible(true);
      setCurrentModal("pending");
      // Animate slide in from bottom
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (action === "new") {
      // Show AddPatientDetails modal instead of full screen
      setModalVisible(true);
      setCurrentModal("new");
      // Animate slide in from bottom
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCloseModal = () => {
    // Animate slide out to bottom
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setCurrentModal("");
    });
  };

  const renderModalContent = () => {
    if (currentModal === "pending") {
      return <PendingIntimations onClose={handleCloseModal} />;
    } else if (currentModal === "new") {
      return (
        <AddPatientDetails
          onClose={handleCloseModal}
          onNext={handlePatientDetailsNext}
        />
      );
    }
    return null;
  };

  const getModalHeight = () => {
    switch (currentModal) {
      case "pending":
        return 600; // Current height for PendingIntimations
      case "new":
        return 550; // Recommended height for AddPatientDetails form
      default:
        return 600;
    }
  };

  const handleCloseAddPatientDetails = () => {
    setShowAddPatientDetails(false);
  };

  const handlePatientDetailsNext = (patientData) => {
    console.log("Patient data received:", patientData);
    // Handle the next step after patient details are entered
    // You can navigate to the next page or process the data
    setShowAddPatientDetails(false);
    handleCloseModal(); // Close the modal after processing
  };

  // If showing AddPatientDetails page, render only that
  if (showAddPatientDetails) {
    return (
      <AddPatientDetails
        onClose={handleCloseAddPatientDetails}
        onNext={handlePatientDetailsNext}
      />
    );
  }

  return (
    <>
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
          <Text style={styles.headerTitle}>Online Claim Intimations</Text>
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
          {/* Content Card - Centered */}
          <View style={styles.contentContainer}>
            <View style={styles.card}>
              <Text style={styles.title}>Online Claim Intimations Exits !</Text>
              {forms.map((form, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.button}
                  onPress={() => handleButtonPress(form.action)}
                >
                  <Text style={styles.buttonText}>{form.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Dynamic Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        {/* Dark overlay background */}
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          {/* Animated modal content with dynamic height */}
          <Animated.View
            style={[
              styles.animatedModal,
              {
                height: getModalHeight(), // Dynamic height based on modal type
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {renderModalContent()}
          </Animated.View>
        </View>
      </Modal>
    </>
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
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#657070",
  },
  button: {
    backgroundColor: "#00C4CC",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
  },
  animatedModal: {
    // Height is set dynamically in the component, not here
    backgroundColor: "transparent",
  },
});

export default OnlineClaimIntimations;