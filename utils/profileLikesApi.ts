/**
 * إعجاب البروفايل — يتصل بالباك اند
 * POST /api/profile/like — إعجاب ببروفايل مستخدم (مرة واحدة لكل مستخدم)
 * GET /api/profile/likes/:userId — جلب عدد الإعجابات وحالة إعجابي
 * GET /api/profile/likes/:userId/list — جلب قائمة المستخدمين الذين أعجبوا بصفحتي
 * عند فشل الباك اند — استخدام التخزين المحلي (AsyncStorage)
 */
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";
import type { SocialUser } from "./socialApi";

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const KEY_LIKED = (uid: string) => `profile_liked_${uid}`;
const KEY_COUNT = (uid: string) => `profile_likes_count_${uid}`;

export type ProfileLikesResult = {
  likeCount: number;
  likedByMe: boolean;
};

export async function fetchProfileLikes(targetUserId: string): Promise<ProfileLikesResult | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/profile/likes/${targetUserId}`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success) {
      return {
        likeCount: res.data.likeCount ?? 0,
        likedByMe: res.data.likedByMe === true,
      };
    }
  } catch {
    // fallback: local storage
  }
  try {
    const [[, vLiked], [, vCount]] = await AsyncStorage.multiGet([KEY_LIKED(targetUserId), KEY_COUNT(targetUserId)]);
    return {
      likeCount: vCount != null ? parseInt(vCount, 10) || 0 : 0,
      likedByMe: vLiked === "1",
    };
  } catch {
    return { likeCount: 0, likedByMe: false };
  }
}

export async function likeProfile(targetUserId: string): Promise<{ success: boolean; likeCount?: number; alreadyLiked?: boolean }> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_BASE_URL}/api/profile/like`,
      { targetUserId },
      { headers, timeout: 8000 }
    );
    if (res.data?.success) {
      return {
        success: true,
        likeCount: res.data.likeCount ?? 0,
        alreadyLiked: res.data.alreadyLiked === true,
      };
    }
  } catch {
    // fallback: local storage
  }
  try {
    const [[, vLiked], [, vCount]] = await AsyncStorage.multiGet([KEY_LIKED(targetUserId), KEY_COUNT(targetUserId)]);
    if (vLiked === "1") {
      return { success: true, likeCount: parseInt(vCount || "0", 10) || 0, alreadyLiked: true };
    }
    const newCount = (parseInt(vCount || "0", 10) || 0) + 1;
    await AsyncStorage.multiSet([[KEY_LIKED(targetUserId), "1"], [KEY_COUNT(targetUserId), String(newCount)]]);
    return { success: true, likeCount: newCount, alreadyLiked: false };
  } catch {
    return { success: false };
  }
}

/**
 * جلب قائمة المستخدمين الذين أعجبوا بصفحتي — GET /api/profile/likes/:userId/list
 * الباك اند يُفترض أن يخزّن المعجب عند POST /api/profile/like ويرجع القائمة بهذا الشكل:
 * { success: true, users: [{ id, name/username, profileImage/avatar, age, country, gender, location/city }] }
 */
export async function fetchProfileLikers(profileUserId: string): Promise<SocialUser[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_BASE_URL}/api/profile/likes/${profileUserId}/list`, {
      headers,
      timeout: 8000,
    });
    if (res.data?.success && Array.isArray(res.data.users)) {
      return res.data.users.map((u: any) => ({
        id: String(u.id ?? u.userId ?? ""),
        name: String(u.name ?? u.username ?? "—"),
        profileImage: String(u.profileImage ?? u.avatar ?? ""),
        age: u.age != null ? Number(u.age) : null,
        country: String(u.country ?? ""),
        gender: String(u.gender ?? ""),
        location: u.location ?? u.city ?? u.address ?? undefined,
      }));
    }
  } catch {
    // fallback: لا يوجد تخزين محلي للقائمة
  }
  return [];
}
