import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from '../constants/index.js';

const ClaimHistory1 = ({ onClose, claimData }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/UploadedDocumentCon/${claimData.seqNo}`
        );
        if (Array.isArray(response.data)) {
          setDocuments(response.data);
        } else {
          setDocuments([response.data]); // in case it's a single object
        }
      } catch (error) {
        console.error("Document fetch error:", error);
        Alert.alert("Error", "Failed to load claim documents.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [claimData]);

  const openImageModal = (doc) => {
    if (doc.imagePath !== "0") {
      setSelectedImage({ type: "url", src: doc.imagePath });
    } else {
      setSelectedImage({ type: "base64", src: doc.imgContent });
    }
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  };

  const renderDocumentCard = (document, index) => (
    <View key={index} style={styles.documentCard}>
      <TouchableOpacity
        onPress={() => openImageModal(document)}
        style={styles.iconContainer}
      >
        {document.imagePath !== "0" ? (
          <Image
            source={{ uri: document.imagePath }}
            style={styles.documentIcon}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={{ uri: `data:image/png;base64,${document.imgContent}` }}
            style={styles.documentIcon}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>

      <View style={styles.documentContent}>
        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Document Type</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.documentValue}>{document.docType}</Text>
        </View>

        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Claim No</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.documentValue}>{document.clmSeqNo}</Text>
        </View>

        <View style={styles.documentRow}>
          <Text style={styles.documentLabel}>Amount</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.documentValue}>{document.docAmount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#FFFFFF", "#6DD3D3"]} style={styles.container}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <Text style={styles.headerTitle}>Claim Documents</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={26}
              color="#13646D"
              style={{ marginRight: 15 }}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#17ABB7" />
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {documents.length > 0 ? (
              documents.map(renderDocumentCard)
            ) : (
              <Text style={{ textAlign: "center", color: "#333" }}>
                No documents found.
              </Text>
            )}
          </ScrollView>
        )}

        {/* Image Modal */}
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={closeImageModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={26} color="#000" />
              </TouchableOpacity>
              {selectedImage && (
                <Image
                  source={{
                    uri:
                      selectedImage.type === "base64"
                        ? `data:image/png;base64,${selectedImage.src}`
                        : selectedImage.src,
                  }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
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
    borderWidth: 1,
    borderColor: "#17ABB7",
    borderRadius: 5,
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
    fontWeight: "400",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
    elevation: 5,
  },
});

export default ClaimHistory1;
