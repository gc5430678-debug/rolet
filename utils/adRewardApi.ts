import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";
import type { WalletBalance } from "./walletApi";

export type AdStatus = {
  todayCount: number;
  dailyLimit: number;
  dailyRemaining?: number;
  remaining?: number; // توافق مع الخلفية القديمة
  weekCount?: number;
  weeklyLimit?: number;
  weeklyRemaining?: number;
  cooldownSeconds?: number;
  rewardPerAd: number;
};

export async function fetchAdStatus(): Promise<AdStatus | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const res = await axios.get(`${API_BASE_URL}/api/wallet/ad-status`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (res.data?.success && res.data?.adStatus) {
      return res.data.adStatus as AdStatus;
    }
  } catch {
    // ignore
  }
  return null;
}

export type ClaimAdRewardResult = {
  success: boolean;
  message?: string;
  reward?: number;
  adStatus?: AdStatus;
  wallet?: WalletBalance;
  cooldownSeconds?: number;
};

export async function claimAdReward(): Promise<ClaimAdRewardResult> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return { success: false, message: "يجب تسجيل الدخول" };
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/ad-reward`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );
    if (res.data?.success) {
      return {
        success: true,
        message: res.data.message,
        reward: res.data.reward,
        adStatus: res.data.adStatus,
        wallet: res.data.wallet,
      };
    }
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { message?: string; cooldownSeconds?: number } } };
    const msg = err?.response?.data?.message;
    const cooldown = err?.response?.data?.cooldownSeconds;
    return {
      success: false,
      message: msg || "فشل في استلام المكافأة",
      cooldownSeconds: cooldown,
    };
  }
  return { success: false, message: "فشل في استلام المكافأة" };
}
