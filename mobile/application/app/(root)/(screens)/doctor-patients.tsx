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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";

const { width: screenWidth } = Dimensions.get("window");
const API = process.env.EXPO_PUBLIC_API_KEY;

// ── Bilingual ────────────────────────────────────────────────────
const TXT: Record<string, { en: string; si: string }> = {
  brand:        { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  myPatients:   { en: "My Patients", si: "මගේ රෝගීන්" },
  allPatients:  { en: "All Patients", si: "සියලුම රෝගීන්" },
  search:       { en: "Search patients...", si: "රෝගීන් සොයන්න..." },
  noPatients:   { en: "No patients found", si: "රෝගීන් හමු නොවීය" },
  noResult:     { en: "Try adjusting your search", si: "ඔබේ සෙවීම නැවත උත්සාහ කරන්න" },
  assess:       { en: "ICOPE Assessment", si: "ICOPE තක්සේරුව" },
  age:          { en: "Age", si: "වයස" },
  phone:        { en: "Phone", si: "දුරකථන" },
  assignedTo:   { en: "Assigned to", si: "පවරා ඇත" },
  signOut:      { en: "Sign Out", si: "පිටවීම" },
  confirmSignOut: { en: "Are you sure you want to sign out?", si: "ඔබට පිටවීමට අවශ්‍ය බව විශ්වාසද?" },
  cancel:       { en: "Cancel", si: "අවලංගු කරන්න" },
  patients:     { en: "Patients", si: "රෝගීන්" },
};

interface Patient {
  _id: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  province?: string;
  district?: string;
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
  const t = (key: string) => TXT[key]?.[lang] ?? key;

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

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

  const handleSignOut = () => {
    Alert.alert(t("signOut"), t("confirmSignOut"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/selectSignIn"); } },
    ]);
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const initials = item.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "?";

    const genderColor = item.gender === "Male" ? "#3B82F6" : item.gender === "Female" ? "#EC4899" : "#6B7280";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: "/(root)/(screens)/patient-assessment", params: { patientId: item._id, patientName: item.fullName } })}
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
                  <Ionicons name="calendar-outline" size={12} color="#666" />
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
                <Ionicons name="call-outline" size={12} color="#888" />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
            )}
            {item.district && item.province && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={styles.detailText}>{item.district}, {item.province}</Text>
              </View>
            )}
            {isSuperAdmin && !showMine && item.doctorId?.name && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={12} color="#0E7C61" />
                <Text style={[styles.detailText, { color: "#0E7C61" }]}>{t("assignedTo")}: {item.doctorId.name}</Text>
              </View>
            )}
          </View>

          {/* Arrow */}
          <View style={styles.assessBtn}>
            <Ionicons name="chevron-forward" size={20} color="#0E7C61" />
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
            <Text style={styles.welcomeName}>{currentUser?.name || "Physiotherapist"}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.langBtn}>
              <Ionicons name="language-outline" size={18} color="#fff" />
              <Text style={styles.langLabel}>{lang === "en" ? "සිං" : "EN"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Super admin toggle */}
        {isSuperAdmin && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, showMine && styles.toggleActive]}
              onPress={() => setShowMine(true)}
            >
              <Ionicons name="person" size={16} color={showMine ? "#0E7C61" : "#fff"} />
              <Text style={[styles.toggleText, showMine && styles.toggleTextActive]}>{t("myPatients")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !showMine && styles.toggleActive]}
              onPress={() => setShowMine(false)}
            >
              <Ionicons name="people" size={16} color={!showMine ? "#0E7C61" : "#fff"} />
              <Text style={[styles.toggleText, !showMine && styles.toggleTextActive]}>{t("allPatients")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#888" />
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
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} {t("patients")}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0E7C61" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color="#ccc" />
          <Text style={styles.emptyTitle}>{t("noPatients")}</Text>
          <Text style={styles.emptyDesc}>{t("noResult")}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderPatientCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPatients(); }} tintColor="#0E7C61" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Poppins-Medium" },
  welcomeName: { color: "#fff", fontSize: 20, fontFamily: "Poppins-Bold", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  langBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4 },
  langLabel: { color: "#fff", fontSize: 12, fontFamily: "Poppins-SemiBold" },
  signOutBtn: { padding: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16 },
  toggleRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 4, marginTop: 16 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 6 },
  toggleActive: { backgroundColor: "#fff" },
  toggleText: { color: "#fff", fontSize: 14, fontFamily: "Poppins-SemiBold" },
  toggleTextActive: { color: "#0E7C61" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, marginBottom: 0, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#e5e5e5" },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontFamily: "Poppins-Regular", color: "#333", paddingVertical: 2 },
  countRow: { paddingHorizontal: 20, paddingVertical: 10 },
  countText: { color: "#888", fontSize: 13, fontFamily: "Poppins-Medium" },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontFamily: "Poppins-Bold" },
  cardInfo: { flex: 1, marginLeft: 12 },
  patientName: { fontSize: 16, fontFamily: "Poppins-SemiBold", color: "#222", marginBottom: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4, marginRight: 6 },
  chipText: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#666" },
  detailText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#888" },
  assessBtn: { padding: 8, backgroundColor: "#E8F5E9", borderRadius: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 17, fontFamily: "Poppins-SemiBold", color: "#999", marginTop: 12 },
  emptyDesc: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#bbb", marginTop: 4 },
});

export default DoctorPatients;
