import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import useAuthStore from "@/stores/authStore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const sc = (n: number) => Math.round((screenWidth / 390) * n);
const vs = (n: number) => Math.round((screenHeight / 844) * n);

// Same pattern as doctor-patients.tsx
const API = process.env.EXPO_PUBLIC_API_URL;

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

interface StaffOption {
  _id: string;
  name: string;
  email?: string;
  specialization?: string;
}

// ── Main component ───────────────────────────────────────────────
const AddPatient = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string; patientName?: string }>();
  const { getAccessToken, currentUser } = useAuthStore();

  const isEdit = !!params.patientId;
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // ── Field refs for sequential keyboard navigation ───────────────
  const fullNameRef       = useRef<TextInput>(null);
  const ageRef            = useRef<TextInput>(null);
  const nicRef            = useRef<TextInput>(null);
  const phoneRef          = useRef<TextInput>(null);
  const emergencyRef      = useRef<TextInput>(null);
  const addressRef        = useRef<TextInput>(null);
  const medicalRef        = useRef<TextInput>(null);

  // ── Form fields ──────────────────────────────────────────────
  const [fullName, setFullName]                   = useState("");
  const [age, setAge]                             = useState("");
  const [gender, setGender]                       = useState("");
  const [phone, setPhone]                         = useState("");
  const [province, setProvince]                   = useState("");
  const [district, setDistrict]                   = useState("");
  const [address, setAddress]                     = useState("");
  const [dateOfBirth, setDateOfBirth]             = useState("");
  const [nic, setNic]                             = useState("");
  const [emergencyContact, setEmergencyContact]   = useState("");
  const [medicalHistory, setMedicalHistory]       = useState("");
  const [assignedStaffId, setAssignedStaffId]     = useState("");
  const [assignedStaffName, setAssignedStaffName] = useState("");
  const [focused, setFocused]                     = useState<string | null>(null);

  // ── UI state ─────────────────────────────────────────────────
  const [loadingPatient, setLoadingPatient]   = useState(isEdit);
  const [saving, setSaving]                   = useState(false);
  const [staffList, setStaffList]             = useState<StaffOption[]>([]);
  const [loadingStaff, setLoadingStaff]       = useState(false);
  const [staffError, setStaffError]           = useState("");
  const [openDropdown, setOpenDropdown]       = useState<string | null>(null);

  // ── Date picker state ────────────────────────────────────────
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [pendingDate, setPendingDate]         = useState<Date>(new Date(1960, 0, 1));

  // ── Load staff list — same fetch pattern as doctor-patients ──
  const loadStaff = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingStaff(true);
    setStaffError("");

    try {
      const token = await getAccessToken();
      if (!token) { setStaffError("Not authenticated"); return; }

      // 1️⃣ Try dedicated endpoints — same order as admin dashboard
      const tryEndpoints = [
        `${API}/api/physiotherapists`,          // dashboard primary (Physios.jsx line 34)
        `${API}/api/users?role=PHYSIOTHERAPIST`,
        `${API}/api/users?role=HEALTH_CARE_STAFF`,
        `${API}/api/doctors`,
        `${API}/api/staff`,
      ];

      let found: StaffOption[] = [];

      for (const url of tryEndpoints) {
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            // Handle dashboard response key "physiotherapists" + other shapes
            const raw: any[] =
              json.physiotherapists ?? json.users ?? json.staff ?? json.doctors ??
              json.data ?? (Array.isArray(json) ? json : []);

            if (raw.length > 0) {
              found = raw.map((u: any) => ({
                _id: u._id ?? u.id ?? "",
                name:
                  u.name ??
                  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ??
                  u.email ?? "Unknown",
                email: u.email,
                specialization: u.specialization ?? u.role,
              })).filter((u) => u._id);
              break; // found a working endpoint
            }
          }
        } catch (_) {
          // try next endpoint
        }
      }

      // 2️⃣ Fallback: extract unique doctors from all-patients list
      //    This ALWAYS works because it uses the same endpoint as doctor-patients.tsx
      if (found.length === 0 && isSuperAdmin) {
        const res = await fetch(`${API}/api/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const patients: any[] = json.patients ?? json.data ?? (Array.isArray(json) ? json : []);
          const seen = new Set<string>();
          patients.forEach((p) => {
            const d = p.doctorId;
            if (d && d._id && !seen.has(d._id)) {
              seen.add(d._id);
              found.push({ _id: d._id, name: d.name ?? d.email ?? "Unknown", email: d.email });
            }
          });
        }
      }

      if (found.length === 0) {
        setStaffError("No health care staff found. Make sure staff accounts exist.");
      }

      setStaffList(found);
    } catch (err: any) {
      setStaffError("Failed to load staff list. Please try again.");
    } finally {
      setLoadingStaff(false);
    }
  }, [isAdmin, isSuperAdmin]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  // ── Load existing patient for edit mode ──────────────────────
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const res = await fetch(`${API}/api/patients/${params.patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const json = await res.json();
        const p = json.patient ?? json;

        setFullName(p.fullName ?? "");
        setAge(p.age != null ? String(p.age) : "");
        setGender(p.gender ?? "");
        setPhone(p.phone ?? "");
        setProvince(p.province ?? "");
        setDistrict(p.district ?? "");
        setAddress(p.address ?? "");
        setDateOfBirth(p.dateOfBirth ?? "");
        setNic(p.nic ?? "");
        setEmergencyContact(p.emergencyContact ?? "");
        setMedicalHistory(p.medicalHistory ?? "");

        const doc = p.doctorId;
        if (doc) {
          setAssignedStaffId(typeof doc === "string" ? doc : doc._id ?? "");
          setAssignedStaffName(typeof doc === "string" ? "" : doc.name ?? "");
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load patient details");
      } finally {
        setLoadingPatient(false);
      }
    };
    load();
  }, [params.patientId, isEdit]);

  // ── Save (same fetch pattern as patient-assessment.tsx submit) ─
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Full name is required");
      return;
    }

    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      // Build body — same as how assessments are built in patient-assessment.tsx
      const body: Record<string, any> = {};
      if (fullName)         body.fullName         = fullName.trim();
      if (age)              body.age              = Number(age);
      if (gender)           body.gender           = gender;
      if (phone)            body.phone            = phone.trim();
      if (province)         body.province         = province;
      if (district)         body.district         = district;
      if (address)          body.address          = address.trim();
      if (dateOfBirth)      body.dateOfBirth      = dateOfBirth.trim();
      if (nic)              body.nic              = nic.trim();
      if (emergencyContact) body.emergencyContact = emergencyContact.trim();
      if (medicalHistory)   body.medicalHistory   = medicalHistory.trim();
      // Assign doctor — key field the admin dashboard sets
      if (isAdmin && assignedStaffId) body.doctorId = assignedStaffId;

      const url    = isEdit ? `${API}/api/patients/${params.patientId}` : `${API}/api/patients`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message ?? errJson.error ?? `Server error ${res.status}`);
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

  const toggleDropdown = (key: string) =>
    setOpenDropdown((prev) => (prev === key ? null : key));

  // ── Loading skeleton for edit mode ───────────────────────────
  if (loadingPatient) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0E7C61" />
        <Text style={styles.centerText}>Loading patient details...</Text>
      </View>
    );
  }

  const availableDistricts = province ? (DISTRICTS[province] ?? []) : [];

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={sc(22)} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: sc(12) }}>
            <Text style={styles.headerTitle}>{isEdit ? "Edit Patient" : "Add Patient"}</Text>
            <Text style={styles.headerSub}>
              {isEdit
                ? (params.patientName || "Update patient information")
                : "Fill in patient details"}
            </Text>
          </View>
          {/* placeholder to center title */}
          <View style={{ width: sc(40) }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════════════════════════════════════════════════
            SECTION 1 — Assign Health Care Staff (Admin only)
            Uses same API as doctor-patients: /api/patients
        ══════════════════════════════════════════════════ */}
        {isAdmin && (
          <View style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="person-circle-outline" size={sc(22)} color="#0E7C61" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Assign Health Care Staff</Text>
                <Text style={styles.sectionSub}>Select the physiotherapist responsible for this patient</Text>
              </View>
            </View>

            {loadingStaff ? (
              /* Loading indicator */
              <View style={styles.staffLoadingRow}>
                <ActivityIndicator size="small" color="#0E7C61" />
                <Text style={styles.staffLoadingText}>Loading available staff...</Text>
              </View>
            ) : staffError ? (
              /* Error state with retry */
              <View style={styles.staffErrorBox}>
                <Ionicons name="warning-outline" size={sc(18)} color="#F59E0B" />
                <Text style={styles.staffErrorText}>{staffError}</Text>
                <TouchableOpacity onPress={loadStaff} style={styles.retryBtn}>
                  <Ionicons name="refresh" size={sc(14)} color="#0E7C61" />
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Staff selector */
              <>
                {/* Currently selected staff — shows assigned name */}
                {assignedStaffId ? (
                  <View style={styles.selectedStaffBox}>
                    <View style={styles.selectedStaffAvatar}>
                      <Text style={styles.selectedStaffAvatarText}>
                        {assignedStaffName.substring(0, 2).toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedStaffName}>{assignedStaffName}</Text>
                      <Text style={styles.selectedStaffLabel}>Assigned Health Care Staff</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { setAssignedStaffId(""); setAssignedStaffName(""); }}
                      style={styles.clearStaffBtn}
                    >
                      <Ionicons name="close-circle" size={sc(20)} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Super Admin — "Assign to myself" shortcut */}
                {isSuperAdmin && !assignedStaffId && (
                  <TouchableOpacity
                    style={styles.assignMyselfBtn}
                    onPress={() => {
                      setAssignedStaffId(currentUser!._id ?? currentUser!.id ?? "");
                      setAssignedStaffName(currentUser!.name ?? "Me");
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="person-circle-outline" size={sc(16)} color="#0E7C61" />
                    <Text style={styles.assignMyselfText}>Assign to Myself</Text>
                  </TouchableOpacity>
                )}

                {/* Selector button */}
                <TouchableOpacity
                  style={[styles.selectorBtn, openDropdown === "staff" && styles.selectorBtnOpen]}
                  onPress={() => toggleDropdown("staff")}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="person-outline"
                    size={sc(18)}
                    color={assignedStaffId ? "#0E7C61" : "#aaa"}
                    style={{ marginRight: sc(8) }}
                  />
                  <Text style={[styles.selectorBtnText, !assignedStaffId && { color: "#aaa" }]}>
                    {assignedStaffId
                      ? `Change (${staffList.length} available)`
                      : `Select from ${staffList.length} staff member${staffList.length !== 1 ? "s" : ""}`}
                  </Text>
                  <Ionicons
                    name={openDropdown === "staff" ? "chevron-up" : "chevron-down"}
                    size={sc(18)} color="#888"
                  />
                </TouchableOpacity>

                {/* Dropdown list */}
                {openDropdown === "staff" && (
                  <View style={styles.dropdown}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Super Admin — "Myself" as first option in list */}
                    {isSuperAdmin && currentUser && (
                      <TouchableOpacity
                        style={[
                          styles.dropdownRow,
                          assignedStaffId === (currentUser._id ?? currentUser.id) && styles.dropdownRowActive,
                          styles.dropdownRowSelf,
                        ]}
                        onPress={() => {
                          setAssignedStaffId(currentUser._id ?? currentUser.id ?? "");
                          setAssignedStaffName(currentUser.name ?? "Me");
                          setOpenDropdown(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.dropdownAvatar, { backgroundColor: "#0E7C61" }]}>
                          <Text style={[styles.dropdownAvatarText, { color: "#fff" }]}>
                            {(currentUser.name ?? "Me").substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: sc(6) }}>
                            <Text style={[styles.dropdownName, { color: "#0E7C61" }]}>
                              {currentUser.name ?? "Me"}
                            </Text>
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          </View>
                          <Text style={styles.dropdownSub}>Super Admin · Assign to yourself</Text>
                        </View>
                        {assignedStaffId === (currentUser._id ?? currentUser.id) && (
                          <Ionicons name="checkmark-circle" size={sc(20)} color="#0E7C61" />
                        )}
                      </TouchableOpacity>
                    )}

                    {staffList.map((s) => {
                      const isSelected = assignedStaffId === s._id;
                      return (
                        <TouchableOpacity
                          key={s._id}
                          style={[styles.dropdownRow, isSelected && styles.dropdownRowActive]}
                          onPress={() => {
                            setAssignedStaffId(s._id);
                            setAssignedStaffName(s.name);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.dropdownAvatar, isSelected && { backgroundColor: "#0E7C61" }]}>
                            <Text style={[styles.dropdownAvatarText, isSelected && { color: "#fff" }]}>
                              {s.name.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.dropdownName, isSelected && { color: "#0E7C61" }]}>
                              {s.name}
                            </Text>
                            {s.specialization || s.email ? (
                              <Text style={styles.dropdownSub} numberOfLines={1}>
                                {s.specialization || s.email}
                              </Text>
                            ) : null}
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={sc(20)} color="#0E7C61" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════
            SECTION 2 — Basic Information
        ══════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="person-outline" size={sc(22)} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <Text style={styles.fieldLabel}>Full Name <Text style={{ color: "#ef4444" }}>*</Text></Text>
          <TextInput
            ref={fullNameRef}
            style={[styles.input, focused === "fullName" && styles.inputFocused]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Patient's full name"
            placeholderTextColor="#bbb"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => ageRef.current?.focus()}
            onFocus={() => setFocused("fullName")}
            onBlur={() => setFocused(null)}
            submitBehavior="submit"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                ref={ageRef}
                style={[styles.input, focused === "age" && styles.inputFocused]}
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 72"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => nicRef.current?.focus()}
                onFocus={() => setFocused("age")}
                onBlur={() => setFocused(null)}
                submitBehavior="submit"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              {/* Calendar date picker button */}
              <TouchableOpacity
                style={[styles.input, styles.dateBtn]}
                onPress={() => {
                  if (dateOfBirth) {
                    const parsed = new Date(dateOfBirth);
                    if (!isNaN(parsed.getTime())) setPendingDate(parsed);
                  }
                  setShowDatePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={sc(16)}
                  color={dateOfBirth ? "#0E7C61" : "#bbb"}
                />
                <Text style={[styles.dateBtnText, !dateOfBirth && { color: "#bbb" }]}>
                  {dateOfBirth || "Select date"}
                </Text>
                {dateOfBirth ? (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); setDateOfBirth(""); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={sc(16)} color="#ef4444" />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Date Picker — Android native dialog / iOS modal spinner ── */}
          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={pendingDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={(event, selected) => {
                setShowDatePicker(false);
                if (event.type !== "dismissed" && selected) {
                  setPendingDate(selected);
                  setDateOfBirth(selected.toISOString().split("T")[0]);
                }
              }}
            />
          )}
          {showDatePicker && Platform.OS === "ios" && (
            <Modal transparent animationType="slide" visible>
              <View style={styles.dateModalOverlay}>
                <View style={styles.dateModalCard}>
                  <View style={styles.dateModalToolbar}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateModalTitle}>Date of Birth</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setDateOfBirth(pendingDate.toISOString().split("T")[0]);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={styles.dateModalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pendingDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={(_, selected) => { if (selected) setPendingDate(selected); }}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Gender dropdown */}
          <Text style={styles.fieldLabel}>Gender</Text>
          <TouchableOpacity
            style={[styles.selectorBtn, openDropdown === "gender" && styles.selectorBtnOpen]}
            onPress={() => toggleDropdown("gender")}
          >
            <Text style={[styles.selectorBtnText, !gender && { color: "#aaa" }]}>
              {gender || "Select gender"}
            </Text>
            <Ionicons name={openDropdown === "gender" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openDropdown === "gender" && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.dropdownRow, gender === g && styles.dropdownRowActive]}
                  onPress={() => { setGender(g); setOpenDropdown(null); }}
                >
                  <Text style={[styles.dropdownName, gender === g && { color: "#0E7C61" }]}>{g}</Text>
                  {gender === g && <Ionicons name="checkmark-circle" size={sc(18)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.fieldLabel}>NIC / ID Number</Text>
          <TextInput
            ref={nicRef}
            style={[styles.input, focused === "nic" && styles.inputFocused]}
            value={nic}
            onChangeText={setNic}
            placeholder="e.g. 881234567V"
            placeholderTextColor="#bbb"
            autoCapitalize="characters"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            onFocus={() => setFocused("nic")}
            onBlur={() => setFocused(null)}
            submitBehavior="submit"
          />
        </View>

        {/* ══════════════════════════════════════════════════
            SECTION 3 — Contact
        ══════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="call-outline" size={sc(22)} color="#E65100" />
            </View>
            <Text style={styles.sectionTitle}>Contact Details</Text>
          </View>

          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            ref={phoneRef}
            style={[styles.input, focused === "phone" && styles.inputFocused]}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 0711234567"
            placeholderTextColor="#bbb"
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => emergencyRef.current?.focus()}
            onFocus={() => setFocused("phone")}
            onBlur={() => setFocused(null)}
            submitBehavior="submit"
          />

          <Text style={styles.fieldLabel}>Emergency Contact</Text>
          <TextInput
            ref={emergencyRef}
            style={[styles.input, focused === "emergency" && styles.inputFocused]}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Name and phone number"
            placeholderTextColor="#bbb"
            returnKeyType="next"
            onSubmitEditing={() => addressRef.current?.focus()}
            onFocus={() => setFocused("emergency")}
            onBlur={() => setFocused(null)}
            submitBehavior="submit"
          />
        </View>

        {/* ══════════════════════════════════════════════════
            SECTION 4 — Location
        ══════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FCE4EC" }]}>
              <Ionicons name="location-outline" size={sc(22)} color="#C62828" />
            </View>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          {/* Province */}
          <Text style={styles.fieldLabel}>Province</Text>
          <TouchableOpacity
            style={[styles.selectorBtn, openDropdown === "province" && styles.selectorBtnOpen]}
            onPress={() => toggleDropdown("province")}
          >
            <Text style={[styles.selectorBtnText, !province && { color: "#aaa" }]}>
              {province || "Select province"}
            </Text>
            <Ionicons name={openDropdown === "province" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openDropdown === "province" && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {PROVINCES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.dropdownRow, province === p && styles.dropdownRowActive]}
                  onPress={() => { setProvince(p); setDistrict(""); setOpenDropdown(null); }}
                >
                  <Text style={[styles.dropdownName, province === p && { color: "#0E7C61" }]}>{p}</Text>
                  {province === p && <Ionicons name="checkmark-circle" size={sc(18)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
              </ScrollView>
            </View>
          )}

          {/* District */}
          <Text style={styles.fieldLabel}>District</Text>
          <TouchableOpacity
            style={[
              styles.selectorBtn,
              !province && { opacity: 0.5 },
              openDropdown === "district" && styles.selectorBtnOpen,
            ]}
            onPress={() => { if (province) toggleDropdown("district"); }}
            activeOpacity={province ? 0.7 : 1}
          >
            <Text style={[styles.selectorBtnText, !district && { color: "#aaa" }]}>
              {district || (province ? "Select district" : "Select province first")}
            </Text>
            <Ionicons name={openDropdown === "district" ? "chevron-up" : "chevron-down"} size={sc(18)} color="#888" />
          </TouchableOpacity>
          {openDropdown === "district" && availableDistricts.length > 0 && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {availableDistricts.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dropdownRow, district === d && styles.dropdownRowActive]}
                  onPress={() => { setDistrict(d); setOpenDropdown(null); }}
                >
                  <Text style={[styles.dropdownName, district === d && { color: "#0E7C61" }]}>{d}</Text>
                  {district === d && <Ionicons name="checkmark-circle" size={sc(18)} color="#0E7C61" />}
                </TouchableOpacity>
              ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.fieldLabel}>Full Address</Text>
          <TextInput
            ref={addressRef}
            style={[styles.input, focused === "address" && styles.inputFocused, { minHeight: sc(60), textAlignVertical: "top" }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city"
            placeholderTextColor="#bbb"
            multiline
            returnKeyType="next"
            onSubmitEditing={() => medicalRef.current?.focus()}
            onFocus={() => setFocused("address")}
            onBlur={() => setFocused(null)}
          />
        </View>

        {/* ══════════════════════════════════════════════════
            SECTION 5 — Medical History
        ══════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="medkit-outline" size={sc(22)} color="#7C3AED" />
            </View>
            <Text style={styles.sectionTitle}>Medical History</Text>
          </View>

          <Text style={styles.fieldLabel}>Known Conditions / Notes</Text>
          <TextInput
            ref={medicalRef}
            style={[styles.input, focused === "medical" && styles.inputFocused, { minHeight: sc(90), textAlignVertical: "top" }]}
            value={medicalHistory}
            onChangeText={setMedicalHistory}
            placeholder="e.g. Hypertension, Diabetes Type 2, previous surgeries..."
            placeholderTextColor="#bbb"
            multiline
            returnKeyType="done"
            onFocus={() => setFocused("medical")}
            onBlur={() => setFocused(null)}
          />
        </View>

        {/* ══════════════════════════════════════════════════
            SUBMIT BUTTON — same gradient style as assessment
        ══════════════════════════════════════════════════ */}
        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.65 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.submitGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={isEdit ? "save-outline" : "person-add-outline"}
                  size={sc(22)} color="#fff"
                />
                <Text style={styles.submitText}>
                  {isEdit ? "Save Changes" : "Add Patient"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: vs(50) }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: sc(12) },
  centerText: { fontSize: sc(14), color: "#888", fontFamily: "Poppins-Regular" },

  // Header — identical to doctor-patients & patient-assessment
  header: {
    paddingTop: Platform.OS === "ios" ? vs(54) : vs(42),
    paddingHorizontal: sc(16),
    paddingBottom: sc(18),
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: sc(40), height: sc(40), borderRadius: sc(12),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: sc(20), fontFamily: "Poppins-Bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: sc(12), fontFamily: "Poppins-Regular", marginTop: 2 },

  scrollContent: { padding: sc(16) },

  // Card section — identical to patient-assessment domain cards
  section: {
    backgroundColor: "#fff",
    borderRadius: sc(16),
    padding: sc(16),
    marginBottom: sc(14),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    gap: sc(10), marginBottom: sc(14),
  },
  sectionIcon: {
    width: sc(40), height: sc(40), borderRadius: sc(12),
    justifyContent: "center", alignItems: "center",
  },
  sectionTitle: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222" },
  sectionSub: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#888", marginTop: 2 },

  fieldLabel: {
    fontSize: sc(13), fontFamily: "Poppins-Medium", color: "#555",
    marginBottom: sc(6), marginTop: sc(12),
  },
  input: {
    backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(10), paddingHorizontal: sc(14), paddingVertical: sc(11),
    fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333",
  },
  inputFocused: {
    borderColor: "#0E7C61",
    backgroundColor: "#f0faf6",
  },
  row: { flexDirection: "row", gap: sc(12) },

  // Generic selector / dropdown — mirrors the StatusChips pattern
  selectorBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(10), paddingHorizontal: sc(14), paddingVertical: sc(13),
    marginTop: sc(2),
  },
  selectorBtnOpen: { borderColor: "#0E7C61", backgroundColor: "#f0faf6" },
  selectorBtnText: { flex: 1, fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333" },

  dropdown: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(12), marginTop: sc(4), overflow: "hidden",
    maxHeight: sc(280),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  dropdownRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: sc(14),
    paddingVertical: sc(13), borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
    gap: sc(10),
  },
  dropdownRowActive: { backgroundColor: "#f0faf6" },
  dropdownAvatar: {
    width: sc(34), height: sc(34), borderRadius: sc(17),
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center",
  },
  dropdownAvatarText: { fontSize: sc(12), fontFamily: "Poppins-Bold", color: "#0E7C61" },
  dropdownName: { fontSize: sc(14), fontFamily: "Poppins-SemiBold", color: "#222" },
  dropdownSub: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#888", marginTop: 1 },

  // Staff section specifics
  staffLoadingRow: {
    flexDirection: "row", alignItems: "center", gap: sc(10),
    paddingVertical: sc(14), paddingHorizontal: sc(4),
  },
  staffLoadingText: { fontSize: sc(13), fontFamily: "Poppins-Regular", color: "#888" },

  staffErrorBox: {
    backgroundColor: "#FFFBEB", borderRadius: sc(10), padding: sc(12),
    borderWidth: 1, borderColor: "#FDE68A",
    flexDirection: "row", alignItems: "flex-start", gap: sc(8), flexWrap: "wrap",
  },
  staffErrorText: {
    fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#92400E", flex: 1,
  },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: sc(4),
    backgroundColor: "#E8F5E9", borderRadius: sc(8),
    paddingHorizontal: sc(10), paddingVertical: sc(5), marginTop: sc(6),
  },
  retryBtnText: { fontSize: sc(12), fontFamily: "Poppins-SemiBold", color: "#0E7C61" },

  selectedStaffBox: {
    flexDirection: "row", alignItems: "center", gap: sc(12),
    backgroundColor: "#f0faf6", borderRadius: sc(12), padding: sc(12),
    borderWidth: 1.5, borderColor: "#0E7C61", marginBottom: sc(8),
  },
  selectedStaffAvatar: {
    width: sc(40), height: sc(40), borderRadius: sc(20),
    backgroundColor: "#0E7C61", justifyContent: "center", alignItems: "center",
  },
  selectedStaffAvatarText: { fontSize: sc(15), fontFamily: "Poppins-Bold", color: "#fff" },
  selectedStaffName: { fontSize: sc(14), fontFamily: "Poppins-SemiBold", color: "#0E7C61" },
  selectedStaffLabel: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#888", marginTop: 1 },
  clearStaffBtn: { padding: sc(4) },

  // Submit — identical to patient-assessment submitBtn
  submitBtn: { marginTop: sc(8) },
  submitGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: sc(8), paddingVertical: sc(16), borderRadius: sc(16),
  },
  submitText: { color: "#fff", fontSize: sc(17), fontFamily: "Poppins-Bold" },

  // "Assign to myself" shortcut — Super Admin only
  assignMyselfBtn: {
    flexDirection: "row", alignItems: "center", gap: sc(8),
    backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#A7F3D0",
    borderRadius: sc(10), paddingHorizontal: sc(14), paddingVertical: sc(10),
    marginBottom: sc(8),
  },
  assignMyselfText: {
    fontSize: sc(13), fontFamily: "Poppins-SemiBold", color: "#0E7C61", flex: 1,
  },

  // "Myself" row inside the dropdown
  dropdownRowSelf: {
    backgroundColor: "#F0FDF4", borderBottomWidth: 1.5, borderBottomColor: "#A7F3D0",
  },
  youBadge: {
    backgroundColor: "#0E7C61", borderRadius: sc(6),
    paddingHorizontal: sc(6), paddingVertical: sc(1),
  },
  youBadgeText: {
    fontSize: sc(9), fontFamily: "Poppins-Bold", color: "#fff", letterSpacing: 0.5,
  },

  // Date picker button (replaces plain TextInput for dateOfBirth)
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: sc(8), paddingVertical: sc(11),
  },
  dateBtnText: {
    flex: 1, fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333",
  },

  // iOS date picker modal
  dateModalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end",
  },
  dateModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: sc(20), borderTopRightRadius: sc(20),
    paddingBottom: vs(28),
  },
  dateModalToolbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: sc(20), paddingVertical: sc(14),
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  dateModalTitle: {
    fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222",
  },
  dateModalCancel: {
    fontSize: sc(15), fontFamily: "Poppins-Regular", color: "#888",
  },
  dateModalDone: {
    fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#0E7C61",
  },
});

export default AddPatient;
