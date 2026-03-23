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

type ChildRef = {
  id: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  diagnosis?: string | null;
};

type AdmissionItem = {
  id: string;
  admissionType?: string;
  status?: string;
  admissionDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  dischargeDate?: string | null;
  deviceAssignedDate?: string | null;
  clinic?: string | null;
  room?: string | null;
  notes?: string | null;
  treatmentPlanPdf?: string | null;
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
    phone?: string;
    address?: string;
  } | null;
  device?: {
    id?: string;
    deviceType?: string;
    serialNumber?: string;
    modelNumber?: string | null;
    manufacturer?: string | null;
    status?: string;
    condition?: string | null;
  } | null;
};

const extractData = (payload: any) => (payload?.success && payload?.data ? payload.data : payload);

const formatDate = (value?: string | null) => {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date not set";
  return parsed.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const formatSessionTime = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Time not set";
  if (start && end) return `${start} - ${end}`;
  return start || end || "Time not set";
};

const statusColor = (status?: string) => {
  const upper = String(status || "").toUpperCase();
  if (upper === "ONGOING") return "#2563eb";
  if (upper === "SCHEDULED") return "#f59e0b";
  if (upper.includes("COMPLETE") || upper === "ATTENDED") return "#16a34a";
  if (upper.includes("ABSENT") || upper.includes("CANCEL")) return "#dc2626";
  if (upper === "ACTIVE") return "#6366f1";
  return "#64748b";
};

