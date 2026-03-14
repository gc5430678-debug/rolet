import axios from "axios";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "./authHelper";
import {
  recordMessageSentSuccess,
  getLocalMessagesSentCount,
  getLocalSecondsUntilClaim,
  recordDiceSentSuccess,
  getLocalDiceSentCount,
  getLocalDiceSecondsUntilClaim,
} from "./tasksApi";

function toAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/uploads/${url.replace(/^\//, "")}`;
}

export type InboxItem = {
  id: string;
  otherId: string;
  otherName: string;
  otherProfileImage: string;
  text: string;
  createdAt: string;
  direction: "in" | "out";
  /** المستخدم الآخر متصل الآن — يُرجع من الخادم عند دعمه */
  otherIsOnline?: boolean;
  /** عمر وجنس ودولة المستخدم الآخر — من الباك اند */
  otherAge?: number | null;
  otherCountry?: string;
  otherGender?: string;
};

export type ChatMessage = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
  replyToText?: string | null;
  replyToFromId?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  imageUrl?: string | null;
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CACHE_KEYS = {
  inbox: "cache_messages_inbox_v1",
  threadPrefix: "cache_messages_thread_v1:",
} as const;

async function getCachedJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setCachedJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore caching errors
  }
}

export async function uploadVoiceMessage(uri: string): Promise<{ audioUrl: string } | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const formData = new FormData();
    formData.append("voice", {
      uri,
      type: "audio/m4a",
      name: "voice.m4a",
    } as any);
    const res = await axios.post(`${API_BASE_URL}/api/messages/upload-voice`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      timeout: 15000,
    });
    if (res.data?.success && res.data?.audioUrl) return { audioUrl: res.data.audioUrl };
  } catch (err) {
    console.log("uploadVoiceMessage error:", err);
  }
  return null;
}

export async function uploadImageMessage(uri: string): Promise<{ imageUrl: string } | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const formData = new FormData();
    formData.append("image", {
      uri,
      type: "image/jpeg",
      name: "image.jpg",
    } as any);
    const res = await axios.post(`${API_BASE_URL}/api/messages/upload-image`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      timeout: 15000,
    });
    if (res.data?.success && res.data?.imageUrl) return { imageUrl: res.data.imageUrl };
  } catch (err) {
    console.log("uploadImageMessage error:", err);
  }
  return null;
}

/** بيانات المرسل للإشعار — اسمه وصورته تظهر في إشعار المستلم */
export type SenderInfoForNotification = {
  senderName: string;
  senderProfileImageUrl?: string | null;
};

export function buildSenderForNotification(me: { name?: string; profileImage?: string } | null): SenderInfoForNotification | null {
  if (!me?.name) return null;
  return {
    senderName: me.name,
    senderProfileImageUrl: toAbsoluteImageUrl(me.profileImage) ?? null,
  };
}

/** مكافأة مهمة من الباك اند (مثلاً: 5 رسائل = 15 ذهب مجاني) */
export type SendMessageBonusTask = {
  task: string;
  reward: number;
  message?: string;
};

export type SendMessageResult = {
  message: ChatMessage;
  bonusTask?: SendMessageBonusTask | null;
  /** true عند إكمال 5 رسائل محلياً (حتى لو الباك اند لم يُرجع bonusTask) */
  justReachedFive?: boolean;
  /** true عند إرسال 5 نرد محلياً */
  justReachedFiveDice?: boolean;
} | null;

