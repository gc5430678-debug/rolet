import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

export type RevenueShareStatus = {
  balancePoints?: number;
  goalPoints?: number;
  balanceUsd: number;
  withdrawGoal: number;
  progressPercent: number;
  canWithdraw: boolean;
  minWithdraw: number;
};

export async function fetchRevenueShare(): Promise<RevenueShareStatus | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const res = await axios.get(`${API_BASE_URL}/api/wallet/revenue-share`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (res.data?.success && res.data?.revenueShare) {
      return res.data.revenueShare as RevenueShareStatus;
    }
  } catch {
    // ignore
  }
  return null;
}

export type WithdrawResult = {
  success: boolean;
  message?: string;
  revenueShare?: { balanceUsd: number };
};

export async function requestWithdraw(amount: number, method?: string, details?: string): Promise<WithdrawResult> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return { success: false, message: "يجب تسجيل الدخول" };
    const res = await axios.post(
      `${API_BASE_URL}/api/wallet/withdraw-request`,
      { amount, method, details },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );
    if (res.data?.success) {
      return {
        success: true,
        message: res.data.message,
        revenueShare: res.data.revenueShare,
      };
    }
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return { success: false, message: msg || "فشل في طلب السحب" };
  }
  return { success: false, message: "فشل في طلب السحب" };
}
