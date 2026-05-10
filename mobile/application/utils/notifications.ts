import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import useNotificationStore from "@/stores/notificationStore";

const PROJECT_ID = "8ad0f96f-f73e-467b-a809-c37d49ce50d7";

// expo-notifications needs a dev build — skip setup in Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo) {
    console.log("Push notifications not supported in Expo Go");
    return null;
  }
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
  const token = tokenData.data;

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

  useNotificationStore.getState().setExpoPushToken(token);
  await useNotificationStore.getState().registerPushToken(token);
  return token;
}

export async function showLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  if (isExpoGo) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data || {}, sound: "default" },
    trigger: null,
  });
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  if (isExpoGo) return () => {};

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const { title, body, data } = notification.request.content;
    console.log("📩 Notification received:", title);
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
      useNotificationStore.getState().fetchUnreadCount();
    }
    onNotificationReceived?.(notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("👆 Notification tapped:", response.notification.request.content.title);
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
