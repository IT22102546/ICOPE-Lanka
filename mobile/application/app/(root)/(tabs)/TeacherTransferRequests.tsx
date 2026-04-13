import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  Paperclip,
  ChevronRight,
  Filter,
  X,
  Calendar,
  MapPin,
  School,
  User,
  Award,
  Mail,
  Home,
  Send,
  Users,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  ArrowRight,
  FileText,
  Download,
  Building,
  BookOpen,
  Mail as MailIcon,
  Phone,
} from "lucide-react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";

const { width } = Dimensions.get("window");

// Types based on your backend DTOs
interface TransferRequest {
  id: string;
  uniqueId?: string;
  registrationId?: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  fromZone?: { id: string; name: string } | string;
  toZones?: Array<{ id: string; name: string }>;
  subject?: { id: string; name: string } | string;
  medium?: { id: string; name: string } | string;
  currentSchool: string;
  currentSchoolType?: string;
  currentDistrict?: string;
  currentZone: string;
  yearsOfService?: number;
  qualifications: string[];
  isInternalTeacher: boolean;
  preferredSchoolTypes: string[];
  additionalRequirements?: string;
  notes?: string;
  status: string;
  verified: boolean;
  verifiedAt?: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

interface TransferMatch {
  id: string;
  matchScore?: number;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: string;
  };
  currentSchool: string;
  currentZone: string;
  desiredZones: string[];
  subject: string;
  medium: string;
  level: string;
  yearsOfService: number;
}

interface TransferStats {
  activeRequests?: number;
  totalSent?: number;
  pendingRequests?: number;
  potentialMatches?: number;
  verifiedCount?: number;
  reqSend?: number;
  reqReceived?: number;
  pendingApproval?: number;
}

// Helper function to extract field name
const getFieldName = (field: any): string => {
  if (!field) return "Unknown";
  if (typeof field === "string") return field;
  if (field.name) return field.name;
  return "Unknown";
};