export async function sendMessage(
  toUserId: string,
  text: string,
  replyToText?: string | null,
  audioUrl?: string | null,
  audioDurationSeconds?: number | null,
  imageUrl?: string | null,
  replyToFromId?: string | null,
  senderForNotification?: SenderInfoForNotification | null,
  giftAmount?: number | null
): Promise<SendMessageResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/messages/send`,
      {
        toUserId,
        text,
        replyToText: replyToText ?? null,
        audioUrl: audioUrl ?? null,
        audioDurationSeconds: audioDurationSeconds ?? null,
        imageUrl: imageUrl ?? null,
        replyToFromId: replyToFromId ?? null,
        senderForNotification: senderForNotification ?? null,
        giftAmount: giftAmount ?? null,
      },
      { headers, timeout: 8000 }
    );
    if (res.data?.success && res.data?.message) {
      const m = res.data.message;
      const textVal = String(m.text || text || "").trim();
      const isDice = /^🎲\s*\d$/.test(textVal);

      let justReachedFive = false;
      let justReachedFiveDice = false;

      if (isDice) {
        const didDice = recordDiceSentSuccess();
        const diceCount = getLocalDiceSentCount();
        if (didDice && diceCount === 5) {
          const secsLeft = await getLocalDiceSecondsUntilClaim();
          justReachedFiveDice = secsLeft === null || secsLeft === 0;
        }
      } else {
        const didIncrement = recordMessageSentSuccess();
        const count = getLocalMessagesSentCount();
        const reachedFive = didIncrement && count === 5;
        if (reachedFive) {
          const secsLeft = await getLocalSecondsUntilClaim();
          justReachedFive = secsLeft === null || secsLeft === 0;
        }
      }

      const msg: ChatMessage = {
        id: m.id,
        fromId: m.fromId,
        toId: m.toId,
        text: m.text,
        createdAt: m.createdAt,
        replyToText: m.replyToText ?? null,
        replyToFromId: m.replyToFromId ?? null,
        audioUrl: m.audioUrl ?? null,
        audioDurationSeconds: m.audioDurationSeconds ?? null,
        imageUrl: m.imageUrl ?? null,
      };
      return {
        message: msg,
        bonusTask: res.data.bonusTask ?? null,
        justReachedFive,
        justReachedFiveDice,
      };
    }
  } catch (err) {
    console.log("sendMessage error:", err);
  }
  return null;
}

export async function fetchInbox(): Promise<InboxItem[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/messages/inbox`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.messages)) {
      const list = res.data.messages as InboxItem[];
      await setCachedJson(CACHE_KEYS.inbox, list);
      return list;
    }
  } catch (err) {
    console.log("fetchInbox error:", err);
  }
  return await getCachedJson<InboxItem[]>(CACHE_KEYS.inbox, []);
}

/** قائمة معرفات المستخدمين المتصلين الآن — يُرجع من الخادم عند دعمه */
export async function fetchOnlineUserIds(): Promise<string[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/auth/online-users`, {
      headers,
      timeout: 5000,
    });
    if (res.data?.success && Array.isArray(res.data.userIds)) {
      return res.data.userIds as string[];
    }
  } catch {
    // الخادم قد لا يدعم هذا المسار بعد
  }
  return [];
}

export async function fetchThread(otherId: string): Promise<ChatMessage[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/messages/thread/${otherId}`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.messages)) {
      const list = res.data.messages as ChatMessage[];
      await setCachedJson(`${CACHE_KEYS.threadPrefix}${otherId}`, list);
      return list;
    }
  } catch (err) {
    console.log("fetchThread error:", err);
  }
  return await getCachedJson<ChatMessage[]>(`${CACHE_KEYS.threadPrefix}${otherId}`, []);
}

