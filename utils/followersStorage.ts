/**
 * تخزين المتابعين محلياً (AsyncStorage)
 * المفتاح: followers_{targetUserId} → مصفوفة من بيانات المتابعين
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FollowerItem = {
  id: string;
  name: string;
  profileImage: string;
  age: number | null;
  country: string;
  gender: string;
};

const PREFIX = "followers_";

export async function getFollowers(targetUserId: string): Promise<FollowerItem[]> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${targetUserId}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function addFollower(targetUserId: string, follower: FollowerItem): Promise<void> {
  const list = await getFollowers(targetUserId);
  if (list.some((f) => f.id === follower.id)) return;
  list.push(follower);
  await AsyncStorage.setItem(`${PREFIX}${targetUserId}`, JSON.stringify(list));
}

export async function removeFollower(targetUserId: string, followerId: string): Promise<void> {
  const list = await getFollowers(targetUserId);
  const filtered = list.filter((f) => f.id !== followerId);
  await AsyncStorage.setItem(`${PREFIX}${targetUserId}`, JSON.stringify(filtered));
}

export async function isFollowing(targetUserId: string, followerId: string): Promise<boolean> {
  const list = await getFollowers(targetUserId);
  return list.some((f) => f.id === followerId);
}
