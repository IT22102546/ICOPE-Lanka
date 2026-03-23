// app/(auth)/signup.tsx - COMPLETE CODE WITH UPDATED TEACHER FIELDS
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  ImageSourcePropType,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { icons } from "@/constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import Checkbox from "expo-checkbox";

// Data arrays
interface DistrictZoneData {
  [key: string]: string[];
}

const districtZoneData: DistrictZoneData = {
  Ampara: ["Akkaraipattu", "Ampara", "Kalmunai", "Sainthamaruthu", "Uhana", "Pottuvil", "Damana", "Mahaoya", "Navithanveli", "Irakkamam", "Dehiattakandiya", "Lahugala", "Thirukkovil", "Nintavur", "Addalaichenai"],
  Anuradhapura: ["Anuradhapura", "Kekirawa", "Medawachchiya", "Mihintale", "Nochchiyagama", "Thalawa", "Galenbindunuwewa", "Horowpothana", "Kahatagasdigiliya", "Ipalogama", "Palagala", "Palugaswewa", "Rambewa", "Thambuttegama", "Kebithigollewa"],
  Badulla: ["Badulla", "Bandarawela", "Mahiyanganaya", "Welimada", "Hali Ela", "Passara", "Kandaketiya", "Lunugala", "Rideemaliyadda", "Soranathota", "Haputale", "Diyatalawa", "Haldummulla", "Ella", "Uva Paranagama"],
  Batticaloa: ["Batticaloa", "Kattankudy", "Eravur", "Valaichchenai", "Vakarai", "Porativu", "Koralai Pattu", "Manmunai", "Eravur Pattu", "Kiran", "Vellavely", "Oddamavadi", "Vantharamoolai"],
  Colombo: ["Colombo", "Dehiwala", "Moratuwa", "Sri Jayawardenepura Kotte", "Kolonnawa", "Kaduwela", "Homagama", "Maharagama", "Kesbewa", "Ratmalana", "Boralesgamuwa", "Nugegoda", "Pannipitiya", "Hanwella", "Padukka"],
  Galle: ["Galle", "Ambalangoda", "Hikkaduwa", "Elpitiya", "Bentota", "Karapitiya", "Baddegama", "Imaduwa", "Neluwa", "Nagoda", "Thawalama", "Akmeemana", "Habaraduwa", "Yakkalamulla", "Udugama"],
  Gampaha: ["Gampaha", "Negombo", "Kelaniya", "Kadawatha", "Ja-Ela", "Wattala", "Minuwangoda", "Divulapitiya", "Mirigama", "Veyangoda", "Biyagama", "Dompe", "Mahara", "Katana", "Attanagalla"],
  Hambantota: ["Hambantota", "Tangalle", "Ambalantota", "Tissamaharama", "Beliatta", "Weeraketiya", "Lunugamwehera", "Okewela", "Sooriyawewa", "Angunakolapelessa", "Katuwana", "Walasmulla", "Middeniya"],
  Jaffna: ["Jaffna", "Chavakachcheri", "Nallur", "Point Pedro", "Karainagar", "Kayts", "Vaddukoddai", "Uduppidy", "Kopay", "Tellippalai", "Maruthnkerny", "Chankanai", "Sandilipay"],
  Kalutara: ["Kalutara", "Panadura", "Horana", "Beruwala", "Matugama", "Agalawatta", "Bandaragama", "Bulathsinhala", "Madurawala", "Millaniya", "Palindanuwara", "Walallavita", "Ingiriya"],
  Kandy: ["Kandy", "Gampola", "Nawalapitiya", "Kadugannawa", "Peradeniya", "Kundasale", "Akurana", "Ampitiya", "Pilimatalawa", "Galagedara", "Harispattuwa", "Pathadumbara", "Udunuwara", "Yatinuwara", "Udapalatha", "Minipe", "Hatharaliyadda"],
  Kegalle: ["Kegalle", "Mawanella", "Rambukkana", "Warakapola", "Galigamuwa", "Yatiyantota", "Dehiowita", "Deraniyagala", "Aranayaka", "Ruwanwella"],
  Kilinochchi: ["Kilinochchi", "Pallai", "Kandavalai", "Karachchi", "Poonakary"],
  Kurunegala: ["Kurunegala", "Kuliyapitiya", "Pannala", "Narammala", "Polgahawela", "Alawwa", "Bingiriya", "Wariyapola", "Giriulla", "Melsiripura", "Nikaweratiya", "Mahawa", "Galgamuwa", "Panduwasnuwara", "Kobeigane", "Ibbagamuwa"],
  Mannar: ["Mannar", "Nanattan", "Madhu", "Musali", "Manthai West"],
  Matale: ["Matale", "Dambulla", "Galewela", "Ukuwela", "Rattota", "Palapathwela", "Naula", "Wilgamuwa", "Yatawatta"],
  Matara: ["Matara", "Weligama", "Hakmana", "Devinuwara", "Akuressa", "Kamburupitiya", "Athuraliya", "Malimbada", "Thihagoda", "Pasgoda", "Kotapola", "Dickwella"],
  Moneragala: ["Moneragala", "Wellawaya", "Bibile", "Buttala", "Katharagama", "Madulla", "Sevanagala", "Siyambalanduwa", "Thanamalwila", "Medagana"],
  Mullaitivu: ["Mullaitivu", "Oddusuddan", "Puthukudiyiruppu", "Thunukkai", "Manthai East", "Maritimepattu", "Welioya"],
  "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Kotagala", "Ginigathena", "Hanguranketha", "Walapane", "Ragala", "Ambagamuwa", "Maskeliya"],
  Polonnaruwa: ["Polonnaruwa", "Kaduruwela", "Hingurakgoda", "Medirigiriya", "Lankapura", "Thamankaduwa", "Welikanda", "Dimbulagala"],
  Puttalam: ["Puttalam", "Chilaw", "Wennappuwa", "Dankotuwa", "Nattandiya", "Marawila", "Anamaduwa", "Kalpitiya", "Pallama", "Vanathavilluwa", "Madampe"],
  Ratnapura: ["Ratnapura", "Balangoda", "Embilipitiya", "Pelmadulla", "Eheliyagoda", "Kuruwita", "Nivithigala", "Kahawatta", "Godakawela", "Ayagama", "Kalawana", "Opanayaka", "Weligepola", "Rakwana"],
  Trincomalee: ["Trincomalee", "Kinniya", "Muthur", "Kuchchaveli", "Gomarankadawala", "Morawewa", "Seruvila", "Thambalagamuwa", "Verugal"],
  Vavuniya: ["Vavuniya", "Vengalacheddikulam", "Nedunkerny", "Cheddikulam"],
};

