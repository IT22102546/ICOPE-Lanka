import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { icons } from "@/constants";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "@/utils/api";
import DateTimePicker from "@react-native-community/datetimepicker";

// District and zone data
const districtZoneData = {
  Ampara: [
    "Akkaraipattu", "Ampara", "Kalmunai", "Sainthamaruthu", "Uhana", "Pottuvil", "Damana", "Mahaoya", "Navithanveli", "Irakkamam", "Dehiattakandiya", "Lahugala", "Thirukkovil", "Nintavur", "Addalaichenai",
  ],
  Anuradhapura: [
    "Anuradhapura", "Kekirawa", "Medawachchiya", "Mihintale", "Nochchiyagama", "Thalawa", "Galenbindunuwewa", "Horowpothana", "Kahatagasdigiliya", "Ipalogama", "Palagala", "Palugaswewa", "Rambewa", "Thambuttegama", "Kebithigollewa",
  ],
  Badulla: [
    "Badulla", "Bandarawela", "Mahiyanganaya", "Welimada", "Hali Ela", "Passara", "Kandaketiya", "Lunugala", "Rideemaliyadda", "Soranathota", "Haputale", "Diyatalawa", "Haldummulla", "Ella", "Uva Paranagama",
  ],
  Batticaloa: [
    "Batticaloa", "Kattankudy", "Eravur", "Valaichchenai", "Vakarai", "Porativu", "Koralai Pattu", "Manmunai", "Eravur Pattu", "Kiran", "Vellavely", "Oddamavadi", "Vantharamoolai",
  ],
  Colombo: [
    "Colombo", "Dehiwala", "Moratuwa", "Sri Jayawardenepura Kotte", "Kolonnawa", "Kaduwela", "Homagama", "Maharagama", "Kesbewa", "Ratmalana", "Boralesgamuwa", "Nugegoda", "Pannipitiya", "Hanwella", "Padukka",
  ],
  Galle: [
    "Galle", "Ambalangoda", "Hikkaduwa", "Elpitiya", "Bentota", "Karapitiya", "Baddegama", "Imaduwa", "Neluwa", "Nagoda", "Thawalama", "Akmeemana", "Habaraduwa", "Yakkalamulla", "Udugama",
  ],
  Gampaha: [
    "Gampaha", "Negombo", "Kelaniya", "Kadawatha", "Ja-Ela", "Wattala", "Minuwangoda", "Divulapitiya", "Mirigama", "Veyangoda", "Biyagama", "Dompe", "Mahara", "Katana", "Attanagalla",
  ],
  Hambantota: [
    "Hambantota", "Tangalle", "Ambalantota", "Tissamaharama", "Beliatta", "Weeraketiya", "Lunugamwehera", "Okewela", "Sooriyawewa", "Angunakolapelessa", "Katuwana", "Walasmulla", "Middeniya",
  ],
  Jaffna: [
    "Jaffna", "Chavakachcheri", "Nallur", "Point Pedro", "Karainagar", "Kayts", "Vaddukoddai", "Uduppidy", "Kopay", "Tellippalai", "Maruthnkerny", "Chankanai", "Sandilipay",
  ],
  Kalutara: [
    "Kalutara", "Panadura", "Horana", "Beruwala", "Matugama", "Agalawatta", "Bandaragama", "Bulathsinhala", "Madurawala", "Millaniya", "Palindanuwara", "Walallavita", "Ingiriya",
  ],
  Kandy: [
    "Kandy", "Gampola", "Nawalapitiya", "Kadugannawa", "Peradeniya", "Kundasale", "Akurana", "Ampitiya", "Pilimatalawa", "Galagedara", "Harispattuwa", "Pathadumbara", "Udunuwara", "Yatinuwara", "Udapalatha", "Minipe", "Hatharaliyadda",
  ],
  Kegalle: [
    "Kegalle", "Mawanella", "Rambukkana", "Warakapola", "Galigamuwa", "Yatiyantota", "Dehiowita", "Deraniyagala", "Aranayaka", "Ruwanwella",
  ],
  Kilinochchi: [
    "Kilinochchi", "Pallai", "Kandavalai", "Karachchi", "Poonakary",
  ],
  Kurunegala: [
    "Kurunegala", "Kuliyapitiya", "Pannala", "Narammala", "Polgahawela", "Alawwa", "Bingiriya", "Wariyapola", "Giriulla", "Melsiripura", "Nikaweratiya", "Mahawa", "Galgamuwa", "Panduwasnuwara", "Kobeigane", "Ibbagamuwa",
  ],
  Mannar: ["Mannar", "Nanattan", "Madhu", "Musali", "Manthai West"],
  Matale: [
    "Matale", "Dambulla", "Galewela", "Ukuwela", "Rattota", "Palapathwela", "Naula", "Wilgamuwa", "Yatawatta",
  ],
  Matara: [
    "Matara", "Weligama", "Hakmana", "Devinuwara", "Akuressa", "Kamburupitiya", "Athuraliya", "Malimbada", "Thihagoda", "Pasgoda", "Kotapola", "Dickwella",
  ],
  Moneragala: [
    "Moneragala", "Wellawaya", "Bibile", "Buttala", "Katharagama", "Madulla", "Sevanagala", "Siyambalanduwa", "Thanamalwila", "Medagana",
  ],
  Mullaitivu: [
    "Mullaitivu", "Oddusuddan", "Puthukudiyiruppu", "Thunukkai", "Manthai East", "Maritimepattu", "Welioya",
  ],
  "Nuwara Eliya": [
    "Nuwara Eliya", "Hatton", "Talawakele", "Kotagala", "Ginigathena", "Hanguranketha", "Walapane", "Ragala", "Ambagamuwa", "Maskeliya",
  ],
  Polonnaruwa: [
    "Polonnaruwa", "Kaduruwela", "Hingurakgoda", "Medirigiriya", "Lankapura", "Thamankaduwa", "Welikanda", "Dimbulagala",
  ],
  Puttalam: [
    "Puttalam", "Chilaw", "Wennappuwa", "Dankotuwa", "Nattandiya", "Marawila", "Anamaduwa", "Kalpitiya", "Pallama", "Vanathavilluwa", "Madampe",
  ],
  Ratnapura: [
    "Ratnapura", "Balangoda", "Embilipitiya", "Pelmadulla", "Eheliyagoda", "Kuruwita", "Nivithigala", "Kahawatta", "Godakawela", "Ayagama", "Kalawana", "Opanayaka", "Weligepola", "Rakwana",
  ],
  Trincomalee: [
    "Trincomalee", "Kinniya", "Muthur", "Kuchchaveli", "Gomarankadawala", "Morawewa", "Seruvila", "Thambalagamuwa", "Verugal",
  ],
  Vavuniya: ["Vavuniya", "Vengalacheddikulam", "Nedunkerny", "Cheddikulam"],
};

