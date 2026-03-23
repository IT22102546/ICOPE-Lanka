import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, StatusBar, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { icons, images } from "@/constants";

const PhysiotherapistHome = () => {
  const { currentUser, signOut } = useAuthStore();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/onBoard1"); } },
    ]);
  };

  const myPatients = [
    { id: 1, name: "Ella Brown", condition: "Elbow Rehabilitation", image: images.test },
    { id: 2, name: "Noah Smith", condition: "Finger Rehab", image: images.test },
    { id: 3, name: "Maya Lee", condition: "Shoulder Mobility", image: images.test },
  ];

  const upcomingSessions = [
    { id: 1, title: "Elbow Rehabilitation", date: "12th June 2025", time: "3:00 pm - 3:15 pm", patient: "Ella Brown", image: images.test },
    { id: 2, title: "Finger Rehabilitation", date: "12th June 2025", time: "3:30 pm - 4:00 pm", patient: "Noah Smith", image: images.test },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0057FF" translucent={false} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.userName}>{currentUser?.firstName + " " + currentUser?.lastName || "Dr. John"}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/(root)/(tabs)/notifications")}>
              <Image source={icons.notifications} style={styles.notificationIcon} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/profile") }>
              <Image source={ currentUser?.profilePicture ? { uri: currentUser.profilePicture } : icons.profile } style={styles.avatar} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignOut} style={{ marginLeft: 6 }}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Patients</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {myPatients.map((p) => (
              <View key={p.id} style={styles.patientCard}>
                <Image source={p.image} style={styles.patientImage} />
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientMeta}>{p.condition}</Text>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {upcomingSessions.map((s) => (
              <View key={s.id} style={styles.scheduleCard}>
                <View style={styles.scheduleImageContainer}>
                  <Image source={s.image} style={styles.scheduleImage} />
                </View>
                <Text style={styles.scheduleTitle}>{s.title}</Text>
                <Text style={styles.courseTitle}>{s.patient}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                  <Image source={icons.calender} style={{ width: 14, height: 14, tintColor: "#3b82f6", marginRight: 6 }} />
                  <Text style={{ color: "#64748b", fontSize: 12 }}>{s.date}</Text>
                </View>
                <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{s.time}</Text>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Start Session</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#0057FF", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  welcomeText: { fontSize: 16, color: "#fff", fontWeight: "500" },
  userName: { fontSize: 22, fontWeight: "bold", color: "#fff", marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 12 },
  patientCard: { width: 200, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginRight: 12 },
  patientImage: { width: 160, height: 100, borderRadius: 8, marginBottom: 8 },
  patientName: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  patientMeta: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  joinButton: { backgroundColor: "#005CFF", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, alignItems: "center", marginTop: 8 },
  joinButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  scheduleCard: { backgroundColor: "#fff", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", width: 260, marginRight: 12 },
  scheduleImageContainer: { width: "100%", height: 120, borderRadius: 8, overflow: "hidden", marginBottom: 12, backgroundColor: "#f1f5f9" },
  scheduleImage: { width: "100%", height: "100%" },
  scheduleTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 6 },
  courseTitle: { fontSize: 14, fontWeight: "600", color: "#3b82f6" },
  notificationButton: { marginRight: 12, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  notificationIcon: { width: 22, height: 22, tintColor: "#fff" },
  notificationBadge: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff3b30", borderWidth: 1, borderColor: "#fff" },
  avatar: { width: 36, height: 36, borderRadius: 18, marginLeft: 8, borderWidth: 2, borderColor: "#fff" },
});

export default PhysiotherapistHome;
