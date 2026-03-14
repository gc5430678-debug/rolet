import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

const FIVE_MSG_CLAIMED_AT_KEY = "five_messages_claimed_at";

/** حالة مهمة "5 رسائل" */
export type FiveMessagesTaskStatus = {
  messagesSentToday: number;
  claimedToday: boolean;
  reward: number;
  secondsUntilClaim?: number;
  nextClaimAt?: string | null;
};

/** يحفظ وقت الاستلام محلياً (للعداد عند عدم وجود نت) */
export async function setLocalClaimedAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(FIVE_MSG_CLAIMED_AT_KEY, String(timestamp));
}

/** يُرجع الثواني المتبقية حتى انتهاء الـ 24 ساعة (محلي) — للعمل بدون نت */
export async function getLocalSecondsUntilClaim(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(FIVE_MSG_CLAIMED_AT_KEY);
  if (!stored) return null;
  const claimedAt = parseInt(stored, 10);
  if (!Number.isFinite(claimedAt)) return null;
  const cooldownEnd = claimedAt + 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now >= cooldownEnd) return 0;
  return Math.max(0, Math.floor((cooldownEnd - now) / 1000));
}

/** هل انتهت المهلة محلياً؟ */
export async function isLocalCooldownExpired(): Promise<boolean> {
  const secs = await getLocalSecondsUntilClaim();
  return secs === null || secs === 0;
}

/** عداد محلي — يُستدعى فقط عند نجاح إرسال رسالة فعلياً (لا يُحسب الفشل) */
let localMessagesSentCount = 0;

/** يُستدعى من messagesApi عند نجاح إرسال رسالة فقط — لا يُحسب إذا فشل الإرسال. يرجع true إذا تمت الإضافة (أي كانت الرسالة ضمن الخمس الأولى) */
export function recordMessageSentSuccess(): boolean {
  if (localMessagesSentCount < 5) {
    localMessagesSentCount += 1;
    return true;
  }
  return false;
}

export function getLocalMessagesSentCount(): number {
  return localMessagesSentCount;
}

export function clearLocalMessagesSentCount(): void {
  localMessagesSentCount = 0;
}

export async function fetchFiveMessagesTask(): Promise<FiveMessagesTaskStatus | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const res = await axios.get(`${API_BASE_URL}/api/wallet/task-five-messages`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    if (res.data?.success && res.data?.task) {
      const t = res.data.task;
      clearLocalMessagesSentCount();
      let secs = t.secondsUntilClaim ?? 0;
      if (t.claimedToday && secs <= 0 && t.nextClaimAt) {
        const next = new Date(t.nextClaimAt).getTime();
        secs = Math.max(0, Math.floor((next - Date.now()) / 1000));
      }
      return {
        messagesSentToday: t.messagesSentToday ?? 0,
        claimedToday: t.claimedToday ?? false,
        reward: t.reward ?? 15,
        secondsUntilClaim: secs,
        nextClaimAt: t.nextClaimAt ?? null,
      };
    }
  } catch {
    // الخادم قد لا يدعم هذا المسار بعد
  }
  return null;
}

/** يجلب الحالة مع دمج العداد المحلي عند غياب الباك اند — للعرض الفوري. العداد يعمل بدون نت */
export async function fetchFiveMessagesTaskWithLocal(): Promise<FiveMessagesTaskStatus> {
  const server = await fetchFiveMessagesTask();
  const localSecs = await getLocalSecondsUntilClaim();

  if (server) {
    // إذا الباك اند يقول "تم التحصيل" لكن secondsUntilClaim = 0 — استخدم المحلي
    if (server.claimedToday && (server.secondsUntilClaim ?? 0) <= 0 && localSecs != null && localSecs > 0) {
      return { ...server, secondsUntilClaim: localSecs };
    }
    // إذا المستخدم استلم للتو (محلياً) والباك اند لم يحدّث بعد — اعرض العداد المحلي
    if (!server.claimedToday && localSecs != null && localSecs > 0) {
      return {
        messagesSentToday: 5,
        claimedToday: true,
        reward: server.reward ?? 15,
        secondsUntilClaim: localSecs,
        nextClaimAt: null,
      };
    }
    return server;
  }

  const expired = localSecs === null || localSecs === 0;
  return {
    messagesSentToday: expired ? Math.min(5, localMessagesSentCount) : 5,
    claimedToday: !expired,
    reward: 15,
    secondsUntilClaim: localSecs ?? 0,
    nextClaimAt: null,
  };
}