export default function AdmissionTrackingScreen() {
  const { currentUser, isSignedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionItem[]>([]);
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
        if (firstChild?.id) return String(firstChild.id);
      }
    } catch {
      // continue
    }

    try {
      const childrenRes = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (childrenRes.ok) {
        const childrenJson = await childrenRes.json();
        const rows = extractData(childrenJson) || [];
        const firstChild = Array.isArray(rows) ? rows[0] : null;
        if (firstChild?.id) return String(firstChild.id);
      }
    } catch {
      // continue
    }

    return null;
  }, [currentUser]);

  const fetchAdmissions = useCallback(async (isRefresh = false) => {
    if (!isSignedIn || !currentUser) {
      setAdmissions([]);
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const childId = await resolveLoggedInChildId();
      if (!childId) {
        setAdmissions([]);
        setError("No child account found for this login.");
        return;
      }

      const response = await apiFetch(
        `/api/v1/users/my-admission-trackings?childId=${encodeURIComponent(childId)}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`Failed to load physical sessions (${response.status})`);
      }

      const json = await response.json();
      const rows: AdmissionItem[] = Array.isArray(extractData(json)) ? extractData(json) : [];
      const filteredByChild = rows.filter((item) => {
        if (item?.child?.id !== childId) return false;
        const type = String(item?.admissionType || "").toUpperCase();
        return !type.includes("ONLINE");
      });
      setAdmissions(filteredByChild);
    } catch (err: any) {
      setAdmissions([]);
      setError(err?.message || "Unable to load physical session details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, isSignedIn, resolveLoggedInChildId]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const statusOptions = useMemo(() => {
    const raw = admissions
      .map((item) => String(item.status || "SCHEDULED").toUpperCase())
      .filter(Boolean);

    const unique = Array.from(new Set(raw));
    const priority = ["SCHEDULED", "ONGOING", "ACTIVE", "ATTENDED_COMPLETE", "COMPLETED", "CANCELLED", "ABSENT_INCOMPLETE"];

    unique.sort((a, b) => {
      const aIndex = priority.indexOf(a);
      const bIndex = priority.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return ["ALL", ...unique];
  }, [admissions]);

  const visibleAdmissions = useMemo(() => {
    if (selectedStatus === "ALL") return admissions;
    return admissions.filter((item) => String(item.status || "SCHEDULED").toUpperCase() === selectedStatus);
  }, [selectedStatus, admissions]);

  const admissionStats = useMemo(() => {
    const total = admissions.length;
    const scheduled = admissions.filter((item) => String(item.status || "").toUpperCase() === "SCHEDULED").length;
    const active = admissions.filter((item) => {
      const status = String(item.status || "").toUpperCase();
      return status === "ONGOING" || status === "ACTIVE";
    }).length;
    return { total, scheduled, active };
  }, [admissions]);

  const openExternalUrl = async (value?: string | null, missingMessage = "Link is not available") => {
    if (!value || !value.trim()) {
      Alert.alert("Not available", missingMessage);
      return;
    }

    const trimmed = value.trim();
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    const canOpen = await Linking.canOpenURL(normalized);
    if (!canOpen) {
      Alert.alert("Cannot open", "This link is not supported on this device.");
      return;
    }

    await Linking.openURL(normalized);
  };

  const callNumber = async (phone?: string) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Cannot open", "Calling is not supported on this device.");
      return;
    }

    await Linking.openURL(url);
  };

  const emailTherapist = async (email?: string) => {
    if (!email) return;
    const url = `mailto:${email}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Cannot open", "Email app is not available on this device.");
      return;
    }

    await Linking.openURL(url);
  };

  if (!isSignedIn || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={28} color="#64748b" />
          <Text style={styles.centerTitle}>Sign in required</Text>
          <Text style={styles.centerDescription}>Please sign in to view physical sessions.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centerDescription}>Loading admission records...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAdmissions(true)} />}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="clipboard-outline" size={18} color="#1d4ed8" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Physical Sessions</Text>
                <Text style={styles.heroSubtitle}>Admission tracking and in-person therapy details</Text>
              </View>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={[styles.heroStatChip, styles.heroStatBlue]}>
                <Text style={styles.heroStatValue}>{admissionStats.total}</Text>
                <Text style={styles.heroStatLabel}>Total</Text>
              </View>
              <View style={[styles.heroStatChip, styles.heroStatAmber]}>
                <Text style={styles.heroStatValue}>{admissionStats.scheduled}</Text>
                <Text style={styles.heroStatLabel}>Scheduled</Text>
              </View>
              <View style={[styles.heroStatChip, styles.heroStatPurple]}>
                <Text style={styles.heroStatValue}>{admissionStats.active}</Text>
                <Text style={styles.heroStatLabel}>Active</Text>
              </View>
            </View>
          </View>

          {!error && admissions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
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
                    <Text style={[styles.filterChipText, { color: isActive ? chipColor : "#475569" }]}>{status}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchAdmissions()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!error && visibleAdmissions.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="clipboard-outline" size={30} color="#64748b" />
              <Text style={styles.centerTitle}>
                {admissions.length === 0 ? "No admission records found" : `No ${selectedStatus.toLowerCase()} admission records found`}
              </Text>
              <Text style={styles.centerDescription}>
                {admissions.length === 0
                  ? "Admission tracking details for this child will appear here."
                  : "Try another admission status filter."}
              </Text>
            </View>
          ) : null}

          {visibleAdmissions.map((item) => {
            const status = String(item.status || "SCHEDULED").toUpperCase();
            const statusBadgeColor = statusColor(status);
            const therapistName = item.physiotherapist?.name || "Not assigned";
            const therapistRole = item.physiotherapist?.specialization || item.physiotherapist?.role || "Physiotherapist";

            return (
              <View key={item.id} style={[styles.card, { borderLeftColor: statusBadgeColor }]}>
                <View style={styles.rowTop}>
                  <View style={styles.dateChip}>
                    <Ionicons name="calendar-outline" size={14} color="#1d4ed8" />
                    <Text style={styles.dateChipText}>{formatDate(item.admissionDate)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: statusBadgeColor, backgroundColor: `${statusBadgeColor}18` }]}>
                    <Text style={[styles.statusText, { color: statusBadgeColor }]}>{status}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="layers-outline" size={14} color="#475569" />
                  <Text style={styles.metaText}>Admission Type: {item.admissionType || "REHAB"}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color="#475569" />
                  <Text style={styles.metaText}>Admission Time: {formatSessionTime(item.startTime, item.endTime)}</Text>
                </View>

                {item.child ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={14} color="#475569" />
                    <Text style={styles.metaText}>
                      Child: {`${item.child.firstName || ""} ${item.child.lastName || ""}`.trim() || "N/A"}
                      {item.child.age ? ` · ${item.child.age} yrs` : ""}
                      {item.child.diagnosis ? ` · ${item.child.diagnosis}` : ""}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <Ionicons name="medkit-outline" size={14} color="#475569" />
                  <Text style={styles.metaText}>Physio: {therapistName} ({therapistRole})</Text>
                </View>

                {item.hospital?.name ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="business-outline" size={14} color="#475569" />
                    <Text style={styles.metaText}>
                      Hospital: {item.hospital.name}
                      {item.hospital.city ? `, ${item.hospital.city}` : ""}
                    </Text>
                  </View>
                ) : null}

                {(item.clinic || item.room) ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="navigate-outline" size={14} color="#475569" />
                    <Text style={styles.metaText}>Location: {[item.clinic, item.room].filter(Boolean).join(" · ")}</Text>
                  </View>
                ) : null}

                {item.device ? (
                  <View style={styles.metaBox}>
                    <Text style={styles.metaBoxTitle}>Assigned Device</Text>
                    <Text style={styles.metaText}>Type: {item.device.deviceType || "N/A"}</Text>
                    <Text style={styles.metaText}>Serial: {item.device.serialNumber || "N/A"}</Text>
                    {item.device.modelNumber ? <Text style={styles.metaText}>Model: {item.device.modelNumber}</Text> : null}
                    {item.device.manufacturer ? <Text style={styles.metaText}>Manufacturer: {item.device.manufacturer}</Text> : null}
                    {item.device.status ? <Text style={styles.metaText}>Status: {item.device.status}</Text> : null}
                    {item.device.condition ? <Text style={styles.metaText}>Condition: {item.device.condition}</Text> : null}
                    {item.deviceAssignedDate ? <Text style={styles.metaText}>Assigned On: {formatDateTime(item.deviceAssignedDate)}</Text> : null}
                  </View>
                ) : null}

                {item.dischargeDate ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="log-out-outline" size={14} color="#475569" />
                    <Text style={styles.metaText}>Discharge: {formatDate(item.dischargeDate)}</Text>
                  </View>
                ) : null}

                {item.notes?.trim() ? <Text style={styles.cardDescription}>{item.notes.trim()}</Text> : null}

                <View style={styles.actionsRow}>
                  {item.treatmentPlanPdf ? (
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => openExternalUrl(item.treatmentPlanPdf, "Treatment plan PDF is not available")}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#fff" />
                      <Text style={styles.primaryActionText}>Treatment Plan</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {(item.physiotherapist?.phone || item.physiotherapist?.email || item.hospital?.phone) ? (
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
                    {item.hospital?.phone ? (
                      <TouchableOpacity style={styles.contactButton} onPress={() => callNumber(item.hospital?.phone)}>
                        <Ionicons name="call-outline" size={15} color="#2563eb" />
                        <Text style={styles.contactText}>Hospital: {item.hospital?.phone}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
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
  heroStatPurple: { backgroundColor: "#f3e8ff", borderColor: "#d8b4fe" },
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
  centerTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a", textAlign: "center" },
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
  metaText: { fontSize: 12, color: "#64748b", flex: 1 },
  metaBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  metaBoxTitle: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 2 },
  cardDescription: {
    marginTop: 2,
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
  },
  actionsRow: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryActionButton: {
    borderRadius: 10,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryActionText: { color: "#fff", fontWeight: "700", fontSize: 12 },
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
