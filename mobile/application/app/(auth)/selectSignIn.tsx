import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { images } from "@/constants";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isSmallScreen = screenHeight < 700;
const isMedScreen   = screenHeight >= 700 && screenHeight < 850;

// Responsive header height — percentage-based so it works on all devices
const TOP_H = Math.round(
  screenHeight * (isSmallScreen ? 0.28 : isMedScreen ? 0.30 : 0.32)
);
const HEADER_FONT = isSmallScreen ? 22 : isMedScreen ? 26 : 30;
const TAGLINE_FONT = isSmallScreen ? 10 : 12;
const LOGO_SIZE = isSmallScreen ? 48 : 60;

// Scale helper for icon positions relative to header height
const _s = (base: number): number => Math.round((base / 200) * TOP_H);

// ── Bilingual text ───────────────────────────────────────────────
const TEXT: Record<string, { en: string; si: string }> = {
  brand:       { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  tagline:     { en: "Integrated Care for Older People", si: "වැඩිහිටියන් සඳහා ඒකාබද්ධ සත්කාර" },
  loginAs:     { en: "Login As", si: "ලෙස පිවිසෙන්න" },
  chooseRole:  { en: "Choose your role to continue", si: "ඉදිරියට යාමට ඔබේ භූමිකාව තෝරන්න" },
  physio:      { en: "Health Care Staff", si: "සෞඛ්‍ය සේවා කාර්ය මණ්ඩලය" },
  physioDesc:  { en: "ICOPE assessments & patient care", si: "ICOPE තක්සේරු සහ රෝගී සත්කාර" },
  patient:     { en: "Patient / Elder", si: "රෝගී / වැඩිහිටි" },
  patientDesc: { en: "View your care plan & progress", si: "ඔබේ සත්කාර සැලැස්ම බලන්න" },
  continue:    { en: "Continue", si: "ඉදිරියට" },
};

const MEDICAL_ICONS = [
  "fitness-outline", "heart-outline", "pulse-outline",
  "medkit-outline", "body-outline", "barbell-outline",
  "walk-outline", "bandage-outline", "stopwatch-outline",
  "heart-circle-outline", "fitness", "heart",
  "pulse", "medkit", "body",
] as const;

// Scaled icon positions so they adapt to header height
const ICON_POSITIONS = [
  { name: "fitness-outline",      top: _s(10),  leftPct:  3, size: 20, baseOpacity: 0.55, rotation:  -5 },
  { name: "heart-outline",        top: _s(16),  leftPct: 22, size: 16, baseOpacity: 0.50, rotation:   8 },
  { name: "pulse-outline",        top: _s(8),   leftPct: 44, size: 18, baseOpacity: 0.45, rotation:  -3 },
  { name: "medkit-outline",       top: _s(18),  leftPct: 68, size: 22, baseOpacity: 0.55, rotation:   6 },
  { name: "body-outline",         top: _s(12),  leftPct: 88, size: 20, baseOpacity: 0.60, rotation:  -8 },
  { name: "barbell-outline",      top: _s(60),  leftPct:  5, size: 22, baseOpacity: 0.60, rotation:   5 },
  { name: "walk-outline",         top: _s(64),  leftPct: 48, size: 18, baseOpacity: 0.50, rotation:  10 },
  { name: "bandage-outline",      top: _s(56),  leftPct: 84, size: 20, baseOpacity: 0.55, rotation:  -6 },
  { name: "stopwatch-outline",    top: _s(110), leftPct:  3, size: 20, baseOpacity: 0.55, rotation:   7 },
  { name: "heart-circle-outline", top: _s(116), leftPct: 27, size: 18, baseOpacity: 0.50, rotation:  -4 },
  { name: "fitness",              top: _s(108), leftPct: 60, size: 22, baseOpacity: 0.60, rotation:   3 },
  { name: "heart",                top: _s(114), leftPct: 84, size: 20, baseOpacity: 0.55, rotation:  -7 },
  { name: "pulse",                top: _s(155), leftPct:  7, size: 20, baseOpacity: 0.55, rotation:   4 },
  { name: "medkit",               top: _s(158), leftPct: 45, size: 18, baseOpacity: 0.50, rotation:  -5 },
  { name: "body",                 top: _s(152), leftPct: 80, size: 22, baseOpacity: 0.60, rotation:   6 },
];

const SelectSignIn = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "si">("en");
  const t = (key: string) => TEXT[key]?.[lang] ?? key;

  const animatedValues = useRef(
    MEDICAL_ICONS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const anims = animatedValues.map((animValue, index) => {
      const delay = index * 150 + Math.random() * 400;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, { toValue: 1, duration: 2500 + Math.random() * 1500, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 2500 + Math.random() * 1500, useNativeDriver: true }),
        ])
      );
    });
    anims.forEach((a) => a.start());
    return () => animatedValues.forEach((v) => v.stopAnimation());
  }, []);

  const renderFloatingIcons = () =>
    ICON_POSITIONS.map((item, index) => {
      const translateY = animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
      const scale      = animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
      const rotate     = animatedValues[index].interpolate({ inputRange: [0, 1], outputRange: [`${item.rotation}deg`, `${item.rotation + 6}deg`] });
      const opacity    = animatedValues[index].interpolate({ inputRange: [0, 0.5, 1], outputRange: [item.baseOpacity, Math.min(item.baseOpacity * 1.4, 1), item.baseOpacity] });
      return (
        <Animated.View key={index} style={{ position: "absolute", top: item.top, left: `${item.leftPct}%` as any, zIndex: 2, transform: [{ translateY }, { scale }, { rotate }], opacity }}>
          <Ionicons name={item.name as any} size={item.size} color="rgba(255,255,255,0.88)" />
        </Animated.View>
      );
    });

  const handleContinue = () => {
    if (!selectedRole) return;
    if (selectedRole === "Patient") {
      router.push("/(auth)/patient-coming-soon");
      return;
    }
    router.push({ pathname: "/sign-in", params: { role: "Health Care Staff", backendRole: "PHYSIOTHERAPIST" } });
  };

  return (
    <View style={styles.container}>
      {/* Green background extends behind status bar */}
      <View style={[styles.statusBarBg, { height: insets.top }]} />

      {/* Language toggle — safe area aware */}
      <View style={[styles.langToggle, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.langBtn}>
          <Ionicons name="language-outline" size={18} color="#fff" />
          <Text style={styles.langText}>{lang === "en" ? "සිං" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={["#0E7C61", "#14A87D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topSection, { paddingTop: insets.top }]}
      >
        <View style={styles.iconsLayer}>{renderFloatingIcons()}</View>

        {/* Logo + Brand */}
        <Image
          source={images.ICOPELogo}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 12, marginBottom: 4 }}
          resizeMode="contain"
        />
        <Text style={styles.header}>{t("brand")}</Text>
        <Text style={styles.tagline}>{t("tagline")}</Text>

        {/* Lighter green wave */}
        <View style={styles.lightWaveContainer}>
          <Svg height="100" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <Path fill="#3CC8A1" d="M0,180L48,170C96,160,192,140,288,130C384,120,480,120,576,135C672,150,768,180,864,190C960,200,1056,190,1152,175C1248,160,1344,130,1392,115L1440,100L1440,320L0,320Z" />
          </Svg>
        </View>

        {/* White wave — fully covers bottom edge */}
        <Svg height="100" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none" style={styles.whiteWave}>
          <Path fill="#ffffff" d="M0,224L48,202.7C96,181,192,139,288,128C384,117,480,139,576,165.3C672,192,768,224,864,234.7C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L0,320Z" />
        </Svg>
      </LinearGradient>

      {/* Bottom content overlaps gradient by 2px to eliminate green line */}
      <View style={styles.bottomContent}>
        <ScrollView
          contentContainerStyle={styles.rolesContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Text style={styles.loginAsText}>{t("loginAs")}</Text>
            <Text style={styles.subHeader}>{t("chooseRole")}</Text>
          </View>

          {/* Physiotherapist card */}
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === "Physiotherapist" && styles.selectedCard]}
            onPress={() => setSelectedRole("Physiotherapist")}
            activeOpacity={0.7}
          >
            <View style={styles.roleContent}>
              <View style={styles.roleLeft}>
                <View style={[styles.roleIconCircle, { backgroundColor: "#E8F5E9" }]}>
                  <Ionicons name="medkit" size={26} color="#0E7C61" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>{t("physio")}</Text>
                  <Text style={styles.roleDesc}>{t("physioDesc")}</Text>
                </View>
              </View>
              <View style={[styles.radioButton, selectedRole === "Physiotherapist" && styles.radioButtonSelected]}>
                {selectedRole === "Physiotherapist" && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableOpacity>

          {/* Patient / Elder card */}
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === "Patient" && styles.selectedCard]}
            onPress={() => setSelectedRole("Patient")}
            activeOpacity={0.7}
          >
            <View style={styles.roleContent}>
              <View style={styles.roleLeft}>
                <View style={[styles.roleIconCircle, { backgroundColor: "#FFF3E0" }]}>
                  <Ionicons name="people" size={26} color="#E65100" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>{t("patient")}</Text>
                  <Text style={styles.roleDesc}>{t("patientDesc")}</Text>
                </View>
              </View>
              <View style={[styles.radioButton, selectedRole === "Patient" && styles.radioButtonSelected]}>
                {selectedRole === "Patient" && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Continue button — safe area bottom */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
            { marginBottom: Math.max(insets.bottom, 16) + 4 },
          ]}
          disabled={!selectedRole}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>{t("continue")}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  statusBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0E7C61",
    zIndex: 10,
  },
  langToggle: {
    position: "absolute",
    right: 16,
    zIndex: 99,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  langText: {
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  topSection: {
    width: "100%",
    height: TOP_H + 50, // extra 50 for wave overlap
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconsLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    zIndex: 7,
  },
  header: {
    fontSize: HEADER_FONT,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontFamily: "Poppins-Bold",
  },
  tagline: {
    fontSize: TAGLINE_FONT,
    color: "rgba(255,255,255,0.85)",
    zIndex: 5,
    fontFamily: "Poppins-Regular",
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: isSmallScreen ? 30 : 44,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  lightWaveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2,
  },
  whiteWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 3,
  },
  bottomContent: {
    flex: 1,
    marginTop: -2, // overlap to kill any green line
    backgroundColor: "#fff",
  },
  rolesContainer: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  titleSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: isSmallScreen ? 16 : 24,
    paddingBottom: isSmallScreen ? 12 : 20,
    paddingHorizontal: 20,
  },
  loginAsText: {
    fontSize: isSmallScreen ? 20 : 24,
    color: "#3C3C3D",
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subHeader: {
    fontSize: isSmallScreen ? 13 : 15,
    color: "#666",
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  roleCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: isSmallScreen ? 14 : 16,
    marginHorizontal: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#0E7C61",
    backgroundColor: "#f0faf6",
  },
  roleContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  roleIconCircle: {
    width: isSmallScreen ? 46 : 52,
    height: isSmallScreen ? 46 : 52,
    borderRadius: isSmallScreen ? 23 : 26,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  roleTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: isSmallScreen ? 16 : 18,
    color: "#333",
    marginBottom: 2,
  },
  roleDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: isSmallScreen ? 11 : 12,
    color: "#777",
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  radioButtonSelected: {
    borderColor: "#0E7C61",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0E7C61",
  },
  continueButton: {
    backgroundColor: "#0E7C61",
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#9E9E9E",
    opacity: 0.5,
  },
  continueText: {
    fontFamily: "Poppins-Bold",
    fontSize: isSmallScreen ? 16 : 18,
    color: "#fff",
  },
});

export default SelectSignIn;