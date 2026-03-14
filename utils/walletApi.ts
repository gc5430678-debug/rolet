import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./authHelper";

export type WalletBalance = {
  totalGold: number;
  chargedGold: number;
  freeGold: number;
  diamonds: number;
};

export async function fetchWallet(): Promise<WalletBalance | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    const res = await axios.get(`${API_BASE_URL}/api/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    if (res.data?.success && res.data?.wallet) {
      const w = res.data.wallet;
      return {
        totalGold: w.totalGold ?? 0,
        chargedGold: w.chargedGold ?? 0,
        freeGold: w.freeGold ?? 0,
        diamonds: w.diamonds ?? 0,
      };
    }
  } catch {
    // ignore
  }
  return null;
}
