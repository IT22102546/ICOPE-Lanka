import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, StatusBar, ActivityIndicator, RefreshControl, Dimensions, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API = process.env.EXPO_PUBLIC_API_KEY;
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight || 36) : 44;

// ── Bilingual ─────────────────────────────────────────────────────────
const TXT = {
  brand:        { en: "ICOPE Lanka",            si: "ICOPE Lanka" },
  greeting:     { en: "Welcome Back",           si: "නැවත සාදරයෙන්" },
  myPatients:   { en: "My Patients",            si: "මගේ රෝගීන්" },
  assessBtn:    { en: "Assess",                 si: "තක්සේරු" },
  viewAll:      { en: "View All",               si: "සියල්ල" },
  totalPat:     { en: "Patients",               si: "රෝගීන්" },
  assessments:  { en: "Assessments",            si: "තක්සේරු" },
  quickActions: { en: "Quick Actions",          si: "ඉක්මන් ක්‍රියා" },
  patientList:  { en: "Patients",               si: "රෝගීන්" },
  assessment:   { en: "Assessment",             si: "තක්සේරුව" },
  profile:      { en: "Profile",               si: "පැතිකඩ" },
  signOut:      { en: "Sign Out",               si: "පිටවීම" },
  noPat:        { en: "No patients assigned yet", si: "රෝගීන් නොමැත" },
  male:         { en: "Male",                   si: "පිරිමි" },
  female:       { en: "Female",                 si: "ගැහැනු" },
} as const;

type Lang = "en" | "si";
interface Patient {
  _id: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  province?: string;
  district?: string;
}

