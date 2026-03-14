import Constants from "expo-constants";
import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

// Expo Go لا يدعم الإشعارات في SDK 53+ — نتخطى التسجيل لتجنب التعطل
const isExpoGo = Constants.appOwnership === "expo";

export async function registerPushTokenWithBackend(): Promise<void> {
  if (isExpoGo) return;
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");

    if (!Device.isDevice) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("messages", {
        name: "الرسائل",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? "483bb82a-0fb7-4c6a-8033-365103e54c18";
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;
    if (!pushToken) return;

    await axios.post(
      `${API_BASE_URL}/api/auth/push-token`,
      { pushToken },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
  } catch {
    // تجاهل — Expo Go أو أخطاء أخرى
  }
}

/** إشعار الأصدقاء بأن المستخدم متصل (عند فتح التطبيق) */
export async function notifyFriendsOnline(): Promise<void> {
  if (isExpoGo) return;
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    await axios.post(
      `${API_BASE_URL}/api/auth/online`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 6000 }
    );
  } catch {
    // تجاهل
  }
}

/** إشعار الخادم بأن المستخدم غادر (عند إغلاق/تصغير التطبيق) — النقطة تختفي فوراً */
export async function notifyOffline(): Promise<void> {
  if (isExpoGo) return;
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    await axios.post(
      `${API_BASE_URL}/api/auth/offline`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 3000 }
    );
  } catch {
    // تجاهل
  }
}
