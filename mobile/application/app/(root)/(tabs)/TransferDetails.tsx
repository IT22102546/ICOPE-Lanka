// apps/frontend/app/teacher/transfer/details.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  School,
  MapPin,
  BookOpen,
  Award,
  MessageSquare,
  Calendar,
  User,
  Building,
  FileText,
  ChevronRight,
  Mail,
  Phone,
  Home,
} from "lucide-react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";

// Types
interface TransferRequest {
  id: string;
  uniqueId: string;
  requesterId: string;
  fromZoneId: string;
  subjectId: string;
  mediumId: string;
  level: string;
  currentSchool: string;
  currentSchoolType?: string;
  currentDistrictId?: string;
  yearsOfService?: number;
  qualifications: string[];
  isInternalTeacher: boolean;
  preferredSchoolTypes: string[];
  additionalRequirements?: string;
  notes?: string;
  status: TransferRequestStatus;
  approvalStatus: ApprovalStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  attachments: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  acceptanceNotes?: string;
  // Relations
  fromZone?: { id: string; name: string; code: string };
  currentDistrict?: { id: string; name: string; code: string };
  subject?: { id: string; name: string; code: string };
  medium?: { id: string; name: string; code: string };
  desiredZones?: Array<{ id: string; zone: { id: string; name: string } }>;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
}

type TransferRequestStatus = 
  | "PENDING" 
  | "VERIFIED" 
  | "ACCEPTED" 
  | "REJECTED" 
  | "COMPLETED" 
  | "CANCELLED";

