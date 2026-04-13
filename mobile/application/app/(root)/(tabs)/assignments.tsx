import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "@/stores/authStore";
import { apiFetch } from "@/utils/api";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_KEY || "";

const normalizeBaseUrl = (value?: string) => (value || "").trim().replace(/\/+$/, "");

const getBaseOrigin = () => {
  const normalized = normalizeBaseUrl(configuredBaseUrl);
  if (!normalized) return "";
  try {
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
};

const resolveRemoteUrl = (value?: string) => {
  if (!value) return "";
  const input = value.trim();
  if (!input) return "";

  const base = normalizeBaseUrl(configuredBaseUrl);
  const baseOrigin = getBaseOrigin();

  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const parsed = new URL(input);
      const localhostHosts = new Set(["localhost", "127.0.0.1", "10.0.2.2"]);
      if (localhostHosts.has(parsed.hostname) && baseOrigin) {
        return `${baseOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return input;
    } catch {
      return input;
    }
  }

  if (!base) return input;
  return input.startsWith("/") ? `${base}${input}` : `${base}/${input}`;
};

type AssignmentItem = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  dueDate?: string | null;
  assignmentPdf?: string | null;
  assignmentPdfName?: string | null;
  child?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
  physiotherapist?: {
    id?: string;
    name?: string;
    specialization?: string;
  };
};

type MobileProfileResponse = {
  parent?: {
    id?: string;
  };
  children?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
  }>;
};

const formatDate = (value?: string | null) => {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return parsed.toLocaleDateString();
};

const extractProfileData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

const extractAssignments = (payload: any): AssignmentItem[] => {
  const root = payload?.success && payload?.data ? payload.data : payload;

  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.assignments)) return root.assignments;
  if (Array.isArray(root?.data?.assignments)) return root.data.assignments;
  if (Array.isArray(payload?.assignments)) return payload.assignments;

  return [];
};

export default function AssignmentsScreen() {
  const { currentUser, isSignedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [childName, setChildName] = useState<string>("");

  const resolveLoggedInChildId = useCallback(async (): Promise<string | null> => {
    const directCandidates = [
      (currentUser as any)?.childId,
      (currentUser as any)?.child?.id,
      (currentUser as any)?.profile?.childId,
      (currentUser as any)?.studentProfile?.childId,
      (currentUser as any)?.id,
      (currentUser as any)?._id,
    ].filter(Boolean);

    if (directCandidates.length > 0) {
      return String(directCandidates[0]);
    }

    try {
      const profileRes = await apiFetch("/api/v1/users/profile", { method: "GET" });
      if (profileRes.ok) {
        const profileJson = await profileRes.json();
        const profileData = extractProfileData(profileJson);
        const profileChildId =
          profileData?.childId ||
          profileData?.child?.id ||
          profileData?.studentProfile?.childId ||
          profileData?.patientProfile?.childId ||
          profileData?.id;
        if (profileChildId) return String(profileChildId);
      }
    } catch {
      // continue fallback
    }

    try {
      const mobileRes = await apiFetch("/api/v1/users/mobile/profile", { method: "GET" });
      if (mobileRes.ok) {
        const mobileJson = await mobileRes.json();
        const mobileData: MobileProfileResponse = extractProfileData(mobileJson);
        const firstChild = Array.isArray(mobileData?.children) ? mobileData.children[0] : null;
        if (firstChild?.id) {
          const fullName = `${firstChild.firstName || ""} ${firstChild.lastName || ""}`.trim();
          if (fullName) setChildName(fullName);
          return firstChild.id;
        }
      }
    } catch {
      // continue fallback
    }

    try {
      const childrenRes = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (childrenRes.ok) {
        const childrenJson = await childrenRes.json();
        const rows =
          childrenJson?.success && Array.isArray(childrenJson?.data)
            ? childrenJson.data
            : Array.isArray(childrenJson)
              ? childrenJson
              : [];
        const firstChild = rows[0];
        if (firstChild?.id) {
          const fullName = `${firstChild.firstName || ""} ${firstChild.lastName || ""}`.trim();
          if (fullName) setChildName(fullName);
          return String(firstChild.id);
        }
      }
    } catch {
      // no-op
    }

    return null;
  }, [currentUser]);

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    if (!isSignedIn || !currentUser) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const childId = await resolveLoggedInChildId();

      const baseRes = await apiFetch("/api/v1/users/my-assignments", {
        method: "GET",
      });

      let rows: AssignmentItem[] = [];

      if (baseRes.ok) {
        const baseJson = await baseRes.json();
        rows = extractAssignments(baseJson);
      } else if (childId) {
        const childRes = await apiFetch(
          `/api/v1/users/my-assignments?childId=${encodeURIComponent(childId)}`,
          { method: "GET" }
        );

        if (!childRes.ok) {
          throw new Error(`Failed to load assignments (${baseRes.status})`);
        }

        const childJson = await childRes.json();
        rows = extractAssignments(childJson);
      } else {
        throw new Error(`Failed to load assignments (${baseRes.status})`);
      }

      const scopedRows = childId
        ? rows.filter((item) => !item?.child?.id || item.child.id === childId)
        : rows;

      const finalRows = scopedRows.length > 0 ? scopedRows : rows;

      if (!childName && finalRows[0]?.child) {
        const inferredName = `${finalRows[0].child?.firstName || ""} ${finalRows[0].child?.lastName || ""}`.trim();
        if (inferredName) setChildName(inferredName);
      }

      setAssignments(finalRows);
    } catch (err: any) {
      setAssignments([]);
      setError(err?.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [childName, currentUser, isSignedIn, resolveLoggedInChildId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const subtitle = useMemo(() => {
    if (childName) return `Assignments for ${childName}`;
    const name = `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim();
    return name ? `Assignments for ${name}` : "Child assignments";
  }, [childName, currentUser?.firstName, currentUser?.lastName]);

  const assignmentStats = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((item) => String(item.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
    const completed = assignments.filter((item) => {
      const value = String(item.status || "").toUpperCase();
      return value.includes("COMPLETE") || value.includes("DONE");
    }).length;
    return { total, active, completed };
  }, [assignments]);

  const statusBadgeColor = (status?: string | null) => {
    const value = String(status || "ACTIVE").toUpperCase();
    if (value.includes("COMPLETE") || value.includes("DONE")) return "#16a34a";
    if (value.includes("PENDING") || value.includes("DRAFT")) return "#f59e0b";
    if (value.includes("HOLD") || value.includes("LATE")) return "#dc2626";
    return "#2563eb";
  };

  const openPdf = async (url?: string | null) => {
    const resolved = resolveRemoteUrl(url || "");
    if (!resolved) {
      Alert.alert("Not available", "This assignment does not have an attached file.");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(resolved);
      if (!canOpen) {
        Alert.alert("Cannot open", "This assignment file cannot be opened on this device.");
        return;
      }
      await Linking.openURL(resolved);
    } catch {
      Alert.alert("Open failed", "Unable to open assignment file.");
    }
  };

  if (!isSignedIn || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={28} color="#64748b" />
          <Text style={styles.centerTitle}>Sign in required</Text>
          <Text style={styles.centerDescription}>Please sign in to view assignments.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="document-text-outline" size={18} color="#1d4ed8" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Assignments</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statChip, styles.statChipBlue]}>
            <Text style={styles.statValue}>{assignmentStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statChip, styles.statChipAmber]}>
            <Text style={styles.statValue}>{assignmentStats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statChip, styles.statChipGreen]}>
            <Text style={styles.statValue}>{assignmentStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centerDescription}>Loading assignments...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignments(true)} />}
        >
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchAssignments()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!error && assignments.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="document-text-outline" size={30} color="#64748b" />
              <Text style={styles.centerTitle}>No assignments found</Text>
              <Text style={styles.centerDescription}>
                New assignments for this child will appear here.
              </Text>
            </View>
          ) : null}

          {assignments.map((item) => {
            const accentColor = statusBadgeColor(item.status);
            return (
            <View key={item.id} style={[styles.card, { borderLeftColor: accentColor }]}> 
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      borderColor: statusBadgeColor(item.status),
                      backgroundColor: `${statusBadgeColor(item.status)}1A`,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusBadgeColor(item.status) }]}>
                    {String(item.status || "ACTIVE").toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.metaText}>Due: {formatDate(item.dueDate)}</Text>
              {item.physiotherapist?.name ? (
                <Text style={styles.metaText}>Physiotherapist: {item.physiotherapist.name}</Text>
              ) : null}
              <Text style={styles.cardDescription}>
                {item.description?.trim() || "No description provided."}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: accentColor },
                    !item.assignmentPdf && styles.actionDisabled,
                  ]}
                  onPress={() => openPdf(item.assignmentPdf)}
                  disabled={!item.assignmentPdf}
                >
                  <Ionicons name="document-outline" size={16} color="#fff" />
                  <Text style={styles.actionText}>Open PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          )})}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 12,
    gap: 10,
  },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  headerTextWrap: { flex: 1 },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  statChipBlue: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  statChipAmber: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  statChipGreen: { backgroundColor: "#ecfdf5", borderColor: "#86efac" },
  statValue: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#64748b" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
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
    gap: 7,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardDescription: { marginTop: 4, fontSize: 13, color: "#334155", lineHeight: 18 },
  metaText: { fontSize: 12, color: "#64748b" },
  actionsRow: { marginTop: 8, flexDirection: "row", alignItems: "center" },
  actionButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
