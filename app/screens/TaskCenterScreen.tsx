import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import godOfWealthAnim from "../../assets/animations/god of wealth.json";
import { AdWatchModal } from "../../components/AdWatchModal";
import { AdBanner } from "../../components/AdBanner";
import { CheckInContinuousModal } from "../../components/CheckInContinuousModal";
import { fetchFiveMessagesTaskWithLocal, fetchShareMomentTaskWithLocal, fetchAddFriendTaskWithLocal, fetchDiceTaskWithLocal } from "../../utils/tasksApi";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";

const PURPLE_DARK = "#1a1625";
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const CARD_BG = "rgba(45, 38, 64, 0.6)";
const GOLD = "#facc15";
const RED = "#ef4444";

type Props = {
  onBack: () => void;
  onWalletUpdate?: () => void;
  onOpenAdTest?: () => void;
  /** للانتقال لقسم معيّن عند الضغط على مهمة (اختياري) */
  onNavigateTo?: (section: "messages" | "moments" | "profile" | "social") => void;
};

export default function TaskCenterScreen({ onBack, onWalletUpdate, onOpenAdTest, onNavigateTo }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [fiveMessagesTask, setFiveMessagesTask] = useState<{
    messagesSentToday: number;
    claimedToday: boolean;
    secondsUntilClaim: number;
  } | null>(null);
  const [shareMomentTask, setShareMomentTask] = useState<{
    claimedToday: boolean;
    secondsUntilClaim: number;
  } | null>(null);
  const [addFriendTask, setAddFriendTask] = useState<{
    claimedToday: boolean;
    secondsUntilClaim: number;
  } | null>(null);
  const [diceTask, setDiceTask] = useState<{
    diceSentToday: number;
    claimedToday: boolean;
    secondsUntilClaim: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFiveMessagesTask = useCallback(async () => {
    const data = await fetchFiveMessagesTaskWithLocal();
    setFiveMessagesTask({
      messagesSentToday: data.messagesSentToday,
      claimedToday: data.claimedToday,
      secondsUntilClaim: data.secondsUntilClaim ?? 0,
    });
  }, []);

  const loadShareMomentTask = useCallback(async () => {
    const data = await fetchShareMomentTaskWithLocal();
    setShareMomentTask({
      claimedToday: data.claimedToday,
      secondsUntilClaim: data.secondsUntilClaim ?? 0,
    });
  }, []);

  const loadAddFriendTask = useCallback(async () => {
    const data = await fetchAddFriendTaskWithLocal();
    setAddFriendTask({
      claimedToday: data.claimedToday,
      secondsUntilClaim: data.secondsUntilClaim ?? 0,
    });
  }, []);

  const loadDiceTask = useCallback(async () => {
    const data = await fetchDiceTaskWithLocal();
    setDiceTask({
      diceSentToday: data.diceSentToday ?? 0,
      claimedToday: data.claimedToday,
      secondsUntilClaim: data.secondsUntilClaim ?? 0,
    });
  }, []);

  const loadAllTasks = useCallback(async () => {
    await Promise.all([loadFiveMessagesTask(), loadShareMomentTask(), loadAddFriendTask(), loadDiceTask()]);
  }, [loadFiveMessagesTask, loadShareMomentTask, loadAddFriendTask, loadDiceTask]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllTasks();
    setRefreshing(false);
  }, [loadAllTasks]);

  useEffect(() => {
    loadAllTasks();
    const interval = setInterval(loadAllTasks, 5000);
    return () => clearInterval(interval);
  }, [loadAllTasks]);

  // تحديث العداد كل ثانية عند وجود مهلة (يعمل بدون نت)
  useEffect(() => {
    if (!fiveMessagesTask?.claimedToday || fiveMessagesTask.secondsUntilClaim <= 0) return;
    const id = setInterval(() => {
      setFiveMessagesTask((prev) => {
        if (!prev || prev.secondsUntilClaim <= 0) return prev;
        const next = prev.secondsUntilClaim - 1;
        if (next <= 0) loadFiveMessagesTask();
        return { ...prev, secondsUntilClaim: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [fiveMessagesTask?.claimedToday, fiveMessagesTask?.secondsUntilClaim, loadFiveMessagesTask]);

  useEffect(() => {
    if (!shareMomentTask?.claimedToday || shareMomentTask.secondsUntilClaim <= 0) return;
    const id = setInterval(() => {
      setShareMomentTask((prev) => {
        if (!prev || prev.secondsUntilClaim <= 0) return prev;
        const next = prev.secondsUntilClaim - 1;
        if (next <= 0) loadShareMomentTask();
        return { ...prev, secondsUntilClaim: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [shareMomentTask?.claimedToday, shareMomentTask?.secondsUntilClaim, loadShareMomentTask]);

  useEffect(() => {
    if (!addFriendTask?.claimedToday || addFriendTask.secondsUntilClaim <= 0) return;
    const id = setInterval(() => {
      setAddFriendTask((prev) => {
        if (!prev || prev.secondsUntilClaim <= 0) return prev;
        const next = prev.secondsUntilClaim - 1;
        if (next <= 0) loadAddFriendTask();
        return { ...prev, secondsUntilClaim: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [addFriendTask?.claimedToday, addFriendTask?.secondsUntilClaim, loadAddFriendTask]);

  useEffect(() => {
    if (!diceTask?.claimedToday || diceTask.secondsUntilClaim <= 0) return;
    const id = setInterval(() => {
      setDiceTask((prev) => {
        if (!prev || prev.secondsUntilClaim <= 0) return prev;
        const next = prev.secondsUntilClaim - 1;
        if (next <= 0) loadDiceTask();
        return { ...prev, secondsUntilClaim: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [diceTask?.claimedToday, diceTask?.secondsUntilClaim, loadDiceTask]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={theme.textLight} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t("taskCenter.title")}</Text>
        <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
      >
        {/* بانر المشاركة في الأرباح */}
        <TouchableOpacity style={styles.alertBanner} activeOpacity={0.8} onPress={() => setShowAdModal(true)}>
          <Ionicons name="tv" size={16} color="#854d0e" />
          <Text style={styles.alertText} numberOfLines={2}>
            {t("taskCenter.alertBanner")}
          </Text>
          <Ionicons name="chevron-back" size={14} color="#854d0e" />
        </TouchableOpacity>

        {/* تمرير شهري */}
        <TouchableOpacity style={styles.monthlyCard} activeOpacity={0.9}>
          <LinearGradient
            colors={["#3b82f6", "#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.monthlyGradient}
          >
            <View style={styles.monthlyContent}>
              <Text style={styles.monthlyTitle}>{t("taskCenter.monthlyTitle")}</Text>
              <Text style={styles.monthlyDesc}>{t("taskCenter.monthlyDesc")}</Text>
            </View>
            <View style={styles.monthlyDecor}>
              <LottieView source={godOfWealthAnim} autoPlay loop style={styles.monthlyLottie} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* مهام يومية */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("taskCenter.dailyTasks")}</Text>
          </View>

          <View style={styles.taskList}>
            <View style={styles.taskItem}>
              <View style={[styles.taskIcon, { backgroundColor: "#3b82f6" }]}>
                <Ionicons name="tv" size={18} color="#fff" />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskDesc}>{t("taskCenter.earnWithdraw")}</Text>
                <View style={styles.taskReward}>
                  <Text style={styles.taskRewardText}>10$</Text>
                  <Text style={styles.taskCoin}>{t("taskCenter.withdrawGoal")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.watchAdBtn}
                  onPress={() => setShowAdModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play-circle" size={14} color="#fff" />
                  <Text style={styles.watchAdBtnText}>{t("taskCenter.watchAd")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.taskItem} activeOpacity={0.8} onPress={() => setShowCheckinModal(true)}>
              <View style={[styles.taskIcon, { backgroundColor: "#f97316" }]}>
                <Ionicons name="calendar" size={18} color="#fff" />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskDesc}>{t("taskCenter.checkinDesc")}</Text>
                <View style={styles.taskReward}>
                  <Text style={styles.taskRewardText}>50+</Text>
                  <Text style={styles.taskCoin}>🪙</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.taskItem}
              activeOpacity={0.8}
              onPress={() => (onNavigateTo ? onNavigateTo("messages") : onBack())}
            >
              <View style={[styles.taskIcon, { backgroundColor: "#06b6d4" }]}>
                <Ionicons name="chatbubbles" size={18} color="#fff" />
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskDescRow}>
                  <Text style={styles.taskDesc}>{t("taskCenter.fiveMessagesDesc")}</Text>
                  <View style={styles.taskProgressWrap}>
                    {fiveMessagesTask?.claimedToday ? (
                      <Text style={styles.taskClaimed}>{t("taskCenter.claimed")}</Text>
                    ) : (
                      <View style={styles.taskProgressNums}>
                        <Text style={styles.taskProgressTarget}>5</Text>
                        <Text style={styles.taskProgressSep}>|</Text>
                        <Text style={[styles.taskProgressCurrent, fiveMessagesTask && fiveMessagesTask.messagesSentToday < 5 ? styles.taskProgressRed : undefined]}>
                          {fiveMessagesTask?.messagesSentToday ?? 0}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {fiveMessagesTask?.claimedToday ? (
                  <View style={styles.taskCountdownWrap}>
                    <Text style={styles.taskTryAgain}>
                      {fiveMessagesTask.secondsUntilClaim > 0
                        ? (() => {
                            const h = Math.floor(fiveMessagesTask.secondsUntilClaim / 3600);
                            const m = Math.floor((fiveMessagesTask.secondsUntilClaim % 3600) / 60);
                            const s = fiveMessagesTask.secondsUntilClaim % 60;
                            return `${t("taskCenter.countdownAfter")} ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                          })()
                        : t("taskCenter.tryAgain")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.taskReward}>
                    <Text style={styles.taskRewardText}>15</Text>
                    <Text style={styles.taskCoin}>🪙</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-back" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.taskItem}
              activeOpacity={0.8}
              onPress={() => (onNavigateTo ? onNavigateTo("moments") : onBack())}
            >
              <View style={[styles.taskIcon, { backgroundColor: "#ec4899" }]}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskDescRow}>
                  <Text style={styles.taskDesc}>{t("taskCenter.shareMomentDesc")}</Text>
                  {shareMomentTask?.claimedToday ? (
                    <Text style={styles.taskClaimed}>{t("taskCenter.claimed")}</Text>
                  ) : null}
                </View>
                {shareMomentTask?.claimedToday ? (
                  <View style={styles.taskCountdownWrap}>
                    <Text style={styles.taskTryAgain}>
                      {shareMomentTask.secondsUntilClaim > 0
                        ? (() => {
                            const h = Math.floor(shareMomentTask.secondsUntilClaim / 3600);
                            const m = Math.floor((shareMomentTask.secondsUntilClaim % 3600) / 60);
                            const s = shareMomentTask.secondsUntilClaim % 60;
                            return `${t("taskCenter.countdownAfter")} ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                          })()
                        : t("taskCenter.tryAgain")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.taskReward}>
                    <Text style={styles.taskRewardText}>10</Text>
                    <Text style={styles.taskCoin}>🪙</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-back" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.taskItem}
              activeOpacity={0.8}
              onPress={() => (onNavigateTo ? onNavigateTo("social") : onBack())}
            >
              <View style={[styles.taskIcon, { backgroundColor: "#22c55e" }]}>
                <Ionicons name="person-add" size={18} color="#fff" />
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskDescRow}>
                  <Text style={styles.taskDesc}>{t("taskCenter.addFriendDesc")}</Text>
                  {addFriendTask?.claimedToday ? (
                    <Text style={styles.taskClaimed}>{t("taskCenter.claimed")}</Text>
                  ) : null}
                </View>
                {addFriendTask?.claimedToday ? (
                  <View style={styles.taskCountdownWrap}>
                    <Text style={styles.taskTryAgain}>
                      {addFriendTask.secondsUntilClaim > 0
                        ? (() => {
                            const h = Math.floor(addFriendTask.secondsUntilClaim / 3600);
                            const m = Math.floor((addFriendTask.secondsUntilClaim % 3600) / 60);
                            const s = addFriendTask.secondsUntilClaim % 60;
                            return `${t("taskCenter.countdownAfter")} ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                          })()
                        : t("taskCenter.tryAgain")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.taskReward}>
                    <Text style={styles.taskRewardText}>25</Text>
                    <Text style={styles.taskCoin}>🪙</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-back" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.taskItem}
              activeOpacity={0.8}
              onPress={() => (onNavigateTo ? onNavigateTo("messages") : onBack())}
            >
              <View style={[styles.taskIcon, { backgroundColor: "#f59e0b" }]}>
                <Text style={styles.diceEmoji}>🎲</Text>
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskDescRow}>
                  <Text style={styles.taskDesc}>{t("taskCenter.diceDesc")}</Text>
                  {diceTask?.claimedToday ? (
                    <Text style={styles.taskClaimed}>{t("taskCenter.claimed")}</Text>
                  ) : (
                    <View style={styles.taskProgressNums}>
                      <Text style={styles.taskProgressTarget}>5</Text>
                      <Text style={styles.taskProgressSep}>|</Text>
                      <Text style={[styles.taskProgressCurrent, diceTask && diceTask.diceSentToday < 5 ? styles.taskProgressRed : undefined]}>
                        {diceTask?.diceSentToday ?? 0}
                      </Text>
                    </View>
                  )}
                </View>
                {diceTask?.claimedToday ? (
                  <View style={styles.taskCountdownWrap}>
                    <Text style={styles.taskTryAgain}>
                      {diceTask.secondsUntilClaim > 0
                        ? (() => {
                            const h = Math.floor(diceTask.secondsUntilClaim / 3600);
                            const m = Math.floor((diceTask.secondsUntilClaim % 3600) / 60);
                            const s = diceTask.secondsUntilClaim % 60;
                            return `${t("taskCenter.countdownAfter")} ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                          })()
                        : t("taskCenter.tryAgain")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.taskReward}>
                    <Text style={styles.taskRewardText}>8</Text>
                    <Text style={styles.taskCoin}>🪙</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-back" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>

          </View>
        </View>

        <AdBanner />
        {onOpenAdTest && (
          <TouchableOpacity style={styles.adTestLink} onPress={onOpenAdTest} activeOpacity={0.7}>
            <Ionicons name="bug" size={14} color={TEXT_MUTED} />
            <Text style={styles.adTestLinkText}>{t("taskCenter.adTest")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <CheckInContinuousModal
        visible={showCheckinModal}
        forceOpen
        onClose={() => setShowCheckinModal(false)}
        onWalletUpdate={onWalletUpdate}
      />

      <AdWatchModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onSuccess={() => onWalletUpdate?.()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "ios" ? 44 : 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 32 },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef9c3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    color: "#854d0e",
    fontWeight: "500",
  },

  monthlyCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  monthlyGradient: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 88,
    justifyContent: "space-between",
  },
  monthlyContent: {
    paddingRight: 85,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  monthlyDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
  },
  monthlyDecor: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  monthlyLottie: {
    width: 72,
    height: 72,
  },

  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    backgroundColor: "rgba(30, 27, 75, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_LIGHT,
  },
  taskList: {
    gap: 6,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.12)",
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskDesc: {
    fontSize: 12,
    color: TEXT_LIGHT,
    fontWeight: "500",
  },
  taskDescRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  taskProgressWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskProgressNums: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  taskProgressTarget: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_LIGHT,
  },
  taskProgressSep: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  taskProgressCurrent: {
    fontSize: 13,
    fontWeight: "700",
    color: GOLD,
  },
  taskProgressRed: {
    color: RED,
  },
  taskClaimed: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22c55e",
  },
  taskCountdownWrap: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  taskTryAgain: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22c55e",
  },
  taskReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  taskRewardText: {
    fontSize: 11,
    fontWeight: "700",
    color: GOLD,
  },
  taskCoin: { fontSize: 12 },
  taskDiamond: { fontSize: 12 },
  diceEmoji: { fontSize: 18 },
  watchAdBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#22c55e",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  watchAdBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  adTestLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingVertical: 12,
  },
  adTestLinkText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
