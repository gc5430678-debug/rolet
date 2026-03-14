import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchAdStatus, claimAdReward, type AdStatus } from "../utils/adRewardApi";
import { fetchRevenueShare, type RevenueShareStatus } from "../utils/revenueShareApi";
import { AD_UNITS } from "../utils/adConfig";

const GOLD = "#facc15";

function formatPoints(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (adStatus: AdStatus) => void;
};

export function AdWatchModal({ visible, onClose, onSuccess }: Props) {
  const [adStatus, setAdStatus] = useState<AdStatus | null>(null);
  const [revenueShare, setRevenueShare] = useState<RevenueShareStatus | null>(null);
  const [loadingAd, setLoadingAd] = useState<1 | 2 | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const loadStatus = useCallback(async () => {
    const [s, rs] = await Promise.all([fetchAdStatus(), fetchRevenueShare()]);
    setAdStatus(s);
    setRevenueShare(rs);
  }, []);

  useEffect(() => {
    if (visible) loadStatus();
  }, [visible, loadStatus]);

  useEffect(() => {
    const secs = adStatus?.cooldownSeconds ?? 0;
    if (secs > 0) setCooldown(secs);
  }, [adStatus?.cooldownSeconds]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          loadStatus();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown > 0, loadStatus]);

  const handleWatchAd = async (adUnitId: string, adNum: 1 | 2) => {
    setLoadingAd(adNum);
    try {
      let adCompleted = false;
      let loadError: string | null = null;

      const Constants = await import("expo-constants").then((m) => m.default);
      const isExpoGo = Constants.executionEnvironment === "storeClient";
      if (isExpoGo) {
        loadError = "الإعلانات لا تعمل في Expo Go. شغّل: npx expo run:android";
      } else {
        try {
          const ads = await import("react-native-google-mobile-ads");
          const RewardedInterstitialAd = ads.RewardedInterstitialAd;
          const RewardedAdEventType = ads.RewardedAdEventType;
          const AdEventType = ads.AdEventType;
          const rewarded = RewardedInterstitialAd.createForAdRequest(adUnitId);
          adCompleted = await new Promise<boolean>((resolve) => {
            const unsubs: (() => void)[] = [];
            const cleanup = () => unsubs.forEach((u) => u());
            unsubs.push(
              rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                rewarded.show();
              })
            );
            unsubs.push(
              rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
                cleanup();
                resolve(true);
              })
            );
            unsubs.push(
              rewarded.addAdEventListener(AdEventType.CLOSED, () => {
                cleanup();
                resolve(false);
              })
            );
            rewarded.load().catch((e: unknown) => {
              loadError = (e as Error)?.message ?? "فشل تحميل الإعلان";
              cleanup();
              resolve(false);
            });
            setTimeout(() => {
              cleanup();
              resolve(false);
            }, 35000);
          });
        } catch (e) {
          loadError = (e as Error)?.message ?? "خطأ غير متوقع";
          if (__DEV__) {
            await new Promise((r) => setTimeout(r, 1800));
            adCompleted = true;
          }
        }
      }

      if (!adCompleted && loadError) {
        Alert.alert("لم يظهر الإعلان", loadError);
      }

      if (adCompleted) {
        const res = await claimAdReward();
        if (res.success) {
          setAdStatus(res.adStatus ?? null);
          loadStatus();
          onSuccess?.(res.adStatus!);
          Alert.alert("مبروك!", `تم استلام ${res.reward ?? 1} ذهب`);
          onClose();
        } else {
          if (res.cooldownSeconds) {
            setCooldown(res.cooldownSeconds);
            loadStatus();
          }
          if (res.message) Alert.alert("تنبيه", res.message);
        }
      }
    } finally {
      setLoadingAd(null);
    }
  };

  const dailyRemaining = adStatus?.dailyRemaining ?? adStatus?.remaining ?? 0;
  const weeklyRemaining = adStatus?.weeklyRemaining ?? 999;
  const canWatch = dailyRemaining > 0 && weeklyRemaining > 0 && cooldown === 0 && loadingAd === null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>📺</Text>
          </View>
          <Text style={styles.title}>اجمع نقاط حتى 10$ وسحب ✨</Text>
          <Text style={styles.subtitle}>
            {adStatus?.rewardPerAd ?? 1} ذهب لكل إعلان • شاهد 20 يومياً
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{dailyRemaining}</Text>
              <Text style={styles.statLabel}>متاح اليوم</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {adStatus?.weekCount ?? 0}/{adStatus?.weeklyLimit ?? 140}
              </Text>
              <Text style={styles.statLabel}>هذا الأسبوع</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{adStatus?.rewardPerAd ?? 1} 🪙</Text>
              <Text style={styles.statLabel}>لكل إعلان</Text>
            </View>
          </View>

          <View style={styles.pointsSection}>
            <Text style={styles.pointsLabel}>مجموع نقاط</Text>
            <Text style={styles.pointsValue}>{formatPoints(revenueShare?.balancePoints ?? 0)}</Text>
            <Text style={styles.pointsRate}>كل 2000 نقطة = 0.06$</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min(100, revenueShare?.progressPercent ?? 0)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {revenueShare?.progressPercent?.toFixed(1) ?? "0"}% من هدف {revenueShare?.withdrawGoal ?? 10}$
            </Text>
          </View>

          {cooldown > 0 && (
            <Text style={styles.cooldownText}>انتظر {cooldown} ث — 5 دقائق بين الإعلانات</Text>
          )}
          <Text style={styles.hint}>
            {dailyRemaining === 0
              ? "وصلت للحد اليومي. عد غداً!"
              : weeklyRemaining === 0
              ? "وصلت للحد الأسبوعي. عد الأسبوع القادم!"
              : "1 ذهب + نقطة لكل إعلان • 20 يومياً • 5 دقائق بين كل إعلان"}
          </Text>
          <View style={styles.buttons}>
            <View style={styles.adButtonRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnFlex, !canWatch && styles.primaryBtnDisabled]}
                onPress={() => handleWatchAd(AD_UNITS.REWARDED_INTERSTITIAL, 1)}
                disabled={!canWatch}
                activeOpacity={0.8}
              >
                {loadingAd === 1 ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {cooldown > 0
                      ? `انتظر ${cooldown} ث`
                      : dailyRemaining === 0
                      ? "انتهى اليوم"
                      : weeklyRemaining === 0
                      ? "انتهى الأسبوع"
                      : "شاهد إعلان"}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.adCountBadge}>
                <Text style={styles.adCountText}>
                  {adStatus?.todayCount ?? 0}/{adStatus?.dailyLimit ?? 20}
                </Text>
              </View>
            </View>
            <View style={styles.adButtonRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnFlex, !canWatch && styles.primaryBtnDisabled]}
                onPress={() => handleWatchAd(AD_UNITS.REWARDED_INTERSTITIAL_2, 2)}
                disabled={!canWatch}
                activeOpacity={0.8}
              >
                {loadingAd === 2 ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {cooldown > 0
                      ? `انتظر ${cooldown} ث`
                      : dailyRemaining === 0
                      ? "انتهى اليوم"
                      : weeklyRemaining === 0
                      ? "انتهى الأسبوع"
                      : "شاهد إعلان"}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.adCountBadge}>
                <Text style={styles.adCountText}>
                  {adStatus?.todayCount ?? 0}/{adStatus?.dailyLimit ?? 20}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>لاحقاً</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: "#5b21b6",
    borderRadius: 20,
    padding: 18,
    borderTopWidth: 2,
    borderTopColor: "rgba(251, 191, 36, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(251, 191, 36, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  iconEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: GOLD,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pointsSection: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  pointsLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: "800",
    color: GOLD,
    fontVariant: ["tabular-nums"],
  },
  pointsRate: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: GOLD,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  cooldownText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fbbf24",
    textAlign: "center",
    marginBottom: 6,
  },
  hint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 16,
  },
  buttons: {
    gap: 8,
  },
  adButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnFlex: {
    flex: 1,
  },
  adCountBadge: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  adCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: GOLD,
    fontVariant: ["tabular-nums"],
  },
  primaryBtnDisabled: {
    backgroundColor: "rgba(100, 116, 139, 0.5)",
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
