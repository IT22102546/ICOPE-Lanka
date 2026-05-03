import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";

const { width: screenWidth } = Dimensions.get("window");
const sc = (n: number) => Math.round((screenWidth / 390) * n);
const API = process.env.EXPO_PUBLIC_API_KEY;

const TXT: Record<string, { en: string; si: string }> = {
  brand:          { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  myPatients:     { en: "My Patients", si: "මගේ රෝගීන්" },
  allPatients:    { en: "All Patients", si: "සියලුම රෝගීන්" },
  search:         { en: "Search patients...", si: "රෝගීන් සොයන්න..." },
  noPatients:     { en: "No patients found", si: "රෝගීන් හමු නොවීය" },
  noResult:       { en: "Try adjusting your search or add a new patient", si: "ඔබේ සෙවීම නැවත උත්සාහ කරන්න" },
  assess:         { en: "ICOPE Assessment", si: "ICOPE තක්සේරුව" },
  age:            { en: "Age", si: "වයස" },
  phone:          { en: "Phone", si: "දුරකථන" },
  assignedTo:     { en: "Assigned to", si: "පවරා ඇත" },
  signOut:        { en: "Sign Out", si: "පිටවීම" },
  confirmSignOut: { en: "Are you sure you want to sign out?", si: "ඔබට පිටවීමට අවශ්‍ය බව විශ්වාසද?" },
  cancel:         { en: "Cancel", si: "අවලංගු කරන්න" },
  patients:       { en: "Patients", si: "රෝගීන්" },
  addPatient:     { en: "Add Patient", si: "රෝගියා එකතු කරන්න" },
  editPatient:    { en: "Edit Patient", si: "රෝගියා සංස්කරණය" },
  deletePatient:  { en: "Delete Patient", si: "රෝගියා ඉවත් කරන්න" },
  confirmDelete:  { en: "Are you sure you want to delete this patient? This cannot be undone.", si: "ඔබට මෙම රෝගියා මකා දැමීමට අවශ්‍ය බව විශ්වාසද?" },
  delete:         { en: "Delete", si: "මකන්න" },
  viewAssessment: { en: "View Assessment", si: "තක්සේරුව බලන්න" },
  actions:        { en: "Patient Actions", si: "රෝගී ක්‍රියාවන්" },
  totalPatients:  { en: "Total", si: "මුළු" },
  malePatients:   { en: "Male", si: "පිරිමි" },
  femalePatients: { en: "Female", si: "ගැහැණු" },
};

interface Patient {
  _id: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  province?: string;
  district?: string;
  address?: string;
  doctorId?: { _id: string; name: string; email: string };
}

const DoctorPatients = () => {
  const router = useRouter();
  const { currentUser, getAccessToken, signOut } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMine, setShowMine] = useState(true);
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<"en" | "si">("en");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  const t = (key: string) => TXT[key]?.[lang] ?? key;
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const fetchPatients = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const mineParam = isSuperAdmin && !showMine ? "" : "?mine=true";
      const res = await fetch(`${API}/api/patients${mineParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err: any) {
      console.error("Fetch patients error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showMine, isSuperAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchPatients();
  }, [fetchPatients]);

  const filtered = patients.filter((p) =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.district?.toLowerCase().includes(search.toLowerCase())
  );

  const maleCount = filtered.filter((p) => p.gender === "Male").length;
  const femaleCount = filtered.filter((p) => p.gender === "Female").length;

  const handleSignOut = () => {
    Alert.alert(t("signOut"), t("confirmSignOut"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"), style: "destructive",
        onPress: async () => { await signOut(); router.replace("/(auth)/selectSignIn"); },
      },
    ]);
  };

  const openActionModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setActionModalVisible(true);
  };

  const handleDelete = () => {
    if (!selectedPatient) return;
    Alert.alert(t("deletePatient"), t("confirmDelete"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"), style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            const token = await getAccessToken();
            const res = await fetch(`${API}/api/patients/${selectedPatient._id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Delete failed");
            setActionModalVisible(false);
            setSelectedPatient(null);
            fetchPatients();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete patient");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const initials = item.fullName
      ?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "?";
    const genderColor = item.gender === "Male" ? "#3B82F6" : item.gender === "Female" ? "#EC4899" : "#6B7280";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: "/(root)/(screens)/patient-assessment",
          params: { patientId: item._id, patientName: item.fullName },
        })}
        onLongPress={() => openActionModal(item)}
        delayLongPress={400}
      >
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: genderColor + "20" }]}>
            <Text style={[styles.avatarText, { color: genderColor }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.patientName} numberOfLines={1}>{item.fullName}</Text>
            <View style={styles.detailRow}>
              {item.age != null && (
                <View style={styles.chip}>
                  <Ionicons name="calendar-outline" size={sc(11)} color="#666" />
                  <Text style={styles.chipText}>{t("age")}: {item.age}</Text>
                </View>
              )}
              {item.gender && (
                <View style={[styles.chip, { backgroundColor: genderColor + "15" }]}>
                  <Text style={[styles.chipText, { color: genderColor }]}>{item.gender}</Text>
                </View>
              )}
            </View>
            {item.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={sc(11)} color="#888" />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
            )}
            {item.district && item.province && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={sc(11)} color="#888" />
                <Text style={styles.detailText}>{item.district}, {item.province}</Text>
              </View>
            )}
            {isSuperAdmin && !showMine && item.doctorId?.name && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={sc(11)} color="#0E7C61" />
                <Text style={[styles.detailText, { color: "#0E7C61" }]}>{t("assignedTo")}: {item.doctorId.name}</Text>
              </View>
            )}
          </View>

          {/* Action menu */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.assessBtn}
              onPress={() => router.push({
                pathname: "/(root)/(screens)/patient-assessment",
                params: { patientId: item._id, patientName: item.fullName },
              })}
            >
              <Ionicons name="clipboard-outline" size={sc(18)} color="#0E7C61" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.assessBtn, { marginTop: sc(4), backgroundColor: "#F3F4F6" }]}
              onPress={() => openActionModal(item)}
            >
              <Ionicons name="ellipsis-vertical" size={sc(16)} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brandText}>{t("brand")}</Text>
            <Text style={styles.welcomeName}>{currentUser?.name || "Health Care Staff"}</Text>
            <Text style={styles.roleLabel}>
              {currentUser?.role === "SUPER_ADMIN" ? "Super Admin" : currentUser?.role === "ADMIN" ? "Admin" : "Health Care Staff"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.iconBtn}>
              <Ionicons name="language-outline" size={sc(18)} color="#fff" />
              <Text style={styles.iconBtnLabel}>{lang === "en" ? "සිං" : "EN"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(root)/(screens)/add-patient")}
              style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.3)" }]}
            >
              <Ionicons name="person-add-outline" size={sc(18)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={sc(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{filtered.length}</Text>
            <Text style={styles.statLabel}>{t("totalPatients")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#93C5FD" }]}>{maleCount}</Text>
            <Text style={styles.statLabel}>{t("malePatients")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#F9A8D4" }]}>{femaleCount}</Text>
            <Text style={styles.statLabel}>{t("femalePatients")}</Text>
          </View>
        </View>

        {/* Super admin toggle */}
        {isSuperAdmin && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, showMine && styles.toggleActive]}
              onPress={() => setShowMine(true)}
            >
              <Ionicons name="person" size={sc(15)} color={showMine ? "#0E7C61" : "#fff"} />
              <Text style={[styles.toggleText, showMine && styles.toggleTextActive]}>{t("myPatients")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !showMine && styles.toggleActive]}
              onPress={() => setShowMine(false)}
            >
              <Ionicons name="people" size={sc(15)} color={!showMine ? "#0E7C61" : "#fff"} />
              <Text style={[styles.toggleText, !showMine && styles.toggleTextActive]}>{t("allPatients")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={sc(18)} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder={t("search")}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={sc(18)} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count + hint */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} {t("patients")}</Text>
        <Text style={styles.hintText}>Long press to edit or delete</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0E7C61" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={sc(56)} color="#ccc" />
          <Text style={styles.emptyTitle}>{t("noPatients")}</Text>
          <Text style={styles.emptyDesc}>{t("noResult")}</Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => router.push("/(root)/(screens)/add-patient")}
          >
            <Ionicons name="person-add-outline" size={sc(18)} color="#fff" />
            <Text style={styles.addFirstBtnText}>{t("addPatient")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderPatientCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchPatients(); }}
              tintColor="#0E7C61"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — expanded overlay backdrop */}
      {fabExpanded && (
        <TouchableOpacity
          style={styles.fabBackdrop}
          activeOpacity={1}
          onPress={() => setFabExpanded(false)}
        />
      )}

      {/* FAB — expandable menu for Admin/Super Admin */}
      <View style={styles.fabContainer}>
        {fabExpanded && (
          <>
            {/* Add Staff option (Super Admin only) */}
            {isSuperAdmin && (
              <TouchableOpacity
                style={styles.fabMenuItem}
                onPress={() => { setFabExpanded(false); router.push("/(root)/(screens)/add-staff"); }}
                activeOpacity={0.85}
              >
                <View style={styles.fabMenuLabel}>
                  <Text style={styles.fabMenuLabelText}>Add Health Care Staff</Text>
                </View>
                <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.fabMenuBtn}>
                  <Ionicons name="medkit" size={sc(20)} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Add Patient option */}
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setFabExpanded(false); router.push("/(root)/(screens)/add-patient"); }}
              activeOpacity={0.85}
            >
              <View style={styles.fabMenuLabel}>
                <Text style={styles.fabMenuLabelText}>Add Patient</Text>
              </View>
              <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.fabMenuBtn}>
                <Ionicons name="person-add" size={sc(20)} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Main FAB button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (isAdmin) {
              setFabExpanded(!fabExpanded);
            } else {
              router.push("/(root)/(screens)/add-patient");
            }
          }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.fabGradient}>
            <Ionicons name={fabExpanded ? "close" : "add"} size={sc(28)} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Patient Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionSheet}>
            {/* Patient info header */}
            {selectedPatient && (
              <View style={styles.actionSheetHeader}>
                <View style={styles.actionSheetAvatar}>
                  <Text style={styles.actionSheetAvatarText}>
                    {selectedPatient.fullName?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.actionSheetName}>{selectedPatient.fullName}</Text>
                  <Text style={styles.actionSheetSub}>
                    {[selectedPatient.age ? `Age ${selectedPatient.age}` : null, selectedPatient.gender, selectedPatient.district].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.actionSheetTitle}>{t("actions")}</Text>

            {/* View Assessment */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionModalVisible(false);
                router.push({
                  pathname: "/(root)/(screens)/patient-assessment",
                  params: { patientId: selectedPatient!._id, patientName: selectedPatient!.fullName },
                });
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="clipboard-outline" size={sc(20)} color="#0E7C61" />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionLabel}>{t("viewAssessment")}</Text>
                <Text style={styles.actionSub}>Start or view ICOPE assessment</Text>
              </View>
              <Ionicons name="chevron-forward" size={sc(18)} color="#ccc" />
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionModalVisible(false);
                router.push({
                  pathname: "/(root)/(screens)/add-patient",
                  params: { patientId: selectedPatient!._id, patientName: selectedPatient!.fullName },
                });
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="create-outline" size={sc(20)} color="#2563EB" />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionLabel}>{t("editPatient")}</Text>
                <Text style={styles.actionSub}>Update patient information</Text>
              </View>
              <Ionicons name="chevron-forward" size={sc(18)} color="#ccc" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomWidth: 0 }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Ionicons name="trash-outline" size={sc(20)} color="#DC2626" />
                )}
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={[styles.actionLabel, { color: "#DC2626" }]}>{t("deletePatient")}</Text>
                <Text style={styles.actionSub}>Permanently remove this patient</Text>
              </View>
            </TouchableOpacity>

            {/* Add Staff shortcut for Super Admin */}
            {isSuperAdmin && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setActionModalVisible(false);
                  router.push("/(root)/(screens)/add-staff");
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
                  <Ionicons name="medkit-outline" size={sc(20)} color="#1565C0" />
                </View>
                <View style={styles.actionTextBlock}>
                  <Text style={styles.actionLabel}>Add Health Care Staff</Text>
                  <Text style={styles.actionSub}>Register a new staff member</Text>
                </View>
                <Ionicons name="chevron-forward" size={sc(18)} color="#ccc" />
              </TouchableOpacity>
            )}

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelAction}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.cancelActionText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: { paddingTop: Platform.OS === "ios" ? 54 : 42, paddingHorizontal: sc(20), paddingBottom: sc(16) },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandText: { color: "rgba(255,255,255,0.75)", fontSize: sc(12), fontFamily: "Poppins-Medium" },
  welcomeName: { color: "#fff", fontSize: sc(20), fontFamily: "Poppins-Bold", marginTop: 2 },
  roleLabel: { color: "rgba(255,255,255,0.7)", fontSize: sc(11), fontFamily: "Poppins-Regular", marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: sc(8) },
  iconBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: sc(10), paddingVertical: sc(6), borderRadius: sc(16), gap: sc(4) },
  iconBtnLabel: { color: "#fff", fontSize: sc(11), fontFamily: "Poppins-SemiBold" },

  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: sc(14), padding: sc(12), marginTop: sc(14), alignItems: "center" },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: sc(22), fontFamily: "Poppins-Bold" },
  statLabel: { color: "rgba(255,255,255,0.75)", fontSize: sc(10), fontFamily: "Poppins-Medium", marginTop: 1 },
  statDivider: { width: 1, height: sc(32), backgroundColor: "rgba(255,255,255,0.25)" },

  toggleRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: sc(12), padding: sc(3), marginTop: sc(14) },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: sc(9), borderRadius: sc(10), gap: sc(6) },
  toggleActive: { backgroundColor: "#fff" },
  toggleText: { color: "#fff", fontSize: sc(13), fontFamily: "Poppins-SemiBold" },
  toggleTextActive: { color: "#0E7C61" },

  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: sc(16), marginBottom: 0, paddingHorizontal: sc(14), paddingVertical: sc(10), borderRadius: sc(12), borderWidth: 1, borderColor: "#e5e5e5" },
  searchInput: { flex: 1, marginLeft: sc(8), fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333", paddingVertical: 2 },

  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: sc(20), paddingVertical: sc(10) },
  countText: { color: "#888", fontSize: sc(13), fontFamily: "Poppins-Medium" },
  hintText: { color: "#bbb", fontSize: sc(11), fontFamily: "Poppins-Regular" },

  list: { paddingHorizontal: sc(16), paddingBottom: sc(100) },
  card: {
    backgroundColor: "#fff",
    borderRadius: sc(16),
    padding: sc(14),
    marginBottom: sc(10),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: sc(48), height: sc(48), borderRadius: sc(24), justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: sc(18), fontFamily: "Poppins-Bold" },
  cardInfo: { flex: 1, marginLeft: sc(12) },
  patientName: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222", marginBottom: sc(3) },
  detailRow: { flexDirection: "row", alignItems: "center", gap: sc(4), marginTop: sc(2) },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", paddingHorizontal: sc(7), paddingVertical: sc(2), borderRadius: sc(7), gap: sc(3), marginRight: sc(5) },
  chipText: { fontSize: sc(10), fontFamily: "Poppins-Medium", color: "#666" },
  detailText: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#888" },
  cardActions: { alignItems: "center", gap: sc(2) },
  assessBtn: { padding: sc(8), backgroundColor: "#E8F5E9", borderRadius: sc(10) },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: sc(30) },
  emptyTitle: { fontSize: sc(17), fontFamily: "Poppins-SemiBold", color: "#999", marginTop: sc(12) },
  emptyDesc: { fontSize: sc(13), fontFamily: "Poppins-Regular", color: "#bbb", marginTop: sc(4), textAlign: "center" },
  addFirstBtn: { flexDirection: "row", alignItems: "center", gap: sc(8), backgroundColor: "#0E7C61", paddingHorizontal: sc(20), paddingVertical: sc(12), borderRadius: sc(12), marginTop: sc(20) },
  addFirstBtnText: { color: "#fff", fontSize: sc(14), fontFamily: "Poppins-SemiBold" },

  fabBackdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)", zIndex: 90,
  },
  fabContainer: {
    position: "absolute", right: sc(20), bottom: sc(30),
    alignItems: "flex-end", gap: sc(12), zIndex: 100,
  },
  fabMenuItem: { flexDirection: "row", alignItems: "center", gap: sc(10) },
  fabMenuLabel: {
    backgroundColor: "#fff", paddingHorizontal: sc(14), paddingVertical: sc(8),
    borderRadius: sc(10),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  fabMenuLabelText: { fontSize: sc(13), fontFamily: "Poppins-SemiBold", color: "#333" },
  fabMenuBtn: { width: sc(46), height: sc(46), borderRadius: sc(23), justifyContent: "center", alignItems: "center" },
  fab: {
    borderRadius: sc(28),
    ...Platform.select({
      ios: { shadowColor: "#0E7C61", shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  fabGradient: { width: sc(56), height: sc(56), borderRadius: sc(28), justifyContent: "center", alignItems: "center" },

  // Action Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  actionSheet: { backgroundColor: "#fff", borderTopLeftRadius: sc(24), borderTopRightRadius: sc(24), paddingHorizontal: sc(20), paddingTop: sc(20), paddingBottom: sc(36) },
  actionSheetHeader: { flexDirection: "row", alignItems: "center", gap: sc(12), marginBottom: sc(16), paddingBottom: sc(16), borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  actionSheetAvatar: { width: sc(44), height: sc(44), borderRadius: sc(22), backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  actionSheetAvatarText: { fontSize: sc(16), fontFamily: "Poppins-Bold", color: "#0E7C61" },
  actionSheetName: { fontSize: sc(16), fontFamily: "Poppins-SemiBold", color: "#111" },
  actionSheetSub: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#888", marginTop: 2 },
  actionSheetTitle: { fontSize: sc(12), fontFamily: "Poppins-SemiBold", color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: sc(8) },
  actionItem: { flexDirection: "row", alignItems: "center", paddingVertical: sc(14), borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: sc(12) },
  actionIcon: { width: sc(40), height: sc(40), borderRadius: sc(12), justifyContent: "center", alignItems: "center" },
  actionTextBlock: { flex: 1 },
  actionLabel: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222" },
  actionSub: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#888", marginTop: 1 },
  cancelAction: { marginTop: sc(14), backgroundColor: "#f5f5f5", borderRadius: sc(12), paddingVertical: sc(14), alignItems: "center" },
  cancelActionText: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#666" },
});

export default DoctorPatients;
