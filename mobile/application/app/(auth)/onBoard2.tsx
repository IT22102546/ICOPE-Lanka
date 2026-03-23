import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { images } from "@/constants";

const OnBoard2 = () => {
  const router = useRouter();

  return (
    <LinearGradient colors={["#ecfeff", "#dbeafe"]} style={styles.container}>
      <Image source={images.IcopeLogo} style={styles.logo} resizeMode="contain" />
      <Image source={images.Onboard02} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>Doctor and Patient Workflows</Text>
      <Text style={styles.desc}>Doctors can register patients under their care and maintain structured ICOPE clinical records.</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(auth)/onBoard1")}> 
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/(auth)/onBoard3")}> 
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  logo: { width: 110, height: 110, marginBottom: 14 },
  image: { width: "100%", height: 240, marginBottom: 14 },
  title: { fontSize: 26, color: "#0f172a", textAlign: "center", fontFamily: "Poppins-Bold" },
  desc: { marginTop: 10, fontSize: 14, color: "#334155", textAlign: "center", fontFamily: "Poppins-Regular" },
  row: { flexDirection: "row", gap: 10, marginTop: 24 },
  button: { backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 30 },
  buttonText: { color: "#ffffff", fontSize: 16, fontFamily: "Poppins-SemiBold" },
  secondaryButton: { backgroundColor: "#e2e8f0", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 30 },
  secondaryText: { color: "#0f172a", fontSize: 16, fontFamily: "Poppins-SemiBold" },
});

export default OnBoard2;
