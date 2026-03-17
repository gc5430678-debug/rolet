import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

export type WalletBalance = {
  totalGold: number;
  chargedGold: number;
  freeGold: number;
  diamonds: number;
};

const CACHE_KEY = "cache_wallet_v1";

async function getCachedWalletFromStorage(): Promise<WalletBalance | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WalletBalance;
  } catch {
    return null;
  }
}

/** جلب الرصيد المخزّن محلياً — للعرض الفوري */
export async function getCachedWallet(): Promise<WalletBalance | null> {
  return getCachedWalletFromStorage();
}

export async function fetchWallet(): Promise<WalletBalance | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return getCachedWalletFromStorage();
    const res = await axios.get(`${API_BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    if (res.data?.success && res.data?.wallet) {
      const w = res.data.wallet;
      const balance: WalletBalance = {
        totalGold: w.totalGold ?? 0,
        chargedGold: w.chargedGold ?? 0,
        freeGold: w.freeGold ?? 0,
        diamonds: w.diamonds ?? 0,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(balance));
      return balance;
    }
  } catch {
    // ignore
  }
  return getCachedWalletFromStorage();
}