/** يطالب بمكافأة 5 رسائل — الباك اند يضيف إلى freeGold. يحفظ وقت الاستلام محلياً للعداد بدون نت */
export async function claimFiveMessagesBonus(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return false;
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/claim-task-five-messages`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
    if (res.data?.success) {
      await setLocalClaimedAt(Date.now());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ——— مهمة نشر لحظة (10 ذهب، مهلة 24 ساعة) ———
const SHARE_MOMENT_CLAIMED_AT_KEY = "share_moment_claimed_at";

export async function setLocalShareMomentClaimedAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(SHARE_MOMENT_CLAIMED_AT_KEY, String(timestamp));
}

export async function getLocalShareMomentSecondsUntilClaim(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(SHARE_MOMENT_CLAIMED_AT_KEY);
  if (!stored) return null;
  const claimedAt = parseInt(stored, 10);
  if (!Number.isFinite(claimedAt)) return null;
  const cooldownEnd = claimedAt + 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now >= cooldownEnd) return 0;
  return Math.max(0, Math.floor((cooldownEnd - now) / 1000));
}

export type ShareMomentTaskStatus = {
  claimedToday: boolean;
  reward: number;
  secondsUntilClaim?: number;
  nextClaimAt?: string | null;
};

export async function fetchShareMomentTaskWithLocal(): Promise<ShareMomentTaskStatus> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("no token");
    const res = await axios.get(`${API_BASE_URL}/api/wallet/task-share-moment`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    if (res.data?.success && res.data?.task) {
      const t = res.data.task;
      let secs = t.secondsUntilClaim ?? 0;
      if (t.claimedToday && secs <= 0 && t.nextClaimAt) {
        const next = new Date(t.nextClaimAt).getTime();
        secs = Math.max(0, Math.floor((next - Date.now()) / 1000));
      }
      const localSecs = await getLocalShareMomentSecondsUntilClaim();
      if (t.claimedToday && secs <= 0 && localSecs != null && localSecs > 0) {
        return { ...t, secondsUntilClaim: localSecs };
      }
      if (!t.claimedToday && localSecs != null && localSecs > 0) {
        return { claimedToday: true, reward: t.reward ?? 10, secondsUntilClaim: localSecs, nextClaimAt: null };
      }
      return {
        claimedToday: t.claimedToday ?? false,
        reward: t.reward ?? 10,
        secondsUntilClaim: secs,
        nextClaimAt: t.nextClaimAt ?? null,
      };
    }
  } catch {}
  const localSecs = await getLocalShareMomentSecondsUntilClaim();
  const expired = localSecs === null || localSecs === 0;
  return {
    claimedToday: !expired,
    reward: 10,
    secondsUntilClaim: localSecs ?? 0,
    nextClaimAt: null,
  };
}

export async function claimShareMomentBonus(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return false;
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/claim-task-share-moment`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
    if (res.data?.success) {
      await setLocalShareMomentClaimedAt(Date.now());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ——— مهمة إضافة صديق (25 ذهب، مهلة 24 ساعة) ———
const ADD_FRIEND_CLAIMED_AT_KEY = "add_friend_claimed_at";

export async function setLocalAddFriendClaimedAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(ADD_FRIEND_CLAIMED_AT_KEY, String(timestamp));
}

export async function getLocalAddFriendSecondsUntilClaim(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(ADD_FRIEND_CLAIMED_AT_KEY);
  if (!stored) return null;
  const claimedAt = parseInt(stored, 10);
  if (!Number.isFinite(claimedAt)) return null;
  const cooldownEnd = claimedAt + 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now >= cooldownEnd) return 0;
  return Math.max(0, Math.floor((cooldownEnd - now) / 1000));
}

export type AddFriendTaskStatus = {
  claimedToday: boolean;
  reward: number;
  secondsUntilClaim?: number;
  nextClaimAt?: string | null;
};

