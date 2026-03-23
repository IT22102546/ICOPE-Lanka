import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { images } from "@/constants";

const OnBoard1 = () => {
  const router = useRouter();

  return (
    <LinearGradient colors={["#f7fbff", "#e0f2fe"]} style={styles.container}>
      <Image source={images.IcopeLogo} style={styles.logo} resizeMode="contain" />
      <Image source={images.Onboard01} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>Welcome to ICOPE Lanka</Text>
      <Text style={styles.desc}>Digitally connected physiotherapy and patient care for clinics across Sri Lanka.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/(auth)/onBoard2")}> 
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  logo: { width: 110, height: 110, marginBottom: 14 },
  image: { width: "100%", height: 240, marginBottom: 14 },
  title: { fontSize: 28, color: "#0f172a", textAlign: "center", fontFamily: "Poppins-Bold" },
  desc: { marginTop: 10, fontSize: 14, color: "#334155", textAlign: "center", fontFamily: "Poppins-Regular" },
  button: { marginTop: 24, backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 38 },
  buttonText: { color: "#ffffff", fontSize: 16, fontFamily: "Poppins-SemiBold" },
});

export default OnBoard1;
