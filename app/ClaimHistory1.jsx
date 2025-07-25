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
  Dimensions,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from '../constants/index.js';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

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
    let imageSource;
    let imageDescription = `${doc.docType} - Claim No: ${doc.clmSeqNo}`;
    
    if (doc.imagePath !== "0") {
      imageSource = { uri: doc.imagePath };
    } else {
      imageSource = { uri: `data:image/png;base64,${doc.imgContent}` };
    }
    
    setSelectedImage({
      source: imageSource,
      description: imageDescription,
      docType: doc.docType,
      claimNo: doc.clmSeqNo,
      amount: doc.docAmount
    });
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
        activeOpacity={0.8}
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
        {/* Add expand icon overlay */}
        <View style={styles.expandOverlay}>
          <Ionicons name="expand-outline" size={16} color="#fff" />
        </View>
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#17ABB7" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {documents.length > 0 ? (
              documents.map(renderDocumentCard)
            ) : (
              <View style={styles.noDocumentsContainer}>
                <Ionicons name="document-outline" size={48} color="#888" />
                <Text style={styles.noDocumentsText}>
                  No documents found.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Image Modal - Close icon removed, tap outside to close preserved */}
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalCloseArea}
              onPress={closeImageModal}
              activeOpacity={1}
            >
              <TouchableOpacity 
                style={styles.modalContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                {selectedImage && (
                  <>
                    <Image
                      source={selectedImage.source}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                    <View style={styles.modalImageInfo}>
                      <Text style={styles.modalImageTitle}>
                        {selectedImage.description}
                      </Text>
                      {selectedImage.amount && (
                        <Text style={styles.modalImageAmount}>
                          Amount: Rs {selectedImage.amount}
                        </Text>
                      )}
                      <Text style={styles.modalImageSubtitle}>
                        Tap outside to close
                      </Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#17ABB7",
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
    position: "relative",
  },
  documentIcon: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#17ABB7",
    borderRadius: 5,
  },
  expandOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
    padding: 2,
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
  noDocumentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noDocumentsText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 15,
  },
  // Modal Styles - Close button removed
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: screenHeight * 0.6,
    borderRadius: 10,
  },
  modalImageInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  modalImageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  modalImageAmount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#00C4CC",
    textAlign: "center",
    marginBottom: 8,
  },
  modalImageSubtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
  },
});

export default ClaimHistory1;