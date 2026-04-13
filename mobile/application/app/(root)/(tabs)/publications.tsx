import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";

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

type PublicationItem = {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  coverImage?: string;
  fileUrl?: string;
  author?: string;
  publisher?: string;
  price?: number;
  discountPrice?: number;
  status?: string;
  createdAt?: string;
  createdBy?: {
    firstName?: string;
    lastName?: string;
  };
};

const getPublicationsFromResponse = (payload: any): PublicationItem[] => {
  const root = payload?.success && payload?.data ? payload.data : payload;

  if (Array.isArray(root?.publications)) {
    return root.publications;
  }

  if (Array.isArray(root?.data?.publications)) {
    return root.data.publications;
  }

  if (Array.isArray(root)) {
    return root;
  }

  return [];
};

const formatPrice = (price?: number, discountPrice?: number) => {
  const finalPrice = typeof discountPrice === "number" ? discountPrice : price;
  if (typeof finalPrice !== "number" || finalPrice <= 0) return "Free";
  return `$${finalPrice.toFixed(2)}`;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

export default function PublicationsScreen() {
  const { currentUser, isSignedIn } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publications, setPublications] = useState<PublicationItem[]>([]);

  const fetchPublications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await apiFetch("/api/v1/publications?page=1&limit=50", {
        method: "GET",
      });

      if (response.status === 401) {
        setError("Session expired. Please sign in again.");
        setPublications([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load publications (${response.status})`);
      }

      const json = await response.json();
      const rows = getPublicationsFromResponse(json);
      setPublications(Array.isArray(rows) ? rows : []);
    } catch (fetchError: any) {
      setPublications([]);
      setError(fetchError?.message || "Unable to load publications right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && currentUser) {
      fetchPublications();
      return;
    }

    setLoading(false);
  }, [isSignedIn, currentUser, fetchPublications]);

  const subtitle = useMemo(() => {
    if (!currentUser) return "Latest content from your account";
    const name = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
    return name ? `Welcome, ${name}` : "Latest content from your account";
  }, [currentUser]);

  const publicationStats = useMemo(() => {
    const total = publications.length;
    const free = publications.filter((item) => !item.discountPrice && !item.price).length;
    const paid = total - free;
    return { total, free, paid };
  }, [publications]);

  const openExternalUrl = async (url?: string, failureTitle = "Open failed") => {
    if (!url || !url.trim()) {
      Alert.alert("Not available", "This publication does not have a file URL.");
      return false;
    }

    const resolved = resolveRemoteUrl(url);

    if (!resolved) {
      Alert.alert("Not available", "This publication does not have a file URL.");
      return false;
    }

    try {
      const canOpen = await Linking.canOpenURL(resolved);
      if (!canOpen) {
        Alert.alert("Cannot open file", "The publication link is not supported on this device.");
        return false;
      }

      await Linking.openURL(resolved);
      return true;
    } catch {
      Alert.alert(failureTitle, "Could not open this publication.");
      return false;
    }
  };

  const handleRead = async (publication: PublicationItem) => {
    const fileUrl = resolveRemoteUrl(publication.fileUrl);

    if (!fileUrl) {
      Alert.alert("Not available", "This publication does not have a readable file URL.");
      return;
    }

    const lower = fileUrl.toLowerCase();
    const isDoc = lower.endsWith(".doc") || lower.endsWith(".docx");
    const isPdf = lower.endsWith(".pdf");

    if (isDoc) {
      const viewerUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fileUrl)}`;
      await openExternalUrl(viewerUrl, "Read failed");
      return;
    }

    if (isPdf) {
      await openExternalUrl(fileUrl, "Read failed");
      return;
    }

    await openExternalUrl(fileUrl, "Read failed");
  };

  const handleDownload = async (publication: PublicationItem) => {
    if (!publication.id) {
      await openExternalUrl(publication.fileUrl, "Download failed");
      return;
    }

    try {
      const response = await apiFetch(`/api/v1/publications/${publication.id}/download`, {
        method: "GET",
      });

      if (response.ok) {
        const json = await response.json();
        const payload = json?.success && json?.data ? json.data : json;
        const downloadUrl =
          payload?.downloadUrl ||
          payload?.url ||
          payload?.fileUrl;

        if (downloadUrl) {
          const opened = await openExternalUrl(downloadUrl, "Download failed");
          if (opened) return;
        }
      }
    } catch {
      // fallback to direct URL below
    }

    await openExternalUrl(publication.fileUrl, "Download failed");
  };

  if (!isSignedIn || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={28} color="#64748b" />
          <Text style={styles.centerTitle}>Sign in required</Text>
          <Text style={styles.centerDescription}>Please sign in to view publications.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="book-outline" size={18} color="#1d4ed8" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Publications</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statChip, styles.statChipBlue]}>
            <Text style={styles.statValue}>{publicationStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statChip, styles.statChipGreen]}>
            <Text style={styles.statValue}>{publicationStats.free}</Text>
            <Text style={styles.statLabel}>Free</Text>
          </View>
          <View style={[styles.statChip, styles.statChipPurple]}>
            <Text style={styles.statValue}>{publicationStats.paid}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centerDescription}>Loading publications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPublications(true)} />}
        >
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchPublications()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!error && publications.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="document-text-outline" size={28} color="#64748b" />
              <Text style={styles.centerTitle}>No publications yet</Text>
              <Text style={styles.centerDescription}>
                Publications created on web and published to the database will appear here.
              </Text>
            </View>
          ) : null}

          {publications.map((publication) => {
            const authorName = publication.author?.trim() ||
              `${publication.createdBy?.firstName || ""} ${publication.createdBy?.lastName || ""}`.trim() ||
              "Unknown author";

            const publishedDate = formatDate(publication.createdAt);
            const statusUpper = String(publication.status || "PUBLISHED").toUpperCase();
            const accentColor = statusUpper.includes("DRAFT") ? "#f59e0b" : "#7c3aed";

            return (
              <View key={publication.id} style={[styles.card, { borderLeftColor: accentColor }]}>
                <View style={styles.cardTop}>
                  {publication.coverImage ? (
                    <Image
                      source={{ uri: resolveRemoteUrl(publication.coverImage) }}
                      style={styles.cover}
                      resizeMode="cover"
                      onError={() => {
                        // keep silent fallback handled by placeholder state below if uri invalid in future refreshes
                      }}
                    />
                  ) : (
                    <View style={[styles.cover, styles.coverFallback]}>
                      <Ionicons name="book-outline" size={22} color="#2563eb" />
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {publication.title}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={3}>
                      {publication.shortDescription || publication.description || "No description"}
                    </Text>

                    <Text style={styles.metaText}>By {authorName}</Text>
                    {publication.publisher ? (
                      <Text style={styles.metaText}>Publisher: {publication.publisher}</Text>
                    ) : null}
                    {publishedDate ? <Text style={styles.metaText}>Added: {publishedDate}</Text> : null}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceText}>
                      {formatPrice(publication.price, publication.discountPrice)}
                    </Text>
                    <Text style={styles.statusText}>{publication.status || "PUBLISHED"}</Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.readButton, !publication.fileUrl && styles.openButtonDisabled]}
                      onPress={() => handleRead(publication)}
                      disabled={!publication.fileUrl}
                    >
                      <Ionicons name="book-outline" size={15} color="#fff" />
                      <Text style={styles.openButtonText}>Read</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: accentColor }, !publication.fileUrl && styles.openButtonDisabled]}
                      onPress={() => handleDownload(publication)}
                      disabled={!publication.fileUrl}
                    >
                      <Ionicons name="download-outline" size={15} color="#fff" />
                      <Text style={styles.openButtonText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  statChipGreen: { backgroundColor: "#ecfdf5", borderColor: "#86efac" },
  statChipPurple: { backgroundColor: "#f3e8ff", borderColor: "#d8b4fe" },
  statValue: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  centerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
  },
  centerDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#7c3aed",
    marginBottom: 14,
    gap: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
  },
  cover: {
    width: 72,
    height: 96,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardDescription: {
    marginTop: 2,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  metaText: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748b",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
  statusText: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  readButton: {
    backgroundColor: "#2563eb",
  },
  downloadButton: {
    backgroundColor: "#0f766e",
  },
  openButtonDisabled: {
    opacity: 0.55,
  },
  openButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});