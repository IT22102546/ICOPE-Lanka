import React, { useEffect, useRef, useState } from "react";
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

// Same API base as all other screens
const API = process.env.EXPO_PUBLIC_API_KEY;

// ── Main Component ────────────────────────────────────────────────
const AddStaff = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    staffId?: string;
    staffName?: string;
    staffEmail?: string;
  }>();
  const { getAccessToken } = useAuthStore();

  const isEdit = !!params.staffId;

  // ── Field refs for sequential keyboard navigation ───────────────
  const nameRef     = useRef<TextInput>(null);
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  // ── Form state (matches dashboard: name, email, password) ───────
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [focused, setFocused]                 = useState<string | null>(null);

  // ── Pre-fill from navigation params (edit mode) ─────────────────
  useEffect(() => {
    if (!isEdit) return;

    // Fast path: use params passed from teachers.tsx list screen
    if (params.staffName) {
      setName(params.staffName);
      if (params.staffEmail) setEmail(params.staffEmail);
      return;
    }

    // Fallback: fetch from API if params missing
    const load = async () => {
      setLoading(true);
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(`${API}/api/physiotherapists/${params.staffId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const s = data.physiotherapist || data.user || data;
          setName(s.name || "");
          setEmail(s.email || "");
        }
      } catch (_) {
        // silently ignore — form stays blank
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.staffId, isEdit]);

  // ── Validation ──────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!name.trim())  return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
    if (!isEdit) {
      if (!password)            return "Password is required";
      if (password.length < 8)  return "Password must be at least 8 characters";
      if (password !== confirmPassword) return "Passwords do not match";
    } else if (password) {
      if (password.length < 8)  return "New password must be at least 8 characters";
      if (password !== confirmPassword) return "Passwords do not match";
    }
    return null;
  };

  // ── Save — exact same body as admin dashboard ──────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert("Validation", err); return; }

    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      // Body matches dashboard exactly: { name, email, password }
      const body: Record<string, any> = {
        name:  name.trim(),
        email: email.trim().toLowerCase(),
      };
      if (!isEdit)        body.password = password;
      if (isEdit && password) body.password = password;

      // Create:  POST /api/auth/register-physiotherapist  (dashboard line 66)
      // Edit:    PUT  /api/physiotherapists/:id           (dashboard line 118)
      const url    = isEdit
        ? `${API}/api/physiotherapists/${params.staffId}`
        : `${API}/api/auth/register-physiotherapist`;
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Server error ${res.status}`);
      }

      Alert.alert(
        "Success",
        isEdit
          ? "Health care staff updated successfully"
          : "Health care staff account created successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Header ── */}
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
                ? (params.staffName || "Update staff information")
                : "Register a new health care staff member"}
            </Text>
          </View>
          {/* Mirror backBtn width for centering */}
          <View style={[styles.backBtn, { backgroundColor: "transparent" }]} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════════════════════════════════════════════
            SECTION 1 — Account Info (name + email)
            Matches dashboard "Create Physiotherapist Account" modal
        ══════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="person-outline" size={sc(20)} color="#1565C0" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <Text style={styles.sectionSub}>Name and email for the staff member</Text>
            </View>
          </View>

          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            ref={nameRef}
            style={[styles.input, focused === "name" && styles.inputFocused]}
            value={name}
            onChangeText={setName}
            placeholder="Dr. Amara Perera"
            placeholderTextColor="#bbb"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            submitBehavior="submit"
          />

          <Text style={styles.label}>
            Work Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            ref={emailRef}
            style={[styles.input, focused === "email" && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholder="amara@clinic.lk"
            placeholderTextColor="#bbb"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            submitBehavior="submit"
          />
        </View>

        {/* ══════════════════════════════════════════════
            SECTION 2 — Password
            Required for new accounts; optional in edit mode
        ══════════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="lock-closed-outline" size={sc(20)} color="#E65100" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>
                {isEdit ? "Change Password" : "Temporary Password"}
              </Text>
              <Text style={styles.sectionSub}>
                {isEdit
                  ? "Leave blank to keep the current password"
                  : "Staff member should change this after first login"}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            {isEdit ? "New Password" : "Password"}
            {!isEdit && <Text style={styles.required}> *</Text>}
          </Text>
          <View style={[styles.passwordRow, focused === "password" && styles.passwordRowFocused]}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: "transparent" }]}
              value={password}
              onChangeText={setPassword}
              placeholder={isEdit ? "Leave blank to keep current" : "Minimum 8 characters"}
              placeholderTextColor="#bbb"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              submitBehavior="submit"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={sc(20)} color="#888"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            Confirm Password
            {!isEdit && <Text style={styles.required}> *</Text>}
          </Text>
          <View style={[styles.passwordRow, focused === "confirm" && styles.passwordRowFocused]}>
            <TextInput
              ref={confirmRef}
              style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: "transparent" }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor="#bbb"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              onFocus={() => setFocused("confirm")}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? "eye-off-outline" : "eye-outline"}
                size={sc(20)} color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* Live mismatch warning */}
          {password && confirmPassword && password !== confirmPassword && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={sc(14)} color="#EF4444" />
              <Text style={styles.errorText}>Passwords do not match</Text>
            </View>
          )}

          {/* Password strength hint */}
          {password.length > 0 && password.length < 8 && (
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={sc(14)} color="#F59E0B" />
              <Text style={styles.hintText}>
                {8 - password.length} more character{8 - password.length !== 1 ? "s" : ""} needed
              </Text>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════
            SAVE / CREATE BUTTON
        ══════════════════════════════════════════════ */}
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
                  {isEdit ? "Save Changes" : "Create Account"}
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

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#f5f7fa" },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", gap: sc(12) },
  loadingText: { fontSize: sc(14), color: "#666", fontFamily: "Poppins-Regular" },

  header: {
    paddingTop: Platform.OS === "ios" ? vs(54) : vs(42),
    paddingHorizontal: sc(16),
    paddingBottom: sc(20),
  },
  headerRow:    { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: sc(40), height: sc(40), borderRadius: sc(12),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  headerCenter: { flex: 1, marginHorizontal: sc(12) },
  headerTitle:  { color: "#fff", fontSize: sc(19), fontFamily: "Poppins-Bold" },
  headerSub:    {
    color: "rgba(255,255,255,0.8)", fontSize: sc(12),
    fontFamily: "Poppins-Regular", marginTop: 2,
  },

  scrollContent: { padding: sc(16) },

  section: {
    backgroundColor: "#fff",
    borderRadius: sc(16),
    padding: sc(16),
    marginBottom: sc(14),
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "flex-start",
    gap: sc(10), marginBottom: sc(14),
  },
  sectionIcon: {
    width: sc(38), height: sc(38), borderRadius: sc(10),
    justifyContent: "center", alignItems: "center",
    marginTop: 2,
  },
  sectionTitle: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222" },
  sectionSub:   { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#888", marginTop: 2 },

  label:    {
    fontSize: sc(13), fontFamily: "Poppins-Medium",
    color: "#555", marginBottom: sc(6), marginTop: sc(12),
  },
  required: { color: "#EF4444" },

  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(10),
    paddingHorizontal: sc(14), paddingVertical: sc(12),
    fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333",
  },
  inputFocused: {
    borderColor: "#1565C0",
    backgroundColor: "#EFF6FF",
  },

  passwordRow: {
    flexDirection: "row", alignItems: "center", gap: sc(8),
    backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: sc(10),
  },
  passwordRowFocused: {
    borderColor: "#1565C0",
    backgroundColor: "#EFF6FF",
  },
  eyeBtn: {
    width: sc(46), height: sc(46), borderRadius: sc(10),
    backgroundColor: "#f8f9fa",
    borderWidth: 1, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
  },

  errorRow: {
    flexDirection: "row", alignItems: "center", gap: sc(6),
    marginTop: sc(6),
  },
  errorText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#EF4444" },

  hintRow: {
    flexDirection: "row", alignItems: "center", gap: sc(6),
    marginTop: sc(6),
  },
  hintText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#F59E0B" },

  saveBtn: { marginTop: sc(8) },
  saveBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: sc(10), paddingVertical: sc(16), borderRadius: sc(16),
  },
  saveBtnText: { color: "#fff", fontSize: sc(16), fontFamily: "Poppins-Bold" },
});

export default AddStaff;
