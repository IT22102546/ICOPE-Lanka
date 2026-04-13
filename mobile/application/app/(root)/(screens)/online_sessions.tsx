import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "@/stores/authStore";
import { apiFetch } from "@/utils/api";

type ChildRef = {
  id: string;
  firstName?: string;
  lastName?: string;
};

type OnlineSessionItem = {
  id: string;
  admissionDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
  notes?: string | null;
  link?: string | null;
  meetingLink?: string | null;
  onlineLink?: string | null;
  sessionLink?: string | null;
  url?: string | null;
  child?: ChildRef;
  physiotherapist?: {
    id?: string;
    name?: string;
    role?: string;
    specialization?: string;
    phone?: string;
    email?: string;
  } | null;
  hospital?: {
    id?: string;
    name?: string;
    city?: string;
  } | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date not set";
  return parsed.toLocaleDateString();
};

const formatSessionTime = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Time not set";
  if (start && end) return `${start} - ${end}`;
  return start || end || "Time not set";
};

const extractFirstUrl = (text?: string | null) => {
  if (!text) return "";
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] || "";
};

const statusColor = (status?: string) => {
  const upper = String(status || "").toUpperCase();
  if (upper === "ONGOING") return "#2563eb";
  if (upper === "SCHEDULED") return "#f59e0b";
  if (upper.includes("COMPLETE") || upper === "ATTENDED") return "#16a34a";
  if (upper.includes("ABSENT") || upper.includes("CANCEL")) return "#dc2626";
  return "#64748b";
};

const extractData = (payload: any) => (payload?.success && payload?.data ? payload.data : payload);

