import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";

type TabId = "frames" | "bubbles" | "room" | "entrance";

type Props = {
  onBack: () => void;
};

export default function DecorationsScreen({ onBack }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("bubbles");

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: "frames", labelKey: "decorations.frames" },
    { id: "bubbles", labelKey: "decorations.bubbles" },
    { id: "room", labelKey: "decorations.room" },
    { id: "entrance", labelKey: "decorations.entrance" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.accentMuted }]} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={theme.textLight} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t("decorations.title")}</Text>
        <View style={styles.headerIcon} />
      </View>

      {/* تبويبات جنب بعض — كتابات صغيرة ومرتبة */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, { backgroundColor: theme.accentMuted }, activeTab === tab.id && { borderWidth: 1, borderColor: theme.accentSoft }]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: theme.textMuted }, activeTab === tab.id && { color: theme.textLight, fontWeight: "600" }]} numberOfLines={2}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* المحتوى — يتبدل حسب التبويب في نفس الصفحة */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "frames" && (
          <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{t("decorations.frames")}</Text>
            <Text style={[styles.placeholderText, { color: theme.textMuted }]}>{t("decorations.selectFrame")}</Text>
            <View style={styles.placeholderGrid}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.placeholderCard, { backgroundColor: theme.cardBg }]}>
                  <Ionicons name="square" size={28} color={theme.accentSoft} />
                  <Text style={[styles.placeholderLabel, { color: theme.textLight }]}>{t("decorations.frameN")} {i}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "bubbles" && (
          <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{t("decorations.bubbles")}</Text>
            <Text style={[styles.placeholderText, { color: theme.textMuted }]}>{t("decorations.selectBubble")}</Text>
            <View style={styles.placeholderGrid}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.placeholderCard, { backgroundColor: theme.cardBg }]}>
                  <Ionicons name="chatbubble" size={28} color={theme.accentSoft} />
                  <Text style={[styles.placeholderLabel, { color: theme.textLight }]}>{t("decorations.bubbleN")} {i}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "room" && (
          <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{t("decorations.room")}</Text>
            <Text style={[styles.placeholderText, { color: theme.textMuted }]}>{t("decorations.selectRoom")}</Text>
            <View style={styles.placeholderGrid}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.placeholderCard, { backgroundColor: theme.cardBg }]}>
                  <Ionicons name="image" size={28} color={theme.accentSoft} />
                  <Text style={[styles.placeholderLabel, { color: theme.textLight }]}>{t("decorations.roomN")} {i}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "entrance" && (
          <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: theme.textLight }]}>{t("decorations.entrance")}</Text>
            <Text style={[styles.placeholderText, { color: theme.textMuted }]}>{t("decorations.selectEntrance")}</Text>
            <View style={styles.placeholderGrid}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.placeholderCard, { backgroundColor: theme.cardBg }]}>
                  <Ionicons name="sparkles" size={28} color={theme.accentSoft} />
                  <Text style={[styles.placeholderLabel, { color: theme.textLight }]}>{t("decorations.entranceN")} {i}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerIcon: { width: 40, height: 40 },

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  contentSection: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderText: {
    fontSize: 13,
    marginBottom: 8,
  },
  placeholderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  placeholderCard: {
    width: "30%",
    minWidth: 90,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderLabel: {
    fontSize: 11,
  },
});
