import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Constants from "expo-constants";

const TOP_PAD = (Constants.default?.statusBarHeight ?? 24) + 6;
const PING_URL = "https://www.google.com/generate_204";

let NetInfo: typeof import("@react-native-community/netinfo").default | null = null;
try {
  NetInfo = require("@react-native-community/netinfo").default;
} catch {
  NetInfo = null;
}

async function checkOnlineWithFetch(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(PING_URL, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  const checkConnection = useCallback(async () => {
    if (NetInfo) {
      try {
        const state = await NetInfo.fetch();
        setIsOffline(!(state.isConnected ?? false));
      } catch {
        const ok = await checkOnlineWithFetch();
        setIsOffline(!ok);
      }
    } else {
      const ok = await checkOnlineWithFetch();
      setIsOffline(!ok);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => checkOnlineWithFetch().then((ok) => { if (!cancelled) setIsOffline(!ok); });
    run();
    if (NetInfo) {
      try {
        const unsub = NetInfo.addEventListener((state) => {
          if (!cancelled) setIsOffline(!(state.isConnected ?? false));
        });
        return () => { cancelled = true; unsub(); };
      } catch {
        const iv = setInterval(run, 4000);
        return () => { cancelled = true; clearInterval(iv); };
      }
    }
    const iv = setInterval(run, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: TOP_PAD }]}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text style={styles.text}>لا يوجد اتصال</Text>
      <TouchableOpacity
        style={styles.retryBtn}
        onPress={checkConnection}
        activeOpacity={0.8}
      >
        <Text style={styles.retryText}>أعد المحاولة</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingVertical: 6,
    gap: 8,
    zIndex: 99999,
    elevation: 99999,
  },
  text: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
});