type ApprovalStatus = 
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export default function TransferDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transfer, setTransfer] = useState<TransferRequest | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Get transfer ID from params or from my requests
  const transferId = params.id as string;

  useEffect(() => {
    if (transferId) {
      loadTransferDetails();
    }
  }, [transferId]);

  const loadTransferDetails = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const authStore = useAuthStore.getState();
      if (!authStore.isSignedIn || !authStore.accessToken) {
        Alert.alert("Authentication Required", "Please sign in to view transfer details");
        router.replace("/(auth)/selectSignIn");
        return;
      }

      // Fetch transfer details
      const response = await apiFetch(`/api/v1/transfer/${transferId}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert("Not Found", "Transfer request not found");
          router.back();
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTransfer(data);
      
    } catch (error: any) {
      console.error("Failed to load transfer details:", error);
      
      if (error.message?.includes("401") || error.message?.includes("403")) {
        Alert.alert("Session Expired", "Your session has expired. Please sign in again.");
        useAuthStore.getState().signOut();
        router.replace("/(auth)/selectSignIn");
        return;
      }
      
      Alert.alert("Error", "Failed to load transfer details");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransferDetails();
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push({
      pathname: "/(root)/(tabs)/EditTransferRequest",
      params: { id: transferId }
    });
  };

  const handleDelete = async () => {
    if (!transfer) return;

    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/v1/transfer/${transferId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      Alert.alert(
        "Success",
        "Transfer request cancelled successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error("Delete error:", error);
      
      if (error.message?.includes("401") || error.message?.includes("403")) {
        Alert.alert("Session Expired", "Your session has expired. Please sign in again.");
        useAuthStore.getState().signOut();
        router.replace("/(auth)/selectSignIn");
        return;
      }
      
      Alert.alert("Error", error.message || "Failed to cancel transfer request");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusConfig = (status: TransferRequestStatus) => {
    const configs = {
      PENDING: { 
        color: "#F59E0B", 
        icon: Clock, 
        label: "Pending Review", 
        bgColor: "#FEF3C7",
        description: "Your application is under review"
      },
      VERIFIED: { 
        color: "#10B981", 
        icon: CheckCircle, 
        label: "Verified", 
        bgColor: "#D1FAE5",
        description: "Your documents have been verified"
      },
      ACCEPTED: { 
        color: "#10B981", 
        icon: CheckCircle, 
        label: "Accepted", 
        bgColor: "#D1FAE5",
        description: "Transfer request has been accepted"
      },
      REJECTED: { 
        color: "#EF4444", 
        icon: XCircle, 
        label: "Rejected", 
        bgColor: "#FEE2E2",
        description: "Transfer request has been rejected"
      },
      COMPLETED: { 
        color: "#3B82F6", 
        icon: CheckCircle, 
        label: "Completed", 
        bgColor: "#DBEAFE",
        description: "Transfer process completed"
      },
      CANCELLED: { 
        color: "#6B7280", 
        icon: XCircle, 
        label: "Cancelled", 
        bgColor: "#F3F4F6",
        description: "Transfer request was cancelled"
      },
    };
    return configs[status] || configs.PENDING;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatQualifications = (qualifications: string[]) => {
    if (!qualifications || qualifications.length === 0) return "Not specified";
    return qualifications.map(q => {
      // Format qualification names
      const qualMap: Record<string, string> = {
        "BSc": "Bachelor of Science",
        "BSc(Maths)": "BSc in Mathematics",
        "PGDE": "Postgraduate Diploma in Education",
        "PGD": "Postgraduate Diploma",
        "Trained_Graduate": "Trained Graduate",
        "Untrained_Graduate": "Untrained Graduate",
        "NCOE": "National College of Education",
        "BEd": "Bachelor of Education",
        "MEd": "Master of Education",
        "MSc": "Master of Science",
        "PhD": "Doctor of Philosophy",
      };
      return qualMap[q] || q;
    }).join(', ');
  };

  const formatSchoolType = (type?: string) => {
    if (!type) return "Not specified";
    const typeMap: Record<string, string> = {
      "1AB": "Type 1AB",
      "1C": "Type 1C",
      "2": "Type 2",
      "3": "Type 3",
      "PRIMARY": "Primary School",
      "SECONDARY": "Secondary School",
      "NATIONAL": "National School",
      "CENTRAL": "Central School",
    };
    return typeMap[type] || type;
  };

  const renderInfoItem = (
    icon: React.ReactNode,
    label: string,
    value: string,
    color: string = "#111827"
  ) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color }]}>{value || "Not specified"}</Text>
      </View>
    </View>
  );

  const renderSection = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          {icon}
        </View>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading transfer details...</Text>
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push("/(root)/(tabs)/TeacherHome")} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Transfer Details</Text>
            <Text style={styles.headerSubtitle}>Not Found</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Transfer request not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTransferDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(transfer.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.push("/(root)/(tabs)/TeacherHome")} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Transfer Details</Text>
            <Text style={styles.headerSubtitle}>Application ID: {transfer.uniqueId}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {transfer.status !== "COMPLETED" && transfer.status !== "CANCELLED" && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEdit}
              >
                <Edit2 size={20} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bgColor }]}>
          <View style={styles.statusContent}>
            <statusConfig.icon size={24} color={statusConfig.color} />
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
              <Text style={styles.statusDescription}>
                {statusConfig.description}
              </Text>
            </View>
          </View>
          <Text style={styles.statusTimestamp}>
            Last updated: {formatDate(transfer.updatedAt)}
          </Text>
        </View>

        {/* Applicant Information */}
        {renderSection(
          "Applicant Information",
          "Your personal and contact details",
          <User size={20} color="#4F46E5" />,
          <>
            {renderInfoItem(
              <User size={20} color="#6B7280" />,
              "Name",
              `${transfer.requester?.firstName || ""} ${transfer.requester?.lastName || ""}`
            )}
            {renderInfoItem(
              <Mail size={20} color="#6B7280" />,
              "Email",
              transfer.requester?.email || ""
            )}
            {transfer.requester?.phone && renderInfoItem(
              <Phone size={20} color="#6B7280" />,
              "Phone",
              transfer.requester.phone
            )}
            {renderInfoItem(
              <Calendar size={20} color="#6B7280" />,
              "Years of Service",
              transfer.yearsOfService ? `${transfer.yearsOfService} years` : "Not specified"
            )}
          </>
        )}

        {/* Current School Information */}
        {renderSection(
          "Current School",
          "Details about your current placement",
          <School size={20} color="#4F46E5" />,
          <>
            {renderInfoItem(
              <Building size={20} color="#6B7280" />,
              "School Name",
              transfer.currentSchool
            )}
            {renderInfoItem(
              <School size={20} color="#6B7280" />,
              "School Type",
              formatSchoolType(transfer.currentSchoolType)
            )}
            {transfer.currentDistrict && renderInfoItem(
              <MapPin size={20} color="#6B7280" />,
              "District",
              transfer.currentDistrict.name
            )}
            {transfer.fromZone && renderInfoItem(
              <MapPin size={20} color="#6B7280" />,
              "Current Zone",
              transfer.fromZone.name
            )}
          </>
        )}

        {/* Teaching Details */}
        {renderSection(
          "Teaching Details",
          "Your subject, medium, and qualifications",
          <BookOpen size={20} color="#4F46E5" />,
          <>
            {transfer.subject && renderInfoItem(
              <BookOpen size={20} color="#6B7280" />,
              "Subject",
              transfer.subject.name
            )}
            {transfer.medium && renderInfoItem(
              <BookOpen size={20} color="#6B7280" />,
              "Medium",
              transfer.medium.name
            )}
            {renderInfoItem(
              <Award size={20} color="#6B7280" />,
              "Level",
              transfer.level
            )}
            {renderInfoItem(
              <Award size={20} color="#6B7280" />,
              "Qualifications",
              formatQualifications(transfer.qualifications)
            )}
          </>
        )}

        {/* Transfer Preferences */}
        {renderSection(
          "Transfer Preferences",
          "Your desired transfer options",
          <MapPin size={20} color="#4F46E5" />,
          <>
            {transfer.desiredZones && transfer.desiredZones.length > 0 && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Home size={20} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Desired Zones</Text>
                  <View style={styles.tagsContainer}>
                    {transfer.desiredZones.map((dz, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{dz.zone.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
            {transfer.preferredSchoolTypes && transfer.preferredSchoolTypes.length > 0 && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <School size={20} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Preferred School Types</Text>
                  <View style={styles.tagsContainer}>
                    {transfer.preferredSchoolTypes.map((type, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{formatSchoolType(type)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Additional Information */}
        {(transfer.additionalRequirements || transfer.notes) && renderSection(
          "Additional Information",
          "Requirements and notes",
          <MessageSquare size={20} color="#4F46E5" />,
          <>
            {transfer.additionalRequirements && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <FileText size={20} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Additional Requirements</Text>
                  <Text style={styles.infoValue}>{transfer.additionalRequirements}</Text>
                </View>
              </View>
            )}
            {transfer.notes && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MessageSquare size={20} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{transfer.notes}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Internal Teacher Status */}
        {renderSection(
          "Transfer Type",
          "Internal or external transfer",
          <User size={20} color="#4F46E5" />,
          renderInfoItem(
            <User size={20} color="#6B7280" />,
            "Transfer Type",
            transfer.isInternalTeacher ? "Internal Teacher Transfer" : "External Transfer",
            transfer.isInternalTeacher ? "#10B981" : "#6B7280"
          )
        )}

        {/* Timeline Information */}
        {renderSection(
          "Application Timeline",
          "Important dates and updates",
          <Calendar size={20} color="#4F46E5" />,
          <>
            {renderInfoItem(
              <Calendar size={20} color="#6B7280" />,
              "Application Submitted",
              formatDate(transfer.createdAt)
            )}
            {transfer.verifiedAt && renderInfoItem(
              <Calendar size={20} color="#6B7280" />,
              "Verified On",
              formatDate(transfer.verifiedAt)
            )}
            {transfer.completedAt && renderInfoItem(
              <Calendar size={20} color="#6B7280" />,
              "Completed On",
              formatDate(transfer.completedAt)
            )}
          </>
        )}

        {/* Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogIcon}>
              <AlertCircle size={48} color="#EF4444" />
            </View>
            <Text style={styles.dialogTitle}>Cancel Transfer Request?</Text>
            <Text style={styles.dialogMessage}>
              This action cannot be undone. Your transfer request will be permanently cancelled.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={() => setShowDeleteDialog(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Keep Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmButton}
                onPress={handleDelete}
              >
                <Text style={styles.dialogConfirmButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  scrollView: {
    flex: 1,
    paddingVertical: 16,
  },
  statusBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  statusDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  statusTimestamp: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 36,
    fontFamily: "Inter-Regular",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  sectionBody: {
    paddingTop: 8,
  },
  infoItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  infoIcon: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontFamily: "Inter-Medium",
  },
  infoValue: {
    fontSize: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#4B5563",
    fontFamily: "Inter-Medium",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  dialogIcon: {
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
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
  dialogCancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    alignItems: "center",
  },
  dialogCancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  dialogConfirmButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    alignItems: "center",
  },
  dialogConfirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    fontFamily: "Inter-Medium",
  },
  retryButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  bottomSpacer: {
    height: 40,
  },
});