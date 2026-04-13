import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { icons } from "@/constants";

export default function SubjectNotesRecords() {
  const [activeTab, setActiveTab] = useState("notes");
  const { subjectId, subjectName, teacherName, subjectImage ,subjectCode} = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* ------------------- SUBJECT HEADER ------------------- */}
      <View style={styles.subjectHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectTitle}>{subjectName || "Subject"}</Text>
          <Text style={styles.teacherText}>Teacher: {teacherName || "Sarah Johnson"}</Text>
        </View>
        <Image 
          source={{ uri: subjectImage }} 
          style={styles.subjectHeaderImage}
        />
      </View>
      
      {/* ------------------- TABS ------------------- */}
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab("notes")} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === "notes" && styles.activeTabText]}>
            Notes
          </Text>
          {activeTab === "notes" && <View style={styles.tabLine} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("recording")} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === "recording" && styles.activeTabText]}>
            Recording
          </Text>
          {activeTab === "recording" && <View style={styles.tabLine} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ marginTop: 10 }}>
        
        {/* ------------------- TODAY TITLE ------------------- */}
        <Text style={styles.sectionTitle}>Today</Text>

        {/* ------------------- TODAY ITEMS ------------------- */}
        {activeTab === "notes" ? (
          <>
            <NoteCard
              iconColor="#FCEEBA"
              title={subjectName || "Subject"}
              subtitle={subjectCode}

            />
            <NoteCard
              iconColor="#F8C9A9"
              title={subjectName || "Subject"}
              subtitle="Today . PDF"
            />
          </>
        ) : (
          <>
            <RecordCard
              iconColor="#FCEEBA"
              title={subjectName || "Subject"}
              subtitle="Today . MV4"
            />
            <RecordCard
              iconColor="#FCEEBA"
              title={subjectName || "Subject"}
              subtitle="Today . MV4"
            />
          </>
        )}

        {/* ------------------- PREVIOUS TITLE ------------------- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          {activeTab === "notes" ? "Previous Notes" : "Previous Recordings"}
        </Text>

        {/* ------------------- PREVIOUS ITEMS ------------------- */}
        {activeTab === "notes" ? (
          <>
            <NoteCard
              iconColor="#F9C3E8"
              title={subjectName || "Subject"}
              subtitle="Yesterday . DOC"
            />
            <NoteCard
              iconColor="#F8C9A9"
              title={subjectName || "Subject"}
              subtitle="2 days Before . PDF"
            />
          </>
        ) : (
          <>
            <RecordCard
              iconColor="#F9C3E8"
              title={subjectName || "Subject"}
              subtitle="20 Sep, 2024  . MV4"
            />
            <RecordCard
              iconColor="#F8C9A9"
              title={subjectName || "Subject"}
              subtitle="19 Sep, 2025  . MV4"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const NoteCard = ({ iconColor, title, subtitle }) => (
  <View style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: iconColor }]}>
      <Text style={styles.iconText}>📘</Text>
    </View>

    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </View>

    <View style={styles.downloadBox}>
                <Image source={icons.download} style={styles.inputIcon} />
    </View>
  </View>
);

const RecordCard = ({ iconColor, title, subtitle }) => (
  <View style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: iconColor }]}>
      <Text style={styles.iconText}>🎤</Text>
    </View>

    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </View>

    <View style={styles.downloadBox}>
                <Image source={icons.play} style={styles.inputIcon} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  /* ------------------ Subject Header ------------------ */
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: "#000",
  },
  subjectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  teacherText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  subjectHeaderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },

  /* ------------------ Tabs ------------------ */
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  tabButton: {
    marginHorizontal: 25,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    color: "#9A9A9A",
  },
  activeTabText: {
    color: "#6F4FF2",
    fontWeight: "600",
  },
  tabLine: {
    width: 50,
    height: 2,
    backgroundColor: "#6F4FF2",
    marginTop: 3,
    borderRadius: 2,
  },

  /* ------------------ Section Title ------------------ */
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
    color: "#000",
  },

  /* ------------------ Card ------------------ */
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  iconText: {
    fontSize: 22,
  },

  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  downloadBox: {
    width: 40,
    height: 40,
    backgroundColor: "#005CFF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  downloadIcon: {
    fontSize: 20,
    color: "#0057ff",
  },

  playIcon: {
    fontSize: 22,
    color: "#0057ff",
  },
  inputIcon: {
    width: 15,
    height: 20,
    marginTop: 1,
  },
});