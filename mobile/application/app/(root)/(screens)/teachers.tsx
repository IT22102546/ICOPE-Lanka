import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/utils/api";

interface UnavailableDate {
  id: string;
  date: string;
  reason?: string | null;
}

interface Physiotherapist {
  id: string;
  name: string;
  role?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  availabilityStatus?: "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE" | string | null;
  availabilityNote?: string | null;
  availabilityUpdatedAt?: string | null;
  unavailableDates?: UnavailableDate[];
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  assignedDoctor?: string | null;
  physioAssignments?: Array<{
    id: string;
    physiotherapist?: Physiotherapist | null;
  }>;
}

const statusMeta: Record<"AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE", { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "#10b981" },
  IN_WORK: { label: "In Work", color: "#3b82f6" },
  NOT_AVAILABLE: { label: "Not Available", color: "#ef4444" },
};

const resolveStatus = (raw?: string | null): "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE" => {
  if (raw === "IN_WORK" || raw === "NOT_AVAILABLE") return raw;
  return "AVAILABLE";
};

const fmtDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const PhysiotherapistDetailsScreen = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChildPhysioDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiFetch("/api/v1/users/my-children", { method: "GET" });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const json = await response.json();
      const data: Child[] = json?.success && Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      setChildren(data);
    } catch (error) {
      console.error("❌ Failed to load physiotherapist details:", error);
      Alert.alert("Error", "Unable to load physiotherapist details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChildPhysioDetails(false);
  }, [fetchChildPhysioDetails]);

  const cards = useMemo(
    () =>
      children.map((child) => {
        const physio = child.physioAssignments?.[0]?.physiotherapist ?? null;
        const status = resolveStatus(physio?.availabilityStatus);
        const nextUnavailable = physio?.unavailableDates?.[0] ?? null;
        return { child, physio, status, nextUnavailable };
      }),
    [children]
  );

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#4B3AFF" />
        <Text style={styles.loadingText}>Loading physiotherapist details…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4B3AFF", "#5C6CFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Physiotherapists</Text>
        <Text style={styles.heroSub}>Availability and contact details for each child’s assigned therapist</Text>
      </LinearGradient>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.child.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchChildPhysioDetails(true)}
            colors={["#4B3AFF"]}
            tintColor="#4B3AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No children found</Text>
            <Text style={styles.emptySub}>Child-linked physiotherapist details will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = statusMeta[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.childHeader}>
                <View style={styles.childAvatar}>
                  <Ionicons name="person" size={16} color="#4B3AFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>
                    {item.child.firstName} {item.child.lastName}
                  </Text>
                  <Text style={styles.childLabel}>Assigned Child</Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: status.color, backgroundColor: `${status.color}14` }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Therapist</Text>
                <Text style={styles.valuePrimary}>
                  {item.physio?.name ?? item.child.assignedDoctor ?? "Not assigned"}
                </Text>
                <Text style={styles.valueSecondary}>
                  {item.physio?.specialization || item.physio?.role || "No specialization"}
                </Text>
              </View>

              {!!item.physio && (
                <>
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Availability</Text>
                    <Text style={styles.valueSecondary}>
                      Last Updated: {item.physio.availabilityUpdatedAt ? fmtDate(item.physio.availabilityUpdatedAt) : "Not updated"}
                    </Text>
                    {!!item.physio.availabilityNote && (
                      <Text style={styles.valueSecondary}>Note: {item.physio.availabilityNote}</Text>
                    )}
                    {!!item.nextUnavailable?.date && (
                      <Text style={styles.valueSecondary}>
                        Next Off: {fmtDate(item.nextUnavailable.date)}
                        {item.nextUnavailable.reason ? ` (${item.nextUnavailable.reason})` : ""}
                      </Text>
                    )}
                  </View>

                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Contact</Text>
                    <View style={styles.rowInline}>
                      <Ionicons name="call-outline" size={14} color="#64748b" />
                      <Text style={styles.valueSecondary}>{item.physio.phone || "Not available"}</Text>
                    </View>
                    <View style={styles.rowInline}>
                      <Ionicons name="mail-outline" size={14} color="#64748b" />
                      <Text style={styles.valueSecondary}>{item.physio.email || "Not available"}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchChildPhysioDetails(false)}>
        <Ionicons name="refresh" size={16} color="#fff" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  heroSub: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.92)",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    paddingTop: 12,
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  childAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  childName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  childLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  sectionBlock: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 9,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  valuePrimary: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  valueSecondary: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  rowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
  },
  emptyWrap: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptySub: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  refreshBtn: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#4B3AFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    elevation: 3,
  },
  refreshText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default PhysiotherapistDetailsScreen;
