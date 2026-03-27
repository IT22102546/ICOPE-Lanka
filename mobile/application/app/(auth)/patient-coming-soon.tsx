import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { height: screenHeight } = Dimensions.get("window");
const isSmallScreen = screenHeight < 700;

const TEXT: Record<string, { en: string; si: string }> = {
  brand:      { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  title:      { en: "Patient Login", si: "රෝගී පිවිසුම" },
  comingSoon: { en: "Coming Soon", si: "ඉක්මනින්ම" },
  desc:       { en: "We're building a dedicated portal for patients and elders to view their care plans, track progress, and stay connected with their physiotherapists.", si: "රෝගීන් සහ වැඩිහිටියන් සඳහා ඔවුන්ගේ සත්කාර සැලැස්ම බැලීමට, ප්‍රගතිය නිරීක්ෂණය කිරීමට සහ ඔවුන්ගේ භෞතචිකිත්සකයින් සමඟ සම්බන්ධව සිටීමට කැපවූ ද්වාරයක් අපි ගොඩනඟමින් සිටිමු." },
  underDev:   { en: "Under Development", si: "සංවර්ධනය වෙමින්" },
  goBack:     { en: "Go Back", si: "ආපසු යන්න" },
};

const SelectPatientComingSoon = () => {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "si">("en");
  const t = (key: string) => TEXT[key]?.[lang] ?? key;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Language toggle */}
      <View style={styles.langToggle}>
        <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.langBtn}>
          <Ionicons name="language-outline" size={18} color="#0E7C61" />
          <Text style={styles.langText}>{lang === "en" ? "සිං" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={["#0E7C61", "#14A87D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topSection}>
        <View style={styles.brandRow}>
          <Ionicons name="heart-circle" size={32} color="#fff" />
          <Text style={styles.brandText}>{t("brand")}</Text>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Badge */}
        <View style={styles.badge}>
          <Ionicons name="construct-outline" size={14} color="#0E7C61" />
          <Text style={styles.badgeText}>{t("underDev")}</Text>
        </View>

        {/* Animated icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={["#E8F5E9", "#C8E6C9"]} style={styles.iconCircle}>
            <Ionicons name="people" size={56} color="#0E7C61" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>{t("title")}</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>{t("comingSoon")}</Text>
        </View>
        <Text style={styles.description}>{t("desc")}</Text>

        {/* Features preview */}
        <View style={styles.featuresGrid}>
          {[
            { icon: "clipboard-outline" as const, en: "Care Plans", si: "සත්කාර සැලැස්ම" },
            { icon: "trending-up-outline" as const, en: "Progress", si: "ප්‍රගතිය" },
            { icon: "chatbubbles-outline" as const, en: "Chat", si: "සංවාද" },
            { icon: "calendar-outline" as const, en: "Appointments", si: "හමුවීම්" },
          ].map((item, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name={item.icon} size={22} color="#0E7C61" />
              <Text style={styles.featureText}>{lang === "en" ? item.en : item.si}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>{t("goBack")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  langToggle: { position: "absolute", top: 48, right: 16, zIndex: 99 },
  langBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0faf6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4, borderWidth: 1, borderColor: "#C8E6C9" },
  langText: { color: "#0E7C61", fontFamily: "Poppins-SemiBold", fontSize: 13 },
  topSection: { height: isSmallScreen ? 100 : 120, justifyContent: "flex-end", alignItems: "center", paddingBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandText: { fontSize: 24, fontWeight: "bold", color: "#fff", fontFamily: "Poppins-Bold" },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 30, paddingTop: 30 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E8F5E9", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 24 },
  badgeText: { color: "#0E7C61", fontFamily: "Poppins-SemiBold", fontSize: 12 },
  iconContainer: { marginBottom: 20 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, color: "#333", fontFamily: "Poppins-Bold", marginBottom: 8 },
  comingSoonBadge: { backgroundColor: "#0E7C61", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  comingSoonText: { color: "#fff", fontFamily: "Poppins-Bold", fontSize: 16 },
  description: { fontSize: 14, color: "#666", fontFamily: "Poppins-Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f9f9f9", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  featureText: { color: "#555", fontFamily: "Poppins-Medium", fontSize: 13 },
  backButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0E7C61", paddingVertical: 15, margin: 20, borderRadius: 15 },
  backText: { fontFamily: "Poppins-Bold", fontSize: 16, color: "#fff" },
});

export default SelectPatientComingSoon;