export default function OnlineSessionsScreen() {
  const { currentUser, isSignedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<OnlineSessionItem[]>([]);
  const [childName, setChildName] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const resolveLoggedInChildId = useCallback(async (): Promise<string | null> => {
    const role = String((currentUser as any)?.role || "").toUpperCase();
    const isStudentLogin = role.includes("STUDENT");

    const directCandidates = [
      (currentUser as any)?.childId,
      (currentUser as any)?.child?.id,
      (currentUser as any)?.profile?.childId,
      (currentUser as any)?.studentProfile?.childId,
      ...(isStudentLogin ? [(currentUser as any)?.id, (currentUser as any)?._id] : []),
    ].filter(Boolean);

    if (directCandidates.length > 0) return String(directCandidates[0]);

    try {
      const mobileRes = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });
      if (mobileRes.ok) {
        const mobileJson = await mobileRes.json();
        const mobileData = extractData(mobileJson);
        const firstChild = Array.isArray(mobileData?.children) ? mobileData.children[0] : null;
        if (firstChild?.id) {
          const fullName = `${firstChild.firstName || ""} ${firstChild.lastName || ""}`.trim();
          if (fullName) setChildName(fullName);
          return String(firstChild.id);
        }
      }
    } catch {
      // continue
    }

    try {
      const childrenRes = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (childrenRes.ok) {
        const childrenJson = await childrenRes.json();
        const rows: ChildRef[] = extractData(childrenJson) || [];
        const firstChild = Array.isArray(rows) ? rows[0] : null;
        if (firstChild?.id) {
          const fullName = `${firstChild.firstName || ""} ${firstChild.lastName || ""}`.trim();
          if (fullName) setChildName(fullName);
          return String(firstChild.id);
        }
      }
    } catch {
      // continue
    }

    return null;
  }, [currentUser]);

  const fetchSessions = useCallback(async (isRefresh = false) => {
    if (!isSignedIn || !currentUser) {
      setSessions([]);
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const childId = await resolveLoggedInChildId();
      if (!childId) {
        setSessions([]);
        setError("No child account found for this login.");
        return;
      }

      const response = await apiFetch(
        `/api/v1/users/my-online-sessions?childId=${encodeURIComponent(childId)}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`Failed to load sessions (${response.status})`);
      }

      const json = await response.json();
      const rows: OnlineSessionItem[] = Array.isArray(extractData(json)) ? extractData(json) : [];

      const filtered = rows.filter((item) => item?.child?.id === childId);
      setSessions(filtered);

      if (!childName && filtered[0]?.child) {
        const inferred = `${filtered[0].child?.firstName || ""} ${filtered[0].child?.lastName || ""}`.trim();
        if (inferred) setChildName(inferred);
      }
    } catch (err: any) {
      setSessions([]);
      setError(err?.message || "Unable to load online sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [childName, currentUser, isSignedIn, resolveLoggedInChildId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const statusOptions = useMemo(() => {
    const raw = sessions
      .map((item) => String(item.status || "SCHEDULED").toUpperCase())
      .filter(Boolean);

    const unique = Array.from(new Set(raw));
    const priority = ["SCHEDULED", "ONGOING", "ATTENDED", "COMPLETED", "CANCELLED", "ABSENT"];

    unique.sort((a, b) => {
      const aIndex = priority.indexOf(a);
      const bIndex = priority.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return ["ALL", ...unique];
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    if (selectedStatus === "ALL") return sessions;
    return sessions.filter((item) => String(item.status || "SCHEDULED").toUpperCase() === selectedStatus);
  }, [selectedStatus, sessions]);

  const sessionStats = useMemo(() => {
    const total = sessions.length;
    const scheduled = sessions.filter((item) => String(item.status || "").toUpperCase() === "SCHEDULED").length;
    const ongoing = sessions.filter((item) => String(item.status || "").toUpperCase() === "ONGOING").length;
    return { total, scheduled, ongoing };
  }, [sessions]);

  const callNumber = async (phone?: string) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }

    Alert.alert("Cannot open", "Calling is not supported on this device.");
  };

  const emailTherapist = async (email?: string) => {
    if (!email) return;
    const url = `mailto:${email}`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }

    Alert.alert("Cannot open", "Email app is not available on this device.");
  };

  const openSessionLink = async (link?: string | null) => {
    if (!link || !link.trim()) {
      Alert.alert("Link unavailable", "This session does not have a meeting link yet.");
      return;
    }

    const trimmed = link.trim();
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const can = await Linking.canOpenURL(normalized);
    if (can) {
      await Linking.openURL(normalized);
      return;
    }

    Alert.alert("Cannot open", "This meeting link is not supported on this device.");
  };

  if (!isSignedIn || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={28} color="#64748b" />
          <Text style={styles.centerTitle}>Sign in required</Text>
          <Text style={styles.centerDescription}>Please sign in to view online sessions.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centerDescription}>Loading sessions...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchSessions(true)} />}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="videocam-outline" size={18} color="#1d4ed8" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Online Sessions</Text>
                <Text style={styles.heroSubtitle}>Live and scheduled therapy sessions</Text>
              </View>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={[styles.heroStatChip, styles.heroStatBlue]}>
                <Text style={styles.heroStatValue}>{sessionStats.total}</Text>
                <Text style={styles.heroStatLabel}>Total</Text>
              </View>
              <View style={[styles.heroStatChip, styles.heroStatAmber]}>
                <Text style={styles.heroStatValue}>{sessionStats.scheduled}</Text>
                <Text style={styles.heroStatLabel}>Scheduled</Text>
              </View>
              <View style={[styles.heroStatChip, styles.heroStatGreen]}>
                <Text style={styles.heroStatValue}>{sessionStats.ongoing}</Text>
                <Text style={styles.heroStatLabel}>Ongoing</Text>
              </View>
            </View>
          </View>

          {!error && sessions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {statusOptions.map((status) => {
                const isActive = selectedStatus === status;
                const chipColor = status === "ALL" ? "#2563eb" : statusColor(status);

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: isActive ? chipColor : "#cbd5e1",
                        backgroundColor: isActive ? `${chipColor}18` : "#fff",
                      },
                    ]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isActive ? chipColor : "#475569" },
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchSessions()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!error && visibleSessions.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="videocam-outline" size={30} color="#64748b" />
              <Text style={styles.centerTitle}>
                {sessions.length === 0 ? "No online sessions found" : `No ${selectedStatus.toLowerCase()} sessions found`}
              </Text>
              <Text style={styles.centerDescription}>
                {sessions.length === 0
                  ? "Scheduled online sessions for this child will appear here."
                  : "Try another meeting status filter."}
              </Text>
            </View>
          ) : null}

          {visibleSessions.map((item) => {
            const therapistName = item.physiotherapist?.name || "Not assigned";
            const therapistRole = item.physiotherapist?.specialization || item.physiotherapist?.role || "Physiotherapist";
            const status = String(item.status || "SCHEDULED").toUpperCase();
            const badgeColor = statusColor(status);
            const sessionLink =
              item.meetingLink ||
              item.onlineLink ||
              item.sessionLink ||
              item.link ||
              item.url ||
              extractFirstUrl(item.notes);

            return (
              <View key={item.id} style={[styles.card, { borderLeftColor: badgeColor }]}>
                <View style={styles.rowTop}>
                  <View style={styles.dateChip}>
                    <Ionicons name="calendar-outline" size={14} color="#1d4ed8" />
                    <Text style={styles.dateChipText}>{formatDate(item.admissionDate)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: badgeColor, backgroundColor: `${badgeColor}18` }]}>
                    <Text style={[styles.statusText, { color: badgeColor }]}>{status}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color="#475569" />
                  <Text style={styles.metaText}>Time: {formatSessionTime(item.startTime, item.endTime)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={14} color="#475569" />
                  <Text style={styles.metaText}>Therapist: {therapistName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="medkit-outline" size={14} color="#475569" />
                  <Text style={styles.metaText}>Specialization: {therapistRole}</Text>
                </View>
                {item.hospital?.name ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="business-outline" size={14} color="#475569" />
                    <Text style={styles.metaText}>
                      Hospital: {item.hospital.name}{item.hospital.city ? `, ${item.hospital.city}` : ""}
                    </Text>
                  </View>
                ) : null}

                {item.notes?.trim() ? (
                  <Text style={styles.cardDescription}>{item.notes.trim()}</Text>
                ) : null}

                {sessionLink ? (
                  <TouchableOpacity style={styles.joinButton} onPress={() => openSessionLink(sessionLink)}>
                    <Ionicons name="videocam" size={16} color="#fff" />
                    <Text style={styles.joinText}>Join Session</Text>
                  </TouchableOpacity>
                ) : null}

                {(item.physiotherapist?.phone || item.physiotherapist?.email) && (
                  <View style={styles.contactRow}>
                    {item.physiotherapist?.phone ? (
                      <TouchableOpacity style={styles.contactButton} onPress={() => callNumber(item.physiotherapist?.phone)}>
                        <Ionicons name="call-outline" size={15} color="#2563eb" />
                        <Text style={styles.contactText}>{item.physiotherapist?.phone}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {item.physiotherapist?.email ? (
                      <TouchableOpacity style={styles.contactButton} onPress={() => emailTherapist(item.physiotherapist?.email)}>
                        <Ionicons name="mail-outline" size={15} color="#2563eb" />
                        <Text style={styles.contactText}>{item.physiotherapist?.email}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 140 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  heroSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  heroStatsRow: { flexDirection: "row", gap: 8 },
  heroStatChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  heroStatBlue: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  heroStatAmber: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  heroStatGreen: { backgroundColor: "#ecfdf5", borderColor: "#86efac" },
  heroStatValue: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  heroStatLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  filtersRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  centerTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a" },
  centerDescription: { fontSize: 14, color: "#64748b", textAlign: "center" },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { color: "#991b1b", fontSize: 13 },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    marginBottom: 14,
    gap: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dateChipText: { fontSize: 12, fontWeight: "600", color: "#1e3a8a" },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  metaText: { fontSize: 12, color: "#64748b" },
  cardDescription: {
    marginTop: 2,
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
  },
  joinButton: {
    marginTop: 2,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  joinText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  contactRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eff6ff",
  },
  contactText: { color: "#1e40af", fontSize: 12, fontWeight: "500" },
});
