import { useState } from "react";
import { AccessibilityInfo, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { ICOPE_FIELD_LABELS, type LanguageKey } from "@/constants/elderRegistration";

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
  const [language, setLanguage] = useState<LanguageKey>("en");
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

  const speakGuide = async (fieldKey: keyof typeof defaultForm) => {
    const field = ICOPE_FIELD_LABELS[fieldKey];
    if (!field) return;

    const text = language === "en"
      ? `${field.en}. ${field.placeholderEn}`
      : `${field.si}. ${field.placeholderSi}`;

    await AccessibilityInfo.announceForAccessibility(text);
  };

  const fields: { key: keyof typeof defaultForm }[] = [
    { key: "hearing" },
    { key: "vision" },
    { key: "cognition" },
    { key: "mood" },
    { key: "mobility" },
    { key: "nutrition" },
    { key: "notes" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>ICOPE Assessment</Text>
      <Text style={styles.subtitle}>{language === "en" ? "Elder" : "වයෝවෘද්ධයා"}: {patientName || "Unknown"}</Text>

      <View style={styles.langRow}>
        <TouchableOpacity style={[styles.langBtn, language === "en" && styles.langBtnActive]} onPress={() => setLanguage("en")}>
          <Text style={[styles.langText, language === "en" && styles.langTextActive]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langBtn, language === "si" && styles.langBtnActive]} onPress={() => setLanguage("si")}>
          <Text style={[styles.langText, language === "si" && styles.langTextActive]}>සිංහල</Text>
        </TouchableOpacity>
      </View>

      {fields.map((field) => (
        <View key={field.key} style={styles.fieldWrap}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{language === "en" ? ICOPE_FIELD_LABELS[field.key].en : ICOPE_FIELD_LABELS[field.key].si}</Text>
            <TouchableOpacity style={styles.voiceBtn} onPress={() => speakGuide(field.key)}>
              <Text style={styles.voiceBtnText}>{language === "en" ? "Voice" : "හඬ"}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, field.key === "notes" && styles.notesInput]}
            value={form[field.key]}
            onChangeText={(value: string) => update(field.key, value)}
            placeholder={language === "en" ? ICOPE_FIELD_LABELS[field.key].placeholderEn : ICOPE_FIELD_LABELS[field.key].placeholderSi}
            multiline={field.key === "notes"}
          />
        </View>
      ))}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={saveAssessment} disabled={saving}>
        <Text style={styles.saveTxt}>
          {saving
            ? language === "en" ? "Saving..." : "සුරකිමින්..."
            : language === "en" ? "Save Assessment" : "ඇගයීම සුරකින්න"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.voiceHint}>
        {language === "en"
          ? "Voice button reads each field guidance using your phone accessibility voice."
          : "හඬ බොත්තම ඔබගේ දුරකථනයේ ප්‍රවේශ හඬ භාවිතා කර ක්ෂේත්‍ර මාර්ගෝපදේශ කියවයි."}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 26 },
  title: { fontSize: 24, color: "#0f172a", fontFamily: "Poppins-Bold" },
  subtitle: { marginTop: 4, color: "#475569", fontFamily: "Poppins-Regular" },
  langRow: { marginTop: 10, flexDirection: "row", gap: 8 },
  langBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff" },
  langBtnActive: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  langText: { color: "#334155", fontFamily: "Poppins-Regular" },
  langTextActive: { color: "#1d4ed8", fontFamily: "Poppins-SemiBold" },
  fieldWrap: { marginTop: 12 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { marginBottom: 4, color: "#0f172a", fontFamily: "Poppins-SemiBold" },
  voiceBtn: { backgroundColor: "#e0f2fe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  voiceBtnText: { color: "#0c4a6e", fontFamily: "Poppins-SemiBold", fontSize: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Poppins-Regular" },
  notesInput: { minHeight: 90, textAlignVertical: "top" },
  saveBtn: { marginTop: 18, backgroundColor: "#0f766e", alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  saveTxt: { color: "#fff", fontFamily: "Poppins-SemiBold" },
  disabled: { opacity: 0.6 },
  voiceHint: { marginTop: 12, color: "#64748b", fontFamily: "Poppins-Regular", fontSize: 12 },
});

export default PatientAssessment;
