import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";

const API = process.env.EXPO_PUBLIC_API_KEY;

type Patient = {
  _id: string;
  fullName: string;
  age?: number;
  gender?: string;
  doctorId?: string;
};

const DoctorPatients = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const { accessToken } = useAuthStore();

  const title = useMemo(() => "Doctor Patient Management", []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/patients`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error("Unable to load patients");
      }
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const addPatient = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Patient name is required");
      return;
    }

    try {
      const response = await fetch(`${API}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          age: age ? Number(age) : undefined,
          gender,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add patient");
      }

      setModalOpen(false);
      setFullName("");
      setAge("");
      setGender("Female");
      fetchPatients();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Unable to add patient");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Select a patient or register a new one under this doctor.</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalOpen(true)}>
        <Text style={styles.primaryBtnText}>Add New Patient</Text>
      </TouchableOpacity>

      <FlatList
        data={patients}
        keyExtractor={(item: Patient) => item._id}
        refreshing={loading}
        onRefresh={fetchPatients}
        contentContainerStyle={styles.listWrap}
        renderItem={({ item }: { item: Patient }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: "/(root)/(screens)/patient-assessment", params: { patientId: item._id, patientName: item.fullName } })}
          >
            <Text style={styles.cardTitle}>{item.fullName}</Text>
            <Text style={styles.cardDesc}>Age: {item.age || "-"} | Gender: {item.gender || "-"}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No patients found yet.</Text>}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register Patient</Text>
            <TextInput placeholder="Full Name" style={styles.input} value={fullName} onChangeText={setFullName} />
            <TextInput placeholder="Age" keyboardType="number-pad" style={styles.input} value={age} onChangeText={setAge} />

            <View style={styles.genderRow}>
              {[
                { label: "Female", value: "Female" },
                { label: "Male", value: "Male" },
                { label: "Other", value: "Other" },
              ].map((g) => (
                <TouchableOpacity key={g.value} style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]} onPress={() => setGender(g.value)}>
                  <Text style={[styles.genderTxt, gender === g.value && styles.genderTxtActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.secondaryTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnSmall} onPress={addPatient}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  title: { fontSize: 24, color: "#0f172a", fontFamily: "Poppins-Bold" },
  subtitle: { marginTop: 4, color: "#475569", fontFamily: "Poppins-Regular" },
  primaryBtn: { marginTop: 14, backgroundColor: "#2563eb", padding: 12, borderRadius: 12, alignItems: "center" },
  primaryBtnSmall: { backgroundColor: "#2563eb", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontFamily: "Poppins-SemiBold" },
  listWrap: { paddingTop: 14, paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10 },
  cardTitle: { fontSize: 17, color: "#0f172a", fontFamily: "Poppins-SemiBold" },
  cardDesc: { marginTop: 3, color: "#475569", fontFamily: "Poppins-Regular" },
  empty: { color: "#64748b", textAlign: "center", marginTop: 20, fontFamily: "Poppins-Regular" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalContent: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  modalTitle: { fontSize: 19, color: "#0f172a", marginBottom: 12, fontFamily: "Poppins-Bold" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontFamily: "Poppins-Regular" },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  genderBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  genderBtnActive: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  genderTxt: { color: "#334155", fontFamily: "Poppins-Regular" },
  genderTxtActive: { color: "#1d4ed8", fontFamily: "Poppins-SemiBold" },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  secondaryBtn: { backgroundColor: "#e2e8f0", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  secondaryTxt: { color: "#0f172a", fontFamily: "Poppins-SemiBold" },
});

export default DoctorPatients;
