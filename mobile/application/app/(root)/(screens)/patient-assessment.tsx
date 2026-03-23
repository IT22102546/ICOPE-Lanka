import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";

const API = process.env.EXPO_PUBLIC_API_KEY;

const defaultForm = {
  hearing: "",
  vision: "",
  cognition: "",
  mood: "",
  mobility: "",
  nutrition: "",
  notes: "",
};

const PatientAssessment = () => {
  const { patientId, patientName } = useLocalSearchParams<{ patientId?: string; patientName?: string }>();
  const { accessToken } = useAuthStore();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof typeof defaultForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveAssessment = async () => {
    if (!patientId) {
      Alert.alert("Missing patient", "Patient ID is required");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API}/api/patients/${patientId}/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to save assessment");
      }

      Alert.alert("Saved", "ICOPE assessment recorded successfully");
      setForm(defaultForm);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof defaultForm; label: string; placeholder: string }[] = [
    { key: "hearing", label: "Hearing", placeholder: "Normal / Mild / Moderate / Severe" },
    { key: "vision", label: "Vision", placeholder: "Normal / Corrected / Impaired" },
    { key: "cognition", label: "Cognition", placeholder: "Screening result" },
    { key: "mood", label: "Mood", placeholder: "Mood screening result" },
    { key: "mobility", label: "Mobility", placeholder: "Balance and movement status" },
    { key: "nutrition", label: "Nutrition", placeholder: "Nutrition and appetite notes" },
    { key: "notes", label: "General Notes", placeholder: "Additional observations" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>ICOPE Assessment</Text>
      <Text style={styles.subtitle}>Patient: {patientName || "Unknown"}</Text>

      {fields.map((field) => (
        <View key={field.key} style={styles.fieldWrap}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[styles.input, field.key === "notes" && styles.notesInput]}
            value={form[field.key]}
            onChangeText={(value: string) => update(field.key, value)}
            placeholder={field.placeholder}
            multiline={field.key === "notes"}
          />
        </View>
      ))}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={saveAssessment} disabled={saving}>
        <Text style={styles.saveTxt}>{saving ? "Saving..." : "Save Assessment"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 26 },
  title: { fontSize: 24, color: "#0f172a", fontFamily: "Poppins-Bold" },
  subtitle: { marginTop: 4, color: "#475569", fontFamily: "Poppins-Regular" },
  fieldWrap: { marginTop: 12 },
  label: { marginBottom: 4, color: "#0f172a", fontFamily: "Poppins-SemiBold" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Poppins-Regular" },
  notesInput: { minHeight: 90, textAlignVertical: "top" },
  saveBtn: { marginTop: 18, backgroundColor: "#0f766e", alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  saveTxt: { color: "#fff", fontFamily: "Poppins-SemiBold" },
  disabled: { opacity: 0.6 },
});

export default PatientAssessment;
