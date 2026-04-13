import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import useAuthStore from "../../../stores/authStore";
import { apiFetch } from "../../../utils/api";
import { icons } from "@/constants";
import { useRouter } from "expo-router";

export default function Subjects() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const { currentUser, isSignedIn, refreshTokens } = useAuthStore();
  const router = useRouter();

  // Only Core and Options filters
  const filterOptions = ["All", "Core", "Optional"];

  // Enhanced API call function with token refresh
  const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    try {
      let response = await apiFetch(endpoint, options);

      if (response.status === 401) {
        console.log(" Token expired, attempting refresh...");
        const refreshSuccess = await refreshTokens();

        if (refreshSuccess) {
          response = await apiFetch(endpoint, options);
        } else {
          throw new Error("Authentication failed. Please login again.");
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data !== undefined) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        return result;
      }
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      if (!isSignedIn || !currentUser) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to view subjects"
        );
        setLoading(false);
        return;
      }

      console.log(" Fetching subjects for user:", currentUser.email);

      const data = await makeAuthenticatedRequest("/api/v1/subjects");

      const subjectsArray = Array.isArray(data) ? data : [];

      console.log(
        " Subjects fetched successfully:",
        subjectsArray.length,
        "subjects"
      );
      setSubjects(subjectsArray);
    } catch (error) {
      console.error(" Error fetching subjects:", error);

      if (error.message.includes("Authentication failed")) {
        Alert.alert("Session Expired", "Please sign in again", [
          { text: "OK", onPress: () => useAuthStore.getState().signOut() },
        ]);
      } else {
        // Set empty array as fallback
        setSubjects([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      if (!isSignedIn) return;

      const data = await makeAuthenticatedRequest(
        "/api/v1/subjects/categories"
      );

      let categoriesArray = [];
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      }

      setCategories(categoriesArray);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  // Search subjects
  const searchSubjects = async (query) => {
    if (!query) {
      fetchSubjects();
      return;
    }

    try {
      const data = await makeAuthenticatedRequest(
        `/api/v1/subjects/search?q=${encodeURIComponent(query)}`
      );
      const subjectsArray = Array.isArray(data) ? data : [];
      setSubjects(subjectsArray);
    } catch (error) {
      console.error("Error searching subjects:", error);
      // Fallback to local search
      const localResults = subjects.filter((subject) =>
        subject.name.toLowerCase().includes(query.toLowerCase())
      );
      setSubjects(localResults);
    }
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text === "") {
      fetchSubjects();
    } else {
      searchSubjects(text);
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setShowFilterOptions(false);
  };

  // Toggle filter options
  const toggleFilterOptions = () => {
    setShowFilterOptions(!showFilterOptions);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubjects();
    fetchCategories();
  };

  // Navigate to subject details page
  const handleSubjectPress = (subject) => {
    router.push({
      pathname: "/(root)/(screens)/SubjectNotesRecords",
      params: {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherName: subject.teacherName || "Sarah Johnson",
        subjectImage: subject.imageUrl || "https://static.vecteezy.com/system/resources/thumbnails/008/359/437/small/collection-colored-thin-icon-of-english-language-learning-subject-book-graduated-hat-learning-and-education-concept-illustration-vector.jpg"
      }
    });
  };

  // Safe filtering - ensure filteredSubjects is always an array
  const filteredSubjects = React.useMemo(() => {
    if (!Array.isArray(subjects)) return [];

    let filtered = subjects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== "All") {
      filtered = filtered.filter(
        (subject) => subject.category === selectedFilter
      );
    }

    return filtered;
  }, [subjects, selectedFilter, searchQuery]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (isSignedIn && currentUser) {
        await Promise.all([fetchSubjects(), fetchCategories()]);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [isSignedIn, currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  if (!isSignedIn || !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please sign in to view subjects</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* -------- SEARCH + FILTER HEADER -------- */}
      <View style={styles.searchRow}>
        <View className="flex flex-row  gap-3" style={styles.searchBox}>
          <Image source={icons.search} style={styles.sIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Classes"
            placeholderTextColor="#A1A1A1"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButtonBox}
          onPress={toggleFilterOptions}
        >
          <View style={styles.filterIcon}>
            <Image source={icons.filter} style={styles.fIcon} />
          </View>
        </TouchableOpacity>
      </View>

      {/* -------- FILTER OPTIONS DROPDOWN -------- */}
      {showFilterOptions && (
        <View style={styles.filterDropdown}>
          <ScrollView style={styles.filterScrollView}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  selectedFilter === filter && styles.filterOptionActive,
                ]}
                onPress={() => handleFilterChange(filter)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === filter && styles.filterOptionTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* -------- CATEGORY TITLE -------- */}
      <Text style={styles.categoryTitle}>
        {selectedFilter === "All" ? "All Subjects" : selectedFilter}
      </Text>

      {/* -------- GRID VIEW -------- */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#007bff"]}
          />
        }
      >
        <View style={styles.gridContainer}>
          {filteredSubjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No subjects found for your search"
                  : "No subjects available"}
              </Text>
            </View>
          ) : (
            filteredSubjects.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.card}
                onPress={() => handleSubjectPress(item)}
              >
                <View style={styles.imageBox}>
                  <Image
                    source={{
                      uri: item.imageUrl || "https://static.vecteezy.com/system/resources/thumbnails/008/359/437/small/collection-colored-thin-icon-of-english-language-learning-subject-book-graduated-hat-learning-and-education-concept-illustration-vector.jpg",
                    }}
                    style={styles.cardImage}
                  />
                </View>

                <Text style={styles.subjectTitle}>{item.name}</Text>

                <View style={styles.teacherRow}>
                  <Image
                    source={{
                      uri:
                        item.teacherImage ||
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                    }}
                    style={styles.teacherAvatar}
                  />

                  <Text style={styles.teacherName}>
                    {item.teacherName || "Sarah Johnson"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 15,
    zIndex: 10,
  },
  searchBox: {
    flex: 1,
    height: 45,
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchInput: {
    fontSize: 14,
    color: "#000",
  },
  searchPlaceholder: {
    color: "#A1A1A1",
    fontSize: 14,
  },
  filterButtonBox: {
    width: 45,
    height: 45,
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    fontSize: 20,
  },
  filterDropdown: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100,
    maxHeight: 150,
    width: 120,
  },
  filterScrollView: {
    maxHeight: 150,
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterOptionActive: {
    backgroundColor: "#007bff",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#333",
  },
  filterOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  categoryTitle: {
    marginTop: 25,
    marginLeft: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop:15,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  imageBox: {
    width: "100%",
    height: 110,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  subjectTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    paddingHorizontal: 10,
  },
  teacherAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  teacherName: {
    fontSize: 13,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  fIcon: {
    width: 25,
    height: 25,
    marginTop: 3,
  },
  sIcon: {
    width: 25,
    height: 25,
    marginTop: 8,
  },
});