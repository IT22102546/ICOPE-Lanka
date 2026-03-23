import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants";

const SelectSignIn = () => {
  const router = useRouter();

  return (
    <LinearGradient colors={["#f7fbff", "#e7f1ff"]} style={styles.container}>
      <View style={styles.headerWrap}>
        <Image source={images.IcopeLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>ICOPE Lanka</Text>
        <Text style={styles.subtitle}>Choose how you want to continue</Text>
      </View>

      <View style={styles.cardWrap}>
        <TouchableOpacity style={styles.card} onPress={() => router.push("/(auth)/sign-in?role=doctor")}>
          <View style={styles.iconBubble}>
            <Ionicons name="medkit-outline" size={26} color="#ffffff" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Doctor Login</Text>
            <Text style={styles.cardDesc}>Physiotherapist and super admin access</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/(auth)/patient-coming-soon")}>
          <View style={[styles.iconBubble, styles.patientBubble]}>
            <Ionicons name="person-outline" size={26} color="#ffffff" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Patient Login</Text>
            <Text style={styles.cardDesc}>Coming soon with guided onboarding</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  headerWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    color: "#0f172a",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#334155",
    fontFamily: "Poppins-Regular",
  },
  cardWrap: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#1e293b",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  patientBubble: {
    backgroundColor: "#0ea5a2",
  },
  cardTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Poppins-SemiBold",
  },
  cardDesc: {
    marginTop: 2,
    fontSize: 12,
    color: "#475569",
    fontFamily: "Poppins-Regular",
  },
});

export default SelectSignIn;