// ── Component ─────────────────────────────────────────────────────────
const PhysiotherapistHome = () => {
  const { currentUser, getAccessToken, signOut } = useAuthStore();
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("en");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = (key: keyof typeof TXT) => TXT[key][lang];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return lang === "en" ? "Good Morning" : "සුබ උදෑසනක් 🌅";
    if (h < 17) return lang === "en" ? "Good Afternoon" : "සුභ දිනකට ☀️";
    return lang === "en" ? "Good Evening" : "සුභ සන්ධ්‍යාවක් 🌙";
  })();

  const fetchPatients = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API}/api/patients?mine=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPatients(data.patients || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [getAccessToken]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSignOut = () => {
    Alert.alert(t("signOut"), lang === "en" ? "Are you sure you want to sign out?" : "ඔබට නිශ්චිතව පිටවීමට අවශ්‍යද?", [
      { text: lang === "en" ? "Cancel" : "නැත", style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/onBoard1"); } },
    ]);
  };

  const displayName = `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "Physiotherapist";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "P";
  const recentPatients = patients.slice(0, 6);

  const QUICK_ACTIONS = [
    { icon: "people-outline" as const, label: t("patientList"), color: "#0E7C61", bg: "#e8f5f0", onPress: () => router.push("/(root)/(screens)/doctor-patients" as any) },
    { icon: "clipboard-outline" as const, label: t("assessment"), color: "#6366F1", bg: "#eef2ff", onPress: () => router.push("/(root)/(screens)/doctor-patients" as any) },
    { icon: "person-circle-outline" as const, label: t("profile"), color: "#f59e0b", bg: "#fffbeb", onPress: () => router.push("/(root)/(tabs)/profile" as any) },
    { icon: "log-out-outline" as const, label: t("signOut"), color: "#ef4444", bg: "#fef2f2", onPress: handleSignOut },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#0B6B52", "#0E7C61", "#14A87D"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerTop}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.brandText}>ICOPE Lanka</Text>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Language toggle — same style as doctor-patients */}
            <TouchableOpacity style={styles.langBtn} onPress={() => setLang(l => l === "en" ? "si" : "en")}>
              <Ionicons name="language-outline" size={18} color="#fff" />
              <Text style={styles.langLabel}>{lang === "en" ? "සිං" : "EN"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(root)/(tabs)/Notifications" as any)}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsRow}>
          {[
            { icon: "people" as const,    value: loading ? "–" : String(patients.length), label: t("totalPat"),    color: "#34d399" },
            { icon: "clipboard" as const, value: "–",                                     label: t("assessments"), color: "#fbbf24" },
            { icon: "calendar" as const,  value: lang === "en" ? "Today" : "අද",           label: lang === "en" ? "Status" : "තත්ත්වය", color: "#60a5fa" },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Scroll Body ────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPatients(); }}
            colors={["#0E7C61"]} tintColor="#0E7C61"
          />
        }
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t("quickActions")}</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.quickCard} onPress={item.onPress} activeOpacity={0.75}>
              <View style={[styles.quickIconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Patients */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t("myPatients")}</Text>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push("/(root)/(screens)/doctor-patients" as any)}>
            <Text style={styles.viewAllText}>{t("viewAll")}</Text>
            <Ionicons name="arrow-forward" size={13} color="#0E7C61" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#0E7C61" style={{ marginVertical: 32 }} />
        ) : recentPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={44} color="#b2dfdb" />
            <Text style={styles.emptyText}>{t("noPat")}</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={() => router.push("/(root)/(screens)/doctor-patients" as any)}>
              <Text style={styles.emptyActionText}>{lang === "en" ? "View Patients" : "රෝගීන් බලන්න"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentPatients.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.patientCard}
              activeOpacity={0.78}
              onPress={() => router.push({
                pathname: "/(root)/(screens)/patient-assessment" as any,
                params: { patientId: p._id, patientName: p.fullName },
              })}
            >
              <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>{p.fullName?.[0]?.toUpperCase() || "P"}</Text>
              </LinearGradient>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.fullName}</Text>
                <View style={styles.patientMetaRow}>
                  {p.age !== undefined && (
                    <View style={styles.metaChip}>
                      <Ionicons name="person-outline" size={11} color="#64748b" />
                      <Text style={styles.metaChipText}>{p.age} {lang === "en" ? "yrs" : "වයස"}</Text>
                    </View>
                  )}
                  {p.gender && (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{p.gender === "Male" ? t("male") : t("female")}</Text>
                    </View>
                  )}
                  {p.district && (
                    <View style={styles.metaChip}>
                      <Ionicons name="location-outline" size={11} color="#64748b" />
                      <Text style={styles.metaChipText}>{p.district}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.assessPill}>
                <Text style={styles.assessPillText}>{t("assessBtn")}</Text>
                <Ionicons name="chevron-forward" size={13} color="#0E7C61" />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },

  // Header
  header: { paddingTop: STATUS_BAR_HEIGHT + 14, paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  decorCircle1: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.06)", top: -55, right: -45 },
  decorCircle2: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)", bottom: -35, left: -25 },
  headerTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  brandText: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Poppins-Medium", letterSpacing: 0.5 },
  greetingText: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontFamily: "Poppins-Regular", marginTop: 2 },
  nameText: { color: "#fff", fontSize: 22, fontFamily: "Poppins-Bold", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  langBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4 },
  langLabel: { color: "#fff", fontSize: 12, fontFamily: "Poppins-SemiBold" },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  avatarText: { color: "#fff", fontSize: 13, fontFamily: "Poppins-Bold" },

  // Stats
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10 },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 18, fontFamily: "Poppins-Bold" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: "Poppins-Regular", textAlign: "center" },

  // Body
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Poppins-Bold", color: "#0f172a", marginBottom: 12 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#e8f5f0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  viewAllText: { fontSize: 12, color: "#0E7C61", fontFamily: "Poppins-SemiBold" },

  // Quick Grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  quickCard: {
    width: (SCREEN_WIDTH - 52) / 2, alignItems: "center", backgroundColor: "#fff",
    borderRadius: 20, paddingVertical: 20, borderWidth: 1, borderColor: "#e2e8f0",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  quickIconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  quickLabel: { fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#334155" },

  // Patient Cards
  patientCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 14 },
  patientAvatarText: { fontSize: 20, fontFamily: "Poppins-Bold", color: "#fff" },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontFamily: "Poppins-SemiBold", color: "#0f172a", marginBottom: 5 },
  patientMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f1f5f9", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  metaChipText: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#64748b" },
  assessPill: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#e8f5f0", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  assessPillText: { fontSize: 11, fontFamily: "Poppins-SemiBold", color: "#0E7C61" },

  // Empty state
  emptyCard: { alignItems: "center", paddingVertical: 44, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", gap: 12, marginBottom: 12 },
  emptyText: { fontSize: 14, fontFamily: "Poppins-Regular", color: "#94a3b8" },
  emptyAction: { backgroundColor: "#0E7C61", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyActionText: { color: "#fff", fontSize: 13, fontFamily: "Poppins-SemiBold" },
});

export default PhysiotherapistHome;
