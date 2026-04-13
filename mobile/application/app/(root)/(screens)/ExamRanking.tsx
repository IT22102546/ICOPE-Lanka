import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import useAuthStore from "../../../stores/authStore";
import { apiFetch } from "../../../utils/api";

// Types based on your Prisma schema
interface StudentProfile {
  id: string;
  studentId?: string;
  grade?: string;
  mediumId?: string;
  batchId?: string;
  academicYear?: string;
  guardianName?: string;
  guardianPhone?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: string;
  status: string;
  districtId?: string;
  zoneId?: string;
  studentProfile?: StudentProfile;
  [key: string]: any; // Allow any additional properties
}

interface Exam {
  id: string;
  title: string;
  totalMarks: number;
  [key: string]: any; // Allow any additional properties
}

interface ExamRanking {
  id: string;
  examId: string;
  studentId: string;
  studentType: "INTERNAL" | "EXTERNAL";
  score: number;
  islandRank: number;
  districtRank: number | null;
  zoneRank: number | null;
  district: any; // Could be string, object, or anything
  zone: any; // Could be string, object, or anything
  percentage: number;
  totalIsland: number;
  totalDistrict: number | null;
  totalZone: number | null;
  calculatedAt: string;
  exam: Exam;
  student: Student;
  [key: string]: any; // Allow any additional properties
}

interface RankingsResponse {
  rankings: ExamRanking[];
  filters: {
    level?: "ISLAND" | "DISTRICT" | "ZONE";
    studentType?: "INTERNAL" | "EXTERNAL";
    district?: string;
    zone?: string;
  };
  summary: {
    totalRanked: number;
    level: string;
  };
}

