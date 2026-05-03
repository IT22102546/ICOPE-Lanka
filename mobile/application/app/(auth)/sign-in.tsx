import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  KeyboardTypeOptions,
  Dimensions,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import CheckBox from "expo-checkbox";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAuthStore from "@/stores/authStore";

// ── Bilingual text ───────────────────────────────────────────────
const TXT: Record<string, { en: string; si: string }> = {
  brand:       { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  tagline:     { en: "Health Care Staff Portal", si: "සෞඛ්‍ය සේවා ද්වාරය" },
  welcome:     { en: "Welcome Back", si: "සාදරයෙන් පිළිගනිමු" },
  subtitle:    { en: "Sign in with your admin-provided credentials", si: "පරිපාලක ලබා දුන් අක්තපත්‍ර සමඟ පිවිසෙන්න" },
  emailLabel:  { en: "Email or Phone Number", si: "විද්‍යුත් තැපෑල හෝ දුරකථන අංකය" },
  emailPh:     { en: "Enter your email or phone number", si: "ඔබේ විද්‍යුත් තැපෑල ඇතුලත් කරන්න" },
  passLabel:   { en: "Password", si: "මුරපදය" },
  passPh:      { en: "Enter Your Password", si: "ඔබේ මුරපදය ඇතුලත් කරන්න" },
  remember:    { en: "Remember Me", si: "මතක තබා ගන්න" },
  signIn:      { en: "Sign In", si: "පිවිසෙන්න" },
  adminNote:   { en: "Your account credentials are provided by your hospital administrator.", si: "ඔබේ ගිණුම් තොරතුරු ඔබේ රෝහල් පරිපාලක විසින් ලබා දෙනු ලැබේ." },
  emailReq:    { en: "Email or phone number is required", si: "විද්‍යුත් තැපෑල හෝ දුරකථන අංකය අවශ්‍යයි" },
  passReq:     { en: "Password is required", si: "මුරපදය අවශ්‍යයි" },
  invalidId:   { en: "Please enter a valid email or phone number", si: "වලංගු විද්‍යුත් තැපෑලක් හෝ දුරකථන අංකයක් ඇතුලත් කරන්න" },
  usingEmail:  { en: "Using email to sign in", si: "විද්‍යුත් තැපෑලෙන් පිවිසෙමින්" },
  usingPhone:  { en: "Using phone number to sign in", si: "දුරකථන අංකයෙන් පිවිසෙමින්" },
  accessDenied:{ en: "Access Denied", si: "ප්‍රවේශය ප්‍රතික්ෂේප විය" },
  accessMsg:   { en: "This account does not have health care staff or admin access.", si: "මෙම ගිණුමට සෞඛ්‍ය සේවා කාර්ය මණ්ඩල හෝ පරිපාලක ප්‍රවේශය නැත." },
  incorrectPw: { en: "Incorrect password", si: "වැරදි මුරපදය" },
  incorrectCreds: { en: "Invalid email or password", si: "වැරදි විද්‍යුත් තැපෑල හෝ මුරපදය" },
  signInError: { en: "Sign In Error", si: "පිවිසුම් දෝෂය" },
  errorMsg:    { en: "Failed to sign in. Please check your connection.", si: "පිවිසීමට අසමත් විය. කරුණාකර ඔබේ සම්බන්ධතාවය පරීක්ෂා කරන්න." },
};

const MEDICAL_ICONS = [
  "fitness-outline", "heart-outline", "pulse-outline",
  "medkit-outline", "body-outline", "barbell-outline",
  "walk-outline", "bandage-outline", "stopwatch-outline",
  "heart-circle-outline", "fitness", "heart",
  "pulse", "medkit", "body",
] as const;

const ICON_POSITIONS = [
  { name: "fitness-outline",      top: 12,  leftPct:  3, size: 20, baseOpacity: 0.60, rotation:  -5 },
  { name: "heart-outline",        top: 18,  leftPct: 22, size: 16, baseOpacity: 0.55, rotation:   8 },
  { name: "pulse-outline",        top: 10,  leftPct: 44, size: 18, baseOpacity: 0.50, rotation:  -3 },
  { name: "medkit-outline",       top: 20,  leftPct: 68, size: 22, baseOpacity: 0.60, rotation:   6 },
  { name: "body-outline",         top: 14,  leftPct: 88, size: 20, baseOpacity: 0.65, rotation:  -8 },
  { name: "barbell-outline",      top: 68,  leftPct:  5, size: 22, baseOpacity: 0.65, rotation:   5 },
  { name: "walk-outline",         top: 72,  leftPct: 48, size: 18, baseOpacity: 0.55, rotation:  10 },
  { name: "bandage-outline",      top: 62,  leftPct: 84, size: 20, baseOpacity: 0.60, rotation:  -6 },
  { name: "stopwatch-outline",    top: 122, leftPct:  3, size: 20, baseOpacity: 0.60, rotation:   7 },
  { name: "heart-circle-outline", top: 130, leftPct: 27, size: 18, baseOpacity: 0.55, rotation:  -4 },
  { name: "fitness",              top: 120, leftPct: 60, size: 22, baseOpacity: 0.65, rotation:   3 },
  { name: "heart",                top: 128, leftPct: 84, size: 20, baseOpacity: 0.60, rotation:  -7 },
  { name: "pulse",                top: 175, leftPct:  7, size: 20, baseOpacity: 0.60, rotation:   4 },
  { name: "medkit",               top: 178, leftPct: 45, size: 18, baseOpacity: 0.55, rotation:  -5 },
  { name: "body",                 top: 170, leftPct: 80, size: 22, baseOpacity: 0.65, rotation:   6 },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isSmallScreen = screenHeight < 700;
const TOP_H         = Math.round(screenHeight * (isSmallScreen ? 0.28 : screenHeight < 850 ? 0.30 : 0.32));
const HEADER_FONT   = isSmallScreen ? 24 : 30;
const TAGLINE_MB    = isSmallScreen ? 28 : 50;

const API = process.env.EXPO_PUBLIC_API_KEY;

const isValidIdentifier = (value: string): boolean => {
  if (!value || value.trim() === "") return false;
  const trimmed = value.trim();
  
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (emailRegex.test(trimmed)) {
    return true;
  }
  
  const cleanPhone = trimmed.replace(/\D/g, '');
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
};

const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    return `+94${cleaned.substring(1)}`;
  }
  
  if (cleaned.length === 9) {
    return `+94${cleaned}`;
  }
  
  if (cleaned.startsWith('94')) {
    return `+${cleaned}`;
  }
  
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

const isLikelyEmail = (identifier: string): boolean => {
  if (!identifier) return false;
  
  if (identifier.includes('@')) {
    return true;
  }
  
  if (identifier.includes('.') && /[a-zA-Z]/.test(identifier)) {
    return true;
  }
  
  if (/^\d+$/.test(identifier.replace(/\D/g, ''))) {
    return false;
  }
  
  if (/[a-zA-Z]/.test(identifier)) {
    return true;
  }
  
  return false;
};

const getKeyboardType = (value: string): KeyboardTypeOptions => {
  if (!value) return "default";
  
  if (isLikelyEmail(value)) {
    return "email-address";
  }
  
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length > 0 && /^\d+$/.test(cleanValue)) {
    return "phone-pad";
  }
  
  return "default";
};

