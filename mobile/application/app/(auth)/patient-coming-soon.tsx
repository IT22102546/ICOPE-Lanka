import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const PatientComingSoon = () => {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, floatY]);

  return (
    <LinearGradient colors={["#f8fafc", "#cffafe"]} style={styles.container}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }, { translateY: floatY }] }]}>
        <Ionicons name="hourglass-outline" size={58} color="#0f766e" />
      </Animated.View>
      <Text style={styles.title}>Patient Login Coming Soon</Text>
      <Text style={styles.desc}>We are building a guided patient experience with secure onboarding and care tracking.</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/(auth)/selectSignIn")}>
        <Text style={styles.buttonText}>Back to Login Selection</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    color: "#134e4a",
    textAlign: "center",
    fontFamily: "Poppins-Bold",
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#0f766e",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
});

export default PatientComingSoon;
