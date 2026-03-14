import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchCheckIn, startCheckIn, claimCheckIn, type CheckInStatus } from "../utils/checkinApi";

const GOLD = "#facc15";
const CHECKIN_REWARDS = [
  { day: 1, gold: 2 },
  { day: 2, gold: 4 },
  { day: 3, gold: 6 },
  { day: 4, gold: 8 },
  { day: 5, gold: 10 },
  { day: 6, gold: 10 },
  { day: 7, gold: 10 },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  /** عند true من مركز المهام: يظهر دائماً. عند true من التطبيق: يظهر فقط عند canClaim */
  visible: boolean;
  /** عند true: يظهر المودال حتى لو لم يكن canClaim (مثل فتحه من مركز المهام) */
  forceOpen?: boolean;
  onClose: () => void;
  onWalletUpdate?: () => void;
  onOpenTaskCenter?: () => void;
};

/** مودال تسجيل الدخول المتواصل - نفس التصميم الموجود في مركز المهام عند الضغط على "كل أسبوع حتى تحصل على 50+" */
export function CheckInContinuousModal({
  visible,
  forceOpen = false,
  onClose,
  onWalletUpdate,
  onOpenTaskCenter,
}: Props) {
  const [checkin, setCheckin] = useState<CheckInStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const loadCheckin = useCallback(async () => {
    const data = await fetchCheckIn();
    setCheckin(data);
    if (data?.secondsUntilClaim) setCountdown(data.secondsUntilClaim);
    if (data?.canClaim) setDismissed(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    loadCheckin();
  }, [visible, loadCheckin]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadCheckin();
    });
    return () => sub.remove();
  }, [loadCheckin]);

  useEffect(() => {
    if (!checkin || checkin.canClaim || checkin.canStart || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [checkin?.canClaim, checkin?.canStart, countdown]);

  const handleStartCheckin = async () => {
    setLoading(true);
    try {
      const res = await startCheckIn();
      if (res.success && res.checkin) {
        setCheckin(res.checkin);
        setCountdown(res.checkin.secondsUntilClaim ?? 86400);
        onWalletUpdate?.();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCheckin = async () => {
    setLoading(true);
    try {
      const res = await claimCheckIn();
      if (res.success && res.checkin) {
        setCheckin(res.checkin);
        setCountdown(res.checkin.secondsUntilClaim ?? 86400);
        onWalletUpdate?.();
        if (!res.checkin?.canClaim) {
          setDismissed(true);
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckinBtn = () => {
    if (checkin?.canClaim) handleClaimCheckin();
    else if (checkin?.canStart) handleStartCheckin();
    else {
      setDismissed(true);
      onClose();
    }
  };

  const handleBackdrop = () => {
    if (forceOpen) {
      onClose();
    } else {
      setDismissed(true);
      onClose();
    }
  };

  const shouldShow = visible && (forceOpen || (checkin?.canClaim && !dismissed));
  if (!shouldShow) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleBackdrop} />
        <View style={styles.checkinModal} onStartShouldSetResponder={() => true}>
          <View style={styles.checkinHeader}>
            <View style={styles.checkinHeaderIcon}>
              <Text style={styles.checkinPen}>✏️</Text>
              <View style={[styles.checkinCalendar, checkin?.currentDay ? styles.checkinCalendarActive : null]}>
                <Ionicons name="calendar" size={28} color="#f59e0b" />
                <Text style={styles.checkinDayLabel}>Day {checkin?.currentDay ?? 1}</Text>
                {checkin?.canClaim ? (
                  <View style={styles.checkinCheckmark}>
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={styles.checkinTitle}>تسجيل الدخول المتواصل</Text>

          {checkin && (checkin.canClaim || (!checkin.canStart && countdown > 0)) ? (
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>
                {checkin.canClaim ? "جاهز للاستلام!" : "الوقت المتبقي"}
              </Text>
              <Text style={styles.timerValue}>
                {checkin.canClaim ? `${checkin.rewardForCurrentDay} 🪙` : formatTime(countdown)}
              </Text>
            </View>
          ) : null}

          <View style={styles.rewardGrid}>
            <View style={styles.rewardRow}>
              {[4, 3, 2, 1].map((d) => {
                const r = CHECKIN_REWARDS[d - 1];
                const isCurrent = checkin?.currentDay === r.day;
                return (
                  <View key={r.day} style={[styles.rewardCard, isCurrent && styles.rewardCardActive]}>
                    <Text style={styles.rewardDayBadge}>{r.day}</Text>
                    <Text style={styles.rewardGoldIcon}>🪙</Text>
                    <Text style={styles.rewardGoldText}>{r.gold} ذهب</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.rewardRow}>
              {[7, 6, 5].map((d) => {
                const r = CHECKIN_REWARDS[d - 1];
                const isCurrent = checkin?.currentDay === r.day;
                return (
                  <View key={r.day} style={[styles.rewardCard, isCurrent && styles.rewardCardActive]}>
                    <Text style={styles.rewardDayBadge}>{r.day}</Text>
                    <Text style={styles.rewardGoldIcon}>🪙</Text>
                    <Text style={styles.rewardGoldText}>{r.gold} ذهب</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.vipDescRow}>
            <Text style={styles.vipShield}>🛡️</Text>
            <Text style={styles.vipDesc}>
              يقدم تسجيل الوصول لكبار الشخصيات مكافآت مضاعفة، مع توفر 50 قطعة ذهبية كحد أقصى أسبوعيا
            </Text>
          </View>

          <View style={styles.checkinButtons}>
            <TouchableOpacity
              style={[styles.checkinDoneBtn, (checkin?.canClaim || checkin?.canStart) && styles.checkinDoneBtnHighlight]}
              onPress={handleCheckinBtn}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.checkinDoneText}>
                  {checkin?.canClaim
                    ? `استلام ${checkin.rewardForCurrentDay} ذهب`
                    : checkin?.canStart
                      ? "تم الدخول"
                      : "إغلاق"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.vipBtn}
              onPress={onOpenTaskCenter ?? handleBackdrop}
              activeOpacity={0.8}
            >
              <Text style={styles.vipShieldBtn}>🛡️</Text>
              <Text style={styles.vipBtnText}>VIP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  checkinModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#4c1d95",
    borderRadius: 24,
    padding: 24,
    borderTopWidth: 3,
    borderTopColor: "rgba(96, 165, 250, 0.6)",
  },
  checkinHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  checkinHeaderIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkinPen: { fontSize: 36 },
  checkinCalendar: {
    width: 48,
    height: 48,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkinCalendarActive: {
    borderWidth: 2,
    borderColor: GOLD,
  },
  checkinDayLabel: {
    fontSize: 9,
    color: "#92400e",
    fontWeight: "700",
    marginTop: 2,
  },
  checkinCheckmark: {
    position: "absolute",
    bottom: -4,
    right: -4,
  },
  checkinTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  timerBox: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: "800",
    color: GOLD,
    fontVariant: ["tabular-nums"],
  },
  rewardGrid: {
    gap: 12,
    marginBottom: 16,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  rewardCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: "rgba(88, 28, 135, 0.9)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.2)",
  },
  rewardCardActive: {
    borderColor: GOLD,
    borderWidth: 2,
    backgroundColor: "rgba(124, 58, 237, 0.95)",
  },
  rewardDayBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },
  rewardGoldIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  rewardGoldText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: "700",
  },
  vipDescRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  vipShield: { fontSize: 18 },
  vipDesc: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
  checkinButtons: {
    flexDirection: "row",
    gap: 12,
  },
  checkinDoneBtn: {
    flex: 1,
    backgroundColor: "#6d28d9",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkinDoneBtnHighlight: {
    backgroundColor: "#22c55e",
  },
  checkinDoneText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  vipBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  vipShieldBtn: { fontSize: 18 },
  vipBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4c1d95",
  },
});
