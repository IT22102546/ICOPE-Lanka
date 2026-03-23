import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { apiFetch } from "@/utils/api";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Premium Color Palette ───────────────────────────────────────
const COLORS = {
  primary: "#4F46E5", // Rich Indigo
  primaryLight: "#818CF8",
  primarySoft: "#EEF2FF",
  secondary: "#7C3AED", // Vibrant Purple
  success: "#059669", // Deep Emerald
  warning: "#D97706", // Rich Amber
  danger: "#DC2626", // Deep Red
  info: "#2563EB", // Royal Blue
  purple: "#7C3AED",
  pink: "#DB2777",
  
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

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
  avatar?: string | null;
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

const statusConfig = {
  AVAILABLE: {
    label: "Available",
    color: COLORS.success,
    bgColor: COLORS.success + "12",
    icon: "checkmark-circle",
    gradient: [COLORS.success + "20", COLORS.success + "05"] as const,
  },
  IN_WORK: {
    label: "In Work",
    color: COLORS.info,
    bgColor: COLORS.info + "12",
    icon: "time",
    gradient: [COLORS.info + "20", COLORS.info + "05"] as const,
  },
  NOT_AVAILABLE: {
    label: "Not Available",
    color: COLORS.danger,
    bgColor: COLORS.danger + "12",
    icon: "close-circle",
    gradient: [COLORS.danger + "20", COLORS.danger + "05"] as const,
  },
} as const;

const resolveStatus = (raw?: string | null): keyof typeof statusConfig => {
  if (raw === "IN_WORK" || raw === "NOT_AVAILABLE") return raw;
  return "AVAILABLE";
};

const formatDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRelativeTime = (date?: string | null): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  } catch {
    return formatDate(date);
  }
};

