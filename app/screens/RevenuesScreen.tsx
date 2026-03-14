import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { fetchWallet } from "../../utils/walletApi";
import { fetchRevenueShare, requestWithdraw } from "../../utils/revenueShareApi";
import { AdBanner } from "../../components/AdBanner";
import { useTheme } from "../_contexts/ThemeContext";
import { useLanguage } from "../_contexts/LanguageContext";

const GOLD = "#facc15";

type Props = {
  onBack: () => void;
};

export default function RevenuesScreen({ onBack }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [diamonds, setDiamonds] = useState<number | null>(null);
  const [revenueShare, setRevenueShare] = useState<{
    balanceUsd: number;
    withdrawGoal: number;
    progressPercent: number;
    canWithdraw: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [wallet, rs] = await Promise.all([fetchWallet(), fetchRevenueShare()]);
    setDiamonds(wallet?.diamonds ?? 0);
    setRevenueShare(rs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = () => {
    const goal = revenueShare?.withdrawGoal ?? 10;
    if (!revenueShare || revenueShare.balanceUsd < goal) {
      Alert.alert("تنبيه", `الحد الأدنى للسحب ${goal}$ — شاهد 20 إعلان يومياً للوصول!`);
      return;
    }
    Alert.alert(
      "طلب سحب",
      `رصيدك ${revenueShare.balanceUsd.toFixed(2)}$ — سنتواصل معك خلال 24-48 ساعة. كيف تفضل الاستلام؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "PayPal", onPress: () => doWithdraw("PayPal") },
        { text: "حساب بنكي", onPress: () => doWithdraw("حساب بنكي") },
      ]
    );
  };

  const doWithdraw = async (method: string) => {
    setWithdrawing(true);
    const res = await requestWithdraw(revenueShare!.balanceUsd, method);
    setWithdrawing(false);
    if (res.success) {
      setRevenueShare((r) => (r ? { ...r, balanceUsd: res.revenueShare?.balanceUsd ?? 0 } : null));
      Alert.alert(t("revenues.success"), res.message ?? t("revenues.withdrawSuccess"));
    } else {
      Alert.alert(t("revenues.alert"), res.message ?? t("revenues.withdrawFailed"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.textLight} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t("revenues.title")}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.diamondCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.diamondRow}>
            <View style={styles.lottieWrap}>
              <LottieView
                source={require("../../assets/animations/Diamond.json")}
                autoPlay
                loop
                style={styles.lottie}
              />
            </View>
            <View style={styles.countCol}>
              {loading ? (
                <ActivityIndicator size="large" color={GOLD} />
              ) : (
                <Text style={[styles.diamondCount, { color: theme.textLight }]}>{diamonds != null ? Number(diamonds).toFixed(2) : "0.00"}</Text>
              )}
              <Text style={[styles.diamondLabel, { color: theme.textMuted }]}>{t("revenues.diamonds")}</Text>
            </View>
          </View>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            {t("revenues.hint")}
          </Text>
        </View>

        <View style={[styles.revenueCard, { backgroundColor: theme.accentMuted, borderColor: theme.border }]}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash" size={28} color="#22c55e" />
            <Text style={[styles.revenueTitle, { color: theme.textLight }]}>{t("revenues.profitShare")}</Text>
          </View>
          <Text style={[styles.revenueSub, { color: theme.textMuted }]}>
            {t("revenues.revenueSub").replace("{goal}", String(revenueShare?.withdrawGoal ?? 10))}
          </Text>
          <View style={styles.revenueBalance}>
            <Text style={[styles.revenueAmount, { color: theme.textLight }]}>
              {revenueShare != null ? revenueShare.balanceUsd.toFixed(2) : "0.00"} $
            </Text>
            <Text style={[styles.revenueLabel, { color: theme.textMuted }]}>{t("revenues.fromGoal")} {revenueShare?.withdrawGoal ?? 10}$</Text>
          </View>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBar, { width: `${Math.min(100, revenueShare?.progressPercent ?? 0)}%` }]} />
          </View>
          <Text style={[styles.revenueWeek, { color: theme.textMuted }]}>
            {t("revenues.progress")}: {revenueShare?.progressPercent.toFixed(1) ?? "0"}%
          </Text>
          <TouchableOpacity
            style={[styles.withdrawBtn, (!revenueShare?.canWithdraw || withdrawing) && styles.withdrawBtnDisabled]}
            onPress={handleWithdraw}
            disabled={withdrawing || !revenueShare?.canWithdraw}
            activeOpacity={0.8}
          >
            {withdrawing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.withdrawBtnText}>
                {revenueShare?.canWithdraw
                  ? t("revenues.withdrawBtn").replace("{goal}", String(revenueShare.withdrawGoal))
                  : t("revenues.continueBtn").replace("{goal}", String(revenueShare?.withdrawGoal ?? 10))}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <AdBanner />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  diamondCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  diamondRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  lottieWrap: {
    width: 140,
    height: 140,
  },
  lottie: { width: "100%", height: "100%" },
  countCol: {
    alignItems: "center",
    minWidth: 80,
  },
  diamondCount: {
    fontSize: 42,
    fontWeight: "800",
    color: GOLD,
  },
  diamondLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
  },
  revenueCard: {
    marginTop: 24,
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  revenueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#22c55e",
  },
  revenueSub: {
    fontSize: 13,
    color: "#a1a1aa",
    marginBottom: 16,
  },
  revenueBalance: {
    alignItems: "center",
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#22c55e",
  },
  revenueLabel: {
    fontSize: 14,
    color: "#a1a1aa",
    marginTop: 4,
  },
  progressBarWrap: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },
  revenueWeek: {
    fontSize: 12,
    color: "#a1a1aa",
    marginBottom: 16,
    textAlign: "center",
  },
  withdrawBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  withdrawBtnDisabled: {
    backgroundColor: "rgba(100, 116, 139, 0.5)",
  },
  withdrawBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