const districts = Object.keys(districtZoneData);
const grades = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Grade 13"];
const mediums = ["Sinhala", "Tamil", "English"];
const subjects = ["Mathematics", "Science", "English", "Sinhala", "Tamil", "History", "Geography", "ICT", "Commerce", "Business Studies"];
const levels = ["Primary (Grade 1-5)", "Junior Secondary (Grade 6-9)", "O/L (Grade 10-11)", "A/L (Grade 12-13)"];
const qualifications = ["B.A.", "B.Sc.", "B.Ed.", "M.A.", "M.Sc.", "M.Ed.", "Ph.D.", "Diploma in Education", "National Diploma", "PGDE"];

const API = process.env.EXPO_PUBLIC_API_URL;

const SignUp = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get role from navigation params
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    if (params.role) {
      setUserRole(params.role as string);
      console.log("User role from params:", params.role);
    }
  }, [params.role]);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    district: "",
    zone: "",
    grade: "",
    school: "",
    medium: "",
    institution: "",
    institutionCode: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // Teacher-specific fields - UPDATED WITH NEW FIELDS
  const [teacherData, setTeacherData] = useState({
    employeeId: "",
    registrationId: "",
    currentSchool: "",
    address: "", // NEW: Added address field
    nicNumber: "", // NEW: Added NIC field
    currentZone: "", // NEW: Added current zone
    currentDistrict: "", // NEW: Added current district
    department: "",
    specialization: "",
    experience: "",
    qualifications: [] as string[],
    desiredZones: [] as string[],
    requiredZones: [] as string[], // NEW: Multi-selection for required zones
    requiredDistricts: [] as string[], // NEW: Multi-selection for required districts
    subject: "",
    level: "",
    canCreateExams: true,
    canMonitorExams: true,
    canManageClasses: true,
  });

  // OTP Verification States
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [tempUserId, setTempUserId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [phoneExists, setPhoneExists] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showCurrentZoneDropdown, setShowCurrentZoneDropdown] = useState(false);
  const [showRequiredZoneDropdown, setShowRequiredZoneDropdown] = useState(false);
  const [showRequiredDistrictDropdown, setShowRequiredDistrictDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showMediumDropdown, setShowMediumDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showQualificationDropdown, setShowQualificationDropdown] = useState(false);
  const [showDesiredZoneDropdown, setShowDesiredZoneDropdown] = useState(false);
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [availableCurrentZones, setAvailableCurrentZones] = useState<string[]>([]);
  const [tempDate, setTempDate] = useState(new Date());
  const [loading, setLoading] = useState(false);


  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-backend-url.com";
