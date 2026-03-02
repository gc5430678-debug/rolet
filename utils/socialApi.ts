/**
 * واجهة المتابعين والأصدقاء — تتصل بالباك اند
 */
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

export type SocialUser = {
  id: string;
  name: string;
  profileImage: string;
  age: number | null;
  country: string;
  gender: string;
};

export type BlockRelation = "blocked" | "blocked_me" | "mutual";

export type BlockedUser = SocialUser & {
  relation: BlockRelation;
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function followUser(targetUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/social/follow`,
      { targetUserId },
      { headers, timeout: 8000 }
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}

export async function unfollowUser(targetUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/social/unfollow`,
      { targetUserId },
      { headers, timeout: 8000 }
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}

export async function fetchFollowers(): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/followers`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.followers)) {
      return res.data.followers as SocialUser[];
    }
  } catch {}
  return [];
}

export async function fetchFriends(): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/friends`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.friends)) {
      return res.data.friends as SocialUser[];
    }
  } catch {}
  return [];
}

export async function fetchBlocked(): Promise<BlockedUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/blocked`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.blocked)) {
      return res.data.blocked as BlockedUser[];
    }
  } catch {}
  return [];
}

export async function fetchFollowing(): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/following`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.following)) {
      return res.data.following as SocialUser[];
    }
  } catch {}
  return [];
}

export async function acceptFriendRequest(followerUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/social/friends/accept`,
      { followerUserId },
      { headers, timeout: 8000 }
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}

export async function isFollowing(targetUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/is-following/${targetUserId}`, {
      headers,
      timeout: 8000,
    });
    return res.data?.isFollowing === true;
  } catch {
    return false;
  }
}

export async function blockUser(targetUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/social/block`,
      { targetUserId },
      { headers, timeout: 8000 }
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}

export async function unblockUser(targetUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/social/unblock`,
      { targetUserId },
      { headers, timeout: 8000 }
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}
