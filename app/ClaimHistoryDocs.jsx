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
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import { API_BASE_URL } from "../constants/index.js";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ClaimHistoryDocs = ({ onClose, claimData }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

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
      outputRange: ['0deg', '360deg'],
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
        <Text style={styles.loadingText}>Loading documents...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment</Text>
      </View>
    </View>
  );

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
      amount: doc.docAmount,
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
      {/* Fixed Header - moved outside modalContainer like ClaimHistory */}
      <View style={styles.header}>
        <View style={{ width: 26 }} />
        <Text style={styles.headerTitle}>Claim History Documents</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons
            name="close"
            size={26}
            color="#13646D"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.modalContainer}>
        {loading ? (
          <LoadingScreen />
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
                <Text style={styles.noDocumentsText}>No documents found.</Text>
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
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  // Updated header styles to match ClaimHistory exactly
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
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Custom Loading Styles
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#16858D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6DD3D3',
  },
  loadingIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17ABB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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

export default ClaimHistoryDocs;