const districts = Object.keys(districtZoneData);
const UpdateProfile = () => {
  const { currentUser, userupdate, signOut } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    district: "",
    zone: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [availableZones, setAvailableZones] = useState([]);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = await SecureStore.getItemAsync("access_token");
      console.log("🔐 Current access token:", accessToken ? "Present" : "Missing");
    };
    checkAuth();
  }, []);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      console.log(" Current user data:", {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone,
        dateOfBirth: currentUser.dateOfBirth,
        district: currentUser.district?.name,
        zone: currentUser.zone,
      });

      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        dateOfBirth: currentUser.dateOfBirth || "",
        district: currentUser.district?.name || "",
        zone: currentUser.zone || "",
      });

      if (currentUser.district?.name) {
        setAvailableZones(districtZoneData[currentUser.district.name] || []);
      }

      // Set profile image if available
      if (currentUser.avatar) {
        setProfileImage(currentUser.avatar);
      }
    }
  }, [currentUser]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Sorry, we need camera roll permissions to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Sorry, we need camera permissions to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Change Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "district") {
      setAvailableZones(districtZoneData[value] || []);
      setFormData((prev) => ({ ...prev, zone: "" }));
    }
  };

  // Date picker handlers
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      handleInputChange("dateOfBirth", formattedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Dropdown handlers
  const handleDistrictSelect = (district: string) => {
    handleInputChange("district", district);
    setShowDistrictDropdown(false);
  };

  const handleZoneSelect = (zone: string) => {
    handleInputChange("zone", zone);
    setShowZoneDropdown(false);
  };

  const renderDropdownItem = ({ item, onSelect }) => (
    <TouchableOpacity style={styles.dropdownItem} onPress={() => onSelect(item)}>
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const handleUpdateProfile = async () => {
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      };

      if (formData.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }

      if (formData.zone) {
        updateData.zone = formData.zone.trim();
      }

      if (formData.district) {
        updateData.district = formData.district;
      }
;

      let response = await apiFetch("/api/v1/users/profile", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      console.log("📡 Update Response Status:", response.status);

      if (response.status === 401) {
        console.log("Token expired, attempting refresh...");
        const refreshSuccess = await useAuthStore.getState().refreshTokens();
        if (refreshSuccess) {
          console.log(" Token refresh successful, retrying...");
          response = await apiFetch("/api/v1/users/profile", {
            method: "PUT",
            body: JSON.stringify(updateData),
          });
          console.log("Retry Response Status:", response.status);
        }
      }

      if (response.status === 401) {
        throw new Error("Authentication failed. Please sign in again.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Backend error details:", errorData);

        if (response.status === 400) {
          throw new Error(errorData.message || "Invalid data sent to server. Please check your input.");
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later or contact support.");
        } else {
          throw new Error(errorData.message || `Failed to update profile (Status: ${response.status})`);
        }
      }

      const apiResult = await response.json();
      console.log(" Profile updated successfully:", apiResult);

      if (userupdate && apiResult.data) {
        await userupdate({ ...currentUser, ...apiResult.data });
        console.log(" User data updated in auth store");
      }

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.replace("/(root)/(tabs)/profile") },
      ]);
    } catch (error) {
      console.error("❌ Update profile error:", error);
      if (error.message.includes("Authentication failed")) {
        Alert.alert("Session Expired", "Your session has expired. Please sign in again.", [
          {
            text: "Sign In",
            onPress: () => {
              signOut();
              router.replace("/(auth)/sign-in");
            },
          },
        ]);
      } else {
        Alert.alert("Update Failed", error.message || "Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.replace("/(root)/(tabs)/profile");
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
        <View style={styles.systemStatusBar} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Update Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      <View style={styles.systemStatusBar} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header Section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Image source={icons.nav_user} style={styles.avatar} resizeMode="contain" />
              )}
              <TouchableOpacity style={styles.editIconContainer} onPress={showImagePickerOptions}>
                <View style={styles.editIconBackground}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Image source={icons.nav_user} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange("firstName", value)}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <Image source={icons.nav_user} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange("lastName", value)}
                  placeholder="Enter your last name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Image source={icons.emailFill} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone - Display Only */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <Image source={icons.phoneFill} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.disabledText]}
                  value={formData.phone}
                  editable={false}
                  placeholderTextColor="#999"
                />
              </View>
              <Text style={styles.noteText}>Phone number cannot be changed after account creation</Text>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={showDatepicker}>
                <Image source={icons.calender} style={styles.inputIcon} />
                <Text style={[styles.textInput, !formData.dateOfBirth && { color: "#999" }]}>
                  {formData.dateOfBirth || "Select Date of Birth"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* District */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>District</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowDistrictDropdown(true)}
              >
                <Image source={icons.location} style={styles.inputIcon} />
                <Text style={[styles.textInput, !formData.district && { color: "#999" }]}>
                  {formData.district || "Select District"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>

              <Modal visible={showDistrictDropdown} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setShowDistrictDropdown(false)}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.dropdownContainer}>
                      <FlatList
                        data={districts}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => renderDropdownItem({ item, onSelect: handleDistrictSelect })}
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>

            {/* Zone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Zone</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, !formData.district && styles.disabledInput]}
                onPress={() => formData.district && setShowZoneDropdown(true)}
                disabled={!formData.district}
              >
                <Image source={icons.location} style={styles.inputIcon} />
                <Text style={[styles.textInput, !formData.zone && { color: "#999" }]}>
                  {formData.zone || (formData.district ? "Select Zone" : "Select District First")}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>

              <Modal visible={showZoneDropdown} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setShowZoneDropdown(false)}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.dropdownContainer}>
                      <FlatList
                        data={availableZones}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => renderDropdownItem({ item, onSelect: handleZoneSelect })}
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.updateButton, loading && styles.disabledButton]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#005CFF" />
              ) : (
                <Text style={styles.updateButtonText}>Update Profile</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modals */}
      <Modal visible={showDistrictDropdown} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDistrictDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownContainer}>
              <FlatList
                data={districts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => renderDropdownItem({ item, onSelect: handleDistrictSelect })}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showZoneDropdown} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowZoneDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownContainer}>
              <FlatList
                data={availableZones}
                keyExtractor={(item) => item}
                renderItem={({ item }) => renderDropdownItem({ item, onSelect: handleZoneSelect })}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  systemStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "#3b82f6",
  },
  header: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
    marginLeft: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 2,
    backgroundColor: "transparent",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#3b82f6",
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    tintColor: "#3b82f6",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
  editIconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: "#9797AA",
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  disabledText: {
    color: "#64748b",
  },
  noteText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    fontStyle: "italic",
  },
  updateButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderColor: "#005CFF",
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 20,
    shadowColor: "#005CFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#005CFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: 300,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#005CFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UpdateProfile;