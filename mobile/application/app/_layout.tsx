import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { AppState } from "react-native";
import useAuthStore from "@/stores/authStore";
import useNotificationStore from "@/stores/notificationStore";
import { socket } from "@/utils/socket";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  showLocalNotification,
} from "@/utils/notifications";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const notificationCleanupRef = useRef<(() => void) | null>(null);

  // Load custom fonts
  const [loaded] = useFonts({
    "Cretina-Bold": require("../assets/fonts/Cretina-Bold.ttf"),
    "Cretina-Regular": require("../assets/fonts/Cretina-Regular.ttf"),
    "DMSerifDisplay-Regular": require("../assets/fonts/DMSerifDisplay-Regular.ttf"),
    "DMSerifDisplay-Italic": require("../assets/fonts/DMSerifDisplay-Italic.ttf"),
    "GrandHotel-Regular": require("../assets/fonts/GrandHotel-Regular.ttf"),
  });

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Setup push notifications & socket listeners
  useEffect(() => {
    const initNotifications = async () => {
      const authState = useAuthStore.getState();
      if (!authState.isSignedIn || !authState.accessToken) return;

      // Register for push notifications
      await registerForPushNotificationsAsync();

      // Setup notification listeners (foreground + tap)
      notificationCleanupRef.current = setupNotificationListeners(
        // On notification received in foreground
        undefined,
        // On notification tapped - navigate to notifications screen
        () => {
          router.push("/(root)/(tabs)/Notifications");
        }
      );

      // Fetch initial notification data
      useNotificationStore.getState().refresh();

      // Setup socket connection for real-time notifications
      const userId = authState.currentUser?.id;
      if (userId) {
        socket.connect();
        socket.emit("authenticate", {
          userId,
          token: authState.accessToken,
        });

        // Listen for real-time notifications from backend
        socket.on("notification", async (data: any) => {
          if (data) {
            // Add to store
            useNotificationStore.getState().addNotification({
              id: data.id || `temp-${Date.now()}`,
              userId: data.userId || userId,
              title: data.title || "New Notification",
              message: data.message || "",
              type: data.type || "GENERAL",
              status: "UNREAD",
              isRead: false,
              metadata: data.metadata,
              sentAt: data.sentAt || new Date().toISOString(),
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });

            // Show local popup notification
            await showLocalNotification(
              data.title || "New Notification",
              data.message || "",
              { notificationId: data.id, type: data.type }
            );
          }
        });

        // Listen for announcement broadcasts
        socket.on("announcement", async (data: any) => {
          if (data) {
            // Show local popup for announcement
            await showLocalNotification(
              `📢 ${data.title || "Announcement"}`,
              data.content || data.message || "",
              { type: "ANNOUNCEMENT", announcementId: data.id }
            );
            // Refresh announcements list
            useNotificationStore.getState().fetchAnnouncements();
          }
        });
      }
    };

    initNotifications();

    // Refresh on app foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && useAuthStore.getState().isSignedIn) {
        useNotificationStore.getState().fetchUnreadCount();
      }
    });

    return () => {
      notificationCleanupRef.current?.();
      socket.off("notification");
      socket.off("announcement");
      subscription.remove();
    };
  }, [loaded, router]);

  // Return null if fonts are not yet loaded
  if (!loaded) {
    return null;
  }

  // Render the navigation stack
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}