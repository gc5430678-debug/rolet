import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";

export const GIFT_ITEMS: { image: number; name: string; cost: string; key: string }[] = [
  { image: require("../assets/images/taws.jpg"), name: "طاوس", cost: "500", key: "peacock" },
  { image: require("../assets/images/tenen.jpg"), name: "تنين وردي", cost: "100", key: "dragon" },
  { image: require("../assets/images/spec.jpj.png"), name: "رجل فضاء", cost: "25", key: "space" },
  { image: require("../assets/images/love.jpg"), name: "رسالة حب", cost: "10", key: "love" },
  { image: require("../assets/images/perd.jpg"), name: "طيور حب", cost: "45", key: "bird" },
  { image: require("../assets/images/chost.jpg"), name: "شبح", cost: "5", key: "ghost" },
  { image: require("../assets/images/تنزيل.png"), name: "وردة", cost: "1", key: "rose" },
  { image: require("../assets/images/flo.jpg"), name: "زهرة كرز", cost: "200", key: "flower" },
];

const GIFT_AMOUNTS: Record<string, number> = {
  peacock: 500,
  dragon: 100,
  space: 25,
  love: 10,
  bird: 45,
  ghost: 5,
  rose: 1,
  flower: 200,
};

export type GiftKey = "peacock" | "dragon" | "space" | "love" | "bird" | "ghost" | "rose" | "flower";

type Props = {
  visible: boolean;
  onClose: () => void;
  goldBalance: number;
  chargedGold: number;
  freeGold: number;
  onSend: (giftKey: GiftKey, amount: number, quantity: number) => void;
  onOpenTopup?: () => void;
  t: (key: string) => string;
};

export function GiftModal({
  visible,
  onClose,
  goldBalance,
  chargedGold,
  freeGold,
  onSend,
  onOpenTopup,
  t,
}: Props) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  const item = GIFT_ITEMS[selectedIndex];
  const giftKey = (item?.key ?? "rose") as GiftKey;
  const baseAmount = GIFT_AMOUNTS[giftKey] ?? 1;
  const amount = baseAmount * Math.max(1, quantity);

  const handleSend = () => {
    if (goldBalance <= 0 || goldBalance < amount) {
      onClose();
      onOpenTopup?.();
      return;
    }
    onSend(giftKey, amount, quantity);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modal}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.goldPill}
                  activeOpacity={0.8}
                  onPress={onOpenTopup}
                >
                  <Text style={styles.goldIcon}>🪙</Text>
                  <View>
                    <Text style={styles.goldText}>{goldBalance}</Text>
                    <Text style={styles.goldSub}>{t("me.charged")} {chargedGold} · {t("me.free")} {freeGold}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <View style={styles.headerIcons}>
                  <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="shield-outline" size={20} color={TEXT_MUTED} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="sparkles-outline" size={20} color={TEXT_MUTED} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.headerIcon, styles.headerIconActive]}>
                    <Ionicons name="gift" size={20} color="#fbbf24" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.grid}>
                {GIFT_ITEMS.map((g, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.gridItem, selectedIndex === i && styles.gridItemSelected]}
                    onPress={() => setSelectedIndex(i)}
                    activeOpacity={0.7}
                  >
                    <Image source={g.image} style={styles.gridImage} resizeMode="cover" />
                    <Text style={styles.gridName} numberOfLines={1}>{g.name}</Text>
                    <View style={styles.gridCostRow}>
                      <Text style={styles.gridCost}>{g.cost}</Text>
                      <Text style={styles.goldIcon}>🪙</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.pagination}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
              </View>
              <View style={styles.footer}>
                <View style={styles.quantityPill}>
                  <Ionicons name="gift-outline" size={18} color={TEXT_LIGHT} />
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity((q) => Math.min(q + 1, 99))} hitSlop={8}>
                    <Ionicons name="chevron-up" size={18} color={TEXT_LIGHT} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setQuantity((q) => Math.max(1, q - 1))} hitSlop={8}>
                    <Ionicons name="chevron-down" size={18} color={TEXT_LIGHT} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
                  <Text style={styles.sendText}>{t("chat.send")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#1e1b2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  goldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  goldText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fbbf24",
  },
  goldSub: {
    fontSize: 11,
    color: "rgba(251,191,36,0.85)",
    marginTop: 2,
  },
  goldIcon: { fontSize: 14 },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: { padding: 6 },
  headerIconActive: { opacity: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: SCREEN_WIDTH - 32,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 32 - 24) / 4,
    alignItems: "center",
    marginBottom: 16,
  },
  gridItemSelected: {
    borderWidth: 2,
    borderColor: "#a855f7",
    borderRadius: 10,
    padding: 4,
    margin: -4,
  },
  gridImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(148,163,184,0.2)",
    marginBottom: 6,
  },
  gridName: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginBottom: 4,
    width: "100%",
    textAlign: "center",
  },
  gridCostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridCost: {
    fontSize: 12,
    color: "#fbbf24",
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(148,163,184,0.4)",
  },
  dotActive: {
    backgroundColor: "#e2e8f0",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(167,139,250,0.2)",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_LIGHT,
  },
  sendBtn: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#a855f7",
    alignItems: "center",
  },
  sendText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
