import { icons, images } from "@/constants";
import React, { useState } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

export default function Seminar() {
  // Dummy seminar data - replace with API data later
  const [seminars, setSeminars] = useState([
    {
      id: 1,
      title: "Science & Technology",
      image: (images.test),
      date: "12th June 2025",
      time: "3.00 pm - 5.00 pm",
      type: "Online",
      category: "Science",
      registered: false
    },
    {
      id: 2,
      title: "Business Leadership",
      image: (images.test),
      date: "15th June 2025",
      time: "10.00 am - 12.00 pm",
      type: "Offline",
      category: "Business",
      registered: true
    },
    {
      id: 3,
      title: "AI & Machine Learning",
      image: (images.test),
      date: "18th June 2025",
      time: "2.00 pm - 4.30 pm",
      type: "Hybrid",
      category: "Technology",
      registered: false
    },
    {
      id: 4,
      title: "Health & Wellness",
      image: (images.test),
      date: "20th June 2025",
      time: "9.00 am - 11.00 am",
      type: "Online",
      category: "Health",
      registered: false
    },
    {
      id: 5,
      title: "Digital Marketing",
      image: (images.test),
      date: "22nd June 2025",
      time: "1.00 pm - 3.00 pm",
      type: "Online",
      category: "Marketing",
      registered: true
    },
    {
      id: 6,
      title: "Sustainable Energy",
      image: (images.test),
      date: "25th June 2025",
      time: "11.00 am - 1.00 pm",
      type: "Offline",
      category: "Science",
      registered: false
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSeminars, setFilteredSeminars] = useState(seminars);

  // Handle search functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === "") {
      setFilteredSeminars(seminars);
    } else {
      const filtered = seminars.filter(seminar =>
        seminar.title.toLowerCase().includes(text.toLowerCase()) ||
        seminar.category.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSeminars(filtered);
    }
  };

  // Handle filter button click (you can expand this later)
  const handleFilter = () => {
    // Add filter logic here
    alert("Filter functionality will be implemented with backend");
  };

  // Handle registration
  const handleRegister = (id) => {
    const updatedSeminars = seminars.map(seminar => {
      if (seminar.id === id) {
        return { ...seminar, registered: !seminar.registered };
      }
      return seminar;
    });
    setSeminars(updatedSeminars);
    setFilteredSeminars(updatedSeminars);
  };

  // Get tag color based on type
  const getTagStyle = (type) => {
    switch(type) {
      case 'Online':
        return { backgroundColor: '#FFECCC', color: '#D28A00' };
      case 'Offline':
        return { backgroundColor: '#CCE5FF', color: '#0066CC' };
      case 'Hybrid':
        return { backgroundColor: '#D4FFCC', color: '#009900' };
      default:
        return { backgroundColor: '#FFECCC', color: '#D28A00' };
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Search + Filter Row */}
      <View style={styles.row}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search Seminar"
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Image
            source={icons.search}
            style={styles.searchIcon}
          />
        </View>

        <TouchableOpacity style={styles.filterBtn} onPress={handleFilter}>
          <Image
            source={icons.filter}
            style={styles.filterIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Title with count */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>All Seminars </Text>
        <Text style={styles.count}>{filteredSeminars.length} seminars</Text>
      </View>

      {/* Seminar Cards Grid */}
      <View style={styles.grid}>
        {filteredSeminars.length > 0 ? (
          filteredSeminars.map((seminar) => {
            const tagStyle = getTagStyle(seminar.type);
            return (
              <View key={seminar.id} style={styles.card}>
                <Image
                  source={seminar.image}
                  style={styles.cardImage}
                />

                <Text style={styles.cardTitle}>{seminar.title}</Text>
                <Text style={styles.cardCategory}>{seminar.category}</Text>

                {/* Date */}
                <View style={styles.rowItem}>
                  <Image
                    source={icons.calender}
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>{seminar.date}</Text>
                </View>

                {/* Time */}
                <View style={styles.rowItem}>
                  <Image
                    source={icons.clock}
                    style={styles.icon}
                  />
                  <Text style={styles.cardText}>{seminar.time}</Text>
                </View>

                {/* Type Tag */}
                <View style={[styles.tag, { backgroundColor: tagStyle.backgroundColor }]}>
                  <Text style={[styles.tagText, { color: tagStyle.color }]}>
                    {seminar.type}
                  </Text>
                </View>

                {/* Register Button */}
                <TouchableOpacity 
                  style={[
                    styles.registerBtn, 
                    seminar.registered ? styles.registeredBtn : {}
                  ]}
                  onPress={() => handleRegister(seminar.id)}
                >
                  <Text style={[
                    styles.registerText,
                    seminar.registered ? styles.registeredText : {}
                  ]}>
                    {seminar.registered ? "Registered" : "Register"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No seminars found</Text>
            <Text style={styles.noResultsSubText}>Try different keywords</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: "#555",
  },
  filterBtn: {
    width: 45,
    height: 45,
    marginLeft: 12,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    width: 22,
    height: 22,
    tintColor: "#4A6CFF",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  count: {
    fontSize: 14,
    color: "#666",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    minHeight: 200,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingBottom: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 110,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    marginLeft: 10,
  },
  cardCategory: {
    fontSize: 12,
    color: "#4A6CFF",
    marginLeft: 10,
    marginTop: 2,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    marginTop: 4,
  },
  icon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: "#3575FF",
  },
  cardText: {
    fontSize: 12,
    color: "#555",
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginLeft: 10,
    marginTop: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  registerBtn: {
    backgroundColor: "#346AFF",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    marginHorizontal: 10,
  },
  registeredBtn: {
    backgroundColor: "#E5E5E5",
  },
  registerText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  registeredText: {
    color: "#666",
  },
  noResults: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  noResultsSubText: {
    fontSize: 14,
    color: "#999",
  },
});