export default function TeacherTransferRequests() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewId = params.view as string;

  const { currentUser, isSignedIn } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

  // Data states
  const [sentRequests, setSentRequests] = useState<TransferRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<TransferRequest[]>(
    []
  );
  const [stats, setStats] = useState<TransferStats>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<TransferRequest | null>(null);

  // Action dialogs
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "accept" | "decline" | "withdraw"
  >("accept");
  const [actionLoading, setActionLoading] = useState(false);

  // Message modal
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!isSignedIn) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to access transfer requests",
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
      await fetchData();
    };

    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (viewId && (sentRequests.length > 0 || receivedRequests.length > 0)) {
      const found =
        sentRequests.find((r) => r.id === viewId) ||
        receivedRequests.find((r) => r.id === viewId);
      if (found) {
        setSelectedRequest(found);
        setDetailModalVisible(true);
      }
    }
  }, [viewId, sentRequests, receivedRequests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyRequests(),
        fetchReceivedRequests(),
        fetchStats(),
      ]);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await apiFetch("/api/v1/transfer/browse");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSentRequests(Array.isArray(data) ? data : data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch sent requests:", error);
      throw error;
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      const response = await apiFetch("/api/v1/transfer/matches");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReceivedRequests(Array.isArray(data) ? data : data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch received requests:", error);
      // If endpoint doesn't exist, set empty array
      setReceivedRequests([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiFetch("/api/v1/transfer/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchRequestDetail = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/v1/transfer/${requestId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedRequest(data);
      setDetailModalVisible(true);
    } catch (error: any) {
      console.error("Failed to fetch request detail:", error);
      Alert.alert("Error", "Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      switch (actionType) {
        case "accept":
          await apiFetch(`/api/v1/transfer/${selectedRequest.id}/accept`, {
            method: "POST",
            body: JSON.stringify({
              notes: "Request accepted",
            }),
          });
          Alert.alert("Success", "Transfer request accepted");
          break;
        case "decline":
        case "withdraw":
          await apiFetch(`/api/v1/transfer/${selectedRequest.id}`, {
            method: "DELETE",
          });
          Alert.alert(
            "Success",
            `Transfer request ${actionType === "decline" ? "declined" : "withdrawn"}`
          );
          break;
      }

      await fetchData();
      setShowActionDialog(false);
      setDetailModalVisible(false);
    } catch (error: any) {
      console.error(`Failed to ${actionType} request:`, error);
      Alert.alert("Error", error.message || `Failed to ${actionType} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || !messageText.trim()) return;

    try {
      setSendingMessage(true);
      const response = await apiFetch("/api/v1/transfer/messages", {
        method: "POST",
        body: JSON.stringify({
          transferRequestId: selectedRequest.id,
          content: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      Alert.alert("Success", "Message sent successfully");
      setMessageText("");
      setMessageModalVisible(false);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApiError = (error: any) => {
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
      Alert.alert("Error", "Failed to load data. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      PENDING: {
        color: "#F59E0B",
        bgColor: "#FEF3C7",
        label: "Pending",
        icon: Clock,
      },
      VERIFIED: {
        color: "#3B82F6",
        bgColor: "#DBEAFE",
        label: "Verified",
        icon: CheckCircle,
      },
      ACCEPTED: {
        color: "#10B981",
        bgColor: "#D1FAE5",
        label: "Accepted",
        icon: CheckCircle,
      },
      REJECTED: {
        color: "#EF4444",
        bgColor: "#FEE2E2",
        label: "Rejected",
        icon: XCircle,
      },
      COMPLETED: {
        color: "#059669",
        bgColor: "#D1FAE5",
        label: "Completed",
        icon: CheckCircle,
      },
      CANCELLED: {
        color: "#EF4444",
        bgColor: "#FEE2E2",
        label: "Cancelled",
        icon: XCircle,
      },
    };

    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const filterRequests = (requests: TransferRequest[]) => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.uniqueId?.toLowerCase().includes(term) ||
          request.currentSchool.toLowerCase().includes(term) ||
          request.currentZone.toLowerCase().includes(term) ||
          getFieldName(request.subject).toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const canWithdraw = (request: TransferRequest) => {
    return ["PENDING", "VERIFIED"].includes(request.status);
  };

  const canRespond = (request: TransferRequest) => {
    return request.status === "PENDING";
  };

  // Render Stats Cards
  const StatCard = ({ title, value, color, icon: Icon }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Render Request Card
  const RequestCard = ({
    request,
    type,
  }: {
    request: TransferRequest;
    type: "sent" | "received";
  }) => {
    const statusConfig = getStatusBadge(request.status);
    const StatusIcon = statusConfig.icon;
    const canWithdrawRequest = type === "sent" && canWithdraw(request);
    const canRespondRequest = type === "received" && canRespond(request);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => fetchRequestDetail(request.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.subject}>
                {getFieldName(request.subject)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusConfig.bgColor },
                ]}
              >
                <StatusIcon size={12} color={statusConfig.color} />
                <Text
                  style={[styles.statusText, { color: statusConfig.color }]}
                >
                  {statusConfig.label}
                </Text>
              </View>
            </View>
            <Text style={styles.schoolName}>{request.uniqueId}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>From Zone:</Text>
              <Text style={styles.detailValue}>
                {getFieldName(request.fromZone)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>To Zones:</Text>
              <View style={styles.tags}>
                {request.toZones?.slice(0, 2).map((zone, idx) => (
                  <View key={idx} style={styles.smallTag}>
                    <Text style={styles.smallTagText}>
                      {getFieldName(zone)}
                    </Text>
                  </View>
                ))}
                {request.toZones && request.toZones.length > 2 && (
                  <View style={styles.moreTag}>
                    <Text style={styles.moreTagText}>
                      +{request.toZones.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Medium:</Text>
              <Text style={styles.detailValue}>
                {getFieldName(request.medium)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Level:</Text>
              <Text style={styles.detailValue}>
                {request.level?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Experience:</Text>
              <Text style={styles.detailValue}>
                {request.yearsOfService || 0} years
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={(e) => {
              e.stopPropagation();
              fetchRequestDetail(request.id);
            }}
          >
            <Eye size={16} color="#4F46E5" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          {canRespondRequest && (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(request);
                  setActionType("accept");
                  setShowActionDialog(true);
                }}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(request);
                  setActionType("decline");
                  setShowActionDialog(true);
                }}
              >
                <XCircle size={16} color="#EF4444" />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}

          {canWithdrawRequest && (
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedRequest(request);
                setActionType("withdraw");
                setShowActionDialog(true);
              }}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = ({ type }: { type: "sent" | "received" }) => (
    <View style={styles.emptyState}>
      <Send size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>No {type} requests yet</Text>
      <Text style={styles.emptyStateText}>
        {type === "sent"
          ? "Start searching for compatible matches to send requests"
          : "You haven't received any transfer requests yet"}
      </Text>
      {type === "sent" && (
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/(root)/(tabs)/SearchMatches")}
        >
          <ArrowRight size={20} color="#fff" />
          <Text style={styles.searchButtonText}>Start Searching</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render Detail Modal
  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      animationType="slide"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={() => setDetailModalVisible(false)}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Transfer Request Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedRequest && (
          <ScrollView style={styles.modalContent}>
            {/* Status */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionLabel}>Status:</Text>
              <View
                style={[
                  styles.detailStatusBadge,
                  {
                    backgroundColor: getStatusBadge(selectedRequest.status)
                      .bgColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.detailStatusText,
                    { color: getStatusBadge(selectedRequest.status).color },
                  ]}
                >
                  {getStatusBadge(selectedRequest.status).label}
                </Text>
              </View>
            </View>

            {/* Registration Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registration Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Registration ID:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.registrationId || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Years of Service:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.yearsOfService || 0} years
                  </Text>
                </View>
              </View>
            </View>

            {/* Current School */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current School</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>School:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentSchool}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentSchoolType || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>District:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentDistrict || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Zone:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.currentZone}
                  </Text>
                </View>
              </View>
            </View>

            {/* Transfer Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transfer Preferences</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>From Zone:</Text>
                  <Text style={styles.infoValue}>
                    {getFieldName(selectedRequest.fromZone)}
                  </Text>
                </View>
                {selectedRequest.toZones &&
                  selectedRequest.toZones.length > 0 && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Desired Zones:</Text>
                      <View style={styles.tagsContainer}>
                        {selectedRequest.toZones.map((zone, idx) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>
                              {getFieldName(zone)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
              </View>
            </View>

            {/* Teaching Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Teaching Details</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Subject:</Text>
                  <Text style={styles.infoValue}>
                    {getFieldName(selectedRequest.subject)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medium:</Text>
                  <Text style={styles.infoValue}>
                    {getFieldName(selectedRequest.medium)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Level:</Text>
                  <Text style={styles.infoValue}>
                    {selectedRequest.level?.toUpperCase()}
                  </Text>
                </View>
                {selectedRequest.qualifications &&
                  selectedRequest.qualifications.length > 0 && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Qualifications:</Text>
                      <View style={styles.tagsContainer}>
                        {selectedRequest.qualifications.map((qual, idx) => (
                          <View
                            key={idx}
                            style={[styles.tag, styles.qualificationTag]}
                          >
                            <Text
                              style={[
                                styles.tagText,
                                styles.qualificationTagText,
                              ]}
                            >
                              {qual}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
              </View>
            </View>

            {/* Additional Information */}
            {(selectedRequest.additionalRequirements ||
              selectedRequest.notes) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {selectedRequest.additionalRequirements && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Requirements:</Text>
                    <Text style={styles.infoValue}>
                      {selectedRequest.additionalRequirements}
                    </Text>
                  </View>
                )}
                {selectedRequest.notes && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Notes:</Text>
                    <Text style={styles.infoValue}>
                      {selectedRequest.notes}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Attachments */}
            {selectedRequest.attachments &&
              selectedRequest.attachments.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Attachments</Text>
                  <View style={styles.attachmentsContainer}>
                    {selectedRequest.attachments.map((attachment, idx) => (
                      <View key={idx} style={styles.attachmentItem}>
                        <FileText size={16} color="#6B7280" />
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {attachment.split("/").pop() || attachment}
                        </Text>
                        <TouchableOpacity style={styles.downloadButton}>
                          <Download size={16} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Dates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Updated:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedRequest.updatedAt).toLocaleString()}
                  </Text>
                </View>
                {selectedRequest.verifiedAt && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Verified:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedRequest.verifiedAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {selectedRequest.status === "PENDING" && (
                <>
                  {activeTab === "received" && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptActionButton]}
                        onPress={() => {
                          setSelectedRequest(selectedRequest);
                          setActionType("accept");
                          setShowActionDialog(true);
                        }}
                      >
                        <CheckCircle size={20} color="#fff" />
                        <Text style={styles.acceptActionText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.declineActionButton,
                        ]}
                        onPress={() => {
                          setSelectedRequest(selectedRequest);
                          setActionType("decline");
                          setShowActionDialog(true);
                        }}
                      >
                        <XCircle size={20} color="#EF4444" />
                        <Text style={styles.declineActionText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {activeTab === "sent" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.withdrawActionButton]}
                      onPress={() => {
                        setSelectedRequest(selectedRequest);
                        setActionType("withdraw");
                        setShowActionDialog(true);
                      }}
                    >
                      <Trash2 size={20} color="#EF4444" />
                      <Text style={styles.withdrawActionText}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={styles.modalSpacer} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Render Action Dialog
  const renderActionDialog = () => (
    <Modal
      visible={showActionDialog}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowActionDialog(false)}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContainer}>
          <AlertCircle size={48} color="#EF4444" />

          <Text style={styles.dialogTitle}>
            {actionType === "accept" && "Accept Transfer Request?"}
            {actionType === "decline" && "Decline Transfer Request?"}
            {actionType === "withdraw" && "Withdraw Transfer Request?"}
          </Text>

          <Text style={styles.dialogMessage}>
            {actionType === "accept" &&
              "By accepting, you agree to proceed with this mutual transfer. This action cannot be undone."}
            {actionType === "decline" &&
              "The sender will be notified of your decision. This action cannot be undone."}
            {actionType === "withdraw" &&
              "Your transfer request will be cancelled and removed from the system."}
          </Text>

          <View style={styles.dialogButtons}>
            <TouchableOpacity
              style={[styles.dialogButton, styles.dialogCancelButton]}
              onPress={() => setShowActionDialog(false)}
              disabled={actionLoading}
            >
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dialogButton,
                actionType === "accept"
                  ? styles.dialogAcceptButton
                  : actionType === "decline"
                    ? styles.dialogDeclineButton
                    : styles.dialogWithdrawButton,
              ]}
              onPress={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.dialogActionText}>
                  {actionType === "accept" && "Yes, Accept"}
                  {actionType === "decline" && "Yes, Decline"}
                  {actionType === "withdraw" && "Yes, Withdraw"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const currentRequests =
    activeTab === "sent" ? sentRequests : receivedRequests;
  const filteredRequests = filterRequests(currentRequests);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <StatCard
          title="Sent "
          value={stats.reqSend || sentRequests.length}
          color="#3B82F6"
          icon={Send}
        />
        <StatCard
          title="Received "
          value={stats.reqReceived || receivedRequests.length}
          color="#22C55E"
          icon={Send}
        />
        <StatCard
          title="Pending"
          value={
            stats.pendingApproval ||
            sentRequests.filter((r) => r.status === "PENDING").length +
              receivedRequests.filter((r) => r.status === "PENDING").length
          }
          color="#F59E0B"
          icon={Clock}
        />
        <StatCard
          title="Verified"
          value={
            stats.verifiedCount ||
            sentRequests.filter((r) => r.status === "VERIFIED").length +
              receivedRequests.filter((r) => r.status === "VERIFIED").length
          }
          color="#10B981"
          icon={CheckCircle}
        />
      </ScrollView>
      <View className="justify-end content-end flex-row mb- mr-4">
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchData}
          disabled={loading}
        >
          <RefreshCw size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "sent" && styles.activeTab]}
          onPress={() => setActiveTab("sent")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "sent" && styles.activeTabText,
            ]}
          >
            Transfer Requests({sentRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "received" && styles.activeTab]}
          onPress={() => setActiveTab("received")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "received" && styles.activeTabText,
            ]}
          >
            Received Requests({receivedRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search requests..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#4F46E5" />
          <Text style={styles.filterButtonText}>Filter</Text>
          {showFilters ? (
            <ChevronUp size={16} color="#4F46E5" />
          ) : (
            <ChevronDown size={16} color="#4F46E5" />
          )}
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFiltersContainer}
        >
          <TouchableOpacity
            style={[
              styles.statusFilter,
              statusFilter === "all" && styles.activeStatusFilter,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.statusFilterText,
                statusFilter === "all" && styles.activeStatusFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {[
            "PENDING",
            "VERIFIED",
            "ACCEPTED",
            "REJECTED",
            "COMPLETED",
            "CANCELLED",
          ].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilter,
                statusFilter === status && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.activeStatusFilterText,
                ]}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard request={item} type={activeTab} />
        )}
        ListEmptyComponent={<EmptyState type={activeTab} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {renderDetailModal()}
      {renderActionDialog()}
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  refreshButton: {
    padding: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  statCard: {
    width: 120,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#4F46E5",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "Inter-SemiBold",
  },
  filtersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    fontFamily: "Inter-Medium",
  },
  statusFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  statusFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeStatusFilter: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  statusFilterText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  activeStatusFilterText: {
    color: "#fff",
    fontFamily: "Inter-SemiBold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  subject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  schoolName: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Regular",
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    width: "48%",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
    fontFamily: "Inter-Medium",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  smallTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallTagText: {
    fontSize: 10,
    color: "#4B5563",
    fontFamily: "Inter-Medium",
  },
  moreTag: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreTagText: {
    fontSize: 10,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    color: "#4F46E5",
    fontFamily: "Inter-SemiBold",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#10B981",
    borderRadius: 6,
  },
  acceptButtonText: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "Inter-SemiBold",
  },
  declineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  declineButtonText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter-SemiBold",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  withdrawButtonText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter-SemiBold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Inter-Regular",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    fontFamily: "Inter-SemiBold",
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontFamily: "Inter-Medium",
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#4B5563",
    fontFamily: "Inter-Medium",
  },
  qualificationTag: {
    backgroundColor: "#E0F2FE",
  },
  qualificationTagText: {
    color: "#0369A1",
  },
  attachmentsContainer: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    fontFamily: "Inter-Regular",
  },
  downloadButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  acceptActionButton: {
    backgroundColor: "#10B981",
  },
  acceptActionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  declineActionButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  declineActionText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  withdrawActionButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  withdrawActionText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  modalSpacer: {
    height: 40,
  },
  // Dialog Styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dialogContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  dialogMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: "Inter-Regular",
  },
  dialogButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dialogButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  dialogCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  dialogCancelText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  dialogAcceptButton: {
    backgroundColor: "#10B981",
  },
  dialogDeclineButton: {
    backgroundColor: "#EF4444",
  },
  dialogWithdrawButton: {
    backgroundColor: "#EF4444",
  },
  dialogActionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
});
