// apps/frontend/app/(root)/(tabs)/SearchMatches.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Grid3x3,
  List,
  Send,
  ChevronDown,
  Check,
  MapPin,
  School,
  BookOpen,
  Award,
  User,
} from "lucide-react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";

const { width } = Dimensions.get("window");

// Types based on your backend DTOs
interface TeacherTransferRequest {
  id: string;
  teacherId: string;
  registrationId: string;
  currentSchool: string;
  currentSchoolType?: string;
  currentDistrict: string;
  currentZone: string;
  fromZoneId: string;
  toZoneIds: string[];
  subjectId: string;
  mediumId: string;
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
  // Enriched data for display
  subject?: {
    id: string;
    name: string;
  };
  medium?: {
    id: string;
    name: string;
  };
  fromZone?: {
    id: string;
    name: string;
  };
  toZones?: Array<{
    id: string;
    name: string;
  }>;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  matchScore?: number;
}

interface Filters {
  searchTerm?: string;
  fromZone?: string;
  toZone?: string;
  subject?: string;
  medium?: string;
  level?: string;
  schoolType?: string;
  minYearsOfService?: string;
  maxYearsOfService?: string;
  verified?: boolean;
  status?: string;
}

interface DropdownItem {
  id: string;
  value: string;
  label: string;
  name?: string;
}

