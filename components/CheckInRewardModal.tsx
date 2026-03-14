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
import { fetchCheckIn, claimCheckIn, type CheckInStatus } from "../utils/checkinApi";

const GOLD = "#facc15";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onOpenTaskCenter?: () => void;
  onWalletUpdate?: () => void;
};

export function CheckInRewardModal({ visible, onDismiss, onOpenTaskCenter, onWalletUpdate }: Props) {
  const [checkin, setCheckin] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const loadCheckin = useCallback(async () => {
    const data = await fetchCheckIn();
    setCheckin(data);
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

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      const res = await claimCheckIn();
      if (res.success) {
        onWalletUpdate?.();
        setCheckin(res.checkin ?? null);
        if (!res.checkin?.canClaim) {
          setDismissed(true);
          onDismiss();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const show = visible && checkin?.canClaim && !dismissed;

  return (
    <Modal visible={show} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleDismiss} />
        <View style={styles.checkinModal} onStartShouldSetResponder={() => true}>
          <View style={styles.checkinHeader}>
            <View style={styles.checkinHeaderIcon}>
              <Text style={styles.checkinPen}>✏️</Text>
              <View style={[styles.checkinCalendar, styles.checkinCalendarActive]}>
                <Ionicons name="calendar" size={28} color="#f59e0b" />
                <Text style={styles.checkinDayLabel}>Day {checkin?.currentDay ?? 1}</Text>
                <View style={styles.checkinCheckmark}>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.checkinTitle}>جاهز للاستلام!</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>مكافأة اليوم {checkin?.currentDay}</Text>
            <Text style={styles.timerValue}>{checkin?.rewardForCurrentDay ?? 0} 🪙</Text>
          </View>
          <View style={styles.checkinButtons}>
            <TouchableOpacity
              style={[styles.checkinDoneBtn, styles.checkinDoneBtnHighlight]}
              onPress={handleClaim}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.checkinDoneText}>استلام {checkin?.rewardForCurrentDay ?? 0} ذهب</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.vipBtn} onPress={onOpenTaskCenter ?? handleDismiss} activeOpacity={0.8}>
              <Text style={styles.vipBtnText}>مركز المهام</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterBtn} onPress={handleDismiss} activeOpacity={0.8}>
              <Text style={styles.laterBtnText}>لاحقاً</Text>
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
    marginBottom: 20,
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
  checkinButtons: {
    gap: 10,
  },
  checkinDoneBtn: {
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
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  vipBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4c1d95",
  },
  laterBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  laterBtnText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
});
