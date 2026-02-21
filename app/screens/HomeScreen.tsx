import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ACCENT_SOFT = "#c4b5fd";
const ACCENT_MUTED = "rgba(167, 139, 250, 0.25)";
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const CARD_BG = "rgba(45, 38, 64, 0.6)";
const BORDER_SOFT = "rgba(167, 139, 250, 0.2)";

type Props = {
  userName: string;
  onNavigate: (tab: string) => void;
};

export default function HomeScreen({ userName, onNavigate }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>مرحباً، {userName || "صديقي"}</Text>
      <Text style={styles.subtitle}>استكشف التطبيق من هنا</Text>
      <View style={styles.cards}>
        <TouchableOpacity style={styles.card} onPress={() => onNavigate("moment")} activeOpacity={0.85}>
          <View style={styles.cardIcon}>
            <Ionicons name="sparkles" size={28} color={ACCENT_SOFT} />
          </View>
          <Text style={styles.cardTitle}>لحظاتي</Text>
          <Text style={styles.cardSub}>شارك لحظاتك</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => onNavigate("messages")} activeOpacity={0.85}>
          <View style={styles.cardIcon}>
            <Ionicons name="chatbubble-ellipses" size={28} color={ACCENT_SOFT} />
          </View>
          <Text style={styles.cardTitle}>الرسائل</Text>
          <Text style={styles.cardSub}>تواصل مع الآخرين</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => onNavigate("club")} activeOpacity={0.85}>
          <View style={styles.cardIcon}>
            <Ionicons name="globe" size={28} color={ACCENT_SOFT} />
          </View>
          <Text style={styles.cardTitle}>النادي</Text>
          <Text style={styles.cardSub}>انضم للمجتمع</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  card: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: ACCENT_MUTED,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
