import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const PendingIntimations = ({
  onClose,
  onEditClaim,
  userId = "000682",
  policyNo = "G/010/SHE/17087/22",
}) => {
  const navigation = useNavigation();

  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch claims data from API
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://203.115.11.229:1002/api/SavedclaimlistCon?userid=${userId}&policyNo=${policyNo}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform API data to match component structure
        const transformedData = data.map((claim, index) => ({
          id: claim.clmSeqNo || `claim_${index}`,
          referenceNo: claim.clmSeqNo,
          enteredBy: claim.patientName,
          relationship: claim.relationship,
          claimType: claim.indOut,
          createdOn: formatDate(claim.createdDate),
          policyNo: claim.policyNo,
        }));

        setPendingClaims(transformedData);
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError(err.message);
        Alert.alert("Error", "Failed to load claims data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [userId, policyNo]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Refresh data function
  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://203.115.11.229:1002/api/SavedclaimlistCon?userid=${userId}&policyNo=${policyNo}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformedData = data.map((claim, index) => ({
        id: claim.clmSeqNo || `claim_${index}`,
        referenceNo: claim.clmSeqNo,
        enteredBy: claim.patientName,
        relationship: claim.relationship,
        claimType: claim.indOut,
        createdOn: formatDate(claim.createdDate),
        policyNo: claim.policyNo,
      }));

      setPendingClaims(transformedData);
    } catch (err) {
      console.error("Error refreshing claims:", err);
      Alert.alert("Error", "Failed to refresh claims data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (claim) => {
    try {
      if (onEditClaim) {
        onEditClaim(claim);
      }

      navigation.navigate("EditClaimIntimation", {
        claimData: claim,
        onUpdate: (updatedClaim) => {
          setPendingClaims((prev) =>
            prev.map((item) =>
              item.id === updatedClaim.id ? updatedClaim : item
            )
          );
        },
      });
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Could not navigate to edit page");
    }
  };

  // Handle Delete
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this claim?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setPendingClaims((prev) => prev.filter((item) => item.id !== id));
            // Here you would typically also make an API call to delete from server
            // deleteClaimFromServer(id);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Pending Intimations</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D7D" />
          <Text style={styles.loadingText}>Loading claims...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Pending Intimations</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load claims</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Pending Intimations</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#2E7D7D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {pendingClaims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={50} color="#B0BEC5" />
            <Text style={styles.emptyText}>No pending claims found</Text>
          </View>
        ) : (
          pendingClaims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <View style={styles.claimContent}>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Reference No :</Text>
                  <Text style={styles.claimValue}>{claim.referenceNo}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Patient Name :</Text>
                  <Text style={styles.claimValue}>{claim.enteredBy}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Relationship :</Text>
                  <Text style={styles.claimValue}>{claim.relationship}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Claim Type :</Text>
                  <Text style={styles.claimValue}>{claim.claimType}</Text>
                </View>
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Created on :</Text>
                  <Text style={styles.claimValue}>{claim.createdOn}</Text>
                </View>
              </View>

              <View style={styles.actionIcons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(claim)}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(claim.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D7D",
    textAlign: "left",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    padding: 5,
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2E7D7D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2E7D7D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#B0BEC5",
    marginTop: 10,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 20,
  },
  claimCard: {
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimContent: {
    flex: 1,
  },
  claimRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: "#4DD0E1",
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  claimValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    flex: 1,
    marginLeft: 10,
  },
  actionIcons: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    backgroundColor: "#2E7D7D",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
});

export default PendingIntimations;
