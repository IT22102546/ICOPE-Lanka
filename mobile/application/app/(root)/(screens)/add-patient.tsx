import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const sc = (n: number) => Math.round((screenWidth / 390) * n);
const vs = (n: number) => Math.round((screenHeight / 844) * n);
const API = process.env.EXPO_PUBLIC_API_KEY;

const PROVINCES = [
  "Western", "Central", "Southern", "Northern", "Eastern",
  "North Western", "North Central", "Uva", "Sabaragamuwa",
];

const DISTRICTS: Record<string, string[]> = {
  Western: ["Colombo", "Gampaha", "Kalutara"],
  Central: ["Kandy", "Matale", "Nuwara Eliya"],
  Southern: ["Galle", "Matara", "Hambantota"],
  Northern: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  Eastern: ["Ampara", "Batticaloa", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  Uva: ["Badulla", "Monaragala"],
  Sabaragamuwa: ["Kegalle", "Ratnapura"],
};

const GENDERS = ["Male", "Female", "Other"];

interface StaffMember {
  _id: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
}

interface PatientForm {
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  province: string;
  district: string;
  address: string;
  dateOfBirth: string;
  nic: string;
  emergencyContact: string;
  medicalHistory: string;
  assignedStaffId: string;
  assignedStaffName: string;
}

const EMPTY_FORM: PatientForm = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  province: "",
  district: "",
  address: "",
  dateOfBirth: "",
  nic: "",
  emergencyContact: "",
  medicalHistory: "",
  assignedStaffId: "",
  assignedStaffName: "",
};

