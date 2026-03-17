import Constants from "expo-constants";
import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

// Expo Go لا يدعم الإشعارات في SDK 53+ — استخدم development build لاختبار الإشعارات
const isExpoGo = Constants.appOwnership === "expo";

export async function registerPushTokenWithBackend(): Promise<void> {
  if (isExpoGo) {
    if (__DEV__) console.warn("[push] الإشعارات لا تعمل في Expo Go — استخدم: npx expo run:android أو eas build");
    return;
  }
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

    const res = await axios.post(
      `${API_BASE_URL}/api/auth/push-token`,
      { pushToken },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
    if (__DEV__ && res?.data?.success) {
      console.log("[push] تم تسجيل رمز الإشعارات بنجاح");
    }
  } catch (e) {
    if (__DEV__) {
      console.warn("[push] فشل تسجيل رمز الإشعارات:", (e as Error)?.message || e);
    }
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

function handleNotificationResponse(response: { notification: { request: { content: { data?: Record<string, unknown> } } } }, onOpenChat: (u: { id: string; name: string; profileImage?: string }) => void) {
  const data = response.notification.request.content.data;
  if (data?.type === "message" && data?.fromId && typeof data.fromId === "string") {
    onOpenChat({
      id: data.fromId,
      name: (data.fromName as string) || "مستخدم",
      profileImage: (data.fromProfileImage as string) || "",
    });
  }
}

/** عند الضغط على إشعار رسالة — فتح المحادثة مع المرسل. يُرجع دالة إلغاء الاشتراك. */
export function setupNotificationResponseListener(
  onOpenChat: (user: { id: string; name: string; profileImage?: string }) => void
): () => void {
  if (isExpoGo) return () => {};
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  import("expo-notifications").then((Notifications) => {
    if (cancelled) return;
    Notifications.getLastNotificationResponseAsync().then((last) => {
      if (cancelled || !last) return;
      handleNotificationResponse(last, onOpenChat);
    });
    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response, onOpenChat);
    });
  });
  return () => {
    cancelled = true;
    sub?.remove?.();
    sub = null;
  };
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
