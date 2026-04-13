// apps/frontend/app/(root)/(tabs)/TeacherTransferDashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  FileText,
  Users,
  MapPin,
  BookOpen,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Send,
  Mail,
  Bell,
  Home,
  School,
  Award,
  Megaphone,
  Calendar,
} from "lucide-react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";
import { icons } from "@/constants";

const { width } = Dimensions.get("window");

// Types based on your backend
interface TeacherTransferRequest {
  id: string;
  uniqueId?: string;
  registrationId: string;
  currentSchool: string;
  currentSchoolType?: string;
  currentDistrict: string;
  currentZone: string;
  fromZoneId?: string;
  fromZone?: { id: string; name: string };
  toZoneIds?: string[];
  toZones?: Array<{ id: string; name: string }>;
  subjectId?: string;
  subject?: { id: string; name: string };
  mediumId?: string;
  medium?: { id: string; name: string };
  level: string;
  yearsOfService: number;
  qualifications: string[];
  isInternalTeacher: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;
  notes?: string;
  status: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TransferMatch {
  id: string;
  registrationId: string;
  currentSchool: string;
  currentZone: string;
  desiredZones: string[];
  subject: string;
  medium: string;
  level: string;
  yearsOfService: number;
  matchScore?: number;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface DashboardStats {
  activeRequests: number;
  totalSent: number;
  pendingRequests: number;
  potentialMatches: number;
  verifiedCount: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "urgent";
  date: string;
  isRead: boolean;
}

export default function TeacherHome() {
  const router = useRouter();
  const { currentUser, isSignedIn } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [myRequests, setMyRequests] = useState<TeacherTransferRequest[]>([]);
  const [matches, setMatches] = useState<TransferMatch[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Transfer Window Open",
      content: "2024 Mutual Transfer window is now open until December 31st.",
      type: "info",
      date: "2024-11-15",
      isRead: false,
    },
    {
      id: "2",
      title: "Document Verification",
      content: "Ensure all your documents are verified before applying for transfers.",
      type: "warning",
      date: "2024-11-10",
      isRead: true,
    },
    {
      id: "3",
      title: "New Matching Algorithm",
      content: "Improved matching algorithm launched for better compatibility.",
      type: "success",
      date: "2024-11-05",
      isRead: true,
    },
  ]);
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    totalSent: 0,
    pendingRequests: 0,
    potentialMatches: 0,
    verifiedCount: 0,
  });

  // Check authentication and fetch data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!isSignedIn) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to access transfer dashboard",
          [
            {
              text: "Sign In",
              onPress: () => router.replace("/(auth)/selectSignIn"),
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }
      await fetchDashboardData();
    };

    checkAuthAndFetch();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      console.log("📊 Fetching dashboard data...");

      // Fetch all data in parallel
      const [requestsRes, matchesRes, messagesRes] = await Promise.allSettled([
        apiFetch("/api/v1/transfer/my-requests"),
        apiFetch("/api/v1/transfer/matches"),
        apiFetch("/api/v1/transfer/messages/unread-count"),
      ]);

      // Process my requests
      let requests: TeacherTransferRequest[] = [];
      if (requestsRes.status === "fulfilled" && requestsRes.value.ok) {
        const data = await requestsRes.value.json();
        console.log("📥 My requests data:", data);

        // Handle different response formats
        if (Array.isArray(data)) {
          requests = data;
        } else if (data.data && Array.isArray(data.data)) {
          requests = data.data;
        } else if (data.items && Array.isArray(data.items)) {
          requests = data.items;
        }

        // Sort by date (newest first)
        requests.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMyRequests(requests);
      }

      // Process matches
      let matchesData: TransferMatch[] = [];
      if (matchesRes.status === "fulfilled" && matchesRes.value.ok) {
        const data = await matchesRes.value.json();
        console.log("📥 Matches data:", data);

        if (Array.isArray(data)) {
          matchesData = data;
        } else if (data.data && Array.isArray(data.data)) {
          matchesData = data.data;
        } else if (data.matches && Array.isArray(data.matches)) {
          matchesData = data.matches;
        }

        // Calculate match scores if not provided
        const matchesWithScores = matchesData.map((match) => ({
          ...match,
          matchScore: match.matchScore || calculateMatchScore(match),
        }));

        // Sort by match score (highest first)
        matchesWithScores.sort(
          (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
        );
        setMatches(matchesWithScores);
      }

      // Process unread messages
      if (messagesRes.status === "fulfilled" && messagesRes.value.ok) {
        const data = await messagesRes.value.json();
        const count = data.count || data.data?.count || 0;
        setUnreadMessages(count);
      }

      // Calculate stats
      const activeRequests = requests.filter(
        (r) => !["CANCELLED", "COMPLETED"].includes(r.status)
      ).length;

      const pendingRequests = requests.filter(
        (r) => r.status === "PENDING"
      ).length;

      const verifiedCount = requests.filter(
        (r) => r.verified || r.status === "VERIFIED"
      ).length;

      setStats({
        activeRequests,
        totalSent: requests.length,
        pendingRequests,
        potentialMatches: matchesData.length,
        verifiedCount,
      });
    } catch (error: any) {
      console.error("❌ Failed to fetch dashboard data:", error);

      // Handle 401/403 errors
      if (error.message?.includes("401") || error.message?.includes("403")) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please sign in again.",
          [
            {
              text: "Sign In",
              onPress: () => {
                useAuthStore.getState().signOut();
                router.replace("/(auth)/selectSignIn");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load dashboard data. Please try again."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate match score based on various factors
  const calculateMatchScore = (match: TransferMatch): number => {
    let score = 50; // Base score

    // Add points for years of service (more experience = higher score)
    const years = match.yearsOfService || 0;
    if (years > 10) score += 20;
    else if (years > 5) score += 15;
    else if (years > 2) score += 10;
    else if (years > 0) score += 5;

    // Ensure score is between 0-100
    return Math.min(Math.max(score, 0), 100);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  // Get status badge
  const getStatusBadge = (status: string, verified: boolean) => {
    let backgroundColor = "#6B7280";
    let textColor = "#fff";
    let statusText = status;

    switch (status) {
      case "PENDING":
        backgroundColor = "#F59E0B";
        statusText = "Pending";
        break;
      case "VERIFIED":
        backgroundColor = "#10B981";
        statusText = "Verified";
        break;
      case "MATCHED":
        backgroundColor = "#8B5CF6";
        statusText = "Matched";
        break;
      case "ACCEPTED":
        backgroundColor = "#3B82F6";
        statusText = "Accepted";
        break;
      case "COMPLETED":
        backgroundColor = "#10B981";
        statusText = "Completed";
        break;
      case "CANCELLED":
        backgroundColor = "#EF4444";
        statusText = "Cancelled";
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {statusText} {verified ? "✓" : ""}
        </Text>
      </View>
    );
  };

  // Get announcement color
  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "info":
        return "#3B82F6";
      case "warning":
        return "#F59E0B";
      case "success":
        return "#10B981";
      case "urgent":
        return "#EF4444";
      default:
        return "#3B82F6";
    }
  };

  // Render stat card
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    onPress,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Icon size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  // Render quick action card
  const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    color,
    onPress,
  }: {
    title: string;
    description: string;
    icon: any;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + "20" }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  // Render announcement card
  const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
    const color = getAnnouncementColor(announcement.type);
    
    return (
      <TouchableOpacity style={styles.announcementCard}>
        <View style={styles.announcementHeader}>
          <View style={styles.announcementTitleRow}>
            <View style={[styles.announcementBadge, { backgroundColor: color + "20" }]}>
              <Megaphone size={14} color={color} />
            </View>
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            {!announcement.isRead && (
              <View style={styles.unreadDot} />
            )}
          </View>
          <Text style={styles.announcementDate}>
            <Calendar size={12} color="#9CA3AF" /> {new Date(announcement.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.announcementContent} numberOfLines={2}>
          {announcement.content}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render request card
  const RequestCard = ({ request }: { request: TeacherTransferRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => router.push(`/(root)/(tabs)/TransferDetails?id=${request.id}`)}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestId}>
            {request.uniqueId || `TRF-${request.id.slice(0, 8)}`}
          </Text>
          <Text style={styles.requestSchool}>{request.currentSchool}</Text>
        </View>
        {getStatusBadge(request.status, request.verified)}
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.detailText}>From: {request.currentZone}</Text>
        </View>

        <View style={styles.detailRow}>
          <BookOpen size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {request.subject?.name || request.subjectId} •{" "}
            {request.medium?.name || request.mediumId}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Award size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {request.yearsOfService} years experience
          </Text>
        </View>
      </View>

      <Text style={styles.requestDate}>
        Created: {new Date(request.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  // Render match card
  const MatchCard = ({ match }: { match: TransferMatch }) => {
    const matchScoreColor =
      match.matchScore || 0 >= 80
        ? "#10B981"
        : match.matchScore || 0 >= 60
          ? "#F59E0B"
          : "#EF4444";

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() =>
          router.push(`/teacher/transfer/search?highlight=${match.id}`)
        }
      >
        <View style={styles.matchHeader}>
          <View style={styles.matchInfo}>
            <Text style={styles.matchSchool}>{match.currentSchool}</Text>
            <Text style={styles.matchTeacher}>
              {match.teacher
                ? `${match.teacher.firstName} ${match.teacher.lastName}`
                : "Teacher"}
            </Text>
          </View>
          <View
            style={[
              styles.matchScoreBadge,
              { backgroundColor: matchScoreColor + "20" },
            ]}
          >
            <Text style={[styles.matchScoreText, { color: matchScoreColor }]}>
              {match.matchScore || 0}% match
            </Text>
          </View>
        </View>

        <View style={styles.matchDetails}>
          <View style={styles.detailRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.detailText}>{match.currentZone}</Text>
            <Text style={styles.detailText}>→</Text>
            <Text style={styles.detailText}>
              {match.desiredZones?.join(", ") || "Multiple zones"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <BookOpen size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {match.subject} • {match.medium} • {match.level}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0057FF" />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text className="font-Poppins" style={styles.headerTitle}>Welcome, <Text className="text-lg font-Poppins">{currentUser?.firstName || "Teacher"} !</Text></Text>
            <Text style={styles.headerSubtitle}>
              Manage your mutual transfers
            </Text>
          </View>
          {unreadMessages > 0 && (
            <TouchableOpacity
              style={styles.notificationBadge}
              onPress={() => router.push("/teacher/transfer/messages")}
            >
              <Bell size={20} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessages}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Requests"
            value={stats.activeRequests}
            icon={Send}
            color="#3B82F6"
            subtitle={`${stats.totalSent} total`}
            onPress={() => router.push("/teacher/transfer/details")}
          />

          <StatCard
            title="Pending"
            value={stats.pendingRequests}
            icon={Clock}
            color="#F59E0B"
            subtitle="Awaiting verification"
          />

          <StatCard
            title="Verified"
            value={stats.verifiedCount}
            icon={CheckCircle}
            color="#10B981"
            subtitle="Ready for matching"
          />

          <StatCard
            title="Matches"
            value={stats.potentialMatches}
            icon={Users}
            color="#8B5CF6"
            subtitle="Potential swaps"
            onPress={() => router.push("/(root)/(tabs)/SearchMatches")}
          />
        </View>

        {/* Quick Actions*/} 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
           {/*} <QuickActionCard
              title="New Transfer Request"
              description="Create a new mutual transfer request"
              icon={Send}
              color="#3B82F6"
              onPress={() =>
                router.push("/(root)/(tabs)/CreateTransferRequest")
              }
            />*/}

            <QuickActionCard
              title="Search & Match"
              description="Find compatible teachers"
              icon={Users}
              color="#8B5CF6"
              onPress={() => router.push("/(root)/(tabs)/SearchMatches")}
            />

            <QuickActionCard
              title="My Request"
              description="View latest transfer request"
              icon={FileText}
              color="#10B981"
              onPress={() => router.push(RequestCard.length > 0 ? `/(root)/(tabs)/TransferDetails?id=${myRequests[0].id}` : "/(root)/(tabs)/CreateTransferRequest" )}
            />
          </View>
        </View>

        {/* Announcements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity
              onPress={() => router.push("/teacher/announcements")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.announcementsList}>
            {announcements.slice(0, 2).map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </View>
        </View>

        {/* Top Matches */}
        {matches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Matches</Text>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/SearchMatches")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.matchesList}>
              {matches.slice(0, 3).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </View>
          </View>
        )}

        {/* Empty State - No Requests */}
        {myRequests.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Image
                source={icons.Pkg}
                style={styles.emptyIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.emptyTitle}>No Transfer Requests Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first mutual transfer request to find compatible
              teachers
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() =>
                router.push("/(root)/(tabs)/CreateTransferRequest")
              }
            >
              <Text style={styles.createButtonText}>
                Create Transfer Request
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    paddingTop: 16, // Add padding at top to account for header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  header: {
    backgroundColor: "#0057FF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
    fontFamily: "Inter-SemiBold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  notificationBadge: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0057FF",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  statsGrid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter-Regular",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  viewAllText: {
    fontSize: 14,
    color: "#4F46E5",
    fontFamily: "Inter-Medium",
  },
  quickActions: {
    gap: 8,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    fontFamily: "Inter-SemiBold",
  },
  actionDescription: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Regular",
  },
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  announcementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  announcementBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginLeft: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter-Regular",
  },
  announcementContent: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 8,
  },
  requestId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  requestSchool: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter-Regular",
    flexWrap: "wrap",
  },
  requestDetails: {
    gap: 6,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
    fontFamily: "Inter-Regular",
    flexShrink: 1,
  },
  requestDate: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter-Regular",
  },
  matchesList: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
    marginRight: 8,
  },
  matchSchool: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
    flexWrap: "wrap",
  },
  matchTeacher: {
    fontSize: 14,
    color: "#4F46E5",
    marginTop: 2,
    fontFamily: "Inter-Medium",
  },
  matchScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  matchScoreText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  matchDetails: {
    gap: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconImage: {
    width: 40,
    height: 40,
    tintColor: "#4F46E5",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
    fontFamily: "Inter-Regular",
  },
  createButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 200,
    elevation: 3,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
  },
  bottomSpacer: {
    height: 110,
  },
});