export default function ExamRanking() {
  const [category, setCategory] = useState<"ZONE" | "DISTRICT" | "ISLAND">("ISLAND");
  const [type, setType] = useState<"EXTERNAL" | "INTERNAL" | null>(null);
  const [district, setDistrict] = useState("");
  const [zone, setZone] = useState("");
  const [rankings, setRankings] = useState<ExamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [examDetails, setExamDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const params = useLocalSearchParams();
  const examId = params.examId as string;
  const examTitle = params.examTitle as string;
  
  const { accessToken, isSignedIn } = useAuthStore();

  // Helper function to safely extract string value from any data
  const safeString = (value: any, fallback: string = ""): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? "Yes" : "No";
    return fallback;
  };

  // Helper function to safely extract name from any location data
  const getLocationName = (location: any): string => {
    if (!location) return "Unknown";
    
    if (typeof location === 'string') {
      return location === "Unknown" ? "Unknown" : "Unknown"; // If it's a string ID, return "Unknown"
    }
    
    if (typeof location === 'object' && location !== null) {
      // Try to get name from common property names
      if (location.name) return safeString(location.name, "Unknown");
      if (location.title) return safeString(location.title, "Unknown");
      if (location.code) return safeString(location.code, "Unknown");
    }
    
    return "Unknown";
  };

  // Enhanced API fetch function with better error handling
  const makeAuthenticatedRequest = async (endpoint: string, options: any = {}) => {
    try {
      console.log(`📡 Making request to: ${endpoint}`);
      
      let response = await apiFetch(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        console.log(" Token expired, attempting refresh...");
        const refreshSuccess = await useAuthStore.getState().refreshTokens();
        
        if (refreshSuccess) {
          const newToken = useAuthStore.getState().accessToken;
          response = await apiFetch(endpoint, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          });
        } else {
          throw new Error("Authentication failed. Please login again.");
        }
      }

      if (!response.ok) {
        console.error(`❌ HTTP error! status: ${response.status} for ${endpoint}`);
        
        if (response.status === 404) {
          throw new Error("Rankings not available for this exam");
        } else if (response.status === 400) {
          const errorText = await response.text();
          console.log(` 400 Error details:`, errorText);
          
          // Handle specific backend errors
          if (errorText.includes("RANKING_NOT_ENABLED")) {
            throw new Error("Ranking is not enabled for this exam");
          }
          throw new Error(`Bad request: ${errorText}`);
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view these rankings");
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Response for ${endpoint}:`, result);
      
      return result;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  const fetchRankings = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Check if user is authenticated
      if (!isSignedIn || !accessToken) {
        Alert.alert(
          "Authentication Required",
          "Please login to view rankings",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Login", 
              onPress: () => router.push("/(auth)/sign-in") 
            }
          ]
        );
        setLoading(false);
        return;
      }

      console.log("🔍 Fetching rankings for exam:", examId);
      console.log("📊 Filters:", { category, type, district, zone });
      
      // Build query parameters according to backend API
      const params = new URLSearchParams();
      
      // The backend expects "level" parameter, not "category"
      params.append("level", category);
      
      if (type) {
        params.append("studentType", type);
      }
      
      // Only include district if category is DISTRICT
      if (district && category === "DISTRICT") {
        params.append("district", district);
      }
      
      // Only include zone if category is ZONE
      if (zone && category === "ZONE") {
        params.append("zone", zone);
      }

      const queryString = params.toString();
      const endpoint = `/api/v1/exams/${examId}/rankings${queryString ? `?${queryString}` : ''}`;
      
      const data: RankingsResponse = await makeAuthenticatedRequest(endpoint);
      
      console.log("📈 Rankings data received:", data);
      
      if (data && data.rankings) {
        // Log the structure of the first ranking to debug
        if (data.rankings.length > 0) {
          const firstRanking = data.rankings[0];
          console.log("🔍 First ranking structure:", {
            id: firstRanking.id,
            district: firstRanking.district,
            zone: firstRanking.zone,
            districtType: typeof firstRanking.district,
            zoneType: typeof firstRanking.zone,
            student: firstRanking.student ? {
              id: firstRanking.student.id,
              firstName: firstRanking.student.firstName,
              lastName: firstRanking.student.lastName,
              hasStudentProfile: !!firstRanking.student.studentProfile,
              // Check if student has any object properties that might cause issues
              studentKeys: Object.keys(firstRanking.student).filter(key => 
                typeof firstRanking.student[key] === 'object' && firstRanking.student[key] !== null
              )
            } : 'No student'
          });
        }
        
        setRankings(data.rankings);
        setExamDetails({
          ...data.summary,
          totalRanked: data.rankings.length
        });
      } else {
        setRankings([]);
        setExamDetails({ 
          level: category, 
          totalRanked: 0 
        });
        setError("No rankings data found");
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching rankings:", error);
      setError(error.message || "Failed to load rankings");
      setRankings([]);
      Alert.alert("Error", error.message || "Failed to load rankings. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRankings();
  };

  useEffect(() => {
    if (examId) {
      console.log("🎯 Component mounted with examId:", examId);
      console.log("🔑 Auth status:", { isSignedIn, hasToken: !!accessToken });
      fetchRankings();
    } else {
      console.error("❌ No examId provided");
      setError("No exam selected");
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (examId) {
      fetchRankings();
    }
  }, [category, type, district, zone]);

  const handleCategoryChange = (newCategory: "ZONE" | "DISTRICT" | "ISLAND") => {
    setCategory(newCategory);
    // Reset filters when changing category
    setDistrict("");
    setZone("");
  };

  const getMedalColor = (rank: number | null) => {
    if (!rank || rank > 5) return "#999";
    
    switch (rank) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#4BE367"; // Green
      case 3:
        return "#FF3B5F"; // Red
      case 4:
        return "#4BD4FF"; // Blue
      case 5:
        return "#AA47FF"; // Purple
      default:
        return "#999";
    }
  };

  const formatRankingNumber = (rank: number | null) => {
    if (!rank || rank <= 0) return "N/A";
    return rank.toString();
  };

  const getStudentName = (student: Student) => {
    if (!student) return "Unknown Student";
    
    // Safely get first name and last name
    const firstName = safeString(student.firstName, "");
    const lastName = safeString(student.lastName, "");
    
    const name = `${firstName} ${lastName}`.trim();
    return name || "Unknown Student";
  };

  const getStudentId = (student: Student) => {
    if (!student) return "N/A";
    
    // Try studentProfile.studentId first, then phone
    if (student.studentProfile && student.studentProfile.studentId) {
      return safeString(student.studentProfile.studentId, "N/A");
    }
    
    return safeString(student.phone, "N/A");
  };

  const getStudentGrade = (student: Student) => {
    if (!student || !student.studentProfile) return "N/A";
    return safeString(student.studentProfile.grade, "N/A");
  };

  // Get the rank based on selected category
  const getRankForCategory = (item: ExamRanking) => {
    switch (category) {
      case "DISTRICT":
        return item.districtRank;
      case "ZONE":
        return item.zoneRank;
      case "ISLAND":
      default:
        return item.islandRank;
    }
  };

  // Filter rankings based on search query
  const filteredRankings = rankings.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const studentName = getStudentName(item.student).toLowerCase();
    const studentId = getStudentId(item.student).toLowerCase();
    const phone = safeString(item.student?.phone, "").toLowerCase();
    
    return studentName.includes(searchLower) || 
           studentId.includes(searchLower) || 
           phone.includes(searchLower);
  });

  // Get top ranking for highlighted card
  const getHighlightedRank = () => {
    if (filteredRankings.length === 0) return null;
    
    // Sort by the selected category rank
    return [...filteredRankings].sort((a, b) => {
      const rankA = getRankForCategory(a);
      const rankB = getRankForCategory(b);
      
      if (rankA === null) return 1;
      if (rankB === null) return -1;
      return rankA - rankB;
    })[0];
  };

  const highlightedRank = getHighlightedRank();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading rankings...</Text>
        <Text style={styles.debugText}>Exam ID: {examId}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRankings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0057FF"]}
          tintColor="#0057FF"
        />
      }
    >
      
      {examDetails && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {rankings.length} ranked students • {examDetails.level} level
          </Text>
        </View>
      )}

      {/* ---------- Top Tabs (Zone/District/Island) ---------- */}
      <View style={styles.tabRow}>
        {[
          { key: "ZONE", label: "Zone" },
          { key: "DISTRICT", label: "District" },
          { key: "ISLAND", label: "Island" }
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => handleCategoryChange(item.key as any)}
            style={[
              styles.tabButton,
              category === item.key && styles.activeTabButton,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                category === item.key && styles.activeTabText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ---------- Second Tabs (External/Internal/Both) ---------- */}
      <View style={styles.tabRow}>
        {[
          { key: "EXTERNAL", label: "External" },
          { key: "INTERNAL", label: "Internal" },
          { key: null, label: "Both" }
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => setType(item.key as any)}
            style={[
              styles.tabButton2,
              type === item.key && styles.activeTabButton2,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText2,
                type === item.key && styles.activeTabText2,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ---------- District/Zone Filter Inputs ---------- */}
      {category === "DISTRICT" && (
        <View style={styles.filterContainer}>
          <TextInput
            placeholder="Enter District Name"
            style={styles.filterInput}
            value={district}
            onChangeText={setDistrict}
            placeholderTextColor="#999"
            returnKeyType="search"
            onSubmitEditing={fetchRankings}
          />
        </View>
      )}

      {category === "ZONE" && (
        <View style={styles.filterContainer}>
          <TextInput
            placeholder="Enter Zone Name"
            style={styles.filterInput}
            value={zone}
            onChangeText={setZone}
            placeholderTextColor="#999"
            returnKeyType="search"
            onSubmitEditing={fetchRankings}
          />
        </View>
      )}

      {/* ---------------- Search Bar ---------------- */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#A0A0A0" />
        <TextInput 
          placeholder="Search by name, student ID, or phone..." 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        )}
      </View>

      {/* ----------- Highlighted Big Card ----------- */}
      {highlightedRank && (
        <LinearGradient
          colors={["#1E88FF", "#0047FF"]}
          style={styles.mainCard}
        >
          <View style={styles.rankCircleLarge}>
            <Text style={styles.rankLarge}>
              {formatRankingNumber(getRankForCategory(highlightedRank))}
            </Text>
          </View>

          <View style={styles.profileImageLarge}>
            <Text style={styles.profileInitials}>
              {getStudentName(highlightedRank.student).charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nameLarge}>{getStudentName(highlightedRank.student)}</Text>
            <Text style={styles.schoolLarge}>
              ID: {getStudentId(highlightedRank.student)}
            </Text>
            <Text style={styles.schoolLarge}>
              Type: {safeString(highlightedRank.studentType)} • Grade: {getStudentGrade(highlightedRank.student)}
            </Text>
            <Text style={styles.schoolLarge}>
              Score: {safeString(highlightedRank.score)} / {safeString(highlightedRank.exam?.totalMarks, "100")} ({safeString(highlightedRank.percentage?.toFixed(1))}%)
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* ------------- Ranking List ------------- */}
      {filteredRankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={60} color="#999" />
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "No matching students found" 
              : "No rankings available for this exam with current filters"}
          </Text>
          {searchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearButtonText}>Clear Search</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={fetchRankings}
            >
              <Text style={styles.clearButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredRankings.map((item, index) => {
          const rank = getRankForCategory(item);
          const districtName = getLocationName(item.district);
          const zoneName = getLocationName(item.zone);
          
          return (
            <View key={item.id || `ranking-${index}`} style={styles.rankItem}>
              <View
                style={[
                  styles.rankCircle,
                  { backgroundColor: getMedalColor(rank) },
                ]}
              >
                <Text style={styles.rankText}>{formatRankingNumber(rank)}</Text>
              </View>

              <View style={styles.profileImage}>
                <Text style={styles.profileInitials}>
                  {getStudentName(item.student).charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{getStudentName(item.student)}</Text>
                <Text style={styles.school}>
                  ID: {getStudentId(item.student)} • {safeString(item.studentType)}
                </Text>
                <Text style={styles.detailText}>
                  Grade: {getStudentGrade(item.student)} • Score: {safeString(item.score)}/{safeString(item.exam?.totalMarks, "100")}
                </Text>
                {(districtName !== "Unknown" || zoneName !== "Unknown") && (
                  <Text style={styles.detailText}>
                    {districtName !== "Unknown" && `District: ${districtName} `}
                    {zoneName !== "Unknown" && `Zone: ${zoneName}`}
                  </Text>
                )}
              </View>

              <View style={styles.pointsContainerSmall}>
                <Text style={styles.points}>{safeString(item.percentage?.toFixed(1))}%</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Debug info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Exam ID: {examId}</Text>
        <Text style={styles.debugText}>Showing: {filteredRankings.length} of {rankings.length} rankings</Text>
        <Text style={styles.debugText}>Current filters: {category} {type ? `• ${type}` : ''}</Text>
      </View>
    </ScrollView>
  );
}

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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  debugText: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#0057FF",
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#6c757d",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
    paddingHorizontal: 15,
  },
  summaryContainer: {
    backgroundColor: "#E8F4FF",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 14,
    color: "#0057FF",
    fontWeight: "500",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E8ECF5",
    marginHorizontal: 5,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#007BFF",
  },
  tabButtonText: { 
    fontSize: 14, 
    color: "#555",
    fontWeight: "500" 
  },
  activeTabText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  tabButton2: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E8ECF5",
    marginHorizontal: 5,
    alignItems: "center",
  },
  activeTabButton2: {
    backgroundColor: "#EEF3FF",
  },
  tabButtonText2: { 
    fontSize: 14, 
    color: "#555",
    fontWeight: "500" 
  },
  activeTabText2: { 
    color: "#0047FF", 
    fontWeight: "600" 
  },
  filterContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  filterInput: {
    backgroundColor: "#F2F4F7",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    color: "#333",
    marginRight: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  clearButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#0057FF",
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  mainCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankCircleLarge: {
    backgroundColor: "#FFD700",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rankLarge: { 
    color: "#000", 
    fontWeight: "700",
    fontSize: 18 
  },
  profileImageLarge: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInitials: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  nameLarge: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16,
    marginBottom: 2 
  },
  schoolLarge: { 
    color: "#E6E6E6", 
    fontSize: 12,
    marginBottom: 1 
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
  },
  rankText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 14 
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
  },
  name: { 
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
    marginBottom: 2 
  },
  school: { 
    color: "#666", 
    fontSize: 12,
    marginBottom: 2 
  },
  detailText: {
    color: "#888",
    fontSize: 11,
  },
  pointsContainerSmall: {
    alignItems: "flex-end",
    minWidth: 60,
  },
  points: { 
    fontWeight: "700", 
    fontSize: 16,
    color: "#333" 
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
});