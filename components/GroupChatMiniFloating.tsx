import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchGroupChatSlots } from "../utils/messagesApi";

const BG = "rgba(26,22,37,0.95)";
const TEXT_LIGHT = "#f5f3ff";
const ACCENT = "#a78bfa";

type Props = {
  onOpen: () => void;
  onClose: () => void;
};

export default function GroupChatMiniFloating({ onOpen, onClose }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => {
      fetchGroupChatSlots().then((slots) => {
        const active = slots.filter((s) => s != null).length;
        setCount(active);
      }).catch(() => {});
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity style={styles.bubble} onPress={onOpen} activeOpacity={0.8}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={24} color={ACCENT} />
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </View>
        <Text style={styles.label}>دردشة جماعية</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close" size={18} color={TEXT_LIGHT} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  iconWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: ACCENT,
    borderRadius: 14,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1a1625",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_LIGHT,
  },
  closeBtn: {
    padding: 8,
  },
});