const API_VERSION = "v1";
const FULL_API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

  // OTP input refs
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0 && isOtpSent) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [otpCountdown, isOtpSent]);

  // Format countdown to MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Animation values for icons
  const animatedValues = useRef(
    Array(15)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  // Animation functions
  const startAnimations = () => {
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];

    animatedValues.forEach((value) => value.setValue(0));

    const iconAnimations = animatedValues.map((animValue, index) => {
      const delay = index * 150 + Math.random() * 400;

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      animationRefs.current.push(animation);
      return animation;
    });

    iconAnimations.forEach((animation) => animation.start());
  };

  const stopAnimations = () => {
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];
  };

  useEffect(() => {
    startAnimations();
    return () => {
      stopAnimations();
    };
  }, []);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "district") {
      setAvailableZones(districtZoneData[value] || []);
      setFormData((prev) => ({ ...prev, zone: "" }));
    }

    // Reset verification if phone number changes
    if (name === "phone" && value !== formData.phone) {
      resetVerification();
    }
  };

  const handleTeacherChange = (name: string, value: any) => {
    setTeacherData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If current district changes, update available zones
    if (name === "currentDistrict" && value) {
      setAvailableCurrentZones(districtZoneData[value] || []);
      setTeacherData(prev => ({ ...prev, currentZone: "" }));
    }
  };

  const toggleQualification = (qualification: string) => {
    setTeacherData(prev => {
      const current = [...prev.qualifications];
      if (current.includes(qualification)) {
        return { ...prev, qualifications: current.filter(q => q !== qualification) };
      } else {
        return { ...prev, qualifications: [...current, qualification] };
      }
    });
  };

  const toggleDesiredZone = (zone: string) => {
    setTeacherData(prev => {
      const current = [...prev.desiredZones];
      if (current.includes(zone)) {
        return { ...prev, desiredZones: current.filter(z => z !== zone) };
      } else {
        return { ...prev, desiredZones: [...current, zone] };
      }
    });
  };

  const toggleRequiredZone = (zone: string) => {
    setTeacherData(prev => {
      const current = [...prev.requiredZones];
      if (current.includes(zone)) {
        return { ...prev, requiredZones: current.filter(z => z !== zone) };
      } else {
        return { ...prev, requiredZones: [...current, zone] };
      }
    });
  };

  const toggleRequiredDistrict = (district: string) => {
    setTeacherData(prev => {
      const current = [...prev.requiredDistricts];
      if (current.includes(district)) {
        return { ...prev, requiredDistricts: current.filter(d => d !== district) };
      } else {
        return { ...prev, requiredDistricts: [...current, district] };
      }
    });
  };

  const resetVerification = () => {
    setIsOtpSent(false);
    setIsPhoneVerified(false);
    setPhoneExists(false);
    setResetToken("");
    setTempUserId("");
    setOtp(["", "", "", ""]);
    setOtpCountdown(0);
    setCanResendOtp(false);
  };

  // Validate phone number format
  const validatePhoneNumber = (phone: string) => {
    const mobileRegex = /^(071|076|077|075|078|070|074|072)\d{7}$/;
    return mobileRegex.test(phone);
  };

  // OTP input handlers
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every((digit) => digit !== "") && index === 3) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 1: Check if phone number exists before sending OTP
  const checkPhoneExists = async (): Promise<boolean> => {
    try {
      console.log("📱 Checking if phone exists:", formData.phone);

      const response = await fetch(`${API}/api/v1/auth/check-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // If exists is true, phone number already exists
        if (data.exists) {
          setPhoneExists(true);
          Alert.alert(
            "Phone Number Already Exists",
            "This phone number is already registered. Please use a different number or try signing in."
          );
          return true;
        }
        return false;
      }
      return false;
    } catch (error) {
      console.error("❌ Error checking phone:", error);
      return false;
    }
  };

  // Add this function after your imports
const apiRequest = async (
  endpoint: string,
  method: string = "POST",
  body?: any,
  customHeaders: Record<string, string> = {}
) => {
  const url = `${FULL_API_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    "x-client-type": "mobile",
    "x-return-tokens": "true",
    ...customHeaders,
  };

  console.log(`🌐 API Request: ${method} ${url}`);
  if (body) {
    console.log("📦 Request Body:", JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    console.log(`📥 Response Status: ${response.status}`);
    console.log("📥 Response Body:", responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("❌ Failed to parse response as JSON:", parseError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        throw new Error("Unauthorized: Please check your API configuration");
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error("❌ API Request Error:", error);
    
    // Handle network errors
    if (error.message.includes("Network request failed")) {
      throw new Error("Network error: Please check your internet connection");
    }
    
    // Handle CORS errors
    if (error.message.includes("Failed to fetch") || error.message.includes("CORS")) {
      throw new Error("CORS error: Please check backend CORS configuration");
    }
    
    throw error;
  }
};

  // Step 2: Send OTP for signup
const sendSignupOtp = async () => {
  if (!validatePhoneNumber(formData.phone)) {
    Alert.alert(
      "Error",
      "Please enter a valid Sri Lankan mobile number (e.g., 0712345678)"
    );
    return;
  }

  setVerificationLoading(true);
  try {
    // First check if phone exists
    const phoneAlreadyExists = await checkPhoneExists();
    if (phoneAlreadyExists) {
      setVerificationLoading(false);
      return;
    }

    console.log("📱 Sending OTP for signup:", formData.phone);

    // Use the API helper
    const data = await apiRequest("/auth/send-signup-otp", "POST", {
      phone: formData.phone,
    });

    console.log("✅ OTP sent successfully:", data);

    setIsOtpSent(true);
    setOtpCountdown(60);
    setCanResendOtp(false);
    setOtp(["", "", "", ""]);
    setTempUserId(data.tempUserId || "");

    Alert.alert("Success", "OTP sent to your mobile number");
  } catch (error: any) {
    console.error("❌ OTP send error:", error);
    
    // Specific error handling
    if (error.message.includes("Unauthorized")) {
      Alert.alert(
        "Configuration Error",
        "Please ensure the backend is properly configured with CORS and authentication headers."
      );
    } else if (error.message.includes("CORS")) {
      Alert.alert(
        "CORS Error",
        "Cannot connect to the server. Please check if the backend allows requests from this origin."
      );
    } else {
      Alert.alert(
        "Error",
        error.message || "Failed to send OTP. Please try again."
      );
    }
  } finally {
    setVerificationLoading(false);
  }
};
  // Step 3: Resend OTP
  const resendOtp = async () => {
    if (!canResendOtp) return;

    setVerificationLoading(true);
    try {
      console.log("📱 Resending OTP for signup:", formData.phone);

      // Use the signup-specific OTP endpoint for resending
      const response = await fetch(`${API}/api/v1/auth/send-signup-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      console.log("✅ OTP resent successfully:", data);

      setOtpCountdown(60);
      setCanResendOtp(false);
      setOtp(["", "", "", ""]);

      Alert.alert("Success", "New OTP sent to your mobile number");
    } catch (error: any) {
      console.error("❌ Resend OTP error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to resend OTP. Please try again."
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  // Step 4: Verify OTP
  const verifyOtp = async (enteredOtp?: string) => {
    const otpToVerify = enteredOtp || otp.join("");

    if (otpToVerify.length !== 4) {
      Alert.alert("Error", "Please enter a valid 4-digit OTP");
      return;
    }

    setVerifyOtpLoading(true);
    try {
      console.log("📱 Verifying OTP for signup:", otpToVerify);

      // Use the signup-specific OTP verification endpoint
      const response = await fetch(`${API}/api/v1/auth/verify-signup-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formData.phone,
          otp: otpToVerify,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      console.log("✅ OTP verified successfully:", data);

      // Store the verification token
      setResetToken(data.verificationToken || "");
      setIsPhoneVerified(true);
      setIsOtpSent(false);
      setOtpCountdown(0);

      Alert.alert("Success", "Phone number verified successfully!");
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      Alert.alert("Error", error.message || "Invalid OTP. Please try again.");
      // Clear OTP on error
      setOtp(["", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  // Step 5: Complete signup with verified phone
  const completeSignup = async () => {
    // Validate required fields
    const requiredFields = [
      !formData.email,
      !formData.phone,
      !formData.firstName,
      !formData.lastName,
      !formData.dateOfBirth,
      !formData.password,
      !formData.confirmPassword,
    ];

    if (requiredFields.some(field => field)) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (!isPhoneVerified) {
      Alert.alert("Error", "Please verify your phone number first");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      Alert.alert(
        "Error",
        "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"
      );
      return;
    }

    if (userRole === "Teacher" && !formData.acceptTerms) {
      Alert.alert("Error", "You must accept the terms and conditions");
      return;
    }

    // Additional validation for teacher registration
    if (userRole === "Teacher") {
      const requiredTeacherFields = [
        !teacherData.registrationId,
        !teacherData.address,
        !teacherData.currentSchool,
        !teacherData.currentDistrict,
        !teacherData.currentZone,
      ];

      if (requiredTeacherFields.some(field => field)) {
        Alert.alert("Error", "Please fill all required teacher fields");
        return;
      }
    }

    setLoading(true);
    try {
      let registerDto;

      if (userRole === "Teacher") {
        // Teacher registration with updated fields
        registerDto = {
          phone: formData.phone,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth + "T00:00:00.000Z",
          role: "EXTERNAL_TEACHER",
          password: formData.password,
          // Teacher-specific required fields
          registrationId: teacherData.registrationId,
          currentSchool: teacherData.currentSchool,
          address: teacherData.address,
          currentZone: teacherData.currentZone,
          currentDistrict: teacherData.currentDistrict,
          nicNumber: teacherData.nicNumber || undefined,
          requiredZones: teacherData.requiredZones,
          requiredDistricts: teacherData.requiredDistricts,
          subject: teacherData.subject || "General",
          medium: teacherData.medium || "English",
          level: teacherData.level || "A/L",
          acceptTerms: formData.acceptTerms,
          // Optional fields
          qualifications: teacherData.qualifications,
          experience: teacherData.experience ? parseInt(teacherData.experience) : undefined,
          department: teacherData.department,
          specialization: teacherData.specialization,
        };
      } else {
        // Student registration
        registerDto = {
          phone: formData.phone,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth + "T00:00:00.000Z",
          role: "INTERNAL_STUDENT",
          password: formData.password,
          ...(formData.district && { district: formData.district }),
          ...(formData.zone && { zone: formData.zone }),
          ...(formData.grade && { grade: formData.grade }),
          ...(formData.school && { school: formData.school }),
          ...(formData.medium && { medium: formData.medium }),
          ...(formData.institution && { institution: formData.institution }),
          ...(formData.institutionCode && { institutionCode: formData.institutionCode }),
        };
      }

      console.log("📤 Completing signup with verified phone");
      console.log("📦 Request body:", JSON.stringify(registerDto, null, 2));

      // Include verification token if available
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-client-type": "mobile",
        "x-return-tokens": "true",
      };

      if (resetToken) {
        headers["x-verification-token"] = resetToken;
      }

      const response = await fetch(`${API}/api/v1/auth/register`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(registerDto),
      });

      const responseText = await response.text();
      console.log("📥 Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      console.log("✅ Signup completed successfully:", data);

      Alert.alert(
        "Account Created Successfully!",
        `Your ${userRole === "Teacher" ? "teacher" : "student"} account has been created. Please sign in to continue.`,
        [
          {
            text: "Sign In",
            onPress: () => {
              // Clear all form data
              setFormData({
                email: "",
                phone: "",
                firstName: "",
                lastName: "",
                dateOfBirth: "",
                district: "",
                zone: "",
                grade: "",
                school: "",
                medium: "",
                institution: "",
                institutionCode: "",
                password: "",
                confirmPassword: "",
                acceptTerms: false,
              });
              setTeacherData({
                employeeId: "",
                registrationId: "",
                currentSchool: "",
                address: "",
                nicNumber: "",
                currentZone: "",
                currentDistrict: "",
                department: "",
                specialization: "",
                experience: "",
                qualifications: [],
                desiredZones: [],
                requiredZones: [],
                requiredDistricts: [],
                subject: "",
                level: "",
                canCreateExams: true,
                canMonitorExams: true,
                canManageClasses: true,
              });
              resetVerification();
              router.replace("/(auth)/sign-in");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Signup completion error:", error);
      
      // Handle specific error for duplicate phone
      if (error.message && error.message.toLowerCase().includes("phone") && error.message.toLowerCase().includes("exist")) {
        Alert.alert(
          "Phone Number Already Exists",
          "This phone number is already registered. Please use a different number or try signing in."
        );
        setPhoneExists(true);
        resetVerification();
      } else {
        Alert.alert(
          "Error",
          error.message || "Failed to complete signup. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Date picker handlers
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Dropdown selection handlers
  const handleDistrictSelect = (district: string) => {
    handleChange("district", district);
    setShowDistrictDropdown(false);
  };

  const handleZoneSelect = (zone: string) => {
    handleChange("zone", zone);
    setShowZoneDropdown(false);
  };

  const handleCurrentDistrictSelect = (district: string) => {
    handleTeacherChange("currentDistrict", district);
  };

  const handleCurrentZoneSelect = (zone: string) => {
    handleTeacherChange("currentZone", zone);
    setShowCurrentZoneDropdown(false);
  };

  const handleGradeSelect = (grade: string) => {
    handleChange("grade", grade);
    setShowGradeDropdown(false);
  };

  const handleMediumSelect = (medium: string) => {
    handleChange("medium", medium);
    setShowMediumDropdown(false);
  };

  const handleSubjectSelect = (subject: string) => {
    handleTeacherChange("subject", subject);
    setShowSubjectDropdown(false);
  };

  const handleLevelSelect = (level: string) => {
    handleTeacherChange("level", level);
    setShowLevelDropdown(false);
  };

  // Render dropdown items
  const renderDropdownItem = ({
    item,
    onSelect,
  }: {
    item: string;
    onSelect: (item: string) => void;
  }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  // Pick only the icons you want
  const selectedIcons: ImageSourcePropType[] = [
    icons.Icon1,
    icons.Icon2,
    icons.Icon3,
    icons.Icon4,
    icons.Icon5,
    icons.Icon6,
    icons.Icon1,
    icons.Icon3,
    icons.Icon2,
    icons.Icon4,
    icons.Icon3,
    icons.Icon5,
    icons.Icon1,
    icons.Icon6,
    icons.Icon2,
  ];

  const getPredefinedPositions = () => {
    const positions = [
      { top: 25, left: 10 },
      { top: 25, left: 50 },
      { top: 25, left: 90 },
      { top: 60, left: 20 },
      { top: 60, left: 80 },
      { top: 95, left: 5 },
      { top: 95, left: 35 },
      { top: 95, left: 65 },
      { top: 95, left: 95 },
      { top: 130, left: 15 },
      { top: 130, left: 50 },
      { top: 130, left: 85 },
      { top: 165, left: 25 },
      { top: 165, left: 75 },
      { top: 200, left: 5 },
      { top: 200, left: 40 },
      { top: 200, left: 60 },
      { top: 200, left: 95 },
    ];
    return positions;
  };

  const renderDistributedIcons = () => {
    const predefinedPositions = getPredefinedPositions();

    return selectedIcons.map((icon, index) => {
      let position;

      if (index < predefinedPositions.length) {
        position = predefinedPositions[index];
      } else {
        position = {
          top: 30 + Math.random() * 140,
          left: 15 + Math.random() * 70,
        };
      }

      const randomOpacity = 0.8 + Math.random() * 0.2;
      const randomSize = 20 + Math.random() * 12;
      const randomRotation = Math.random() * 20 - 10;

      const translateY = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15],
      });

      const scale = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1],
      });

      const rotate = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [`${randomRotation}deg`, `${randomRotation + 8}deg`],
      });

      const opacity = animatedValues[index].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [randomOpacity, randomOpacity * 1.4, randomOpacity],
      });

      return (
        <Animated.Image
          key={index}
          source={icon}
          style={{
            position: "absolute",
            top: position.top,
            left: `${position.left}%`,
            width: randomSize,
            height: randomSize,
            opacity: opacity,
            tintColor: "#FFFFFF",
            zIndex: 2,
            transform: [
              { translateY: translateY },
              { scale: scale },
              { rotate: rotate },
            ],
            shadowColor: "#FFFFFF",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
          }}
          resizeMode="contain"
        />
      );
    });
  };

  // Render Phone Verification Section
  const renderPhoneVerification = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        Phone Number <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.inputWrapper}>
        <MaterialIcons
          name="phone"
          size={18}
          color="#999"
          style={styles.icon}
        />
        <TextInput
          style={[styles.textInput, { flex: 1 }]}
          placeholder="Phone Number"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => {
            const cleanedText = text.replace(/[^0-9]/g, "");
            if (cleanedText.length <= 10) {
              handleChange("phone", cleanedText);
            }
          }}
          maxLength={10}
          editable={!isPhoneVerified && !isOtpSent}
        />
        {!isPhoneVerified && !isOtpSent && (
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!formData.phone || verificationLoading || phoneExists) &&
                styles.disabledButton,
            ]}
            onPress={sendSignupOtp}
            disabled={!formData.phone || verificationLoading || phoneExists}
          >
            {verificationLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>
                {phoneExists ? "Already Exists" : "Verify"}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {isPhoneVerified && (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="check-circle" size={20} color="#10b981" />
          </View>
        )}
      </View>

      {phoneExists && (
        <Text style={styles.errorText}>
          <MaterialIcons name="error" size={14} color="#ef4444" /> Phone number
          already registered
        </Text>
      )}

      {isOtpSent && !isPhoneVerified && (
        <>
          {/* OTP Input Section */}
          <View style={styles.otpSection}>
            <Text style={styles.otpLabel}>
              Enter 4-digit OTP sent to{" "}
              {formData.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
            </Text>

            {/* OTP Input Boxes */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpInputRefs.current[index] = ref)}
                  style={[styles.otpInputBox, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!verifyOtpLoading}
                />
              ))}
            </View>

            {/* Timer and Resend */}
            <View style={styles.otpActionsContainer}>
              {otpCountdown > 0 ? (
                <Text style={styles.timerText}>
                  Resend OTP in {formatCountdown(otpCountdown)}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={resendOtp}
                  disabled={!canResendOtp || verificationLoading}
                >
                  <Text
                    style={[
                      styles.resendText,
                      (!canResendOtp || verificationLoading) &&
                        styles.resendTextDisabled,
                    ]}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.verifyOtpButton,
                  (otp.join("").length !== 4 || verifyOtpLoading) &&
                    styles.disabledButton,
                ]}
                onPress={() => verifyOtp()}
                disabled={otp.join("").length !== 4 || verifyOtpLoading}
              >
                {verifyOtpLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyOtpButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {isPhoneVerified && (
        <Text style={styles.verifiedText}>
          <MaterialIcons name="check-circle" size={14} color="#10b981" /> Phone
          number verified
        </Text>
      )}
    </View>
  );

  // Render Teacher Specific Fields
  const renderTeacherFields = () => {
    if (userRole !== "Teacher") return null;

    return (
      <>
        <Text style={styles.sectionTitle}>Teacher Registration Information</Text>

        {/* Teacher Registration Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Teacher Registration Number <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="badge" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Teacher Registration Number"
              placeholderTextColor="#9ca3af"
              value={teacherData.registrationId}
              onChangeText={(text) => handleTeacherChange("registrationId", text)}
            />
          </View>
        </View>

        {/* Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Address <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="home" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Full Address"
              placeholderTextColor="#9ca3af"
              value={teacherData.address}
              onChangeText={(text) => handleTeacherChange("address", text)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* NIC Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>NIC Number (Optional)</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="credit-card" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="NIC Number"
              placeholderTextColor="#9ca3af"
              value={teacherData.nicNumber}
              onChangeText={(text) => handleTeacherChange("nicNumber", text)}
            />
          </View>
        </View>

        {/* Current School */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Current School <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="school" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Current School Name"
              placeholderTextColor="#9ca3af"
              value={teacherData.currentSchool}
              onChangeText={(text) => handleTeacherChange("currentSchool", text)}
            />
          </View>
        </View>

        {/* Current District */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Current District <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDistrictDropdown(true)}
          >
            <MaterialIcons name="location-on" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                !teacherData.currentDistrict && { color: "#9ca3af" },
              ]}
            >
              {teacherData.currentDistrict || "Select Current District"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showDistrictDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDistrictDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowDistrictDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.dropdownContainer}>
                  <FlatList
                    data={districts}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onSelect: handleCurrentDistrictSelect,
                      })
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Current Zone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Current School Zone <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              !teacherData.currentDistrict && styles.disabledInput,
            ]}
            onPress={() => teacherData.currentDistrict && setShowCurrentZoneDropdown(true)}
            disabled={!teacherData.currentDistrict}
          >
            <MaterialIcons name="map" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                !teacherData.currentZone && { color: "#9ca3af" },
              ]}
            >
              {teacherData.currentZone ||
                (teacherData.currentDistrict ? "Select Zone" : "Select District First")}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showCurrentZoneDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCurrentZoneDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowCurrentZoneDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.dropdownContainer}>
                  <FlatList
                    data={availableCurrentZones}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onSelect: handleCurrentZoneSelect,
                      })
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Required Districts (Multi-selection) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Required Districts (Optional)</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowRequiredDistrictDropdown(true)}
          >
            <MaterialIcons name="location-city" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                teacherData.requiredDistricts.length === 0 && { color: "#9ca3af" },
              ]}
            >
              {teacherData.requiredDistricts.length > 0
                ? `${teacherData.requiredDistricts.length} districts selected`
                : "Select Required Districts"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showRequiredDistrictDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRequiredDistrictDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowRequiredDistrictDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.dropdownContainer, { maxHeight: 400 }]}>
                  <FlatList
                    data={districts}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.checkboxItem}
                        onPress={() => toggleRequiredDistrict(item)}
                      >
                        <Checkbox
                          value={teacherData.requiredDistricts.includes(item)}
                          onValueChange={() => toggleRequiredDistrict(item)}
                          color={teacherData.requiredDistricts.includes(item) ? "#3b82f6" : undefined}
                        />
                        <Text style={styles.checkboxText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Required Zones (Multi-selection) */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Required Zones (Optional)</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowRequiredZoneDropdown(true)}
          >
            <MaterialIcons name="map" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                teacherData.requiredZones.length === 0 && { color: "#9ca3af" },
              ]}
            >
              {teacherData.requiredZones.length > 0
                ? `${teacherData.requiredZones.length} zones selected`
                : "Select Required Zones"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showRequiredZoneDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRequiredZoneDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowRequiredZoneDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.dropdownContainer, { maxHeight: 400 }]}>
                  <FlatList
                    data={availableZones}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.checkboxItem}
                        onPress={() => toggleRequiredZone(item)}
                      >
                        <Checkbox
                          value={teacherData.requiredZones.includes(item)}
                          onValueChange={() => toggleRequiredZone(item)}
                          color={teacherData.requiredZones.includes(item) ? "#3b82f6" : undefined}
                        />
                        <Text style={styles.checkboxText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Subject */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowSubjectDropdown(true)}
          >
            <MaterialIcons name="book" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                !teacherData.subject && { color: "#9ca3af" },
              ]}
            >
              {teacherData.subject || "Select Subject"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showSubjectDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSubjectDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowSubjectDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.dropdownContainer}>
                  <FlatList
                    data={subjects}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onSelect: handleSubjectSelect,
                      })
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Teaching Level */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teaching Level</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowLevelDropdown(true)}
          >
            <MaterialIcons name="trending-up" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                !teacherData.level && { color: "#9ca3af" },
              ]}
            >
              {teacherData.level || "Select Level"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showLevelDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLevelDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowLevelDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.dropdownContainer}>
                  <FlatList
                    data={levels}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) =>
                      renderDropdownItem({
                        item,
                        onSelect: handleLevelSelect,
                      })
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Department */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Department (Optional)</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="business" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Department"
              placeholderTextColor="#9ca3af"
              value={teacherData.department}
              onChangeText={(text) => handleTeacherChange("department", text)}
            />
          </View>
        </View>

        {/* Specialization */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Specialization (Optional)</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="psychology" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Specialization"
              placeholderTextColor="#9ca3af"
              value={teacherData.specialization}
              onChangeText={(text) => handleTeacherChange("specialization", text)}
            />
          </View>
        </View>

        {/* Years of Experience */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Years of Experience (Optional)</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="history" size={18} color="#999" style={styles.icon} />
            <TextInput
              style={styles.textInput}
              placeholder="Years of Experience"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              value={teacherData.experience}
              onChangeText={(text) => handleTeacherChange("experience", text)}
            />
          </View>
        </View>

        {/* Qualifications */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Qualifications (Optional)</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowQualificationDropdown(true)}
          >
            <MaterialIcons name="school" size={18} color="#999" style={styles.icon} />
            <Text
              style={[
                styles.textInput,
                teacherData.qualifications.length === 0 && { color: "#9ca3af" },
              ]}
            >
              {teacherData.qualifications.length > 0
                ? `${teacherData.qualifications.length} selected`
                : "Select Qualifications"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
          </TouchableOpacity>

          <Modal
            visible={showQualificationDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowQualificationDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowQualificationDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.dropdownContainer, { maxHeight: 400 }]}>
                  <FlatList
                    data={qualifications}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.checkboxItem}
                        onPress={() => toggleQualification(item)}
                      >
                        <Checkbox
                          value={teacherData.qualifications.includes(item)}
                          onValueChange={() => toggleQualification(item)}
                          color={teacherData.qualifications.includes(item) ? "#3b82f6" : undefined}
                        />
                        <Text style={styles.checkboxText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>

        {/* Teaching Permissions
        <View style={styles.permissionsContainer}>
          <Text style={styles.label}>Teaching Permissions</Text>
          
          <View style={styles.permissionRow}>
            <View style={styles.permissionCheckbox}>
              <Checkbox
                value={teacherData.canCreateExams}
                onValueChange={(value) => handleTeacherChange("canCreateExams", value)}
                color={teacherData.canCreateExams ? "#3b82f6" : undefined}
              />
              <Text style={styles.permissionText}>Can Create Exams</Text>
            </View>
            
            <View style={styles.permissionCheckbox}>
              <Checkbox
                value={teacherData.canMonitorExams}
                onValueChange={(value) => handleTeacherChange("canMonitorExams", value)}
                color={teacherData.canMonitorExams ? "#3b82f6" : undefined}
              />
              <Text style={styles.permissionText}>Can Monitor Exams</Text>
            </View>
            
            <View style={styles.permissionCheckbox}>
              <Checkbox
                value={teacherData.canManageClasses}
                onValueChange={(value) => handleTeacherChange("canManageClasses", value)}
                color={teacherData.canManageClasses ? "#3b82f6" : undefined}
              />
              <Text style={styles.permissionText}>Can Manage Classes</Text>
            </View>
          </View>
        </View>
 */}
        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <View style={styles.termsCheckbox}>
            <Checkbox
              value={formData.acceptTerms}
              onValueChange={(value) => handleChange("acceptTerms", value.toString())}
              color={formData.acceptTerms ? "#3b82f6" : undefined}
            />
            <Text style={styles.termsText}>
              I accept the Terms and Conditions for teacher registration
            </Text>
          </View>
        </View>
      </>
    );
  };

  // Render Role Indicator
  const renderRoleIndicator = () => {
    if (!userRole) return null;
    
    return (
      <View style={styles.roleIndicator}>
        <Text style={styles.roleIndicatorText}>
          {userRole === "Teacher" 
            ? "Teacher Registration" 
            : "Student Registration"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Gradient with Icons and Waves */}
      <LinearGradient
        colors={["#4B3AFF", "#5C6CFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topSection}
      >
        {/* Icons Layer with Animation */}
        <View style={styles.iconsLayer}>{renderDistributedIcons()}</View>

        {/* Title */}
        <Text style={styles.header}>Learn APP</Text>

        {/* Light Blue Wave */}
        <View style={styles.lightBlueWaveContainer}>
          <Svg
            height="92"
            width="90%"
            viewBox="0 0 1440 320"
            style={styles.lightBlueWaveSvg}
          >
            <Path
              fill="#4B9BFF"
              d="M0,180L48,170C96,160,192,140,288,130C384,120,480,120,576,135C672,150,768,180,864,190C960,200,1056,190,1152,175C1248,160,1344,130,1392,115L1440,100L1440,320L0,320Z"
            />
          </Svg>
        </View>

        {/* White Wave */}
        <Svg
          height="92"
          width="100%"
          viewBox="0 0 1440 320"
          style={styles.whiteWaveWrapper}
        >
          <Path
            fill="#ffffff"
            d="M0,224L48,202.7C96,181,192,139,288,128C384,117,480,139,576,165.3C672,192,768,224,864,234.7C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L0,320Z"
          />
        </Svg>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up for your account</Text>
          </View>

          {/* Role Indicator */}
          {renderRoleIndicator()}

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Personal Info Section */}
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                First Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color="#999"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="First Name"
                  placeholderTextColor="#9ca3af"
                  value={formData.firstName}
                  onChangeText={(t) => handleChange("firstName", t)}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Last Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color="#999"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Last Name"
                  placeholderTextColor="#9ca3af"
                  value={formData.lastName}
                  onChangeText={(t) => handleChange("lastName", t)}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Date of Birth <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={showDatepicker}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color="#999"
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.textInput,
                    !formData.dateOfBirth && { color: "#9ca3af" },
                  ]}
                >
                  {formData.dateOfBirth || "Date of Birth"}
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

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="email"
                  size={18}
                  color="#999"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(t) => handleChange("email", t)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Verification */}
            {renderPhoneVerification()}

            {/* Teacher Specific Fields */}
            {renderTeacherFields()}

            {/* Only show these academic fields for students */}
            {userRole !== "Teacher" && (
              <>
                <Text style={styles.sectionTitle}>Academic Information</Text>

                {/* District */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>District</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowDistrictDropdown(true)}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <Text
                      style={[
                        styles.textInput,
                        !formData.district && { color: "#9ca3af" },
                      ]}
                    >
                      {formData.district || "District"}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
                  </TouchableOpacity>

                  <Modal
                    visible={showDistrictDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDistrictDropdown(false)}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setShowDistrictDropdown(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.dropdownContainer}>
                          <FlatList
                            data={districts}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) =>
                              renderDropdownItem({
                                item,
                                onSelect: handleDistrictSelect,
                              })
                            }
                            showsVerticalScrollIndicator={false}
                          />
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </View>

                {/* Zone */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Zone</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      !formData.district && styles.disabledInput,
                    ]}
                    onPress={() => formData.district && setShowZoneDropdown(true)}
                    disabled={!formData.district}
                  >
                    <MaterialIcons
                      name="map"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <Text
                      style={[
                        styles.textInput,
                        !formData.zone && { color: "#9ca3af" },
                      ]}
                    >
                      {formData.zone ||
                        (formData.district ? "Zone" : "Select District First")}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
                  </TouchableOpacity>

                  <Modal
                    visible={showZoneDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowZoneDropdown(false)}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setShowZoneDropdown(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.dropdownContainer}>
                          <FlatList
                            data={availableZones}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) =>
                              renderDropdownItem({
                                item,
                                onSelect: handleZoneSelect,
                              })
                            }
                            showsVerticalScrollIndicator={false}
                          />
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </View>

                {/* Grade */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Grade</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowGradeDropdown(true)}
                  >
                    <MaterialIcons
                      name="school"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <Text
                      style={[
                        styles.textInput,
                        !formData.grade && { color: "#9ca3af" },
                      ]}
                    >
                      {formData.grade || "Grade"}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
                  </TouchableOpacity>

                  <Modal
                    visible={showGradeDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowGradeDropdown(false)}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setShowGradeDropdown(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.dropdownContainer}>
                          <FlatList
                            data={grades}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) =>
                              renderDropdownItem({
                                item,
                                onSelect: handleGradeSelect,
                              })
                            }
                            showsVerticalScrollIndicator={false}
                          />
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </View>

                {/* School */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>School</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="apartment"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="School"
                      placeholderTextColor="#9ca3af"
                      value={formData.school}
                      onChangeText={(t) => handleChange("school", t)}
                    />
                  </View>
                </View>

                {/* Medium */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Medium</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setShowMediumDropdown(true)}
                  >
                    <MaterialIcons
                      name="translate"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <Text
                      style={[
                        styles.textInput,
                        !formData.medium && { color: "#9ca3af" },
                      ]}
                    >
                      {formData.medium || "Medium"}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#999" />
                  </TouchableOpacity>

                  <Modal
                    visible={showMediumDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowMediumDropdown(false)}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setShowMediumDropdown(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.dropdownContainer}>
                          <FlatList
                            data={mediums}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) =>
                              renderDropdownItem({
                                item,
                                onSelect: handleMediumSelect,
                              })
                            }
                            showsVerticalScrollIndicator={false}
                          />
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </View>

                {/* Institution */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Institution</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="business"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Institution"
                      placeholderTextColor="#9ca3af"
                      value={formData.institution}
                      onChangeText={(t) => handleChange("institution", t)}
                    />
                  </View>
                </View>

                {/* Institution Code */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Institution Code (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="vpn-key"
                      size={18}
                      color="#999"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Institution Code"
                      placeholderTextColor="#9ca3af"
                      value={formData.institutionCode}
                      onChangeText={(t) => handleChange("institutionCode", t)}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Password Section */}
            <Text style={styles.sectionTitle}>Password</Text>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="lock"
                  size={18}
                  color="#999"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(t) => handleChange("password", t)}
                />
              </View>
              <Text style={styles.helperText}>
                Must be at least 8 characters with uppercase, lowercase, number
                & special character
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Confirm Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="lock"
                  size={18}
                  color="#999"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(t) => handleChange("confirmPassword", t)}
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.signUpButton,
                (!isPhoneVerified || loading) && styles.disabledButton,
              ]}
              onPress={completeSignup}
              disabled={!isPhoneVerified || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>
                  {isPhoneVerified 
                    ? `Sign Up as ${userRole === "Teacher" ? "Teacher" : "Student"}` 
                    : "Verify Phone to Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already Have An Account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topSection: {
    position: "relative",
    width: "100%",
    height: 230,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconsLayer: {
    position: "absolute",
    width: "100%",
    height: "95%",
    zIndex: 7,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontFamily: "Poppins-Bold",
  },
  whiteWaveWrapper: {
    position: "absolute",
    bottom: -5,
    left: 0,
    zIndex: 3,
  },
  lightBlueWaveContainer: {
    position: "absolute",
    bottom: -0.1,
    left: "5%",
    right: "-20%",
    alignItems: "center",
    zIndex: 2,
  },
  lightBlueWaveSvg: {},
  scrollContainer: {
    flexGrow: 1,
  },
  headingContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  roleIndicator: {
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  roleIndicatorText: {
    color: "#3b82f6",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 10,
    marginBottom: 16,
    fontFamily: "Poppins-SemiBold",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: "#000",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 15,
    minHeight: 50,
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  icon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: "#000",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    paddingVertical: 0,
  },
  // Phone Verification Styles
  verifyButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
    fontFamily: "Poppins-Medium",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    fontFamily: "Poppins-Medium",
  },
  // OTP Section Styles
  otpSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  otpLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpInputBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    backgroundColor: "#fff",
  },
  otpInputFilled: {
    borderColor: "#3b82f6",
    backgroundColor: "#f0f7ff",
  },
  otpActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerText: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "Poppins-Regular",
  },
  resendText: {
    fontSize: 12,
    color: "#3b82f6",
    fontFamily: "Poppins-Medium",
  },
  resendTextDisabled: {
    color: "#9ca3af",
  },
  verifyOtpButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifyOtpButtonText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  // Other styles
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  // Dropdown styles
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
    fontSize: 14,
    color: "#000",
    fontFamily: "Poppins-Regular",
  },
  // Checkbox styles
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  checkboxText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Poppins-Regular",
    marginLeft: 12,
  },
  // Permissions styles
  permissionsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  permissionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  permissionCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
  },
  permissionText: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  // Terms styles
  termsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  termsCheckbox: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  termsText: {
    fontSize: 12,
    color: "#1e40af",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  // Signup Button
  signUpButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 16,
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
  },
  // Sign In Link
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  signInText: {
    color: "#666",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  signInLink: {
    color: "#3b82f6",
    fontFamily: "Poppins-Medium",
    fontSize: 14,
  },
});

export default SignUp;