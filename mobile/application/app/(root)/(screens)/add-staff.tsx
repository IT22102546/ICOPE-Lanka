import React, { useEffect, useState } from "react";
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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const sc = (n: number) => Math.round((screenWidth / 390) * n);
const vs = (n: number) => Math.round((screenHeight / 844) * n);
const API = process.env.EXPO_PUBLIC_API_KEY;

const SPECIALIZATIONS = [
  "Physiotherapy",
  "Geriatric Care",
  "Occupational Therapy",
  "Nursing",
  "General Medicine",
  "Neurology",
  "Orthopedics",
  "Cardiology",
  "Dietetics / Nutrition",
  "Speech Therapy",
  "Other",
];

const ROLES = [
  { label: "Health Care Staff (Physiotherapist)", value: "PHYSIOTHERAPIST" },
  { label: "Admin", value: "ADMIN" },
];

interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  role: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  availabilityNote: string;
}

const EMPTY_FORM: StaffForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialization: "",
  role: "PHYSIOTHERAPIST",
  password: "",
  confirmPassword: "",
  isActive: true,
  availabilityNote: "",
};

const AddStaff = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ staffId?: string; staffName?: string }>();
  const { getAccessToken, currentUser } = useAuthStore();

  const isEdit = !!params.staffId;
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [openMenu, setOpenMenu] = useState<"specialization" | "role" | null>(null);

  const update = <K extends keyof StaffForm>(key: K, val: StaffForm[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const toggleMenu = (menu: typeof openMenu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // Load existing staff for edit mode
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(`${API}/api/users/${params.staffId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load staff member");
        const data = await res.json();
        const s = data.user || data.staff || data;
        setForm({
          firstName: s.firstName ?? s.name?.split(" ")[0] ?? "",
          lastName: s.lastName ?? s.name?.split(" ").slice(1).join(" ") ?? "",
          email: s.email ?? "",
          phone: s.phone ?? s.mobile ?? "",
          specialization: s.specialization ?? "",
          role: s.role ?? "PHYSIOTHERAPIST",
          password: "",
          confirmPassword: "",
          isActive: s.isActive !== false && s.status !== "INACTIVE",
          availabilityNote: s.availabilityNote ?? "",
        });
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load staff details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.staffId, isEdit]);

  const validate = (): string | null => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email";
    if (form.phone && !/^\+?[\d\s\-]{7,15}$/.test(form.phone)) return "Please enter a valid phone number";
    if (!isEdit) {
      if (!form.password) return "Password is required for new accounts";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (form.password !== form.confirmPassword) return "Passwords do not match";
    } else if (form.password) {
      if (form.password.length < 8) return "New password must be at least 8 characters";
      if (form.password !== form.confirmPassword) return "Passwords do not match";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert("Validation", err); return; }

    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const body: Record<string, any> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim().toLowerCase(),
        role: form.role,
        isActive: form.isActive,
        status: form.isActive ? "ACTIVE" : "INACTIVE",
      };
      if (form.phone) body.phone = form.phone.trim();
      if (form.specialization) body.specialization = form.specialization;
      if (form.availabilityNote) body.availabilityNote = form.availabilityNote.trim();
      if (!isEdit && form.password) body.password = form.password;
      if (isEdit && form.password) body.password = form.password;

      const url = isEdit
        ? `${API}/api/users/${params.staffId}`
        : `${API}/api/users`;
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
        isEdit ? "Health care staff updated successfully" : "Health care staff added successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0E7C61" />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={sc(22)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isEdit ? "Edit Health Care Staff" : "Add Health Care Staff"}
            </Text>
            <Text style={styles.headerSub}>
              {isEdit
                ? params.staffName || "Update staff information"
                : "Register a new health care staff member"}
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
        {/* Role badge */}
        {!isSuperAdmin && (
          <View style={styles.accessNotice}>
            <Ionicons name="shield-checkmark-outline" size={sc(16)} color="#1565C0" />
            <Text style={styles.accessNoticeText}>
              Only Super Admins can add health care staff members.
            </Text>
          </View>
        )}

        {/* ─── Personal Info ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="person-outline" size={sc(20)} color="#1565C0" />
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={(v) => update("firstName", v)}
                placeholder="First name"
                placeholderTextColor="#bbb"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={(v) => update("lastName", v)}
                placeholder="Last name"
                placeholderTextColor="#bbb"
                autoCapitalize="words"
              />
            </View>
          </View>

          <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => update("email", v)}
            placeholder="staff@hospital.lk"
            placeholderTextColor="#bbb"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => update("phone", v)}
            placeholder="e.g. 0711234567"
            placeholderTextColor="#bbb"
            keyboardType="phone-pad"
          />
        </View>

        {/* ─── Professional Info ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="medkit-outline" size={sc(20)} color="#0E7C61" />
            </View>
            <Text style={styles.sectionTitle}>Professional Details</Text>
          </View>

          {/* Role */}
          <Text style={styles.label}>Staff Role <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.selector} onPress={() => toggleMenu("role")}>
            <Text style={[styles.selectorText, !form.role && { color: "#bbb" }]}>
              {ROLES.find((r) => r.value === form.role)?.label || "Select role"}
            </Text>
            <Ionicons name={openMenu === "role" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openMenu === "role" && (
            <View style={styles.dropdownMenu}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.dropdownItem, form.role === r.value && styles.dropdownItemActive]}
                  onPress={() => { update("role", r.value); toggleMenu(null); }}
                >
                  <Text style={[styles.dropdownItemText, form.role === r.value && styles.dropdownItemTextActive]}>
                    {r.label}
                  </Text>
                  {form.role === r.value && <Ionicons name="checkmark" size={sc(16)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Specialization */}
          <Text style={styles.label}>Specialization</Text>
          <TouchableOpacity style={styles.selector} onPress={() => toggleMenu("specialization")}>
            <Text style={[styles.selectorText, !form.specialization && { color: "#bbb" }]}>
              {form.specialization || "Select specialization"}
            </Text>
            <Ionicons name={openMenu === "specialization" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openMenu === "specialization" && (
            <View style={styles.dropdownMenu}>
              {SPECIALIZATIONS.map((sp) => (
                <TouchableOpacity
                  key={sp}
                  style={[styles.dropdownItem, form.specialization === sp && styles.dropdownItemActive]}
                  onPress={() => { update("specialization", sp); toggleMenu(null); }}
                >
                  <Text style={[styles.dropdownItemText, form.specialization === sp && styles.dropdownItemTextActive]}>
                    {sp}
                  </Text>
                  {form.specialization === sp && <Ionicons name="checkmark" size={sc(16)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Active Status */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextBlock}>
              <Text style={styles.switchLabel}>Active / Available</Text>
              <Text style={styles.switchSub}>Inactive staff won't appear in patient assignment lists</Text>
            </View>
            <Switch
              value={form.isActive}
              onValueChange={(v) => update("isActive", v)}
              trackColor={{ true: "#0E7C61", false: "#e5e7eb" }}
              thumbColor={form.isActive ? "#fff" : "#9ca3af"}
            />
          </View>

          <Text style={styles.label}>Availability Note</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.availabilityNote}
            onChangeText={(v) => update("availabilityNote", v)}
            placeholder="e.g. Available Monday–Friday, 8am–5pm"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* ─── Account Credentials ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="lock-closed-outline" size={sc(20)} color="#E65100" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>
                {isEdit ? "Change Password (optional)" : "Account Password"}
              </Text>
              {isEdit && (
                <Text style={styles.sectionSub}>Leave blank to keep current password</Text>
              )}
            </View>
          </View>

          <Text style={styles.label}>
            {isEdit ? "New Password" : "Password"}{!isEdit && <Text style={styles.required}> *</Text>}
          </Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.password}
              onChangeText={(v) => update("password", v)}
              placeholder="Minimum 8 characters"
              placeholderTextColor="#bbb"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={sc(20)} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password{!isEdit && <Text style={styles.required}> *</Text>}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.confirmPassword}
              onChangeText={(v) => update("confirmPassword", v)}
              placeholder="Re-enter password"
              placeholderTextColor="#bbb"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={sc(20)} color="#888" />
            </TouchableOpacity>
          </View>

          {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={sc(14)} color="#EF4444" />
              <Text style={styles.errorText}>Passwords do not match</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.saveBtnGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEdit ? "save-outline" : "person-add-outline"}
                  size={sc(22)} color="#fff"
                />
                <Text style={styles.saveBtnText}>
                  {isEdit ? "Save Changes" : "Add Health Care Staff"}
                </Text>
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
  headerTitle: { color: "#fff", fontSize: sc(19), fontFamily: "Poppins-Bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: sc(12), fontFamily: "Poppins-Regular", marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: sc(16) },

  accessNotice: {
    flexDirection: "row", alignItems: "center", gap: sc(8),
    backgroundColor: "#E3F2FD", borderRadius: sc(12), padding: sc(12),
    marginBottom: sc(14), borderWidth: 1, borderColor: "#BBDEFB",
  },
  accessNoticeText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#1565C0", flex: 1 },

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
  selectorText: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333", flex: 1 },

  dropdownMenu: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(10), marginTop: sc(4), overflow: "hidden", maxHeight: sc(260),
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
  dropdownItemText: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#444", flex: 1 },
  dropdownItemTextActive: { color: "#0E7C61", fontFamily: "Poppins-SemiBold" },

  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: sc(14), gap: sc(12),
  },
  switchTextBlock: { flex: 1 },
  switchLabel: { fontSize: sc(14), fontFamily: "Poppins-Medium", color: "#333" },
  switchSub: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#999", marginTop: 2 },

  passwordRow: { flexDirection: "row", alignItems: "center", gap: sc(8) },
  eyeBtn: {
    width: sc(44), height: sc(44), borderRadius: sc(10),
    backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
  },

  errorRow: { flexDirection: "row", alignItems: "center", gap: sc(6), marginTop: sc(6) },
  errorText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#EF4444" },

  saveBtn: { marginTop: sc(8) },
  saveBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: sc(10), paddingVertical: sc(16), borderRadius: sc(16),
  },
  saveBtnText: { color: "#fff", fontSize: sc(16), fontFamily: "Poppins-Bold" },
});

export default AddStaff;
