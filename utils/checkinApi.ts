import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";
import type { WalletBalance } from "./walletApi";

export type CheckInStatus = {
  currentDay: number;
  weekStartAt: string | null;
  nextClaimAt: string | null;
  canClaim: boolean;
  canStart: boolean;
  rewardForCurrentDay: number;
  secondsUntilClaim: number;
};

export async function fetchCheckIn(): Promise<CheckInStatus | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const res = await axios.get(`${API_BASE_URL}/api/wallet/checkin`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (res.data?.success && res.data?.checkin) {
      return res.data.checkin as CheckInStatus;
    }
  } catch {
    // ignore
  }
  return null;
}

export type StartCheckInResult = {
  success: boolean;
  message?: string;
  checkin?: CheckInStatus;
  wallet?: WalletBalance;
};

export async function startCheckIn(): Promise<StartCheckInResult> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return { success: false, message: "يجب تسجيل الدخول" };
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/checkin`,
      { action: "start" },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );
    if (res.data?.success) {
      return {
        success: true,
        message: res.data.message,
        checkin: res.data.checkin,
        wallet: res.data.wallet,
      };
    }
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: msg || "فشل في بدء التسجيل" };
  }
  return { success: false, message: "فشل في بدء التسجيل" };
}

export async function claimCheckIn(): Promise<StartCheckInResult & { reward?: number }> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return { success: false, message: "يجب تسجيل الدخول" };
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/checkin`,
      { action: "claim" },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );
    if (res.data?.success) {
      return {
        success: true,
        message: res.data.message,
        reward: res.data.reward,
        checkin: res.data.checkin,
        wallet: res.data.wallet,
      };
    }
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: msg || "فشل في استلام المكافأة" };
  }
  return { success: false, message: "فشل في استلام المكافأة" };
}
