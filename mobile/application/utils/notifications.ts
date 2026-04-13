import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import useNotificationStore from "@/stores/notificationStore";

const PROJECT_ID = "8ad0f96f-f73e-467b-a809-c37d49ce50d7";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });

  const token = tokenData.data;

  // Set up Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0057FF",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("announcements", {
      name: "Announcements",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#9A2143",
      sound: "default",
    });
  }

  // Store and register with backend
  useNotificationStore.getState().setExpoPushToken(token);
  await useNotificationStore.getState().registerPushToken(token);

  return token;
}

/**
 * Schedule a local notification (for testing or local triggers).
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: "default",
    },
    trigger: null, // Show immediately
  });
}

/**
 * Add listeners for incoming notifications and user interaction.
 * Returns a cleanup function to remove listeners.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (
    notification: Notifications.Notification
  ) => void,
  onNotificationResponse?: (
    response: Notifications.NotificationResponse
  ) => void
) {
  // When notification is received while app is foregrounded
  const receivedSubscription =
    Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      console.log("📩 Notification received:", title);

      // Add to store if it has notification data from backend
      if (data?.notificationId) {
        useNotificationStore.getState().addNotification({
          id: data.notificationId as string,
          userId: (data.userId as string) || "",
          title: title || "Notification",
          message: body || "",
          type: (data.type as string) || "GENERAL",
          status: "UNREAD",
          isRead: false,
          metadata: data as Record<string, unknown>,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Refresh from server
        useNotificationStore.getState().fetchUnreadCount();
      }

      onNotificationReceived?.(notification);
    });

  // When user taps on a notification
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 Notification tapped:", response.notification.request.content.title);
      onNotificationResponse?.(response);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