export async function fetchAddFriendTaskWithLocal(): Promise<AddFriendTaskStatus> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("no token");
    const res = await axios.get(`${API_BASE_URL}/api/wallet/task-add-friend`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    if (res.data?.success && res.data?.task) {
      const t = res.data.task;
      let secs = t.secondsUntilClaim ?? 0;
      if (t.claimedToday && secs <= 0 && t.nextClaimAt) {
        const next = new Date(t.nextClaimAt).getTime();
        secs = Math.max(0, Math.floor((next - Date.now()) / 1000));
      }
      const localSecs = await getLocalAddFriendSecondsUntilClaim();
      if (t.claimedToday && secs <= 0 && localSecs != null && localSecs > 0) {
        return { ...t, secondsUntilClaim: localSecs };
      }
      if (!t.claimedToday && localSecs != null && localSecs > 0) {
        return { claimedToday: true, reward: t.reward ?? 25, secondsUntilClaim: localSecs, nextClaimAt: null };
      }
      return {
        claimedToday: t.claimedToday ?? false,
        reward: t.reward ?? 25,
        secondsUntilClaim: secs,
        nextClaimAt: t.nextClaimAt ?? null,
      };
    }
  } catch {}
  const localSecs = await getLocalAddFriendSecondsUntilClaim();
  const expired = localSecs === null || localSecs === 0;
  return {
    claimedToday: !expired,
    reward: 25,
    secondsUntilClaim: localSecs ?? 0,
    nextClaimAt: null,
  };
}

export async function claimAddFriendBonus(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return false;
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/claim-task-add-friend`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
    if (res.data?.success) {
      await setLocalAddFriendClaimedAt(Date.now());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ——— مهمة 5 نرد (8 ذهب، مهلة 24 ساعة) ———
const DICE_CLAIMED_AT_KEY = "dice_claimed_at";

export async function setLocalDiceClaimedAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(DICE_CLAIMED_AT_KEY, String(timestamp));
}

export async function getLocalDiceSecondsUntilClaim(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(DICE_CLAIMED_AT_KEY);
  if (!stored) return null;
  const claimedAt = parseInt(stored, 10);
  if (!Number.isFinite(claimedAt)) return null;
  const cooldownEnd = claimedAt + 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now >= cooldownEnd) return 0;
  return Math.max(0, Math.floor((cooldownEnd - now) / 1000));
}

let localDiceSentCount = 0;

export function recordDiceSentSuccess(): boolean {
  if (localDiceSentCount < 5) {
    localDiceSentCount += 1;
    return true;
  }
  return false;
}

export function getLocalDiceSentCount(): number {
  return localDiceSentCount;
}

export function clearLocalDiceSentCount(): void {
  localDiceSentCount = 0;
}

export type DiceTaskStatus = {
  diceSentToday: number;
  claimedToday: boolean;
  reward: number;
  secondsUntilClaim?: number;
  nextClaimAt?: string | null;
};

export async function fetchDiceTaskWithLocal(): Promise<DiceTaskStatus> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("no token");
    const res = await axios.get(`${API_BASE_URL}/api/wallet/task-dice`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    if (res.data?.success && res.data?.task) {
      const t = res.data.task;
      clearLocalDiceSentCount();
      let secs = t.secondsUntilClaim ?? 0;
      if (t.claimedToday && secs <= 0 && t.nextClaimAt) {
        const next = new Date(t.nextClaimAt).getTime();
        secs = Math.max(0, Math.floor((next - Date.now()) / 1000));
      }
      const localSecs = await getLocalDiceSecondsUntilClaim();
      if (t.claimedToday && secs <= 0 && localSecs != null && localSecs > 0) {
        return { ...t, secondsUntilClaim: localSecs };
      }
      if (!t.claimedToday && localSecs != null && localSecs > 0) {
        return { diceSentToday: 5, claimedToday: true, reward: t.reward ?? 8, secondsUntilClaim: localSecs, nextClaimAt: null };
      }
      return {
        diceSentToday: t.diceSentToday ?? 0,
        claimedToday: t.claimedToday ?? false,
        reward: t.reward ?? 8,
        secondsUntilClaim: secs,
        nextClaimAt: t.nextClaimAt ?? null,
      };
    }
  } catch {}
  const localSecs = await getLocalDiceSecondsUntilClaim();
  const expired = localSecs === null || localSecs === 0;
  return {
    diceSentToday: expired ? Math.min(5, localDiceSentCount) : 5,
    claimedToday: !expired,
    reward: 8,
    secondsUntilClaim: localSecs ?? 0,
    nextClaimAt: null,
  };
}

export async function claimDiceBonus(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return false;
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/claim-task-dice`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
    if (res.data?.success) {
      await setLocalDiceClaimedAt(Date.now());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