const getPlaceholder = (value: string): string => {
  if (!value) return "Enter your email or phone number";
  
  if (isLikelyEmail(value)) {
    return "Enter your email address";
  }
  
  return "Enter your phone number";
};

const getIconName = (value: string): string => {
  if (!value) return "person-outline";
  
  if (isLikelyEmail(value)) {
    return "mail-outline";
  }
  
  return "call-outline";
};

const SignIn = () => {
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lang, setLang] = useState<"en" | "si">("en");
  const [apiErrors, setApiErrors] = useState({
    identifier: "",
    password: "",
  });
  const t = (key: string) => TXT[key]?.[lang] ?? key;
  
  const identifierValue = watch("identifier");
  const router = useRouter();
  const { signIn } = useAuthStore();

  const animatedValues = useRef(
    MEDICAL_ICONS.map(() => new Animated.Value(0))
  ).current;
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  // No role param handling needed — this screen is parent-only

  const startAnimations = () => {
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];

    animatedValues.forEach((value) => value.setValue(0));

    const iconAnimations = animatedValues.map((animValue, index) => {
      const delay = index * 150 + Math.random() * 400;

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
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

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const saved = await AsyncStorage.getItem("rememberMe");
        if (saved === "true") {
          const savedIdentifier = await AsyncStorage.getItem("savedIdentifier");
          const savedPassword = await AsyncStorage.getItem("savedPassword");
          if (savedIdentifier) setValue("identifier", savedIdentifier);
          if (savedPassword) setValue("password", savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Failed to load saved credentials", e);
      }
    };
    loadSavedCredentials();
  }, []);

  const clearApiErrors = (field: string) => {
    setApiErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
    clearErrors(field);
  };

  const onSubmit = async (credentials: { identifier: string; password: string }) => {
    try {
      setLoading(true);

      const trimmedIdentifier = credentials.identifier.trim();

      if (!isValidIdentifier(trimmedIdentifier)) {
        setError("identifier", {
          type: "manual",
          message: "Please enter a valid email or phone number",
        });
        setLoading(false);
        return;
      }

      let formattedIdentifier = trimmedIdentifier;
      const isEmailInput = isLikelyEmail(trimmedIdentifier) && trimmedIdentifier.includes('@');
      
      if (!isEmailInput) {
        formattedIdentifier = formatPhoneNumber(trimmedIdentifier);
      }

      console.log("📤 Sending physiotherapist login request:", { identifier: formattedIdentifier });

      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-type": "mobile",
        },
        body: JSON.stringify({
          identifier: formattedIdentifier,
          password: credentials.password,
          allowedRoles: ["PHYSIOTHERAPIST", "SUPER_ADMIN"],
        }),
      });

      console.log("📡 Login Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        const message = errorData.message || "Invalid credentials. Please try again.";
        if (message.toLowerCase().includes("role") || message.toLowerCase().includes("not allowed")) {
          Alert.alert(
            t("accessDenied"),
            t("accessMsg"),
            [{ text: "OK" }]
          );
        } else if (message.toLowerCase().includes("credential")) {
          // "Invalid credentials" covers both wrong email and wrong password
          setError("password", { type: "manual", message: t("incorrectCreds") });
        } else if (message.toLowerCase().includes("password")) {
          setError("password", { type: "manual", message: t("incorrectPw") });
        } else {
          setError("identifier", { type: "manual", message: message });
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log("📱 Login API Response:", result);

      const { accessToken, user } = result;

      if (!accessToken || !user) {
        throw new Error("Missing tokens or user data in response");
      }

      // Backend uses access token only (no refresh token endpoint); reuse it as the stored refresh token
      await signIn(user, accessToken, accessToken);

      // Save or clear credentials based on Remember Me
      if (rememberMe) {
        await AsyncStorage.setItem("rememberMe", "true");
        await AsyncStorage.setItem("savedIdentifier", credentials.identifier);
        await AsyncStorage.setItem("savedPassword", credentials.password);
      } else {
        await AsyncStorage.multiRemove(["rememberMe", "savedIdentifier", "savedPassword"]);
      }

      console.log("✅ Physiotherapist sign in successful!");
      router.replace("/(root)/(screens)/doctor-patients");
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      Alert.alert(t("signInError"), error.message || t("errorMsg"));
    } finally {
      setLoading(false);
    }
  };

  const getInputBorderColor = (fieldName: keyof typeof errors) => {
    if (errors[fieldName] || apiErrors[fieldName]) {
      return "#ef4444";
    }
    return "#d1d5db";
  };

  // Hospital-themed floating icons (matching onboarding screens)
  const renderFloatingIcons = () =>
    ICON_POSITIONS.map((item, index) => {
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
        outputRange: [`${item.rotation}deg`, `${item.rotation + 8}deg`],
      });
      const opacity = animatedValues[index].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [item.baseOpacity, Math.min(item.baseOpacity * 1.5, 1), item.baseOpacity],
      });
      return (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            top: item.top,
            left: `${item.leftPct}%` as any,
            zIndex: 2,
            transform: [{ translateY }, { scale }, { rotate }],
            opacity,
          }}
        >
          <Ionicons name={item.name as any} size={item.size} color="rgba(255,255,255,0.88)" />
        </Animated.View>
      );
    });

  return (
    <View style={styles.container}>
      {/* Green background behind status bar */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top, backgroundColor: "#0E7C61", zIndex: 10 }} />

      {/* Language toggle */}
      <View style={{ position: "absolute", top: insets.top + 8, right: 16, zIndex: 99 }}>
        <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 }}>
          <Ionicons name="language-outline" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontFamily: "Poppins-SemiBold", fontSize: 13 }}>{lang === "en" ? "සිං" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={["#0E7C61", "#14A87D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topSection, { paddingTop: insets.top }]}
      >
        <View style={styles.iconsLayer}>{renderFloatingIcons()}</View>
        <Text style={styles.header}>{t("brand")}</Text>
        <Text style={styles.tagline}>{t("tagline")}</Text>

        <View style={styles.lightBlueWaveContainer}>
          <Svg height="92" width="100%" viewBox="0 0 1440 320">
            <Path
              fill="#3CC8A1"
              d="M0,180L48,170C96,160,192,140,288,130C384,120,480,120,576,135C672,150,768,180,864,190C960,200,1056,190,1152,175C1248,160,1344,130,1392,115L1440,100L1440,320L0,320Z"
            />
          </Svg>
        </View>

        <Svg height="92" width="100%" viewBox="0 0 1440 320" style={styles.whiteWaveWrapper}>
          <Path
            fill="#ffffff"
            d="M0,224L48,202.7C96,181,192,139,288,128C384,117,480,139,576,165.3C672,192,768,224,864,234.7C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L0,320Z"
          />
        </Svg>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingContainer}>
          <Text style={styles.welcomeText}>{t("welcome")}</Text>
          <Text style={styles.subtitle}>{t("subtitle")}</Text>
        </View>

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="identifier"
            rules={{
              required: t("emailReq"),
              validate: (value) => isValidIdentifier(value) || t("invalidId"),
            }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {t("emailLabel")} <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { borderColor: getInputBorderColor("identifier") }]}>
                  <Ionicons
                    name={getIconName(value)}
                    size={18}
                    color={errors.identifier || apiErrors.identifier ? "#ef4444" : "gray"}
                  />
                  <TextInput
                    placeholder={getPlaceholder(value)}
                    placeholderTextColor="#9ca3af"
                    keyboardType={getKeyboardType(value)}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      clearApiErrors("identifier");
                    }}
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
                {(errors.identifier || apiErrors.identifier) && (
                  <Text style={styles.errorText}>
                    {errors.identifier?.message || apiErrors.identifier}
                  </Text>
                )}
                {value && !errors.identifier && (
                  <Text style={styles.identifierTypeText}>
                    {isLikelyEmail(value) ? t("usingEmail") : t("usingPhone")}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: t("passReq") }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {t("passLabel")} <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { borderColor: getInputBorderColor("password") }]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={errors.password || apiErrors.password ? "#ef4444" : "gray"}
                  />
                  <TextInput
                    placeholder={t("passPh")}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={secureText}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      clearApiErrors("password");
                    }}
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    <Ionicons
                      name={secureText ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={errors.password || apiErrors.password ? "#ef4444" : "gray"}
                    />
                  </TouchableOpacity>
                </View>
                {(errors.password || apiErrors.password) && (
                  <Text style={styles.errorText}>
                    {errors.password?.message || apiErrors.password}
                  </Text>
                )}
              </View>
            )}
          />

          <View style={styles.optionsContainer}>
            <View style={styles.rememberMeContainer}>
              <CheckBox
                value={rememberMe}
                onValueChange={setRememberMe}
                color={rememberMe ? "#2563eb" : undefined}
              />
              <Text style={styles.rememberMeText}>{t("remember")}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={[styles.signInButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signInText}>{t("signIn")}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.adminNoteText}>
            {t("adminNote")}
          </Text>
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
    height: TOP_H,
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
    fontSize: HEADER_FONT,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontFamily: "Poppins-Bold",
    marginBottom: 2,
  },
  tagline: {
    fontSize: isSmallScreen ? 10 : 12,
    color: "rgba(255,255,255,0.8)",
    zIndex: 5,
    fontFamily: "Poppins-Regular",
    letterSpacing: 2,
    marginBottom: TAGLINE_MB,
    textTransform: "uppercase",
  },
  whiteWaveWrapper: {
    position: "absolute",
    bottom: -6,
    left: 0,
    zIndex: 3,
  },
  lightBlueWaveContainer: {
    position: "absolute",
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    marginTop: -2,
    backgroundColor: "#fff",
  },
  headingContainer: {
    alignItems: "center",
    marginTop: isSmallScreen ? 16 : 40,
    marginBottom: isSmallScreen ? 12 : 20,
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
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 16,
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  formContainer: {
    paddingHorizontal: Math.round(screenWidth * 0.08),
  },
  inputContainer: {
    marginBottom: isSmallScreen ? 14 : 20,
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
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    color: "#000",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  identifierTypeText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
    fontStyle: "italic",
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 24,
    marginTop: 8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    marginLeft: 8,
    color: "#000",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#3b82f6",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: "#0E7C61",
    paddingVertical: isSmallScreen ? 12 : 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isSmallScreen ? 10 : 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
  },
  adminNoteText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontFamily: "Poppins-Regular",
    fontStyle: "italic",
  },
});

export default SignIn;