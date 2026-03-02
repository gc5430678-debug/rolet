import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sendMessage(toUserId: string, text: string): Promise<ChatMessage | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/messages/send`,
      { toUserId, text },
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
      return res.data.messages as InboxItem[];
    }
  } catch (err) {
    console.log("fetchInbox error:", err);
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
      return res.data.messages as ChatMessage[];
    }
  } catch (err) {
    console.log("fetchThread error:", err);
  }
  return [];
}

