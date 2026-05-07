import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getPushPermissionStatus(): Promise<
  Notifications.PermissionStatus
> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

export async function requestPushPermission(): Promise<
  Notifications.PermissionStatus
> {
  const settings = await Notifications.requestPermissionsAsync();
  return settings.status;
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
    });
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test notification",
      body: "Push pipeline is working — you'll get one of these when a mission is reviewed.",
      sound: "default",
    },
    trigger: { seconds: 1, type: "timeInterval" } as Notifications.TimeIntervalTriggerInput,
  });
}