const getInitials = (name?: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function PhysiotherapistsTab() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChildPhysioDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
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
    } catch (err: any) {
      setChildren([]);
      setError(err?.message || "Unable to load physiotherapist details.");
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
        const physioName = physio?.name ?? child.assignedDoctor ?? null;
        const status = resolveStatus(physio?.availabilityStatus);
        const nextUnavailable = physio?.unavailableDates?.[0] ?? null;
        return { child, physio, physioName, status, nextUnavailable };
      }),
    [children]
  );

  const dashboardStats = useMemo(() => {
    const total = cards.length;
    const assigned = cards.filter((item) => !!item.physioName).length;
    const available = cards.filter((item) => item.physio && item.status === "AVAILABLE").length;
    const inWork = cards.filter((item) => item.physio && item.status === "IN_WORK").length;
    return { total, assigned, available, inWork };
  }, [cards]);

  const renderHeader = () => (
    <LinearGradient
      colors={["#ffffff", "#f5f3ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerCard}
    >
      <View style={styles.headerTopRow}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="fitness-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Physiotherapists</Text>
          <Text style={styles.headerSubtitle}>
            {cards.length > 0
              ? `${cards.length} assigned therapist${cards.length > 1 ? "s" : ""}`
              : "No therapists assigned"}
          </Text>
        </View>
      </View>

      <View style={styles.headerStatsRow}>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.total}</Text>
          <Text style={styles.headerStatLabel}>Children</Text>
        </View>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.assigned}</Text>
          <Text style={styles.headerStatLabel}>Assigned</Text>
        </View>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.available}</Text>
          <Text style={styles.headerStatLabel}>Available</Text>
        </View>
        <View style={styles.headerStatChip}>
          <Text style={styles.headerStatValue}>{dashboardStats.inWork}</Text>
          <Text style={styles.headerStatLabel}>In Work</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.loadingText}>Loading therapist details...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={cards}
        keyExtractor={(item) => item.child.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchChildPhysioDetails(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={[COLORS.primarySoft, COLORS.slate[100]]}
                style={StyleSheet.absoluteFill}
                borderRadius={56}
              />
              <Ionicons name="people-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Therapists Assigned</Text>
            <Text style={styles.emptyMessage}>
              {error || "Your children's physiotherapists will appear here once assigned."}
            </Text>
            {error && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorBadgeText}>{error}</Text>
              </View>
            )}
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const status = statusConfig[item.status];
          const hasPhysio = !!item.physioName;
          
          return (
            <Animated.View 
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.cardContainer}
            >
              <LinearGradient
                colors={[COLORS.white, COLORS.slate[50]]}
                style={styles.card}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.childInfo}>
                    <LinearGradient
                      colors={[COLORS.primarySoft, COLORS.primary + "10"]}
                      style={styles.childAvatar}
                    >
                      <Text style={styles.childAvatarText}>
                        {getInitials(item.child.firstName + " " + item.child.lastName)}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.childName}>
                        {item.child.firstName} {item.child.lastName}
                      </Text>
                      <View style={styles.childMetaContainer}>
                        <Ionicons name="person-outline" size={12} color={COLORS.slate[400]} />
                        <Text style={styles.childMeta}>
                          Child • {item.child.id.substring(0, 8)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {hasPhysio && item.physio ? (
                    <LinearGradient
                      colors={status.gradient}
                      style={[styles.statusBadge, { borderColor: status.color + "30" }]}
                    >
                      <Ionicons name={status.icon as any} size={14} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </LinearGradient>
                  ) : hasPhysio ? (
                    <View style={[styles.statusBadge, { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary + "30" }]}>
                      <Ionicons name="person-circle-outline" size={14} color={COLORS.primary} />
                      <Text style={[styles.statusText, { color: COLORS.primary }]}>Assigned</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.unassignedBadge]}>
                      <Ionicons name="person-outline" size={14} color={COLORS.slate[500]} />
                      <Text style={[styles.statusText, { color: COLORS.slate[500] }]}>Unassigned</Text>
                    </View>
                  )}
                </View>

                {!hasPhysio ? (
                  <View style={styles.noPhysioContainer}>
                    <LinearGradient
                      colors={[COLORS.slate[100], COLORS.slate[50]]}
                      style={styles.noPhysioIconContainer}
                    >
                      <Ionicons name="person-add-outline" size={32} color={COLORS.slate[400]} />
                    </LinearGradient>
                    <Text style={styles.noPhysioText}>No physiotherapist assigned</Text>
                  </View>
                ) : (
                  <>
                    {/* Therapist Info */}
                    <View style={styles.therapistSection}>
                      <LinearGradient
                        colors={[COLORS.secondary + "08", COLORS.transparent]}
                        style={styles.therapistHeader}
                      >
                        <LinearGradient
                          colors={[COLORS.secondary + "15", COLORS.secondary + "05"]}
                          style={styles.therapistAvatar}
                        >
                          <Text style={styles.therapistAvatarText}>
                            {getInitials(item.physioName)}
                          </Text>
                        </LinearGradient>
                        <View style={styles.therapistInfo}>
                          <Text style={styles.therapistName}>{item.physioName || "Physiotherapist"}</Text>
                          <Text style={styles.therapistSpecialization}>
                            {item.physio?.specialization || item.physio?.role || "Physiotherapist"}
                          </Text>
                        </View>
                      </LinearGradient>

                      {/* Availability Info */}
                      <View style={styles.infoGrid}>
                        {item.physio ? (
                          <View style={styles.infoRow}>
                            <View style={[styles.infoIconContainer, { backgroundColor: status.color + "12" }]}>
                              <Ionicons name={status.icon as any} size={14} color={status.color} />
                            </View>
                            <Text style={styles.infoLabel}>Availability:</Text>
                            <Text style={[styles.infoValue, { color: status.color, fontWeight: '600' }]}>
                              {status.label}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.infoRow}>
                            <View style={[styles.infoIconContainer, { backgroundColor: COLORS.slate[200] }]}>
                              <Ionicons name="help-circle-outline" size={14} color={COLORS.slate[500]} />
                            </View>
                            <Text style={styles.infoLabel}>Availability:</Text>
                            <Text style={[styles.infoValue, { color: COLORS.slate[500] }]}>Assigned via name only</Text>
                          </View>
                        )}

                        {item.physio?.availabilityUpdatedAt && (
                          <View style={styles.infoRow}>
                            <View style={[styles.infoIconContainer, { backgroundColor: COLORS.info + "12" }]}>
                              <Ionicons name="time-outline" size={14} color={COLORS.info} />
                            </View>
                            <Text style={styles.infoLabel}>Last Updated:</Text>
                            <Text style={styles.infoValue}>
                              {formatRelativeTime(item.physio?.availabilityUpdatedAt)}
                            </Text>
                          </View>
                        )}

                        {item.physio?.availabilityNote && (
                          <View style={styles.infoRow}>
                            <View style={[styles.infoIconContainer, { backgroundColor: COLORS.warning + "12" }]}>
                              <Ionicons name="information-circle-outline" size={14} color={COLORS.warning} />
                            </View>
                            <Text style={styles.infoLabel}>Note:</Text>
                            <Text style={styles.infoValue} numberOfLines={2}>
                              {item.physio?.availabilityNote}
                            </Text>
                          </View>
                        )}

                        {item.nextUnavailable?.date && (
                          <View style={styles.infoRow}>
                            <View style={[styles.infoIconContainer, { backgroundColor: COLORS.purple + "12" }]}>
                              <Ionicons name="calendar-outline" size={14} color={COLORS.purple} />
                            </View>
                            <Text style={styles.infoLabel}>Next Off:</Text>
                            <Text style={styles.infoValue}>
                              {formatDate(item.nextUnavailable.date)}
                              {item.nextUnavailable.reason ? ` • ${item.nextUnavailable.reason}` : ""}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Contact Info */}
                      <View style={styles.contactSection}>
                        <Text style={styles.contactTitle}>Contact Information</Text>
                        
                        {item.physio?.phone && (
                          <View style={styles.contactRow}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.success + "12" }]}>
                              <Ionicons name="call-outline" size={16} color={COLORS.success} />
                            </View>
                            <Text style={styles.contactValue}>{item.physio?.phone}</Text>
                          </View>
                        )}
                        
                        {item.physio?.email && (
                          <View style={styles.contactRow}>
                            <View style={[styles.contactIcon, { backgroundColor: COLORS.info + "12" }]}>
                              <Ionicons name="mail-outline" size={16} color={COLORS.info} />
                            </View>
                            <Text style={styles.contactValue}>{item.physio?.email}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
  },
  unassignedBadge: {
    backgroundColor: COLORS.slate[100],
    borderColor: COLORS.slate[200],
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    padding: 18,
    gap: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTopRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 14 
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Poppins-Bold",
    color: COLORS.slate[900],
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  headerStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  headerStatChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary + "15",
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  headerStatValue: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: COLORS.primary,
  },
  headerStatLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[500],
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 36,
    alignItems: "center",
    gap: 16,
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + "10",
  },
  loadingIconContainer: {
    padding: 16,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "08",
  },
  loadingText: {
    fontSize: 17,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[700],
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[400],
  },
  listContent: {
    padding: 16,
    paddingBottom: 140,
  },
  cardContainer: {
    marginBottom: 18,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.primary + "10",
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  childInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  childAvatarText: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: COLORS.primary,
  },
  childName: {
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[900],
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  childMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  childMeta: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  noPhysioContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
    backgroundColor: COLORS.slate[50],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    borderStyle: "dashed",
  },
  noPhysioIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  noPhysioText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  therapistSection: {
    gap: 18,
  },
  therapistHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
  },
  therapistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  therapistAvatarText: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: COLORS.secondary,
  },
  therapistInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[900],
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  therapistSpecialization: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  infoGrid: {
    backgroundColor: COLORS.slate[50],
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[600],
    minWidth: 75,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[700],
    lineHeight: 18,
  },
  contactSection: {
    gap: 12,
    marginTop: 4,
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[600],
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactValue: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[800],
    letterSpacing: -0.2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[800],
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyMessage: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger + "10",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.danger + "20",
  },
  errorBadgeText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.danger,
  },
});