const AddPatient = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string; patientName?: string }>();
  const { getAccessToken, currentUser } = useAuthStore();

  const isEdit = !!params.patientId;
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Dropdown open states
  const [openMenu, setOpenMenu] = useState<"province" | "district" | "gender" | "staff" | null>(null);

  const update = (key: keyof PatientForm, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const toggleMenu = (menu: typeof openMenu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // Fetch health care staff list for admin assignment
  const fetchStaff = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingStaff(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      // Try common endpoints; backend may use /api/users or /api/doctors
      const res = await fetch(`${API}/api/users?role=PHYSIOTHERAPIST`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Fallback: try /api/doctors
        const res2 = await fetch(`${API}/api/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res2.ok) {
          const d2 = await res2.json();
          setStaffList(d2.doctors || d2.users || d2 || []);
          return;
        }
        return;
      }
      const data = await res.json();
      setStaffList(data.users || data.staff || data.doctors || data || []);
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setLoadingStaff(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Load existing patient data in edit mode
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(`${API}/api/patients/${params.patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load patient");
        const data = await res.json();
        const p = data.patient || data;
        setForm({
          fullName: p.fullName ?? "",
          age: p.age != null ? String(p.age) : "",
          gender: p.gender ?? "",
          phone: p.phone ?? "",
          province: p.province ?? "",
          district: p.district ?? "",
          address: p.address ?? "",
          dateOfBirth: p.dateOfBirth ?? "",
          nic: p.nic ?? "",
          emergencyContact: p.emergencyContact ?? "",
          medicalHistory: p.medicalHistory ?? "",
          assignedStaffId: p.doctorId?._id ?? p.doctorId ?? "",
          assignedStaffName: p.doctorId?.name ?? "",
        });
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load patient details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.patientId, isEdit]);

  const staffDisplayName = (s: StaffMember) =>
    s.name || `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.email || "Unknown";

  const validate = (): string | null => {
    if (!form.fullName.trim()) return "Full name is required";
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 150))
      return "Please enter a valid age";
    if (form.phone && !/^\+?[\d\s\-]{7,15}$/.test(form.phone))
      return "Please enter a valid phone number";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert("Validation", err); return; }

    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const body: Record<string, any> = {};
      if (form.fullName) body.fullName = form.fullName.trim();
      if (form.age) body.age = Number(form.age);
      if (form.gender) body.gender = form.gender;
      if (form.phone) body.phone = form.phone.trim();
      if (form.province) body.province = form.province;
      if (form.district) body.district = form.district;
      if (form.address) body.address = form.address.trim();
      if (form.dateOfBirth) body.dateOfBirth = form.dateOfBirth.trim();
      if (form.nic) body.nic = form.nic.trim();
      if (form.emergencyContact) body.emergencyContact = form.emergencyContact.trim();
      if (form.medicalHistory) body.medicalHistory = form.medicalHistory.trim();
      // Admin/Super Admin: assign to a staff member
      if (isAdmin && form.assignedStaffId) body.doctorId = form.assignedStaffId;

      const url = isEdit
        ? `${API}/api/patients/${params.patientId}`
        : `${API}/api/patients`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed with status ${res.status}`);
      }

      Alert.alert(
        "Success",
        isEdit ? "Patient updated successfully" : "Patient added successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save patient");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0E7C61" />
        <Text style={styles.loadingText}>Loading patient details...</Text>
      </View>
    );
  }

  const districts = form.province ? (DISTRICTS[form.province] ?? []) : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={sc(22)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isEdit ? "Edit Patient" : "Add Patient"}</Text>
            <Text style={styles.headerSub}>
              {isEdit
                ? params.patientName || "Update patient information"
                : isAdmin
                  ? "Register a new patient & assign staff"
                  : "Register a new patient"}
            </Text>
          </View>
          <View style={[styles.backBtn, { backgroundColor: "transparent" }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ─── Assign to Health Care Staff (Admin only) ─── */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="person-circle-outline" size={sc(20)} color="#0E7C61" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Assign Health Care Staff</Text>
                <Text style={styles.sectionSub}>Choose the staff member responsible for this patient</Text>
              </View>
            </View>

            {loadingStaff ? (
              <View style={styles.staffLoading}>
                <ActivityIndicator size="small" color="#0E7C61" />
                <Text style={styles.staffLoadingText}>Loading health care staff...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => toggleMenu("staff")}
                >
                  <View style={styles.staffSelectorLeft}>
                    {form.assignedStaffId ? (
                      <>
                        <View style={styles.staffAvatarSmall}>
                          <Text style={styles.staffAvatarSmallText}>
                            {(form.assignedStaffName || "?").substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.selectorText}>{form.assignedStaffName}</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={sc(18)} color="#bbb" />
                        <Text style={[styles.selectorText, { color: "#bbb" }]}>
                          {staffList.length === 0 ? "No health care staff available" : "Select health care staff"}
                        </Text>
                      </>
                    )}
                  </View>
                  <Ionicons name={openMenu === "staff" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
                </TouchableOpacity>

                {openMenu === "staff" && staffList.length > 0 && (
                  <View style={styles.dropdownMenu}>
                    {/* Unassign option */}
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => { update("assignedStaffId", ""); update("assignedStaffName", ""); toggleMenu(null); }}
                    >
                      <Ionicons name="close-circle-outline" size={sc(16)} color="#EF4444" />
                      <Text style={[styles.dropdownItemText, { color: "#EF4444", marginLeft: sc(8) }]}>Unassigned (self-managed)</Text>
                    </TouchableOpacity>
                    {staffList.map((s) => {
                      const sid = s._id || s.id || "";
                      const sname = staffDisplayName(s);
                      const isSelected = form.assignedStaffId === sid;
                      return (
                        <TouchableOpacity
                          key={sid}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => { update("assignedStaffId", sid); update("assignedStaffName", sname); toggleMenu(null); }}
                        >
                          <View style={styles.staffDropdownAvatar}>
                            <Text style={styles.staffDropdownAvatarText}>
                              {sname.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: sc(10) }}>
                            <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                              {sname}
                            </Text>
                            {(s.specialization || s.email) && (
                              <Text style={styles.staffDropdownSub}>
                                {s.specialization || s.email}
                              </Text>
                            )}
                          </View>
                          {isSelected && <Ionicons name="checkmark-circle" size={sc(18)} color="#0E7C61" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {staffList.length === 0 && !loadingStaff && (
                  <View style={styles.noStaffBox}>
                    <Ionicons name="information-circle-outline" size={sc(16)} color="#F59E0B" />
                    <Text style={styles.noStaffText}>
                      No health care staff found. Add staff first from the dashboard.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ─── Basic Info ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="person-outline" size={sc(20)} color="#0E7C61" />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.fullName}
            onChangeText={(v) => update("fullName", v)}
            placeholder="Enter patient's full name"
            placeholderTextColor="#bbb"
            autoCapitalize="words"
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={form.age}
                onChangeText={(v) => update("age", v)}
                placeholder="e.g. 72"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={form.dateOfBirth}
                onChangeText={(v) => update("dateOfBirth", v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#bbb"
              />
            </View>
          </View>

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity style={styles.selector} onPress={() => toggleMenu("gender")}>
            <Text style={[styles.selectorText, !form.gender && { color: "#bbb" }]}>
              {form.gender || "Select gender"}
            </Text>
            <Ionicons name={openMenu === "gender" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openMenu === "gender" && (
            <View style={styles.dropdownMenu}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.dropdownItem, form.gender === g && styles.dropdownItemActive]}
                  onPress={() => { update("gender", g); toggleMenu(null); }}
                >
                  <Text style={[styles.dropdownItemText, form.gender === g && styles.dropdownItemTextActive]}>{g}</Text>
                  {form.gender === g && <Ionicons name="checkmark" size={sc(16)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>NIC / ID Number</Text>
          <TextInput
            style={styles.input}
            value={form.nic}
            onChangeText={(v) => update("nic", v)}
            placeholder="e.g. 881234567V"
            placeholderTextColor="#bbb"
            autoCapitalize="characters"
          />
        </View>

        {/* ─── Contact ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="call-outline" size={sc(20)} color="#1565C0" />
            </View>
            <Text style={styles.sectionTitle}>Contact Details</Text>
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => update("phone", v)}
            placeholder="e.g. 0711234567"
            placeholderTextColor="#bbb"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Emergency Contact</Text>
          <TextInput
            style={styles.input}
            value={form.emergencyContact}
            onChangeText={(v) => update("emergencyContact", v)}
            placeholder="Name & phone of emergency contact"
            placeholderTextColor="#bbb"
          />
        </View>

        {/* ─── Location ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="location-outline" size={sc(20)} color="#E65100" />
            </View>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          {/* Province */}
          <Text style={styles.label}>Province</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => toggleMenu("province")}
          >
            <Text style={[styles.selectorText, !form.province && { color: "#bbb" }]}>
              {form.province || "Select province"}
            </Text>
            <Ionicons name={openMenu === "province" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openMenu === "province" && (
            <View style={styles.dropdownMenu}>
              {PROVINCES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.dropdownItem, form.province === p && styles.dropdownItemActive]}
                  onPress={() => { update("province", p); update("district", ""); toggleMenu(null); }}
                >
                  <Text style={[styles.dropdownItemText, form.province === p && styles.dropdownItemTextActive]}>{p}</Text>
                  {form.province === p && <Ionicons name="checkmark" size={sc(16)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* District */}
          <Text style={styles.label}>District</Text>
          <TouchableOpacity
            style={[styles.selector, !form.province && styles.selectorDisabled]}
            onPress={() => { if (form.province) toggleMenu("district"); }}
          >
            <Text style={[styles.selectorText, !form.district && { color: "#bbb" }]}>
              {form.district || (form.province ? "Select district" : "Select province first")}
            </Text>
            <Ionicons name={openMenu === "district" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openMenu === "district" && districts.length > 0 && (
            <View style={styles.dropdownMenu}>
              {districts.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dropdownItem, form.district === d && styles.dropdownItemActive]}
                  onPress={() => { update("district", d); toggleMenu(null); }}
                >
                  <Text style={[styles.dropdownItemText, form.district === d && styles.dropdownItemTextActive]}>{d}</Text>
                  {form.district === d && <Ionicons name="checkmark" size={sc(16)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Full Address</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.address}
            onChangeText={(v) => update("address", v)}
            placeholder="Street address, city"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* ─── Medical History ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FCE4EC" }]}>
              <Ionicons name="medkit-outline" size={sc(20)} color="#C62828" />
            </View>
            <Text style={styles.sectionTitle}>Medical History</Text>
          </View>

          <Text style={styles.label}>Known Conditions / Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline, { minHeight: sc(90) }]}
            value={form.medicalHistory}
            onChangeText={(v) => update("medicalHistory", v)}
            placeholder="e.g. Hypertension, Diabetes Type 2, previous surgeries..."
            placeholderTextColor="#bbb"
            multiline
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.saveBtnGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={isEdit ? "save-outline" : "person-add-outline"} size={sc(22)} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? "Save Changes" : "Add Patient"}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: vs(40) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: sc(12) },
  loadingText: { fontSize: sc(14), color: "#666", fontFamily: "Poppins-Regular" },

  header: {
    paddingTop: Platform.OS === "ios" ? vs(54) : vs(42),
    paddingHorizontal: sc(16),
    paddingBottom: sc(20),
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: sc(40), height: sc(40), borderRadius: sc(12),
    backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center",
  },
  headerCenter: { flex: 1, marginHorizontal: sc(12) },
  headerTitle: { color: "#fff", fontSize: sc(20), fontFamily: "Poppins-Bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: sc(12), fontFamily: "Poppins-Regular", marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: sc(16) },

  section: {
    backgroundColor: "#fff", borderRadius: sc(16), padding: sc(16), marginBottom: sc(14),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: sc(16), gap: sc(10) },
  sectionIcon: { width: sc(38), height: sc(38), borderRadius: sc(10), justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222" },
  sectionSub: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#888", marginTop: 2 },

  label: { fontSize: sc(13), fontFamily: "Poppins-Medium", color: "#555", marginBottom: sc(6), marginTop: sc(10) },
  required: { color: "#EF4444" },
  input: {
    backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: sc(10),
    paddingHorizontal: sc(14), paddingVertical: sc(11),
    fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333",
  },
  multiline: { textAlignVertical: "top", minHeight: sc(56) },
  row: { flexDirection: "row", gap: sc(12) },
  halfCol: { flex: 1 },

  selector: {
    backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: sc(10),
    paddingHorizontal: sc(14), paddingVertical: sc(13),
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  selectorDisabled: { opacity: 0.5 },
  selectorText: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333", flex: 1 },
  staffSelectorLeft: { flexDirection: "row", alignItems: "center", gap: sc(10), flex: 1 },

  dropdownMenu: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(10), marginTop: sc(4), overflow: "hidden",
    maxHeight: sc(280),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: sc(14), paddingVertical: sc(12),
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  dropdownItemActive: { backgroundColor: "#f0faf6" },
  dropdownItemText: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#444" },
  dropdownItemTextActive: { color: "#0E7C61", fontFamily: "Poppins-SemiBold" },

  // Staff-specific
  staffLoading: { flexDirection: "row", alignItems: "center", gap: sc(10), paddingVertical: sc(12) },
  staffLoadingText: { fontSize: sc(13), fontFamily: "Poppins-Regular", color: "#888" },
  staffAvatarSmall: {
    width: sc(28), height: sc(28), borderRadius: sc(14),
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center",
  },
  staffAvatarSmallText: { fontSize: sc(11), fontFamily: "Poppins-Bold", color: "#0E7C61" },
  staffDropdownAvatar: {
    width: sc(32), height: sc(32), borderRadius: sc(16),
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center",
  },
  staffDropdownAvatarText: { fontSize: sc(12), fontFamily: "Poppins-Bold", color: "#0E7C61" },
  staffDropdownSub: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#999", marginTop: 1 },
  noStaffBox: {
    flexDirection: "row", alignItems: "center", gap: sc(8),
    backgroundColor: "#FFFBEB", borderRadius: sc(10),
    padding: sc(12), borderWidth: 1, borderColor: "#FDE68A", marginTop: sc(8),
  },
  noStaffText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#92400E", flex: 1 },

  saveBtn: { marginTop: sc(8) },
  saveBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: sc(10), paddingVertical: sc(16), borderRadius: sc(16),
  },
  saveBtnText: { color: "#fff", fontSize: sc(17), fontFamily: "Poppins-Bold" },
});

export default AddPatient;
