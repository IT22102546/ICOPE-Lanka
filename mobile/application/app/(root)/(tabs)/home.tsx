import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import useAuthStore from "@/stores/authStore";
import useNotificationStore from "@/stores/notificationStore";
import { apiFetch } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight || 36) : 44;

// ── helpers ────────────────────────────────────────────────────────────
const extractData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

const formatDateSmart = (value?: string | null) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  const now = new Date();
  const diff = parsed.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days <= 7) return `In ${days} days`;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: parsed.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const formatTime = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "";
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
};

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: "checkmark-circle" | "time" | "close-circle" }> = {
  AVAILABLE: { label: "Available", color: "#10b981", bg: "#ecfdf5", icon: "checkmark-circle" },
  IN_WORK: { label: "In Session", color: "#f59e0b", bg: "#fffbeb", icon: "time" },
  NOT_AVAILABLE: { label: "Unavailable", color: "#ef4444", bg: "#fef2f2", icon: "close-circle" },
};

const EXERCISE_CONFIG: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
  { key: "exerciseFingers", label: "Fingers", icon: "hand-left-outline", color: "#6366F1", bg: "#eef2ff" },
  { key: "exerciseWrist", label: "Wrist", icon: "hand-right-outline", color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "exerciseElbow", label: "Elbow", icon: "fitness-outline", color: "#f59e0b", bg: "#fffbeb" },
  { key: "exerciseShoulder", label: "Shoulder", icon: "body-outline", color: "#ec4899", bg: "#fdf2f8" },
];

type ChildInfo = { id: string; displayId?: string; firstName?: string; lastName?: string };
type PhysioInfo = {
  id?: string;
  name?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  availabilityStatus?: string;
  availabilityNote?: string;
  unavailableDates?: { id: string; date: string; reason?: string }[];
};
type ProgressTracker = {
  startProgress?: number;
  currentProgress?: number;
  playTimeMinutes?: number;
  fingerProgress?: number;
  wristProgress?: number;
  elbowProgress?: number;
  shoulderProgress?: number;
};
type ChildDetail = ChildInfo & {
  exerciseFingers?: boolean;
  exerciseWrist?: boolean;
  exerciseElbow?: boolean;
  exerciseShoulder?: boolean;
  playTimeMinutes?: number;
  playHours?: number;
  hospital?: { id?: string; name?: string };
  physioAssignments?: { physiotherapist?: PhysioInfo }[];
  progressTracker?: ProgressTracker;
};
type SessionItem = {
  id: string;
  admissionDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
  notes?: string | null;
  child?: ChildInfo;
  physiotherapist?: { name?: string; specialization?: string } | null;
  hospital?: { name?: string } | null;
};
type AssignmentItem = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  dueDate?: string | null;
  child?: ChildInfo;
  physiotherapist?: { name?: string } | null;
};

