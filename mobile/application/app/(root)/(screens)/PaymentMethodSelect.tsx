import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from "react-native";

export default function PaymentMethodSelect() {
  const [activeTab, setActiveTab] = useState("Payment");
  const [subTab, setSubTab] = useState("Online");
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle exit
  const handleExit = () => {
    Alert.alert(
      "Exit Exam",
      "Are you sure you want to exit? You can return to this exam later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handlePayNow = () => {
    if (!agreeToTerms) {
      Alert.alert(
        "Agreement Required",
        "Please agree to the payment instructions before proceeding."
      );
      return;
    }
    // Add your payment logic here
    setShowSuccess(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        {["Payment", "History"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.topTabButton,
              activeTab === tab && styles.activeTopTab,
            ]}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === tab && styles.activeTopTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Payment" ? (
        <>
          {/* Sub Tabs */}
          <View style={styles.subTabs}>
            {["Online", "Slip Upload"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSubTab(tab)}
                style={[
                  styles.subTabButton,
                  subTab === tab && styles.activeSubTab,
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    subTab === tab && styles.activeSubTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SUB TAB CONTENT */}
          <ScrollView style={{ marginTop: 20 }}>
            {subTab === "Online" && (
              <OnlinePayment
                agreeToTerms={agreeToTerms}
                setAgreeToTerms={setAgreeToTerms}
                handlePayNow={handlePayNow}
                showAllInstructions={showAllInstructions}
                setShowAllInstructions={setShowAllInstructions}
              />
            )}
            {subTab === "Slip Upload" && (
              <SlipUpload
                onSuccess={() => setShowSuccess(true)}
                agreeToTerms={agreeToTerms}
                setAgreeToTerms={setAgreeToTerms}
                showAllInstructions={showAllInstructions}
                setShowAllInstructions={setShowAllInstructions}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
              />
            )}
          </ScrollView>
        </>
      ) : (
        <PaymentHistory />
      )}

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check" size={40} color="white" />
            </View>
            <Text style={styles.successTitle}>Thank You</Text>
            <Text style={styles.successText}>
              {subTab === "Online"
                ? "Payment processed successfully. Credits will be added to your wallet shortly."
                : "Slip uploaded successfully. We'll confirm within 24 hours."}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={{ color: "white" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------- Online Payment UI ------------------- */
function OnlinePayment({
  agreeToTerms,
  setAgreeToTerms,
  handlePayNow,
  showAllInstructions,
  setShowAllInstructions,
}) {
  const basicInstructions = [
    "Payments are non-refundable.",
    "Credits will be added to your wallet after payment.",
    "Use credits to take exams and purchase publications.",
  ];

  const detailedInstructions = [
    "Your wallet balance is shown at the top of the screen.",
    "Each exam or publication purchase deducts credits from your wallet.",
    "Ensure your wallet has enough credits before making a purchase.",
    "Credits cannot be transferred between accounts.",
    "Promotional credits (if any) will expire after the stated period.",
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Card Details</Text>

      <TextInput
        style={styles.input}
        placeholder="1234-5678-8765-4321"
        placeholderTextColor={"#A3A4A7"}
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="MM/YY"
          placeholderTextColor={"#A3A4A7"}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="CVC"
          placeholderTextColor={"#A3A4A7"}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Amount (LKR)"
        placeholderTextColor={"#A3A4A7"}
      />

      {/* Payment Instructions with Dropdown */}
      <View style={styles.instructionBox}>
        <View className="flex flex-row justify-between">
          <Text style={styles.instructionTitle}>Payment Instructions</Text>
          {/* Dropdown Button */}
          <TouchableOpacity
            onPress={() => setShowAllInstructions(!showAllInstructions)}
          >
            <MaterialIcons
              name={
                showAllInstructions
                  ? "keyboard-arrow-up"
                  : "keyboard-arrow-down"
              }
              size={28}
              color="#0057FF"
            />
          </TouchableOpacity>
        </View>

        {/* Basic Instructions */}
        {basicInstructions.map((text, index) => (
          <Text key={index} style={styles.instructionText}>
            {text}
          </Text>
        ))}

        {/* Detailed Instructions (Dropdown) */}
        {showAllInstructions &&
          detailedInstructions.map((text, index) => (
            <Text key={index} style={styles.instructionText}>
              {text}
            </Text>
          ))}

        {/* Checkbox Section */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            {agreeToTerms ? (
              <MaterialIcons name="check-box" size={24} color="#0057FF" />
            ) : (
              <MaterialIcons
                name="check-box-outline-blank"
                size={24}
                color="#666"
              />
            )}
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            I have Read and Agree to the payment Instructions
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="flex flex-row items-center justify-center"
        style={[styles.payButton, !agreeToTerms && styles.payButtonDisabled]}
        onPress={handlePayNow}
        disabled={!agreeToTerms}
      >
        <MaterialIcons
          name="credit-card"
          size={20}
          color="white"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: "white", fontSize: 16, fontWeight: 600 }}>
          Pay Now
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------- Slip Upload UI ------------------- */
function SlipUpload({
  onSuccess,
  agreeToTerms,
  setAgreeToTerms,
  showAllInstructions,
  setShowAllInstructions,
  selectedFile,
  setSelectedFile,
}) {
  const basicInstructions = [
    "Upload a valid payment slip. Use bank transfer or deposit receipt.",
    "Payments are non-refundable.",
    "Credits will be added to your wallet after payment.",
    "Use credits to take exams and purchase publications.",
  ];

  const detailedInstructions = [
    "Your wallet balance is shown at the top of the screen.",
    "Each exam or publication purchase deducts credits from your wallet.",
    "Ensure your wallet has enough credits before making a purchase.",
    "Credits cannot be transferred between accounts.",
    "Promotional credits (if any) will expire after the stated period.",
  ];

  // Mock file picker function (simulates file selection)
  const pickFile = () => {
    Alert.alert("Select File", "Choose file source:", [
      { text: "Gallery", onPress: () => simulateFilePick("gallery") },
      { text: "Files", onPress: () => simulateFilePick("files") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const simulateFilePick = (source) => {
    // In a real app, this would integrate with actual file picker
    const mockFiles = [
      { name: "payment_slip_001.jpg", type: "image" },
      { name: "bank_transfer.pdf", type: "document" },
      { name: "receipt_2025.png", type: "image" },
      { name: "payment_confirmation.jpg", type: "image" },
    ];

    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setSelectedFile({
      name: randomFile.name,
      uri: `file://mock/${randomFile.name}`,
      type: randomFile.type,
    });

    Alert.alert(
      "File Selected",
      `File "${randomFile.name}" selected from ${source}.`
    );
  };

  const handleSend = () => {
    if (!agreeToTerms) {
      Alert.alert(
        "Agreement Required",
        "Please agree to the payment instructions before proceeding."
      );
      return;
    }

    if (!selectedFile) {
      Alert.alert(
        "No File Selected",
        "Please select a payment slip file before sending."
      );
      return;
    }

    onSuccess();
  };

  return (
    <View>
      {/* Upload Area */}
      <View style={styles.uploadBox}>
        {selectedFile ? (
          <View style={styles.selectedFileContainer}>
            <MaterialIcons
              name={
                selectedFile.name.includes(".pdf") ? "picture-as-pdf" : "image"
              }
              size={40}
              color="#0057FF"
            />
            <Text style={styles.selectedFileName} numberOfLines={2}>
              {selectedFile.name}
            </Text>
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => setSelectedFile(null)}
            >
              <MaterialIcons name="close" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <MaterialIcons name="cloud-upload" size={50} color="#999" />
            <Text style={{ color: "#999", marginTop: 10, textAlign: "center" }}>
              Choose a file or drag & drop it here
            </Text>
            <Text
              style={{
                color: "#666",
                fontSize: 12,
                marginTop: 5,
                textAlign: "center",
              }}
            >
              Supported: JPG, PNG, PDF (Max: 5MB)
            </Text>
            <TouchableOpacity style={styles.chooseButton} onPress={pickFile}>
              <MaterialIcons
                name="attach-file"
                size={20}
                color="#0057FF"
                style={{ marginRight: 5 }}
              />
              <Text style={{ color: "#0057FF", fontWeight: "600" }}>
                Choose File
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Payment Instructions with Dropdown */}
      <View style={styles.instructionBox}>
        <View className="flex flex-row justify-between">
          <Text style={styles.instructionTitle}>Payment Instructions</Text>
          {/* Dropdown Button */}
          <TouchableOpacity
            onPress={() => setShowAllInstructions(!showAllInstructions)}
          >
            <MaterialIcons
              name={
                showAllInstructions
                  ? "keyboard-arrow-up"
                  : "keyboard-arrow-down"
              }
              size={28}
              color="#0057FF"
            />
          </TouchableOpacity>
        </View>

        {/* Basic Instructions */}
        {basicInstructions.map((text, index) => (
          <Text key={index} style={styles.instructionText}>
            {text}
          </Text>
        ))}

        {/* Detailed Instructions (Dropdown) */}
        {showAllInstructions &&
          detailedInstructions.map((text, index) => (
            <Text key={index} style={styles.instructionText}>
              {text}
            </Text>
          ))}

        {/* Checkbox Section */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            {agreeToTerms ? (
              <MaterialIcons name="check-box" size={24} color="#0057FF" />
            ) : (
              <MaterialIcons
                name="check-box-outline-blank"
                size={24}
                color="#666"
              />
            )}
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            I have Read and Agree to the payment Instructions
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          (!agreeToTerms || !selectedFile) && styles.payButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!agreeToTerms || !selectedFile}
      >
        <MaterialIcons
          name="send"
          size={20}
          color="white"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: "white", fontSize: 16, fontWeight: 600 }}>
          Send
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------------- Payment History UI ------------------- */
function PaymentHistory() {
  const data = [
    {
      title: "Monthly Fee - December",
      date: "December 10, 2025",
      method: "Online Payment",
      amount: "LKR 2000",
      status: "Paid",
      color: "#4CAF50",
    },
    {
      title: "Registration Fee",
      date: "November 12, 2025",
      method: "Slip Upload",
      amount: "LKR 2000",
      status: "Pending",
      color: "#FF9800",
    },
    {
      title: "Late Fee",
      date: "November 01, 2025",
      method: "Online Payment",
      amount: "LKR 2000",
      status: "Over Due",
      color: "#FF3B30",
    },
  ];

  return (
    <ScrollView>
      {data.map((item, index) => (
        <View key={index} style={styles.historyCard}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={{ color: item.color, fontWeight: "600" }}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.historyDate}>{item.date}</Text>
          <Text style={styles.historyMethod}>{item.method}</Text>
          <Text style={styles.historyAmount}>{item.amount}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* ------------------- STYLES ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },

  topTabs: { flexDirection: "row", marginBottom: 10 },
  topTabButton: { flex: 1, paddingVertical: 10, alignItems: "center" },
  topTabText: { color: "#777", fontSize: 16 },
  activeTopTab: { borderBottomWidth: 2, borderBottomColor: "#0057FF" },
  activeTopTabText: { color: "#0057FF", fontWeight: "600" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 15,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },

  subTabs: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
    borderRadius: 10,
    padding: 5,
    gap: 10,
    marginTop: 15,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeSubTab: { backgroundColor: "#0057FF" },
  subTabText: { color: "#666", fontSize: 14 },
  activeSubTabText: { color: "white", fontWeight: "600" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },

  instructionBox: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  instructionTitle: {
    fontWeight: "600",
    marginBottom: 10,
    fontSize: 18,
    color: "#333",
  },
  instructionText: {
    color: "#666",
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Checkbox Styles */
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    color: "#333",
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },

  payButton: {
    backgroundColor: "#0057FF",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  payButtonDisabled: {
    backgroundColor: "#A3A4A7",
    opacity: 0.7,
  },

  uploadBox: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
    borderRadius: 12,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    margin: 10,
  },

  selectedFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#F0F7FF",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0057FF",
  },
  selectedFileName: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },

  removeFileButton: {
    padding: 5,
  },

  chooseButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#0057FF",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
    flexDirection: "row",
    alignItems: "center",
  },

  historyCard: {
    padding: 15,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 15,
  },
  historyTitle: { fontWeight: "600", fontSize: 16, color: "#333" },
  historyDate: { color: "#666", marginTop: 4, fontSize: 14 },
  historyMethod: { color: "#777", marginTop: 3, fontSize: 14 },
  historyAmount: {
    marginTop: 5,
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  successIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#4CAF50",
    borderRadius: 30,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  successText: {
    textAlign: "center",
    marginTop: 5,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0057FF",
    borderRadius: 8,
  },
});