/** يستخرج اسم الملف من audioUrl ويُرجع رابط التشغيل مع التوكن */
export async function getVoicePlaybackUrl(audioUrl: string | null | undefined): Promise<string | null> {
  if (!audioUrl) return null;
  const filename = audioUrl.replace(/^.*\//, "").trim();
  if (!filename || !filename.endsWith(".m4a")) return null;
  const token = await AsyncStorage.getItem("token");
  if (!token) return null;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/api/messages/voice/stream/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
}

/** تحميل الصوت إلى ملف محلي ثم إرجاع مساره (لتجاوز 511 من loca.lt) */
export async function fetchVoiceToLocalUri(audioUrl: string | null | undefined): Promise<string | null> {
  const url = await getVoicePlaybackUrl(audioUrl);
  if (!url) {
    console.log("[voice] getVoicePlaybackUrl returned null");
    return null;
  }
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: { "Bypass-Tunnel-Reminder": "true" },
    });
    const ab = res.data as ArrayBuffer;
    if (!ab || (ab as any).byteLength < 100) {
      console.log("[voice] response too small or invalid");
      return null;
    }
    const base64 = Buffer.from(ab).toString("base64");
    const filename = (audioUrl || "").replace(/^.*\//, "").trim() || `voice_${Date.now()}.m4a`;
    const localPath = `${FileSystem.cacheDirectory}voice_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await FileSystem.writeAsStringAsync(localPath, base64, {
      encoding: "base64",
    });
    const exists = await FileSystem.getInfoAsync(localPath);
    if (!exists.exists || (exists.size ?? 0) < 100) {
      console.log("[voice] file write failed or too small", exists);
      return null;
    }
    return localPath;
  } catch (e) {
    console.log("[voice] fetchVoiceToLocalUri error:", (e as any)?.message || e);
    return null;
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.delete(`${API_BASE_URL}/api/messages/${messageId}`, {
      headers,
      timeout: 8000,
    });
    return res.data?.success === true;
  } catch (err) {
    console.log("deleteMessage error:", err);
    return false;
  }
}

/** الدردشة الجماعية — دخول الغرفة */
export async function joinGroupChat(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_BASE_URL}/api/group-chat/join`, {}, { headers, timeout: 5000 });
    return res.data?.success === true;
  } catch {
    return false;
  }
}

/** مغادرة غرفة الدردشة الجماعية */
export async function leaveGroupChat(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    await axios.post(`${API_BASE_URL}/api/group-chat/leave`, {}, { headers, timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export type GroupChatUser = { userId: string; name: string; gender?: string; profileImage?: string | null };

/** قائمة المستخدمين في غرفة الدردشة الجماعية */
export async function fetchGroupChatUsers(): Promise<GroupChatUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/group-chat/users`, { headers, timeout: 5000 });
    if (res.data?.success && Array.isArray(res.data.users)) {
      return res.data.users as GroupChatUser[];
    }
  } catch {
    // الخادم قد لا يدعم هذا المسار بعد
  }
  return [];
}

export type GroupChatMessage = {
  id: string;
  fromId: string;
  fromName: string;
  fromProfileImage?: string | null;
  fromAge?: number | null;
  fromGender?: string | null;
  fromDiamonds?: number;
  fromChargedGold?: number;
  toId?: string | null;
  text: string;
  createdAt: string;
  replyToText?: string | null;
  replyToFromId?: string | null;
  replyToFromName?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  imageUrl?: string | null;
};

/** جلب رسائل الدردشة الجماعية */
export async function fetchGroupChatMessages(): Promise<GroupChatMessage[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/group-chat/messages?limit=250`, { headers, timeout: 8000 });
    if (res.data?.success && Array.isArray(res.data.messages)) {
      return res.data.messages as GroupChatMessage[];
    }
  } catch (err) {
    console.log("fetchGroupChatMessages error:", err);
  }
  return [];
}

/** إرسال رسالة في الدردشة الجماعية */
export async function sendGroupChatMessage(
  text: string,
  options?: {
    audioUrl?: string | null;
    audioDurationSeconds?: number | null;
    imageUrl?: string | null;
    toId?: string | null;
    giftAmount?: number | null;
    replyToText?: string | null;
    replyToFromId?: string | null;
  }
): Promise<GroupChatMessage | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/group-chat/send`,
      {
        text,
        audioUrl: options?.audioUrl ?? null,
        audioDurationSeconds: options?.audioDurationSeconds ?? null,
        imageUrl: options?.imageUrl ?? null,
        toId: options?.toId ?? null,
        giftAmount: options?.giftAmount ?? null,
        replyToText: options?.replyToText ?? null,
        replyToFromId: options?.replyToFromId ?? null,
      },
      { headers, timeout: 8000 }
    );
    if (res.data?.success && res.data?.message) {
      return res.data.message as GroupChatMessage;
    }
  } catch (err) {
    console.log("sendGroupChatMessage error:", err);
  }
  return null;
}

