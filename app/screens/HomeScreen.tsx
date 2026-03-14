import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";

const CARD_WIDTH = 160;
const CARD_GAP = 14;

type Props = {
  userName: string;
  onNavigate: (tab: string) => void;
  onOpenSearch: () => void;
};

export default function HomeScreen({ userName, onNavigate, onOpenSearch }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.textLight }]}>مرحباً، {userName || "صديقي"}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>استكشف التطبيق من هنا</Text>

      {/* شريط بحث — عند الضغط يفتح صفحة البحث */}
      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
        onPress={onOpenSearch}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
        <Text style={[styles.searchPlaceholder, { color: theme.textMuted }]}>{t("search.placeholder")}</Text>
        <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
      </TouchableOpacity>

      {/* البطاقات أفقياً */}
      <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{t("home.choose")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => onNavigate("moment")}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="sparkles" size={28} color={theme.accentSoft} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.textLight }]}>{t("home.myMoments")}</Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>{t("home.shareMoments")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => onNavigate("messages")}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="chatbubble-ellipses" size={28} color={theme.accentSoft} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.textLight }]}>{t("messages.title")}</Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>{t("home.connect")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => onNavigate("club")}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="globe" size={28} color={theme.accentSoft} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.textLight }]}>{t("home.club")}</Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>{t("home.joinClub")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchIcon: { marginLeft: 8 },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: "row",
    gap: CARD_GAP,
    paddingVertical: 4,
  },
  card: {
    width: CARD_WIDTH,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
  },
});
