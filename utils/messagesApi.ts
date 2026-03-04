import axios from "axios";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "./authHelper";

export type InboxItem = {
  id: string;
  otherId: string;
  otherName: string;
  otherProfileImage: string;
  text: string;
  createdAt: string;
  direction: "in" | "out";
};

export type ChatMessage = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
  replyToText?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
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

export async function sendMessage(
  toUserId: string,
  text: string,
  replyToText?: string | null,
  audioUrl?: string | null,
  audioDurationSeconds?: number | null
): Promise<ChatMessage | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/messages/send`,
      { toUserId, text, replyToText: replyToText ?? null, audioUrl: audioUrl ?? null, audioDurationSeconds: audioDurationSeconds ?? null },
      { headers, timeout: 8000 }
    );
    if (res.data?.success && res.data?.message) {
      const m = res.data.message;
      return {
        id: m.id,
        fromId: m.fromId,
        toId: m.toId,
        text: m.text,
        createdAt: m.createdAt,
        replyToText: m.replyToText ?? null,
        audioUrl: m.audioUrl ?? null,
        audioDurationSeconds: m.audioDurationSeconds ?? null,
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
    const exists = await FileSystem.getInfoAsync(localPath, { size: true });
    if (!exists.exists || (exists.size ?? 0) < 100) {
      console.log("[voice] file write failed or too small", exists);
      return null;
    }
    return localPath;
  } catch (e) {
    console.log("[voice] fetchVoiceToLocalUri error:", e?.message || e);
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

