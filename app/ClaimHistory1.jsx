import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ClaimHistory1 = ({ onClose, claimData }) => {
  // Sample document data based on the UI mockup
  const documents = [
    {
      id: 1,
      documentType: "Diagnosis Card",
      dateOfDocument: "06/07/2025",
      amount: "2.00",
    },
    {
      id: 2,
      documentType: "Diagnosis Card",
      dateOfDocument: "06/07/2025",
      amount: "2.00",
    },
    {
      id: 3,
      documentType: "Diagnosis Card",
      dateOfDocument: "06/07/2025",
      amount: "2.00",
    },
    {
      id: 4,
      documentType: "Diagnosis Card",
      dateOfDocument: "06/07/2025",
      amount: "2.00",
    },
    {
      id: 5,
      documentType: "Diagnosis Card",
      dateOfDocument: "06/07/2025",
      amount: "2.00",
    },
    {
      id: 6,
      documentType: "Diagnosis Card",
      dateOfDocument: "06/07/2025",
      amount: "2.00",
    },
  ];

  const renderDocumentCard = (document) => (
    <View key={document.id} style={styles.documentCard}>
      <View style={styles.iconContainer}>
        <View style={styles.documentIcon}>
          <Ionicons name="document-outline" size={24} color="#17ABB7" />
        </View>
      </View>

      <View style={styles.documentContent}>
        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Document Type</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.documentValue}>{document.documentType}</Text>
        </View>

        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Date of Document</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.documentValue}>{document.dateOfDocument}</Text>
        </View>

        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Amount</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.documentValue}>{document.amount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Claim History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#13646D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>

        {/* Documents List */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {documents.map(renderDocumentCard)}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#13646D",
    textAlign: "left",
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  documentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginBottom: 15,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: 15,
    marginTop: 5,
  },
  documentIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#E8F8F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#17ABB7",
    borderStyle: "dashed",
  },
  documentContent: {
    flex: 1,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  documentLabel: {
    fontSize: 14,
    color: "#17ABB7",
    fontFamily: "AbhayaLibreMedium",
    fontWeight: "500",
    width: 120,
    flexShrink: 0,
  },
  separator: {
    fontSize: 14,
    color: "#17ABB7",
    marginHorizontal: 8,
    fontWeight: "500",
  },
  documentValue: {
    fontSize: 14,
    color: "#333333",
    fontFamily: "AbhayaLibreMedium",
    fontWeight: "400",
    flex: 1,
  },
});

export default ClaimHistory1;
