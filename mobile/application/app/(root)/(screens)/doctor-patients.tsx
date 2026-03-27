import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { SRI_LANKA_DISTRICTS_BY_PROVINCE, SRI_LANKA_PROVINCES, type LanguageKey } from "@/constants/elderRegistration";

const API = process.env.EXPO_PUBLIC_API_KEY;

type Patient = {
  _id: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  province?: string;
  district?: string;
  doctorId?: string;
};

const DoctorPatients = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageKey>("en");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [provinces, setProvinces] = useState<string[]>(SRI_LANKA_PROVINCES);
  const [districtsByProvince, setDistrictsByProvince] = useState<Record<string, string[]>>(SRI_LANKA_DISTRICTS_BY_PROVINCE);
  const [showProvinceList, setShowProvinceList] = useState(false);
  const [showDistrictList, setShowDistrictList] = useState(false);
  const { accessToken } = useAuthStore();

  const title = useMemo(() => (language === "en" ? "Physiotherapist Elder Management" : "භෞතික චිකිත්සක වයෝවෘද්ධ කළමනාකරණය"), [language]);
  const currentDistricts = province ? districtsByProvince[province] || [] : [];

  const loadLocationMeta = async () => {
    try {
      const response = await fetch(`${API}/api/metadata/locations`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.provinces) && data.provinces.length > 0) {
        setProvinces(data.provinces);
      }
      if (data.districtsByProvince && typeof data.districtsByProvince === "object") {
        setDistrictsByProvince(data.districtsByProvince);
      }
    } catch {
      // Keep local fallback when metadata endpoint is unavailable.
    }
  };

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
    loadLocationMeta();
  }, []);

  const addPatient = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Patient name is required");
      return;
    }

    if (!age || Number(age) <= 0) {
      Alert.alert("Validation", "Valid age is required");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Validation", "Mobile number is required");
      return;
    }

    if (!province || !district) {
      Alert.alert("Validation", "Province and district are required");
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
          age: Number(age),
          gender,
          phone: phone.trim(),
          province,
          district,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add patient");
      }

      setModalOpen(false);
      setFullName("");
      setAge("");
      setGender("Female");
      setPhone("");
      setProvince("");
      setDistrict("");
      fetchPatients();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Unable to add patient");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {language === "en"
          ? "Select an elder or register a new elder under this physiotherapist."
          : "මෙම භෞතික චිකිත්සකයා යටතේ නව වයෝවෘද්ධයෙක් ලියාපදිංචි කරන්න හෝ පවතින අයෙකු තෝරන්න."}
      </Text>

      <View style={styles.langRow}>
        <TouchableOpacity style={[styles.langBtn, language === "en" && styles.langBtnActive]} onPress={() => setLanguage("en")}>
          <Text style={[styles.langText, language === "en" && styles.langTextActive]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langBtn, language === "si" && styles.langBtnActive]} onPress={() => setLanguage("si")}>
          <Text style={[styles.langText, language === "si" && styles.langTextActive]}>සිංහල</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalOpen(true)}>
        <Text style={styles.primaryBtnText}>{language === "en" ? "Register Elder" : "වයෝවෘද්ධ ලියාපදිංචි කරන්න"}</Text>
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
            <Text style={styles.cardDesc}>Mobile: {item.phone || "-"}</Text>
            <Text style={styles.cardDesc}>Location: {item.province || "-"} / {item.district || "-"}</Text>
            <View style={styles.cardCtaWrap}>
              <Text style={styles.cardCta}>{language === "en" ? "Continue ICOPE Assessment" : "ICOPE ඇගයීම අඛණ්ඩ කරන්න"}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{language === "en" ? "No elders found yet." : "තවම වයෝවෘද්ධයන් සොයාගත නොහැක."}</Text>}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{language === "en" ? "Register Elder" : "වයෝවෘද්ධ ලියාපදිංචි කිරීම"}</Text>
              <TextInput placeholder={language === "en" ? "Full Name" : "සම්පූර්ණ නම"} style={styles.input} value={fullName} onChangeText={setFullName} />
              <TextInput placeholder={language === "en" ? "Age" : "වයස"} keyboardType="number-pad" style={styles.input} value={age} onChangeText={setAge} />
              <TextInput placeholder={language === "en" ? "Mobile Number" : "දුරකථන අංකය"} keyboardType="phone-pad" style={styles.input} value={phone} onChangeText={setPhone} />

              <TouchableOpacity style={styles.dropdown} onPress={() => { setShowProvinceList((v) => !v); setShowDistrictList(false); }}>
                <Text style={styles.dropdownText}>{province || (language === "en" ? "Select Province" : "පළාත තෝරන්න")}</Text>
              </TouchableOpacity>
              {showProvinceList && (
                <View style={styles.dropdownList}>
                  {provinces.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProvince(item);
                        setDistrict("");
                        setShowProvinceList(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  if (!province) {
                    Alert.alert("Select province", "Please choose a province first");
                    return;
                  }
                  setShowDistrictList((v) => !v);
                }}
              >
                <Text style={styles.dropdownText}>{district || (language === "en" ? "Select District" : "දිස්ත්‍රික්කය තෝරන්න")}</Text>
              </TouchableOpacity>
              {showDistrictList && (
                <View style={styles.dropdownList}>
                  {currentDistricts.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDistrict(item);
                        setShowDistrictList(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.genderRow}>
                {[
                  { label: language === "en" ? "Female" : "ස්ත්‍රී", value: "Female" },
                  { label: language === "en" ? "Male" : "පුරුෂ", value: "Male" },
                  { label: language === "en" ? "Other" : "වෙනත්", value: "Other" },
                ].map((g) => (
                  <TouchableOpacity key={g.value} style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]} onPress={() => setGender(g.value)}>
                    <Text style={[styles.genderTxt, gender === g.value && styles.genderTxtActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalOpen(false)}>
                  <Text style={styles.secondaryTxt}>{language === "en" ? "Cancel" : "අවලංගු"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnSmall} onPress={addPatient}>
                  <Text style={styles.primaryBtnText}>{language === "en" ? "Save Elder" : "වයෝවෘද්ධයෙක් සුරකින්න"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  langRow: { marginTop: 10, flexDirection: "row", gap: 8 },
  langBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff" },
  langBtnActive: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  langText: { color: "#334155", fontFamily: "Poppins-Regular" },
  langTextActive: { color: "#1d4ed8", fontFamily: "Poppins-SemiBold" },
  primaryBtn: { marginTop: 14, backgroundColor: "#2563eb", padding: 12, borderRadius: 12, alignItems: "center" },
  primaryBtnSmall: { backgroundColor: "#2563eb", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontFamily: "Poppins-SemiBold" },
  listWrap: { paddingTop: 14, paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10 },
  cardTitle: { fontSize: 17, color: "#0f172a", fontFamily: "Poppins-SemiBold" },
  cardDesc: { marginTop: 3, color: "#475569", fontFamily: "Poppins-Regular" },
  cardCtaWrap: { marginTop: 10, alignSelf: "flex-start", backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  cardCta: { color: "#0c4a6e", fontFamily: "Poppins-SemiBold", fontSize: 12 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 20, fontFamily: "Poppins-Regular" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalContent: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: "88%" },
  modalTitle: { fontSize: 19, color: "#0f172a", marginBottom: 12, fontFamily: "Poppins-Bold" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontFamily: "Poppins-Regular" },
  dropdown: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, backgroundColor: "#fff" },
  dropdownText: { color: "#334155", fontFamily: "Poppins-Regular" },
  dropdownList: { borderWidth: 1, borderColor: "#dbe3ee", borderRadius: 10, marginTop: -6, marginBottom: 10, backgroundColor: "#f8fafc" },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  dropdownItemText: { color: "#0f172a", fontFamily: "Poppins-Regular" },
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
