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
  /** المدينة أو الموقع — اختياري */
  location?: string;
};

export type BlockRelation = "blocked" | "blocked_me" | "mutual";

export type BlockedUser = SocialUser & {
  relation: BlockRelation;
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CACHE_KEYS = {
  followers: "cache_social_followers_v1",
  friends: "cache_social_friends_v1",
  following: "cache_social_following_v1",
  blocked: "cache_social_blocked_v1",
  visitors: "cache_social_visitors_v1",
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
      const list = res.data.followers as SocialUser[];
      await setCachedJson(CACHE_KEYS.followers, list);
      return list;
    }
  } catch {}
  return await getCachedJson<SocialUser[]>(CACHE_KEYS.followers, []);
}

export async function fetchFriends(): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/friends`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.friends)) {
      const list = res.data.friends as SocialUser[];
      await setCachedJson(CACHE_KEYS.friends, list);
      return list;
    }
  } catch {}
  return await getCachedJson<SocialUser[]>(CACHE_KEYS.friends, []);
}

export async function fetchBlocked(): Promise<BlockedUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/blocked`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.blocked)) {
      const list = res.data.blocked as BlockedUser[];
      await setCachedJson(CACHE_KEYS.blocked, list);
      return list;
    }
  } catch {}
  return await getCachedJson<BlockedUser[]>(CACHE_KEYS.blocked, []);
}

export async function fetchFollowing(): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/social/following`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.following)) {
      const list = res.data.following as SocialUser[];
      await setCachedJson(CACHE_KEYS.following, list);
      return list;
    }
  } catch {}
  return await getCachedJson<SocialUser[]>(CACHE_KEYS.following, []);
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

/** تسجيل زيارة بروفايل — يُستدعى عند فتح ومشاهدة بروفايل مستخدم آخر */
export async function recordProfileVisit(profileUserId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/profile-visits/record`,
      { profileUserId },
      { headers, timeout: 8000 }
    );
    return res.data?.success === true;
  } catch {
    return false;
  }
}

/** جلب قائمة الزوار الذين شاهدوا بروفايلي */
export async function fetchProfileVisitors(): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/profile-visits`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.visitors)) {
      const list = res.data.visitors as SocialUser[];
      await setCachedJson(CACHE_KEYS.visitors, list);
      return list;
    }
  } catch {}
  return await getCachedJson<SocialUser[]>(CACHE_KEYS.visitors, []);
}
