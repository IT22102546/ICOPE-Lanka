import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import useAuthStore from "@/stores/authStore";

const Home = () => {
  const { currentUser, isSignedIn, checkAuthStatus } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await checkAuthStatus();
      setLoading(false);
    };
    initialize();
  }, []);

  if (loading) return null;

  // Signed-in users always land on the main patient list screen.
  return isSignedIn ? (
    <Redirect href="/(root)/(screens)/doctor-patients" />
  ) : (
    <Redirect href="/(auth)/onBoard1" />
  );
};

export default Home;