// ── component ──────────────────────────────────────────────────────────
const Home = () => {
  const { currentUser, signOut, isSignedIn } = useAuthStore();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState<string | null>(null);
  const [childDetail, setChildDetail] = useState<ChildDetail | null>(null);
  const [onlineSessions, setOnlineSessions] = useState<SessionItem[]>([]);
  const [physicalSessions, setPhysicalSessions] = useState<SessionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const childDetailFetched = useRef(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  // resolve child id ────────────────────────────────────────────────────
  const resolveChildId = useCallback(async (): Promise<string | null> => {
    const role = String((currentUser as any)?.role || "").toUpperCase();
    const isStudent = role.includes("STUDENT");
    const candidates = [
      (currentUser as any)?.childId,
      (currentUser as any)?.child?.id,
      (currentUser as any)?.profile?.childId,
      (currentUser as any)?.studentProfile?.childId,
      ...(isStudent ? [(currentUser as any)?.id, (currentUser as any)?._id] : []),
    ].filter(Boolean);
    if (candidates.length) return String(candidates[0]);

    try {
      const res = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });
      if (res.ok) {
        const json = await res.json();
        const data = extractData(json);
        const first = Array.isArray(data?.children) ? data.children[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ""} ${first.lastName || ""}`.trim();
          if (name) setChildName(name);
          setChildDetail(first);
          childDetailFetched.current = true;
          return String(first.id);
        }
      }
    } catch {}
    try {
      const res = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (res.ok) {
        const json = await res.json();
        const rows: ChildDetail[] = extractData(json) || [];
        const first = Array.isArray(rows) ? rows[0] : null;
        if (first?.id) {
          const name = `${first.firstName || ""} ${first.lastName || ""}`.trim();
          if (name) setChildName(name);
          setChildDetail(first);
          childDetailFetched.current = true;
          return String(first.id);
        }
      }
    } catch {}
    return null;
  }, [currentUser]);

  // fetch all home data ────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isSignedIn || !currentUser) { setLoading(false); return; }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const cid = await resolveChildId();
        setChildId(cid);
        if (!cid) { setLoading(false); setRefreshing(false); return; }

        // Refresh notification count from the store
        useNotificationStore.getState().fetchUnreadCount();

        const [onlineRes, physicalRes, assignRes, childrenRes] = await Promise.all([
          apiFetch(`/api/v1/users/my-online-sessions?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch(`/api/v1/users/my-admission-trackings?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch(`/api/v1/users/my-assignments?childId=${encodeURIComponent(cid)}`, { method: "GET" }).catch(() => null),
          apiFetch("/api/v1/users/my-children", { method: "GET" }).catch(() => null),
        ]);

        if (onlineRes?.ok) {
          const json = await onlineRes.json();
          const rows: SessionItem[] = Array.isArray(extractData(json)) ? extractData(json) : [];
          const filtered = rows.filter((s) => s?.child?.id === cid);
          setOnlineSessions(filtered);
          if (!childName && filtered[0]?.child) {
            const n = `${filtered[0].child.firstName || ""} ${filtered[0].child.lastName || ""}`.trim();
            if (n) setChildName(n);
          }
        }
        if (physicalRes?.ok) {
          const json = await physicalRes.json();
          const rows: SessionItem[] = Array.isArray(extractData(json)) ? extractData(json) : [];
          setPhysicalSessions(rows.filter((s) => s?.child?.id === cid));
        }
        if (assignRes?.ok) {
          const json = await assignRes.json();
          const root = extractData(json);
          let items: AssignmentItem[] = [];
          if (Array.isArray(root)) items = root;
          else if (Array.isArray(root?.assignments)) items = root.assignments;
          else if (Array.isArray(root?.data?.assignments)) items = root.data.assignments;
          setAssignments(items);
        }
        // Populate childDetail from my-children or mobile/profile fallback
        if (childrenRes?.ok) {
          try {
            const json = await childrenRes.json();
            const rows: ChildDetail[] = extractData(json) || [];
            const match = Array.isArray(rows) ? rows.find((c) => c.id === cid) || rows[0] : null;
            if (match) { setChildDetail(match); childDetailFetched.current = true; }
          } catch {}
        }
        // Fallback: if childDetail still not set, try mobile/profile
        if (!childDetailFetched.current) {
          try {
            const profileRes = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });
            if (profileRes?.ok) {
              const json = await profileRes.json();
              const data = extractData(json);
              const children: ChildDetail[] = Array.isArray(data?.children) ? data.children : [];
              const match = children.find((c) => c.id === cid) || children[0] || null;
              if (match) {
                setChildDetail(match);
                childDetailFetched.current = true;
                if (!childName) {
                  const n = `${match.firstName || ""} ${match.lastName || ""}`.trim();
                  if (n) setChildName(n);
                }
              }
            }
          } catch {}
        }
      } catch {} finally { setLoading(false); setRefreshing(false); }
    },
    [childName, currentUser, isSignedIn, resolveChildId]
  );

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/onBoard1"); } },
    ]);
  };

  // derived data ────────────────────────────────────────────────────────
  // FIXED COUNT - Only count active/scheduled items
  const upcomingOnline = onlineSessions
    .filter((s) => { const st = String(s.status || "").toUpperCase(); return st === "SCHEDULED" || st === "ONGOING"; })
    .sort((a, b) => new Date(a.admissionDate || "").getTime() - new Date(b.admissionDate || "").getTime())
    .slice(0, 3);

  const upcomingPhysical = physicalSessions
    .filter((s) => { const st = String(s.status || "").toUpperCase(); return st === "SCHEDULED" || st === "ONGOING" || st === "ACTIVE"; })
    .sort((a, b) => new Date(a.admissionDate || "").getTime() - new Date(b.admissionDate || "").getTime())
    .slice(0, 3);

  const latestAssignments = [...assignments]
    .sort((a, b) => new Date(b.dueDate || "").getTime() - new Date(a.dueDate || "").getTime())
    .slice(0, 3);

  // FIXED: Count only active/scheduled items for stats
  const scheduledOnline = onlineSessions.filter((s) => String(s.status || "").toUpperCase() === "SCHEDULED").length;
  const scheduledPhysical = physicalSessions.filter((s) => { const st = String(s.status || "").toUpperCase(); return st === "SCHEDULED" || st === "ACTIVE"; }).length;
  const activeAssignments = assignments.filter((a) => String(a.status || "").toUpperCase() === "ACTIVE").length;
  const totalActive = scheduledOnline + scheduledPhysical + activeAssignments;

  const displayName = childName || `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "User";
  const initials = (childName ? childName.split(" ").map((w: string) => w[0]).join("").slice(0, 2) : "") || `${currentUser?.firstName?.[0] || ""}${currentUser?.lastName?.[0] || ""}` || "U";

  // derived – physio & exercises ──────────────────────────────────────
  const physio = childDetail?.physioAssignments?.[0]?.physiotherapist || null;
  const availConfig = physio?.availabilityStatus ? AVAILABILITY_CONFIG[physio.availabilityStatus] : null;
  const enabledExercises = EXERCISE_CONFIG.filter((e) => !!(childDetail as any)?.[e.key]);

  // ── render ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color="#6366F1" /></View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={["#6366F1"]} tintColor="#6366F1" />}
        >

      {/* ── HEADER (exactly as original) ─────────────────────────────────── */}
      <LinearGradient colors={["#4338CA", "#6366F1", "#818CF8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.topRow}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingText}>{greeting} 👋</Text>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
            {childDetail?.displayId && (
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600", fontFamily: "monospace" }}>{childDetail.displayId}</Text>
              </View>
            )}
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(root)/(tabs)/Notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push("/(root)/(tabs)/profile")}>
              {currentUser?.profilePicture ? (
                <Image source={{ uri: currentUser.profilePicture }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={["#a78bfa", "#7c3aed"]} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Progress + Stats in one row */}
        {enabledExercises.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.progressSection}
            onPress={() => router.push({ pathname: "/(root)/(screens)/exercise_progress" as any, params: { childId: childId || "" } })}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleWrap}>
                <Ionicons name="analytics-outline" size={14} color="#c7d2fe" />
                <Text style={styles.progressTitle}>Progress</Text>
              </View>
              <View style={styles.viewDetailBtn}>
                <Text style={styles.viewDetailText}>Details</Text>
                <Ionicons name="chevron-forward" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, childDetail?.progressTracker?.currentProgress ?? 0))}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{Math.round(childDetail?.progressTracker?.currentProgress ?? 0)}%</Text>
            </View>
            <View style={styles.exerciseMiniList}>
              {enabledExercises.map((ex) => {
                const progKey = ex.key === "exerciseFingers" ? "fingerProgress"
                  : ex.key === "exerciseWrist" ? "wristProgress"
                  : ex.key === "exerciseElbow" ? "elbowProgress"
                  : "shoulderProgress";
                const val = (childDetail?.progressTracker as any)?.[progKey] ?? 0;
                const brightColor = ex.key === "exerciseFingers" ? "#67e8f9"
                  : ex.key === "exerciseWrist" ? "#a78bfa"
                  : ex.key === "exerciseElbow" ? "#fbbf24"
                  : "#f9a8d4";
                return (
                  <View key={ex.key} style={styles.exerciseMiniRow}>
                    <View style={styles.exerciseMiniLeft}>
                      <View style={[styles.exerciseMiniIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <Ionicons name={ex.icon as any} size={14} color={brightColor} />
                      </View>
                      <Text style={styles.exerciseMiniLabel}>{ex.label}</Text>
                    </View>
                    <View style={styles.exerciseMiniBarBg}>
                      <View style={[styles.exerciseMiniBarFill, { width: `${Math.min(100, Math.max(0, val))}%`, backgroundColor: brightColor }]} />
                    </View>
                    <Text style={[styles.exerciseMiniVal, { color: brightColor }]}>{Math.round(val)}%</Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Stats ribbon - FIXED with correct counts */}
        <View style={styles.statsRow}>
          {[
            { label: "Online", value: scheduledOnline, color: "#34d399" },
            { label: "Physical", value: scheduledPhysical, color: "#fbbf24" },
            { label: "Tasks", value: activeAssignments, color: "#f472b6" },
            { label: "Total", value: totalActive, color: "#60a5fa" },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── BODY (Enhanced attractive UI) ───────────────────────────────────── */}
      <View style={styles.body}>
        <View style={styles.bodyContent}>
          
          {/* Quick Access Grid with Enhanced Cards */}
          <View style={styles.quickAccessHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Text style={styles.sectionSubtitle}>Navigate to your tools</Text>
          </View>
          
          <View style={styles.quickGrid}>
            {[
              { icon: "videocam-outline" as const, label: "Online\nSessions", color: "#6366F1", bg: "#eef2ff", route: "/(root)/(tabs)/online_sessions" },
              { icon: "fitness-outline" as const, label: "Physical\nSessions", color: "#f59e0b", bg: "#fffbeb", route: "/(root)/(tabs)/admission_tracking" },
              { icon: "document-text-outline" as const, label: "Assignments", color: "#10b981", bg: "#ecfdf5", route: "/(root)/(tabs)/assignments" },
              { icon: "people-outline" as const, label: "Physio-\ntherapists", color: "#ec4899", bg: "#fdf2f8", route: "/(root)/(tabs)/physiotherapists" },
              { icon: "book-outline" as const, label: "Publications", color: "#8b5cf6", bg: "#f5f3ff", route: "/(root)/(tabs)/publications" },
              { icon: "notifications-outline" as const, label: "Alerts", color: "#ef4444", bg: "#fef2f2", route: "/(root)/(tabs)/Notifications" },
            ].map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.quickCardEnhanced} activeOpacity={0.7} onPress={() => router.push(item.route as any)}>
                <View style={[styles.quickIconEnhanced, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text style={styles.quickLabelEnhanced}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Featured Section - Online Sessions with Enhanced Cards */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Online Sessions</Text>
              <Text style={styles.sectionSubtitle}>Your upcoming virtual appointments</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push("/(root)/(tabs)/online_sessions")}>
              <Text style={styles.seeAll}>See All</Text>
              <Ionicons name="arrow-forward" size={14} color="#6366F1" />
            </TouchableOpacity>
          </View>
          
          {upcomingOnline.length === 0 ? (
            <View style={styles.emptyCardEnhanced}>
              <View style={[styles.emptyIconContainer, { backgroundColor: "#eef2ff" }]}>
                <Ionicons name="videocam-off-outline" size={32} color="#6366F1" />
              </View>
              <Text style={styles.emptyTitle}>No upcoming sessions</Text>
              <Text style={styles.emptySubtitle}>Your scheduled online sessions will appear here</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
              {upcomingOnline.map((s) => (
                <TouchableOpacity key={s.id} activeOpacity={0.9}>
                  <LinearGradient colors={["#6366F1", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sessionCardEnhanced}>
                    <View style={styles.sessionCardHeader}>
                      <View style={styles.sessionIconContainer}>
                        <Ionicons name="videocam" size={16} color="#fff" />
                      </View>
                      <View style={styles.sessionStatusBadge}>
                        <Text style={styles.sessionStatusBadgeText}>{s.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionDateEnhanced}>{formatDateSmart(s.admissionDate)}</Text>
                    <Text style={styles.sessionTimeEnhanced}>{formatTime(s.startTime, s.endTime) || "Time TBD"}</Text>
                    {s.physiotherapist?.name && (
                      <View style={styles.sessionPersonContainer}>
                        <Ionicons name="person-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.sessionPersonName}>Dr. {s.physiotherapist.name}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Physical Sessions with Enhanced Cards */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Physical Sessions</Text>
              <Text style={styles.sectionSubtitle}>Your in-person appointments</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push("/(root)/(tabs)/admission_tracking")}>
              <Text style={styles.seeAll}>See All</Text>
              <Ionicons name="arrow-forward" size={14} color="#6366F1" />
            </TouchableOpacity>
          </View>
          
          {upcomingPhysical.length === 0 ? (
            <View style={styles.emptyCardEnhanced}>
              <View style={[styles.emptyIconContainer, { backgroundColor: "#fffbeb" }]}>
                <Ionicons name="walk-outline" size={32} color="#f59e0b" />
              </View>
              <Text style={styles.emptyTitle}>No physical sessions</Text>
              <Text style={styles.emptySubtitle}>Your in-person appointments will appear here</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
              {upcomingPhysical.map((s) => (
                <TouchableOpacity key={s.id} activeOpacity={0.9}>
                  <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sessionCardEnhanced}>
                    <View style={styles.sessionCardHeader}>
                      <View style={styles.sessionIconContainer}>
                        <Ionicons name="fitness" size={16} color="#fff" />
                      </View>
                      <View style={[styles.sessionStatusBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                        <Text style={styles.sessionStatusBadgeText}>{s.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionDateEnhanced}>{formatDateSmart(s.admissionDate)}</Text>
                    <Text style={styles.sessionTimeEnhanced}>{formatTime(s.startTime, s.endTime) || "Time TBD"}</Text>
                    {s.physiotherapist?.name && (
                      <View style={styles.sessionPersonContainer}>
                        <Ionicons name="person-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.sessionPersonName}>Dr. {s.physiotherapist.name}</Text>
                      </View>
                    )}
                    {s.hospital?.name && (
                      <View style={styles.sessionLocationContainer}>
                        <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.sessionLocationText}>{s.hospital.name}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Assignments with Elegant Cards */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Assignments</Text>
              <Text style={styles.sectionSubtitle}>Tasks waiting for your attention</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push("/(root)/(tabs)/assignments")}>
              <Text style={styles.seeAll}>See All</Text>
              <Ionicons name="arrow-forward" size={14} color="#6366F1" />
            </TouchableOpacity>
          </View>
          
          {latestAssignments.length === 0 ? (
            <View style={styles.emptyCardEnhanced}>
              <View style={[styles.emptyIconContainer, { backgroundColor: "#ecfdf5" }]}>
                <Ionicons name="document-text-outline" size={32} color="#10b981" />
              </View>
              <Text style={styles.emptyTitle}>No assignments</Text>
              <Text style={styles.emptySubtitle}>Your tasks will be displayed here</Text>
            </View>
          ) : (
            <View style={styles.assignmentsContainer}>
              {latestAssignments.map((a, index) => (
                <TouchableOpacity key={a.id} style={[styles.assignCardEnhanced, index === 0 && styles.firstAssignCard]} activeOpacity={0.7}>
                  <View style={styles.assignCardLeft}>
                    <View style={[styles.assignIconContainer, { backgroundColor: String(a.status).toUpperCase() === "ACTIVE" ? "#ecfdf5" : "#fef2f2" }]}>
                      <Ionicons 
                        name={String(a.status).toUpperCase() === "ACTIVE" ? "play-circle" : "time"} 
                        size={20} 
                        color={String(a.status).toUpperCase() === "ACTIVE" ? "#10b981" : "#ef4444"} 
                      />
                    </View>
                  </View>
                  <View style={styles.assignCardBody}>
                    <Text style={styles.assignCardTitle} numberOfLines={1}>{a.title}</Text>
                    {a.description && <Text style={styles.assignCardDesc} numberOfLines={2}>{a.description}</Text>}
                    <View style={styles.assignCardFooter}>
                      <View style={styles.assignDueDate}>
                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                        <Text style={styles.assignDueText}>Due: {formatDateSmart(a.dueDate)}</Text>
                      </View>
                      <View style={[styles.assignCardStatus, { backgroundColor: String(a.status).toUpperCase() === "ACTIVE" ? "#ecfdf5" : "#fef2f2" }]}>
                        <Text style={[styles.assignCardStatusText, { color: String(a.status).toUpperCase() === "ACTIVE" ? "#10b981" : "#ef4444" }]}>{a.status}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Physiotherapist Card - Enhanced */}
          {physio && (
            <View style={styles.physioSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Your Physiotherapist</Text>
                  <Text style={styles.sectionSubtitle}>Primary care provider</Text>
                </View>
              </View>
              
              <View style={styles.physioCardEnhanced}>
                <View style={styles.physioCardHeader}>
                  <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.physioAvatarEnhanced}>
                    <Ionicons name="person" size={28} color="#fff" />
                  </LinearGradient>
                  <View style={styles.physioInfoEnhanced}>
                    <Text style={styles.physioNameEnhanced}>{physio.name || "Physiotherapist"}</Text>
                    {physio.specialization && <Text style={styles.physioSpecEnhanced}>{physio.specialization}</Text>}
                  </View>
                </View>

                <View style={styles.physioDetailsContainer}>
                  {availConfig && (
                    <View style={[styles.availBadgeEnhanced, { backgroundColor: availConfig.bg }]}>
                      <Ionicons name={availConfig.icon} size={16} color={availConfig.color} />
                      <Text style={[styles.availTextEnhanced, { color: availConfig.color }]}>{availConfig.label}</Text>
                    </View>
                  )}
                  
                  {physio.phone && (
                    <View style={styles.physioContactEnhanced}>
                      <Ionicons name="call-outline" size={14} color="#64748b" />
                      <Text style={styles.physioContactTextEnhanced}>{physio.phone}</Text>
                    </View>
                  )}
                  
                  {physio.availabilityNote && (
                    <View style={styles.physioNoteContainer}>
                      <Ionicons name="information-circle-outline" size={14} color="#6366F1" />
                      <Text style={styles.physioNoteText}>{physio.availabilityNote}</Text>
                    </View>
                  )}
                </View>

                {physio.unavailableDates && physio.unavailableDates.length > 0 && (
                  <View style={styles.unavailContainer}>
                    <Text style={styles.unavailTitleEnhanced}>Unavailable Dates</Text>
                    {physio.unavailableDates.slice(0, 2).map((ud) => (
                      <View key={ud.id} style={styles.unavailRowEnhanced}>
                        <Ionicons name="calendar-outline" size={13} color="#ef4444" />
                        <Text style={styles.unavailDateEnhanced}>
                          {new Date(ud.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                        {ud.reason && <Text style={styles.unavailReasonEnhanced}>({ud.reason})</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Exercises Section - Enhanced */}
          {enabledExercises.length > 0 && (
            <View style={styles.exerciseSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Active Exercises</Text>
                  <Text style={styles.sectionSubtitle}>Your personalized routine</Text>
                </View>
                <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push({ pathname: "/(root)/(screens)/exercise_progress" as any, params: { childId: childId || "" } })}>
                  <Text style={styles.seeAll}>View Progress</Text>
                  <Ionicons name="arrow-forward" size={14} color="#6366F1" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.exerciseGridEnhanced}>
                {enabledExercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.key}
                    style={styles.exerciseCardEnhanced}
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: "/(root)/(screens)/exercise_progress" as any, params: { childId: childId || "" } })}
                  >
                    <View style={[styles.exerciseIconWrapEnhanced, { backgroundColor: ex.bg }]}>
                      <Ionicons name={ex.icon} size={32} color={ex.color} />
                    </View>
                    <Text style={styles.exerciseLabelEnhanced}>{ex.label}</Text>
                    <View style={styles.exerciseProgressContainer}>
                      <View style={styles.exerciseProgressBar}>
                        <View style={[styles.exerciseProgressFill, { 
                          width: `${Math.min(100, Math.max(0, (childDetail?.progressTracker as any)?.[
                            ex.key === "exerciseFingers" ? "fingerProgress" :
                            ex.key === "exerciseWrist" ? "wristProgress" :
                            ex.key === "exerciseElbow" ? "elbowProgress" : "shoulderProgress"
                          ] ?? 0))}%`,
                          backgroundColor: ex.color 
                        }]} />
                      </View>
                      <Text style={styles.exerciseProgressText}>
                        {Math.round((childDetail?.progressTracker as any)?.[
                          ex.key === "exerciseFingers" ? "fingerProgress" :
                          ex.key === "exerciseWrist" ? "wristProgress" :
                          ex.key === "exerciseElbow" ? "elbowProgress" : "shoulderProgress"
                        ] ?? 0)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              {(childDetail?.playTimeMinutes ?? 0) > 0 && (
                <View style={styles.playTimeCardEnhanced}>
                  <View style={styles.playTimeIconContainer}>
                    <Ionicons name="time-outline" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.playTimeContent}>
                    <Text style={styles.playTimeLabel}>Total Practice Time</Text>
                    <Text style={styles.playTimeValue}>
                      <Text style={styles.playTimeNumber}>{childDetail?.playHours ?? 0}h</Text>
                      <Text style={styles.playTimeUnit}> ({childDetail?.playTimeMinutes ?? 0} min)</Text>
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButtonEnhanced} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.signOutTextEnhanced}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </View>
        </ScrollView>
      )}
    </View>
  );
};

// ── styles (keeping exact header styles, adding enhanced body styles) ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4338CA" },

  /* header - EXACTLY AS ORIGINAL */
  header: { paddingHorizontal: 20, paddingTop: STATUS_BAR_HEIGHT + 16, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  decorCircle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  decorCircle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greetingWrap: { flex: 1, marginRight: 12 },
  greetingText: { fontSize: 14, color: "#c7d2fe", fontFamily: "Poppins-Regular" },
  displayName: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold", marginTop: 2 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center", paddingHorizontal: 4, borderWidth: 1.5, borderColor: "#4338CA" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  avatarBtn: {},
  avatarImg: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },
  avatarInitials: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Poppins-Bold" },

  /* progress tracker - EXACTLY AS ORIGINAL */
  progressSection: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressTitleWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  progressTitle: { fontSize: 13, fontWeight: "600", color: "#e0e7ff", fontFamily: "Poppins-SemiBold" },
  viewDetailBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  viewDetailText: { fontSize: 10, color: "#fff", fontWeight: "600", fontFamily: "Poppins-SemiBold" },
  progressBarWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, backgroundColor: "#34d399", borderRadius: 4 },
  progressPercent: { fontSize: 13, fontWeight: "800", color: "#34d399", fontFamily: "Poppins-Bold", minWidth: 32, textAlign: "right" },
  exerciseMiniList: { marginBottom: 0 },
  exerciseMiniRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  exerciseMiniLeft: { flexDirection: "row", alignItems: "center", gap: 6, width: 90 },
  exerciseMiniIconWrap: { width: 24, height: 24, borderRadius: 8, justifyContent: "center" as const, alignItems: "center" as const },
  exerciseMiniLabel: { fontSize: 10, color: "#fff", fontFamily: "Poppins-Regular", fontWeight: "600" as const },
  exerciseMiniBarBg: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 4, overflow: "hidden" as const, marginHorizontal: 6 },
  exerciseMiniBarFill: { height: 6, borderRadius: 4 },
  exerciseMiniVal: { fontSize: 10, fontWeight: "800" as const, fontFamily: "Poppins-Bold", minWidth: 30, textAlign: "right" as const },

  /* stats - EXACTLY AS ORIGINAL but with FIXED values */
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12 },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800", fontFamily: "Poppins-Bold" },
  statLabel: { fontSize: 10, color: "#c7d2fe", fontFamily: "Poppins-Regular", marginTop: 4 },

  /* body - ENHANCED */
  body: { backgroundColor: "#f8fafc" },
  bodyContent: { paddingHorizontal: 20, paddingTop: 24 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },

  /* section headers - ENHANCED */
  quickAccessHeader: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", fontFamily: "Poppins-Bold", letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: "#64748b", fontFamily: "Poppins-Regular", marginTop: 2 },
  seeAllButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  seeAll: { fontSize: 13, color: "#6366F1", fontFamily: "Poppins-SemiBold" },

  /* quick grid - ENHANCED */
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  quickCardEnhanced: { width: (SCREEN_WIDTH - 52) / 3, alignItems: "center", marginBottom: 20 },
  quickIconEnhanced: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  quickLabelEnhanced: { fontSize: 12, textAlign: "center", color: "#334155", fontFamily: "Poppins-Medium", lineHeight: 16 },

  /* horizontal scroll */
  horizontalScrollContent: { paddingRight: 16, paddingBottom: 8 },

  /* session cards - ENHANCED */
  sessionCardEnhanced: { width: 240, borderRadius: 24, padding: 16, marginRight: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  sessionCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sessionIconContainer: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  sessionStatusBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  sessionStatusBadgeText: { fontSize: 10, color: "#fff", fontWeight: "600", fontFamily: "Poppins-SemiBold", textTransform: "uppercase" },
  sessionDateEnhanced: { fontSize: 14, color: "#fff", fontFamily: "Poppins-Regular", opacity: 0.9, marginBottom: 4 },
  sessionTimeEnhanced: { fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold", letterSpacing: -0.5, marginBottom: 8 },
  sessionPersonContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sessionPersonName: { fontSize: 13, color: "#fff", fontFamily: "Poppins-Regular", opacity: 0.9 },
  sessionLocationContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionLocationText: { fontSize: 11, color: "#fff", fontFamily: "Poppins-Regular", opacity: 0.7 },

  /* empty states - ENHANCED */
  emptyCardEnhanced: { backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  emptyIconContainer: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", fontFamily: "Poppins-SemiBold", marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: "#94a3b8", fontFamily: "Poppins-Regular", textAlign: "center" },

  /* assignments - ENHANCED */
  assignmentsContainer: { marginBottom: 8 },
  assignCardEnhanced: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  firstAssignCard: { borderColor: "#6366F1", borderWidth: 1.5 },
  assignCardLeft: { marginRight: 12 },
  assignIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  assignCardBody: { flex: 1 },
  assignCardTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a", fontFamily: "Poppins-SemiBold", marginBottom: 4 },
  assignCardDesc: { fontSize: 12, color: "#64748b", fontFamily: "Poppins-Regular", marginBottom: 8, lineHeight: 16 },
  assignCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  assignDueDate: { flexDirection: "row", alignItems: "center", gap: 4 },
  assignDueText: { fontSize: 11, color: "#94a3b8", fontFamily: "Poppins-Regular" },
  assignCardStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  assignCardStatusText: { fontSize: 10, fontWeight: "600", fontFamily: "Poppins-SemiBold", textTransform: "uppercase" },

  /* physio card - ENHANCED */
  physioSection: { marginTop: 16 },
  physioCardEnhanced: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  physioCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  physioAvatarEnhanced: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  physioInfoEnhanced: { flex: 1, marginLeft: 16 },
  physioNameEnhanced: { fontSize: 18, fontWeight: "700", color: "#0f172a", fontFamily: "Poppins-Bold", marginBottom: 2 },
  physioSpecEnhanced: { fontSize: 13, color: "#64748b", fontFamily: "Poppins-Regular" },
  physioDetailsContainer: { marginBottom: 12 },
  availBadgeEnhanced: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, alignSelf: "flex-start", marginBottom: 10 },
  availTextEnhanced: { fontSize: 13, fontWeight: "600", fontFamily: "Poppins-SemiBold" },
  physioContactEnhanced: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  physioContactTextEnhanced: { fontSize: 13, color: "#475569", fontFamily: "Poppins-Regular" },
  physioNoteContainer: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#eef2ff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  physioNoteText: { fontSize: 12, color: "#6366F1", fontFamily: "Poppins-Regular", flex: 1 },
  unavailContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  unavailTitleEnhanced: { fontSize: 13, fontWeight: "600", color: "#64748b", fontFamily: "Poppins-SemiBold", marginBottom: 8 },
  unavailRowEnhanced: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  unavailDateEnhanced: { fontSize: 12, color: "#1e293b", fontFamily: "Poppins-Regular" },
  unavailReasonEnhanced: { fontSize: 11, color: "#94a3b8", fontFamily: "Poppins-Regular" },

  /* exercise section - ENHANCED */
  exerciseSection: { marginTop: 16 },
  exerciseGridEnhanced: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8 },
  exerciseCardEnhanced: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  exerciseIconWrapEnhanced: { width: 72, height: 72, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 12, alignSelf: "center" },
  exerciseLabelEnhanced: { fontSize: 16, fontWeight: "600", color: "#0f172a", fontFamily: "Poppins-SemiBold", textAlign: "center", marginBottom: 10 },
  exerciseProgressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseProgressBar: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  exerciseProgressFill: { height: 6, borderRadius: 3 },
  exerciseProgressText: { fontSize: 12, fontWeight: "600", color: "#475569", fontFamily: "Poppins-SemiBold", minWidth: 35, textAlign: "right" },
  playTimeCardEnhanced: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#eef2ff", borderRadius: 20, padding: 16, marginTop: 8, marginBottom: 16 },
  playTimeIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  playTimeContent: { flex: 1 },
  playTimeLabel: { fontSize: 12, color: "#6366F1", fontFamily: "Poppins-Regular", marginBottom: 2 },
  playTimeValue: { fontSize: 16, fontWeight: "600", color: "#0f172a", fontFamily: "Poppins-SemiBold" },
  playTimeNumber: { color: "#6366F1" },
  playTimeUnit: { fontSize: 13, color: "#64748b", fontFamily: "Poppins-Regular" },

  /* sign out button - ENHANCED */
  signOutButtonEnhanced: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", borderRadius: 20, paddingVertical: 16, marginTop: 24, borderWidth: 1, borderColor: "#fee2e2", shadowColor: "#ef4444", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  signOutTextEnhanced: { fontSize: 15, fontWeight: "600", color: "#ef4444", fontFamily: "Poppins-SemiBold" },

  /* keep original unused styles for compatibility */
  quickCard: {}, quickIcon: {}, quickLabel: {}, sessionCard: {}, sessionRow: {}, chipRow: {}, statusChip: {}, statusChipText: {}, assignCard: {}, assignLeft: {}, assignDot: {}, assignBody: {}, assignTitle: {}, assignDesc: {}, assignMeta: {}, assignMetaText: {}, assignStatus: {}, assignStatusText: {}, moreRow: {}, moreBtn: {}, moreBtnText: {}, physioCard: {}, physioTop: {}, physioInfo: {}, physioName: {}, physioSpec: {}, physioContactRow: {}, physioContactText: {}, availBadge: {}, availText: {}, availNote: {}, unavailWrap: {}, unavailTitle: {}, unavailRow: {}, unavailDate: {}, unavailReason: {}, exerciseGrid: {}, exerciseCard: {}, exerciseIconWrap: {}, exerciseLabel: {}, exerciseActiveChip: {}, exerciseActiveDot: {}, exerciseActiveText: {}, playTimeCard: {}, playTimeText: {}, playTimeBold: {},
});

export default Home;