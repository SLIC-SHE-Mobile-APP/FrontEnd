import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AddPolicy = () => {
  const [policyNumber, setPolicyNumber] = useState("");
  const [policyList, setPolicyList] = useState([]);
  const [deletedPolicies, setDeletedPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removedPoliciesFromAPI, setRemovedPoliciesFromAPI] = useState([]);
  const navigation = useNavigation();

  // Required prefix for policy numbers
  const REQUIRED_PREFIX = "G/010/SHE/";

  // Load policies from API when component mounts
  useEffect(() => {
    loadPoliciesFromAPI();
    loadRemovedPolicies();
  }, []);

  const loadRemovedPolicies = async () => {
    try {
      const storedNic = await SecureStore.getItemAsync("user_nic");

      if (!storedNic) {
        console.log("NIC not found for removed policies");
        return;
      }

      const response = await fetch(
        `http://203.115.11.229:1002/api/ManagePolices/RemovedPoliciesByNic?nic=${storedNic}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success && result.policies) {
        setRemovedPoliciesFromAPI(result.policies);
        // Set them as deleted policies for display
        setDeletedPolicies(result.policies);
      } else {
        setRemovedPoliciesFromAPI([]);
      }
    } catch (error) {
      console.error("Error loading removed policies:", error);
      setRemovedPoliciesFromAPI([]);
    }
  };

  const loadPoliciesFromAPI = async () => {
    try {
      setLoading(true);
      const storedNic = await SecureStore.getItemAsync("user_nic");

      if (!storedNic) {
        Alert.alert("Error", "NIC not found. Please login again.");
        return;
      }

      const response = await fetch(
        "http://203.115.11.229:1002/api/HomePagePoliciesLoad/GetPoliciesByNic",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nicNumber: storedNic,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        const formattedPolicies = result.data.map((policy) => ({
          id: policy.policyNumber, // Using policy number as ID
          policyNumber: policy.policyNumber,
          memberId: policy.memNumber,
          policyPeriod: `${new Date(
            policy.policyStartDate
          ).toLocaleDateString()} - ${new Date(
            policy.policyEndDate
          ).toLocaleDateString()}`,
          contactNo: "0713158877", // Default contact number
          status:
            new Date(policy.policyEndDate) > new Date() ? "Active" : "Inactive",
        }));

        setPolicyList(formattedPolicies);
      } else {
        Alert.alert("Error", "Failed to load policies");
      }
    } catch (error) {
      console.error("Error loading policies:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async () => {
    if (!policyNumber.trim()) {
      Alert.alert("Validation", "Please enter a policy number");
      return;
    }

    // Check if policy number starts with required prefix
    if (!policyNumber.startsWith(REQUIRED_PREFIX)) {
      Alert.alert(
        "Invalid Format",
        `Policy number must start with ${REQUIRED_PREFIX}`
      );
      return;
    }

    const existing = policyList.find(
      (item) => item.policyNumber === policyNumber
    );
    if (existing) {
      Alert.alert("Duplicate", "This policy already exists");
      return;
    }

    try {
      setLoading(true);

      // Call the DELETE API
      const response = await fetch(
        "http://203.115.11.229:1002/api/ManagePolices/DeletePolicy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            policyNumber: policyNumber.trim(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // For manually added policies, use default values
        const newPolicy = {
          id: Date.now().toString(),
          policyNumber,
          memberId: "1165", // Default member ID for manually added policies
          policyPeriod: "2020-02-13 - 2020-02-13",
          contactNo: "0713158877",
          status: policyList.length % 2 === 0 ? "Active" : "Inactive",
        };

        setPolicyList([...policyList, newPolicy]);

        // Remove from deleted if it exists
        setDeletedPolicies((prev) => prev.filter((p) => p !== policyNumber));

        // Remove from removed policies API list
        setRemovedPoliciesFromAPI((prev) =>
          prev.filter((policy) => policy !== policyNumber)
        );

        setPolicyNumber("");

        Alert.alert("Success", "Policy added successfully");
      } else {
        Alert.alert("Not Found", result.message || "Failed to add policy");
      }
    } catch (error) {
      console.error("Error adding policy:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (id, policyNumber) => {
    try {
      setLoading(true);

      // Call the API to remove the policy
      const response = await fetch(
        "http://203.115.11.229:1002/api/DeletePoliciesHome/RemovePolicy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            policyNumber: policyNumber,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove from policy list
        setPolicyList((prev) => prev.filter((item) => item.id !== id));

        // Only add to deleted policies if it's not already from the API
        if (!removedPoliciesFromAPI.includes(policyNumber)) {
          setDeletedPolicies((prev) => [...prev, policyNumber]);
        }

        Alert.alert("Success", result.message || "Policy removed successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to remove policy");
      }
    } catch (error) {
      console.error("Error removing policy:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDeleted = (number) => {
    setPolicyNumber(number);
  };

  // Auto-complete input with prefix and validate format
  const handleInputChange = (text) => {
    // If user is typing and hasn't included the prefix, auto-add it
    if (text.length > 0 && !text.startsWith(REQUIRED_PREFIX)) {
      // Check if the text could be part of the prefix
      if (REQUIRED_PREFIX.startsWith(text)) {
        setPolicyNumber(text);
      } else {
        setPolicyNumber(REQUIRED_PREFIX + text);
      }
    } else {
      // Validate the part after the prefix
      if (text.startsWith(REQUIRED_PREFIX)) {
        const afterPrefix = text.substring(REQUIRED_PREFIX.length);

        // Filter out letters after any '/' in the suffix
        const parts = afterPrefix.split("/");
        const filteredParts = parts.map((part) => {
          // Allow only numbers after '/'
          return part.replace(/[^0-9]/g, "");
        });

        const cleanedAfterPrefix = filteredParts.join("/");
        setPolicyNumber(REQUIRED_PREFIX + cleanedAfterPrefix);
      } else {
        setPolicyNumber(text);
      }
    }
  };

  const renderDeletedPolicy = ({ item }) => {
    // Check if this policy is from the API (removed policies)
    const isFromAPI = removedPoliciesFromAPI.includes(item);

    return (
      <TouchableOpacity
        style={[styles.deletedTag, isFromAPI && styles.deletedTagFromAPI]}
        onPress={() => handleRestoreDeleted(item)}
      >
        <Text style={styles.deletedTagText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  const renderPolicyItem = ({ item }) => (
    <View style={styles.policyCard}>
      <View style={styles.row}>
        <Text style={styles.label}>Policy Number :</Text>
        <Text style={styles.value}>{item.policyNumber}</Text>
        <TouchableOpacity
          onPress={() => handleDeletePolicy(item.id, item.policyNumber)}
        >
          <FontAwesome
            name="trash"
            size={18}
            color="white"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.gradient}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => navigation.navigate("home", { refresh: true })}
        >
          <Ionicons name="arrow-back" size={24} color="#05445E" />
          <Text style={styles.title}>Manage Policy</Text>
        </TouchableOpacity>

        {deletedPolicies.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Removed Policies</Text>
              <Text style={styles.tapToAddText}> (Tap to Add)</Text>
            </View>
            <FlatList
              data={deletedPolicies}
              horizontal
              keyExtractor={(item, index) => `deleted-${index}`}
              renderItem={renderDeletedPolicy}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>ADD POLICY</Text>

        {/* Text Input Section */}
        <View style={styles.textInputSection}>
          <Text style={styles.inputLabel}>Enter policy number:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="G/010/SHE/18666/25"
              value={policyNumber}
              onChangeText={handleInputChange}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddPolicy}>
          <Text style={styles.addButtonText}>Add Policy</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>POLICY DETAILS</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading policies...</Text>
        ) : (
          <FlatList
            data={policyList}
            keyExtractor={(item) => item.id}
            renderItem={renderPolicyItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default AddPolicy;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 20,
    color: "#05445E",
    fontWeight: "bold",
    marginLeft: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#05445E",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInputSection: {
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffffffff",
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: "#05445E",
  },
  addButton: {
    backgroundColor: "#189AB4",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#05445E",
    marginBottom: 10,
    marginTop: 20,
  },
  policyCard: {
    backgroundColor: "#189AB4",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    color: "white",
    marginBottom: 4,
    fontSize: 14,
  },
  label: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  value: {
    color: "white",
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  deletedTag: {
    backgroundColor: "#05445E",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  deletedTagFromAPI: {
    backgroundColor: "#05445E",
    borderWidth: 1,
    borderColor: "#05445E",
  },
  deletedTagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  deletedTagSubText: {
    color: "white",
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  loadingText: {
    textAlign: "center",
    color: "#05445E",
    fontSize: 16,
    marginTop: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapToAddText: {
    fontSize: 13,
    color: "#05445E",
    marginBottom: 10,
    marginTop: 20,
    fontWeight: "normal", // This removes the bold
  },
});
