import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";

const { width: screenWidth } = Dimensions.get("window");
const sc = (n: number) => Math.round((screenWidth / 390) * n);
const API = process.env.EXPO_PUBLIC_API_KEY;

interface HealthCareStaff {
  _id: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  status?: string;
  availabilityStatus?: "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE" | string | null;
  availabilityNote?: string | null;
  availabilityUpdatedAt?: string | null;
  patientCount?: number;
}

const statusMeta: Record<"AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE", { label: string; color: string }> = {
  AVAILABLE:     { label: "Available",     color: "#10b981" },
  IN_WORK:       { label: "In Work",       color: "#3b82f6" },
  NOT_AVAILABLE: { label: "Not Available", color: "#ef4444" },
};

const resolveStatus = (raw?: string | null): "AVAILABLE" | "IN_WORK" | "NOT_AVAILABLE" => {
  if (raw === "IN_WORK" || raw === "NOT_AVAILABLE") return raw;
  return "AVAILABLE";
};

const staffName = (s: HealthCareStaff) =>
  s.name || `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.email || "Unknown";

const staffInitials = (s: HealthCareStaff) =>
  staffName(s).split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase() || "?";

const HealthCareStaffScreen = () => {
  const router = useRouter();
  const { currentUser, getAccessToken } = useAuthStore();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  const [staffList, setStaffList] = useState<HealthCareStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HealthCareStaff | null>(null);
  const [actionModal, setActionModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = await getAccessToken();
      if (!token) return;

      // Primary: GET /api/physiotherapists (same endpoint as admin dashboard)
      let list: HealthCareStaff[] = [];

      const res = await fetch(`${API}/api/physiotherapists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        // Dashboard response key is "physiotherapists"
        list = json.physiotherapists || json.users || json.staff || (Array.isArray(json) ? json : []);
      }

      // Fallback: try alternate endpoints with same auth pattern
      if (list.length === 0) {
        const fallbacks = [
          `${API}/api/users?role=PHYSIOTHERAPIST`,
          `${API}/api/users?role=HEALTH_CARE_STAFF`,
          `${API}/api/doctors`,
        ];
        for (const url of fallbacks) {
          try {
            const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) {
              const j = await r.json();
              const raw = j.physiotherapists ?? j.users ?? j.staff ?? j.doctors ?? j.data ?? (Array.isArray(j) ? j : []);
              if (raw.length > 0) { list = raw; break; }
            }
          } catch (_) { /* try next */ }
        }
      }

      setStaffList(list);
    } catch (error) {
      console.error("❌ Failed to load health care staff:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff(false);
  }, [fetchStaff]);

  const handleDelete = () => {
    if (!selected) return;
    Alert.alert(
      "Remove Health Care Staff",
      `Are you sure you want to remove ${staffName(selected)}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await getAccessToken();
              const sid = selected._id || selected.id;
              // DELETE /api/physiotherapists/:id (same as dashboard line 88)
              const res = await fetch(`${API}/api/physiotherapists/${sid}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error("Delete failed");
              setActionModal(false);
              setSelected(null);
              fetchStaff(false);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove staff member");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const filtered = staffList.filter((s) => {
    const q = search.toLowerCase();
    return (
      staffName(s).toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.specialization?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  });

  const renderCard = ({ item }: { item: HealthCareStaff }) => {
    const avail = resolveStatus(item.availabilityStatus);
    const meta = statusMeta[avail];
    const active = item.isActive !== false && item.status !== "INACTIVE";
    const initials = staffInitials(item);

    return (
      <View style={styles.card}>
        {/* Card top row */}
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.staffName} numberOfLines={1}>{staffName(item)}</Text>
            <Text style={styles.staffRole} numberOfLines={1}>
              {item.specialization || item.role || "Health Care Staff"}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.availBadge, { borderColor: meta.color, backgroundColor: meta.color + "14" }]}>
                <View style={[styles.dot, { backgroundColor: meta.color }]} />
                <Text style={[styles.availText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              {!active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Inactive</Text>
                </View>
              )}
            </View>
          </View>

          {/* Admin action button */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => { setSelected(item); setActionModal(true); }}
            >
              <Ionicons name="ellipsis-vertical" size={sc(18)} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Contact row */}
        <View style={styles.contactRow}>
          {item.phone && (
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={sc(13)} color="#64748b" />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={sc(13)} color="#64748b" />
              <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
            </View>
          )}
        </View>

        {/* Availability note */}
        {!!item.availabilityNote && (
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={sc(13)} color="#94a3b8" />
            <Text style={styles.noteText}>{item.availabilityNote}</Text>
          </View>
        )}

        {/* Patient count */}
        {item.patientCount != null && (
          <View style={styles.patientCountRow}>
            <Ionicons name="people-outline" size={sc(13)} color="#0E7C61" />
            <Text style={styles.patientCountText}>{item.patientCount} patient{item.patientCount !== 1 ? "s" : ""} assigned</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Health Care Staff</Text>
            <Text style={styles.heroSub}>
              {isAdmin
                ? "Manage staff members and their assignments"
                : "Availability and contact details for health care staff"}
            </Text>
          </View>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.addStaffBtn}
              onPress={() => router.push("/(root)/(screens)/add-staff")}
            >
              <Ionicons name="person-add-outline" size={sc(18)} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{staffList.length}</Text>
            <Text style={styles.heroStatLabel}>Total Staff</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>
              {staffList.filter((s) => resolveStatus(s.availabilityStatus) === "AVAILABLE").length}
            </Text>
            <Text style={styles.heroStatLabel}>Available</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>
              {staffList.filter((s) => s.isActive !== false && s.status !== "INACTIVE").length}
            </Text>
            <Text style={styles.heroStatLabel}>Active</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={sc(18)} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or specialization..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={sc(18)} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading health care staff...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStaff(true)}
              colors={["#1565C0"]}
              tintColor="#1565C0"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={sc(48)} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>
                {search ? "No matching staff found" : "No health care staff yet"}
              </Text>
              {isSuperAdmin && !search && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => router.push("/(root)/(screens)/add-staff")}
                >
                  <Ionicons name="person-add-outline" size={sc(16)} color="#fff" />
                  <Text style={styles.emptyAddBtnText}>Add Health Care Staff</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={renderCard}
        />
      )}

      {/* Floating Add button for Super Admin */}
      {isSuperAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/(root)/(screens)/add-staff")}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#1565C0", "#1976D2"]} style={styles.fabGradient}>
            <Ionicons name="person-add" size={sc(22)} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Staff Action Modal */}
      <Modal
        visible={actionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModal(false)}
        >
          <View style={styles.actionSheet}>
            {selected && (
              <View style={styles.actionSheetHeader}>
                <View style={styles.actionSheetAvatar}>
                  <Text style={styles.actionSheetAvatarText}>{staffInitials(selected)}</Text>
                </View>
                <View>
                  <Text style={styles.actionSheetName}>{staffName(selected)}</Text>
                  <Text style={styles.actionSheetSub}>
                    {selected.specialization || selected.role || "Health Care Staff"}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.actionSheetTitle}>Staff Actions</Text>

            {/* Edit */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionModal(false);
                const sid = selected?._id || selected?.id;
                router.push({
                  pathname: "/(root)/(screens)/add-staff",
                  params: {
                    staffId: sid,
                    staffName: staffName(selected!),
                    staffEmail: selected?.email || "",
                  },
                });
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="create-outline" size={sc(20)} color="#2563EB" />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionLabel}>Edit Staff Member</Text>
                <Text style={styles.actionSub}>Update profile, role and availability</Text>
              </View>
              <Ionicons name="chevron-forward" size={sc(18)} color="#ccc" />
            </TouchableOpacity>

            {/* Delete (Super Admin only) */}
            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.actionItem, { borderBottomWidth: 0 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
                  {deleting
                    ? <ActivityIndicator size="small" color="#DC2626" />
                    : <Ionicons name="trash-outline" size={sc(20)} color="#DC2626" />}
                </View>
                <View style={styles.actionTextBlock}>
                  <Text style={[styles.actionLabel, { color: "#DC2626" }]}>Remove Staff Member</Text>
                  <Text style={styles.actionSub}>Permanently remove from the system</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelAction}
              onPress={() => setActionModal(false)}
            >
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: sc(10) },
  loadingText: { fontSize: sc(13), color: "#64748b", fontFamily: "Poppins-Regular" },

  hero: {
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingHorizontal: sc(16),
    paddingBottom: sc(16),
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroTitle: { fontSize: sc(22), fontWeight: "700", color: "#fff", fontFamily: "Poppins-Bold" },
  heroSub: { marginTop: 4, fontSize: sc(12), color: "rgba(255,255,255,0.85)", fontFamily: "Poppins-Regular", maxWidth: "85%" },
  addStaffBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: sc(12),
    width: sc(40), height: sc(40), justifyContent: "center", alignItems: "center",
  },

  heroStats: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: sc(14), padding: sc(12), marginTop: sc(14), alignItems: "center",
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatVal: { color: "#fff", fontSize: sc(22), fontFamily: "Poppins-Bold" },
  heroStatLabel: { color: "rgba(255,255,255,0.75)", fontSize: sc(10), fontFamily: "Poppins-Medium", marginTop: 1 },
  heroStatDivider: { width: 1, height: sc(32), backgroundColor: "rgba(255,255,255,0.25)" },

  searchRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    margin: sc(14), marginBottom: sc(4), paddingHorizontal: sc(14), paddingVertical: sc(10),
    borderRadius: sc(12), borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1, marginLeft: sc(8), fontSize: sc(13),
    fontFamily: "Poppins-Regular", color: "#333", paddingVertical: 2,
  },

  list: { paddingHorizontal: sc(14), paddingTop: sc(10), paddingBottom: sc(100), gap: sc(10) },

  card: {
    backgroundColor: "#fff", borderRadius: sc(16), padding: sc(14),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: sc(12), marginBottom: sc(10) },
  avatar: {
    width: sc(48), height: sc(48), borderRadius: sc(24),
    backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: sc(17), fontFamily: "Poppins-Bold", color: "#1565C0" },
  cardInfo: { flex: 1 },
  staffName: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#0f172a", marginBottom: 2 },
  staffRole: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#64748b", marginBottom: sc(6) },
  badgeRow: { flexDirection: "row", gap: sc(6), flexWrap: "wrap" },
  availBadge: {
    flexDirection: "row", alignItems: "center", gap: sc(4),
    borderWidth: 1, borderRadius: sc(10), paddingHorizontal: sc(8), paddingVertical: sc(3),
  },
  dot: { width: sc(6), height: sc(6), borderRadius: sc(3) },
  availText: { fontSize: sc(11), fontFamily: "Poppins-SemiBold" },
  inactiveBadge: {
    backgroundColor: "#f1f5f9", borderRadius: sc(10),
    paddingHorizontal: sc(8), paddingVertical: sc(3),
  },
  inactiveBadgeText: { fontSize: sc(11), fontFamily: "Poppins-Medium", color: "#94a3b8" },
  menuBtn: {
    padding: sc(6), backgroundColor: "#f8fafc", borderRadius: sc(8),
    borderWidth: 1, borderColor: "#e2e8f0",
  },

  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: sc(12), marginBottom: sc(4) },
  contactItem: { flexDirection: "row", alignItems: "center", gap: sc(5) },
  contactText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#64748b" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: sc(5), marginTop: sc(6) },
  noteText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#94a3b8", flex: 1 },
  patientCountRow: { flexDirection: "row", alignItems: "center", gap: sc(5), marginTop: sc(6) },
  patientCountText: { fontSize: sc(12), fontFamily: "Poppins-Medium", color: "#0E7C61" },

  emptyWrap: { alignItems: "center", marginTop: sc(80), gap: sc(12) },
  emptyTitle: { fontSize: sc(16), fontFamily: "Poppins-SemiBold", color: "#94a3b8" },
  emptyAddBtn: {
    flexDirection: "row", alignItems: "center", gap: sc(8),
    backgroundColor: "#1565C0", paddingHorizontal: sc(20), paddingVertical: sc(12), borderRadius: sc(12),
    marginTop: sc(8),
  },
  emptyAddBtnText: { color: "#fff", fontSize: sc(14), fontFamily: "Poppins-SemiBold" },

  fab: {
    position: "absolute", right: sc(20), bottom: sc(28), borderRadius: sc(28),
    ...Platform.select({
      ios: { shadowColor: "#1565C0", shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  fabGradient: { width: sc(54), height: sc(54), borderRadius: sc(27), justifyContent: "center", alignItems: "center" },

  // Action modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  actionSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: sc(24), borderTopRightRadius: sc(24),
    paddingHorizontal: sc(20), paddingTop: sc(20), paddingBottom: sc(36),
  },
  actionSheetHeader: {
    flexDirection: "row", alignItems: "center", gap: sc(12),
    marginBottom: sc(16), paddingBottom: sc(16), borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  actionSheetAvatar: {
    width: sc(44), height: sc(44), borderRadius: sc(22),
    backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center",
  },
  actionSheetAvatarText: { fontSize: sc(16), fontFamily: "Poppins-Bold", color: "#1565C0" },
  actionSheetName: { fontSize: sc(16), fontFamily: "Poppins-SemiBold", color: "#111" },
  actionSheetSub: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#888", marginTop: 2 },
  actionSheetTitle: {
    fontSize: sc(11), fontFamily: "Poppins-SemiBold", color: "#aaa",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: sc(8),
  },
  actionItem: {
    flexDirection: "row", alignItems: "center", paddingVertical: sc(14),
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: sc(12),
  },
  actionIcon: { width: sc(40), height: sc(40), borderRadius: sc(12), justifyContent: "center", alignItems: "center" },
  actionTextBlock: { flex: 1 },
  actionLabel: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#222" },
  actionSub: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#888", marginTop: 1 },
  cancelAction: {
    marginTop: sc(14), backgroundColor: "#f5f5f5", borderRadius: sc(12),
    paddingVertical: sc(14), alignItems: "center",
  },
  cancelActionText: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#666" },
});

export default HealthCareStaffScreen;