interface DropdownConfig {
  items: DropdownItem[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  placeholder: string;
}

interface ApiResponse<T> {
  data?: T;
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// Static data
const LEVELS = [
  { id: "1", value: "O/L", label: "O/L" },
  { id: "2", value: "A/L", label: "A/L" },
  { id: "3", value: "PRIMARY", label: "Primary" },
  { id: "4", value: "GRADE_1_5", label: "Grade 1-5" },
  { id: "5", value: "GRADE_6_11", label: "Grade 6-11" },
  { id: "6", value: "GRADE_12_13", label: "Grade 12-13" },
];

const SCHOOL_TYPES = [
  { id: "1", value: "1AB", label: "Type 1AB" },
  { id: "2", value: "1C", label: "Type 1C" },
  { id: "3", value: "Type 2", label: "Type 2" },
  { id: "4", value: "Type 3", label: "Type 3" },
  { id: "5", value: "PRIMARY", label: "Primary School" },
  { id: "6", value: "SECONDARY", label: "Secondary School" },
  { id: "7", value: "NATIONAL", label: "National School" },
  { id: "8", value: "CENTRAL", label: "Central School" },
];

const STATUS_OPTIONS = [
  { id: "1", value: "PENDING", label: "Pending" },
  { id: "2", value: "VERIFIED", label: "Verified" },
  { id: "3", value: "MATCHED", label: "Matched" },
  { id: "4", value: "ACCEPTED", label: "Accepted" },
  { id: "5", value: "COMPLETED", label: "Completed" },
  { id: "6", value: "CANCELLED", label: "Cancelled" },
  { id: "7", value: "REJECTED", label: "Rejected" },
];

export default function SearchMatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMatches, setShowMatches] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<
    "matchScore" | "yearsOfService" | "datePosted"
  >("matchScore");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Dropdown states
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownConfig, setDropdownConfig] = useState<DropdownConfig | null>(
    null
  );

  // Dropdown data
  const [subjects, setSubjects] = useState<DropdownItem[]>([]);
  const [mediums, setMediums] = useState<DropdownItem[]>([]);
  const [zones, setZones] = useState<DropdownItem[]>([]);
  const [districts, setDistricts] = useState<DropdownItem[]>([]);

  // Filters
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [allRequests, setAllRequests] = useState<TeacherTransferRequest[]>([]);
  const [matches, setMatches] = useState<TeacherTransferRequest[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<
    TeacherTransferRequest[]
  >([]);

  // Check user role and redirect if not teacher
  useFocusEffect(
    useCallback(() => {
      const authStore = useAuthStore.getState();
      if (authStore.currentUser?.role !== "EXTERNAL_TEACHER") {
        Alert.alert(
          "Access Denied",
          "This feature is only available for teachers",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    }, [])
  );

  // Fetch data from backend with proper error handling
  const fetchBackendData = async (endpoint: string): Promise<any> => {
    try {
      console.log(" Fetching:", endpoint);

      const response = await apiFetch(endpoint, { method: "GET" });

      if (!response.ok) {
        console.log(` HTTP ${response.status} for ${endpoint}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      console.log(" Successfully fetched:", endpoint, result);

      // Extract data based on response structure
      if (result.data !== undefined) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      } else if (result.items) {
        return result.items;
      }

      return result;
    } catch (error) {
      console.error(`❌ Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);

      console.log(" Loading all data...");

      // Fetch dropdown data from API
      try {
        const [subjectsRes, mediumsRes, zonesRes, districtsRes] =
          await Promise.allSettled([
            fetchBackendData("/api/v1/subjects?isActive=true"),
            fetchBackendData("/api/v1/mediums"),
            fetchBackendData("/api/v1/admin/zones?isActive=true"),
            fetchBackendData("/api/v1/admin/districts?isActive=true"),
          ]);

        // Helper function to extract data from API response
        const extractData = (
          result: PromiseSettledResult<any>,
          propertyName?: string
        ): any[] => {
          if (result.status === "fulfilled") {
            const data = result.value;

            // If data has a property with the array (like "mediums", "subjects", etc.)
            if (
              propertyName &&
              data[propertyName] &&
              Array.isArray(data[propertyName])
            ) {
              return data[propertyName];
            }

            // If data is already an array
            if (Array.isArray(data)) {
              return data;
            }

            // If data has a "data" property
            if (data.data && Array.isArray(data.data)) {
              return data.data;
            }

            // If data has an "items" property
            if (data.items && Array.isArray(data.items)) {
              return data.items;
            }
          }
          return [];
        };

        // Process subjects
        const subjectsData = extractData(subjectsRes, "subjects");
        const subjectItems = subjectsData
          .map((subject: any) => ({
            id: subject.id || subject._id || "",
            value: subject.id || subject._id || "",
            label: subject.name || "",
            name: subject.name,
          }))
          .filter((item: DropdownItem) => item.value && item.label);
        setSubjects(subjectItems);
        console.log(" Subjects loaded:", subjectItems.length);

        // Process mediums
        const mediumsData = extractData(mediumsRes, "mediums");
        console.log(" Raw mediums data:", mediumsData);

        const mediumItems = mediumsData
          .map((medium: any) => ({
            id: medium.id || medium._id || "",
            value: medium.id || medium._id || "",
            label: medium.name || "",
            name: medium.name,
          }))
          .filter((item: DropdownItem) => item.value && item.label);
        setMediums(mediumItems);
        console.log(" Mediums loaded:", mediumItems.length);

        // Process zones
        const zonesData = extractData(zonesRes, "zones");
        const zoneItems = zonesData
          .map((zone: any) => ({
            id: zone.id || zone._id || "",
            value: zone.id || zone._id || "",
            label: zone.name || "",
            name: zone.name,
          }))
          .filter((item: DropdownItem) => item.value && item.label);
        setZones(zoneItems);
        console.log(" Zones loaded:", zoneItems.length);

        // Process districts
        const districtsData = extractData(districtsRes, "districts");
        const districtItems = districtsData
          .map((district: any) => ({
            id: district.id || district._id || "",
            value: district.id || district._id || "",
            label: district.name || "",
            name: district.name,
          }))
          .filter((item: DropdownItem) => item.value && item.label);
        setDistricts(districtItems);
        console.log(" Districts loaded:", districtItems.length);
      } catch (error) {
        console.error(" Error fetching dropdown data:", error);
      }

      // Load transfer requests based on user role
      await loadTransferRequests();
    } catch (error) {
      console.error(" Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadTransferRequests = async () => {
    try {
      console.log("📡 Loading transfer requests...");

      // Check user role
      const authStore = useAuthStore.getState();
      const userRole = authStore.currentUser?.role;

      let endpoint = "/api/v1/transfer/browse";
      let queryParams = "";

      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.fromZone) params.append("fromZone", filters.fromZone);
      if (filters.toZone) params.append("toZone", filters.toZone);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.medium) params.append("medium", filters.medium);
      if (filters.level) params.append("level", filters.level);
      if (filters.verified !== undefined)
        params.append("verified", String(filters.verified));

      queryParams = params.toString();
      if (queryParams) {
        endpoint = `${endpoint}?${queryParams}`;
      }

      console.log(`Using endpoint: ${endpoint} for role: ${userRole}`);

      const response = await apiFetch(endpoint);

      if (!response.ok) {
        if (response.status === 403) {
          console.log(" Access forbidden - user may not be EXTERNAL_TEACHER");
          throw new Error("Access denied. Please check your user role.");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(" Transfer requests response:", result);

      // Extract data based on response structure
      let data: any[] = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (result.data && Array.isArray(result.data)) {
        data = result.data;
      } else if (result.items && Array.isArray(result.items)) {
        data = result.items;
      }

      console.log(` Found ${data.length} transfer requests`);

      // Transform and enrich data
      const transformedData: TeacherTransferRequest[] = data.map(
        (item: any) => {
          // Calculate match score based on various factors
          const matchScore = calculateMatchScore(item);

          return {
            id: item.id || item._id || "",
            teacherId: item.teacherId || item.teacher?.id || "",
            registrationId: item.registrationId || "",
            currentSchool: item.currentSchool || "",
            currentSchoolType: item.currentSchoolType,
            currentDistrict: item.currentDistrict || "",
            currentZone: item.currentZone || "",
            fromZoneId: item.fromZoneId || item.fromZone?.id || "",
            toZoneIds:
              item.toZoneIds || item.toZones?.map((z: any) => z.id || z) || [],
            subjectId: item.subjectId || item.subject?.id || "",
            mediumId: item.mediumId || item.medium?.id || "",
            level: item.level || "",
            yearsOfService: item.yearsOfService || 0,
            qualifications: item.qualifications || [],
            isInternalTeacher: item.isInternalTeacher || false,
            preferredSchoolTypes: item.preferredSchoolTypes || [],
            additionalRequirements: item.additionalRequirements,
            notes: item.notes,
            status: item.status || "PENDING",
            verified: item.verified || false,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            // Enriched data
            subject: item.subject || {
              id: item.subjectId,
              name: item.subjectName || "",
            },
            medium: item.medium || {
              id: item.mediumId,
              name: item.mediumName || "",
            },
            fromZone: item.fromZone || {
              id: item.fromZoneId,
              name: item.fromZoneName || "",
            },
            toZones:
              item.toZones ||
              item.toZoneIds?.map((id: string) => ({ id, name: "" })) ||
              [],
            teacher: item.teacher,
            matchScore,
          };
        }
      );

      setAllRequests(transformedData);
      setMatches(transformedData);
      setFilteredMatches(transformedData);
    } catch (error: any) {
      console.error(" Failed to load transfer requests:", error);
      Alert.alert(
        "Error Loading Data",
        error.message ||
          "Failed to load transfer requests. Please check your connection and try again.",
        [{ text: "OK" }]
      );
      setAllRequests([]);
      setMatches([]);
      setFilteredMatches([]);
    }
  };

  // Calculate match score based on various factors
  const calculateMatchScore = (request: any): number => {
    let score = 50; // Base score

    // Add points for verified requests
    if (request.verified) score += 20;

    // Add points based on status
    if (request.status === "VERIFIED") score += 15;
    if (request.status === "MATCHED") score += 10;
    if (request.status === "ACCEPTED") score += 5;

    // Add points for years of service (more experience = higher score)
    const years = request.yearsOfService || 0;
    if (years > 10) score += 15;
    else if (years > 5) score += 10;
    else if (years > 2) score += 5;

    // Ensure score is between 0-100
    return Math.min(Math.max(score, 0), 100);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData().finally(() => setRefreshing(false));
  }, []);

  // Reset filters function
  const handleResetFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  // Send request function
  const handleSendRequest = async (requestId: string) => {
    try {
      Alert.alert(
        "Send Transfer Request",
        "Are you sure you want to send a transfer request to this teacher?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send",
            onPress: async () => {
              try {
                const response = await apiFetch(
                  `/api/v1/transfer/${requestId}/accept`,
                  {
                    method: "POST",
                    body: JSON.stringify({
                      notes: "Interested in mutual transfer",
                    }),
                  }
                );

                if (response.ok) {
                  Alert.alert(
                    "Success",
                    "Your transfer request has been sent successfully."
                  );
                  // Refresh data
                  onRefresh();
                } else {
                  throw new Error("Failed to send request");
                }
              } catch (error) {
                console.error(" Failed to send request:", error);
                Alert.alert(
                  "Error",
                  "Failed to send transfer request. Please try again."
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(" Error sending request:", error);
    }
  };

  // Get match score color
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  // Show dropdown menu
  const showDropdownMenu = (
    items: DropdownItem[],
    selectedValue: string | undefined,
    placeholder: string,
    onSelect: (value: string) => void
  ) => {
    setDropdownConfig({
      items,
      onSelect,
      selectedValue,
      placeholder,
    });
    setShowDropdown(true);
  };

  // Handle dropdown select
  const handleDropdownSelect = (item: DropdownItem) => {
    dropdownConfig?.onSelect(item.value);
    setShowDropdown(false);
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = showMatches ? [...matches] : [...allRequests];

    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((request) => {
        const school = request.currentSchool?.toLowerCase() || "";
        const subject = request.subject?.name?.toLowerCase() || "";
        const zone = request.fromZone?.name?.toLowerCase() || "";
        return (
          school.includes(searchTerm) ||
          subject.includes(searchTerm) ||
          zone.includes(searchTerm)
        );
      });
    }

    // Apply other filters
    if (filters.fromZone) {
      filtered = filtered.filter(
        (request) => request.fromZoneId === filters.fromZone
      );
    }

    if (filters.toZone) {
      filtered = filtered.filter((request) =>
        request.toZoneIds?.some((zoneId) => zoneId === filters.toZone)
      );
    }

    if (filters.subject) {
      filtered = filtered.filter(
        (request) => request.subjectId === filters.subject
      );
    }

    if (filters.medium) {
      filtered = filtered.filter(
        (request) => request.mediumId === filters.medium
      );
    }

    if (filters.level) {
      filtered = filtered.filter((request) => request.level === filters.level);
    }

    if (filters.schoolType) {
      filtered = filtered.filter(
        (request) =>
          request.currentSchoolType === filters.schoolType ||
          request.preferredSchoolTypes?.includes(filters.schoolType!)
      );
    }

    if (filters.minYearsOfService) {
      const minYears = parseInt(filters.minYearsOfService) || 0;
      filtered = filtered.filter(
        (request) => request.yearsOfService >= minYears
      );
    }

    if (filters.maxYearsOfService) {
      const maxYears = parseInt(filters.maxYearsOfService) || 100;
      filtered = filtered.filter(
        (request) => request.yearsOfService <= maxYears
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "matchScore":
          return (b.matchScore || 0) - (a.matchScore || 0);
        case "yearsOfService":
          return b.yearsOfService - a.yearsOfService;
        case "datePosted":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredMatches(filtered);
  }, [filters, matches, allRequests, showMatches, sortBy]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Render filter dropdown
  const renderFilterDropdown = (
    label: string,
    field: keyof Filters,
    items: DropdownItem[]
  ) => {
    return (
      <TouchableOpacity
        style={styles.filterPicker}
        onPress={() =>
          showDropdownMenu(
            items,
            filters[field] as string | undefined,
            `Select ${label}`,
            (value) => setFilters((prev) => ({ ...prev, [field]: value }))
          )
        }
      >
        <Text
          style={
            filters[field]
              ? styles.filterPickerValue
              : styles.filterPickerPlaceholder
          }
        >
          {filters[field]
            ? items.find((i) => i.value === filters[field])?.label ||
              filters[field]
            : `Select ${label}`}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>
    );
  };

  // Render match card
  const renderMatchCard = ({ item }: { item: TeacherTransferRequest }) => {
    const matchScoreColor = getMatchScoreColor(item.matchScore || 0);
    const teacherName = item.teacher
      ? `${item.teacher.firstName} ${item.teacher.lastName}`
      : "Teacher";

    return (
      <View
        style={[
          styles.matchCard,
          highlightId === item.id && styles.highlightedCard,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>
              {item.subject?.name || "Subject"}
            </Text>
            <Text style={styles.cardSchool}>{item.currentSchool}</Text>
            <Text style={styles.cardTeacher}>{teacherName}</Text>
          </View>
          {showMatches && item.matchScore !== undefined && (
            <View
              style={[
                styles.matchBadge,
                { backgroundColor: matchScoreColor + "20" },
              ]}
            >
              <Text style={[styles.matchScore, { color: matchScoreColor }]}>
                {item.matchScore}% Match
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              From:{" "}
              <Text style={styles.detailBold}>
                {item.fromZone?.name || "Zone"}
              </Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              To:{" "}
              <Text style={styles.detailBold}>
                {item.toZones?.map((z) => z.name).join(", ") ||
                  "Multiple zones"}
              </Text>
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <BookOpen size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                Medium:{" "}
                <Text style={styles.detailBold}>
                  {item.medium?.name || "Medium"}
                </Text>
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Award size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                Level: <Text style={styles.detailBold}>{item.level}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <User size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Experience:{" "}
              <Text style={styles.detailBold}>{item.yearsOfService} years</Text>
            </Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                router.push(`/teacher/transfer/details?id=${item.id}`)
              }
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            {item.status === "VERIFIED" && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendRequest(item.id)}
              >
                <Send size={16} color="#fff" />
                <Text style={styles.sendButtonText}>Send Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "#10B981";
      case "PENDING":
        return "#F59E0B";
      case "MATCHED":
        return "#3B82F6";
      case "ACCEPTED":
        return "#8B5CF6";
      case "COMPLETED":
        return "#10B981";
      case "CANCELLED":
        return "#EF4444";
      case "REJECTED":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>
          Loading transfer opportunities...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.tabButton, showMatches && styles.activeTabButton]}
            onPress={() => setShowMatches(true)}
          >
            <Text
              style={[
                styles.tabButtonText,
                showMatches && styles.activeTabButtonText,
              ]}
            >
              Best Matches
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, !showMatches && styles.activeTabButton]}
            onPress={() => setShowMatches(false)}
          >
            <Text
              style={[
                styles.tabButtonText,
                !showMatches && styles.activeTabButtonText,
              ]}
            >
              All Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <View style={styles.filtersTitleContainer}>
              <Filter size={20} color="#4F46E5" />
              <Text style={styles.filtersTitle}>Search Filters</Text>
            </View>

            <TouchableOpacity
              style={styles.resetFiltersButton}
              onPress={handleResetFilters}
            >
              <Text style={styles.resetFiltersText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContent}>
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Search size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by school, subject, or zone..."
                  value={filters.searchTerm}
                  onChangeText={(text) =>
                    setFilters((prev) => ({ ...prev, searchTerm: text }))
                  }
                />
              </View>

              {/* Filter Dropdowns */}
              <View style={styles.filterGrid}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Current Zone</Text>
                  {renderFilterDropdown("From Zone", "fromZone", zones)}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Desired Zone</Text>
                  {renderFilterDropdown("To Zone", "toZone", zones)}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Subject</Text>
                  {renderFilterDropdown("Subject", "subject", subjects)}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Medium</Text>
                  {renderFilterDropdown("Medium", "medium", mediums)}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Level</Text>
                  {renderFilterDropdown("Level", "level", LEVELS)}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>School Type</Text>
                  {renderFilterDropdown(
                    "School Type",
                    "schoolType",
                    SCHOOL_TYPES
                  )}
                </View>
              </View>

              {/* Years of Service Range */}
              <View style={styles.yearsContainer}>
                <View style={styles.yearField}>
                  <Text style={styles.filterLabel}>Min Experience (years)</Text>
                  <TextInput
                    style={styles.yearInput}
                    placeholder="Min"
                    value={filters.minYearsOfService}
                    onChangeText={(text) =>
                      setFilters((prev) => ({
                        ...prev,
                        minYearsOfService: text,
                      }))
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.yearField}>
                  <Text style={styles.filterLabel}>Max Experience (years)</Text>
                  <TextInput
                    style={styles.yearInput}
                    placeholder="Max"
                    value={filters.maxYearsOfService}
                    onChangeText={(text) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxYearsOfService: text,
                      }))
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.toggleFiltersButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.toggleFiltersText}>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Text>
            <ChevronDown
              size={16}
              color="#4F46E5"
              style={[
                styles.chevronIcon,
                showFilters && styles.chevronIconRotated,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            Showing {filteredMatches.length} opportunity
            {filteredMatches.length !== 1 ? "s" : ""}
          </Text>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewButtonIcon,
                viewMode === "grid" && styles.activeViewButton,
              ]}
              onPress={() => setViewMode("grid")}
            >
              <Grid3x3
                size={20}
                color={viewMode === "grid" ? "#4F46E5" : "#6B7280"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewButtonIcon,
                viewMode === "list" && styles.activeViewButton,
              ]}
              onPress={() => setViewMode("list")}
            >
              <List
                size={20}
                color={viewMode === "list" ? "#4F46E5" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {filteredMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>
              No transfer opportunities found
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your filters or check back later
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMatches}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.matchesList}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Dropdown Modal */}
      {showDropdown && dropdownConfig && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowDropdown(false)}
            activeOpacity={1}
          />
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                {dropdownConfig.placeholder}
              </Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <ChevronDown size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={dropdownConfig.items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    dropdownConfig.selectedValue === item.value &&
                      styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleDropdownSelect(item)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      dropdownConfig.selectedValue === item.value &&
                        styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {dropdownConfig.selectedValue === item.value && (
                    <Check size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// Styles
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
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  activeTabButton: {
    backgroundColor: "#4F46E5",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter-Medium",
  },
  activeTabButtonText: {
    color: "#fff",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  filtersCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  filtersHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtersTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
    fontFamily: "Inter-SemiBold",
  },
  resetFiltersButton: {
    position: "absolute",
    right: 16,
    top: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  resetFiltersText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  filtersContent: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  filterGrid: {
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  filterPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  filterPickerValue: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  filterPickerPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
    fontFamily: "Inter-Regular",
  },
  yearsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  yearField: {
    flex: 1,
  },
  yearInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  toggleFiltersButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  toggleFiltersText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4F46E5",
    marginRight: 8,
    fontFamily: "Inter-Medium",
  },
  chevronIcon: {
    transform: [{ rotate: "0deg" }],
  },
  chevronIconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Regular",
  },
  viewToggle: {
    flexDirection: "row",
    gap: 8,
  },
  viewButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  activeViewButton: {
    backgroundColor: "#EEF2FF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  matchesList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    overflow: "hidden",
  },
  highlightedCard: {
    borderColor: "#4F46E5",
    borderWidth: 2,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  cardSchool: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  cardTeacher: {
    fontSize: 13,
    color: "#4F46E5",
    marginTop: 2,
    fontFamily: "Inter-Medium",
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScore: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  cardContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
    fontFamily: "Inter-Regular",
  },
  detailBold: {
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#10B98120",
  },
  verifiedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter-Medium",
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    fontFamily: "Inter-Medium",
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: width - 40,
    maxHeight: "80%",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter-SemiBold",
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemSelected: {
    backgroundColor: "#F5F3FF",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter-Regular",
  },
  dropdownItemTextSelected: {
    color: "#4F46E5",
    fontWeight: "500",
    fontFamily: "Inter-Medium",
  },
});
