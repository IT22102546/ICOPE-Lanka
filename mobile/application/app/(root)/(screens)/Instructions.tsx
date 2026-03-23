import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import { icons, images } from "@/constants";

export default function Instructions() {
  const [activeTab, setActiveTab] = useState("Exam");
  const [loading, setLoading] = useState(true);

  // Tab-wise instruction data
  const examInstructions = [
    {
      id: 1,
      title: "Time Management",
      description:
        "Each exam has a specific time limit. Make sure to manage your time wisely and review your answers before submitting.",
    },
    {
      id: 2,
      title: "Read Questions Carefully",
      description:
        "Always read each question carefully before answering to avoid mistakes.",
    },
    {
      id: 3,
      title: "Results Published",
      description: "Your exam results will be published after evaluation.",
    },
  ];

  const paymentInstructions = [
    {
      id: 1,
      title: "Secure Payment",
      description: "All transactions are protected with 256-bit encryption.",
    },
    {
      id: 2,
      title: "Payment Confirmation",
      description:
        "You'll receive an email confirmation immediately after payment.",
    },
  ];

  const generalInstructions = [
    {
      id: 1,
      title: "Account Safety",
      description:
        "Never share your login credentials with anyone to protect your data.",
    },
    {
      id: 2,
      title: "Stay Updated",
      description:
        "Keep the app updated to enjoy the latest features and improvements.",
    },
  ];

  // Simulate loading
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2979FF" />
        <Text style={styles.loadingText}>Loading instructions...</Text>
      </View>
    );
  }

  // Decide which tab's instructions to show
  const getCurrentTabData = () => {
    if (activeTab === "Exam") return examInstructions;
    if (activeTab === "Payment") return paymentInstructions;
    return generalInstructions;
  };

  return (
    <View style={styles.container}>
      {/* Tabs Header - Fixed to stay at top */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          {["Exam", "Payment", "General"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabItem}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTab]}
              >
                {tab}
              </Text>

              {/* Blue underline */}
              {activeTab === tab && <View style={styles.activeLine} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Illustration Image */}
        <Image
          source={images.instruction1}
          style={styles.topImage}
          resizeMode="contain"
        />

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{activeTab} Guidelines</Text>
          <Text style={styles.headerSubtitle}>
            Follow these rules for a better experience
          </Text>
        </View>

        {/* Render Tab-Specific Instructions */}
        {getCurrentTabData().map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}>
                <Image 
                  source={icons.nav_exam} 
                  style={styles.icon} 
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Add some padding at bottom */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Tabs Container - Fixed position
  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },

  tabsWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    marginHorizontal: 20,
  },

  tabItem: {
    alignItems: "center",
    paddingBottom: 8,
    flex: 1,
  },

  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999",
    textAlign: "center",
  },

  activeTab: {
    color: "#2979FF",
    fontWeight: "700",
  },

  activeLine: {
    width: "100%",
    height: 3,
    backgroundColor: "#2979FF",
    borderRadius: 2,
    marginTop: 6,
    maxWidth: 80,
  },

  // Image
  topImage: {
    width: "100%",
    height: 180,
    marginTop: 24,
    alignSelf: "center",
  },

  headerContainer: {
    marginTop: 16,
    marginBottom: 24,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },

  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },

  // Cards
  card: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: "#E4F0FF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    flexShrink: 0,
  },

  icon: {
    width: 24,
    height: 24,
    tintColor: "#2979FF",
  },

  textContainer: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },

  cardDesc: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },

  bottomPadding: {
    height: 40,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});