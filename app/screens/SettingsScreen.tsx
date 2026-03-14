import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";
import { useAppAlert } from "../../components/AppAlertProvider";
import { deleteAccount } from "../../utils/authHelper";
import type { Lang } from "../../utils/i18n";
import type { ThemeId } from "../../utils/theme";
import { THEMES } from "../../utils/theme";

type Props = {
  onBack: () => void;
  onLogout: () => void;
  onOpenPrivileges?: () => void;
};

const THEME_IDS: ThemeId[] = ["purple", "white", "pink"];

export default function SettingsScreen({ onBack, onLogout, onOpenPrivileges }: Props) {
  const { show } = useAppAlert();
  const { t, lang, setLang } = useLanguage();
  const { themeId, setThemeId, theme } = useTheme();
  const [showThemes, setShowThemes] = useState(false);

  const handleLogout = useCallback(() => {
    show({
      title: t("me.logout"),
      message: t("me.logoutConfirm"),
      type: "warning",
      buttons: [
        { text: t("me.cancel"), style: "cancel" },
        { text: t("me.logout"), style: "destructive", onPress: onLogout },
      ],
    });
  }, [onLogout, show, t]);

  const handleDeleteAccount = useCallback(() => {
    show({
      title: t("settings.deleteAccountConfirm"),
      message: "",
      type: "warning",
      buttons: [
        { text: t("settings.no"), style: "cancel" },
        {
          text: t("settings.yes"),
          style: "destructive",
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) {
              onLogout();
            } else {
              show({
                title: t("settings.error"),
                message: t("settings.deleteFailed"),
                type: "error",
              });
            }
          },
        },
      ],
    });
  }, [onLogout, show, t]);

  const themeLabels: Record<ThemeId, string> = {
    purple: t("settings.themePurple"),
    white: t("settings.themeWhite"),
    pink: t("settings.themePink"),
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.accentMuted }]} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={theme.textLight} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t("settings.title")}</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("selectLanguage")}</Text>
          <View style={styles.langRow}>
            {(["ar", "en"] as Lang[]).map((l) => (
              <TouchableOpacity
                key={l}
                style={[
                  styles.langOption,
                  { backgroundColor: theme.accentMuted },
                  lang === l && { backgroundColor: "rgba(167, 139, 250, 0.35)", borderColor: theme.accentSoft },
                ]}
                onPress={() => setLang(l)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langLabel, { color: theme.textMuted }, lang === l && { color: theme.textLight, fontWeight: "600" }]}>
                  {l === "ar" ? t("arabic") : t("english")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.themeRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setShowThemes(!showThemes)}
          activeOpacity={0.7}
        >
          <Text style={[styles.themeRowLabel, { color: theme.textLight }]}>{t("settings.screenBackgrounds")}</Text>
          <Ionicons name={showThemes ? "chevron-up" : "chevron-forward"} size={16} color={theme.textMuted} />
        </TouchableOpacity>

        {showThemes && (
          <View style={[styles.themeOptions, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {THEME_IDS.map((id) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.accentMuted, borderColor: themeId === id ? theme.accentSoft : "transparent" },
                  themeId === id && styles.themeOptionActive,
                ]}
                onPress={() => setThemeId(id)}
                activeOpacity={0.7}
              >
                <View style={[styles.themeColorDot, { backgroundColor: THEMES[id].bg }]} />
                <Text style={[styles.themeOptionText, { color: themeId === id ? theme.textLight : theme.textMuted }, themeId === id && { fontWeight: "600" }]}>
                  {themeLabels[id]}
                </Text>
                {themeId === id && <Ionicons name="checkmark-circle" size={16} color={theme.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {onOpenPrivileges && (
          <TouchableOpacity
            style={[styles.themeRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={onOpenPrivileges}
            activeOpacity={0.7}
          >
            <Text style={[styles.themeRowLabel, { color: theme.textLight }]}>{t("settings.myPrivileges")}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.deleteAccountCard, { borderColor: "rgba(148, 163, 184, 0.3)" }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={22} color="#94a3b8" />
          <Text style={styles.deleteAccountText}>{t("settings.deleteAccount")}</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#94a3b8" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutCard, { borderColor: "rgba(248, 113, 113, 0.25)" }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color="#f87171" />
          <Text style={styles.logoutText}>{t("me.logout")}</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#f87171" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        <Text style={[styles.hint, { color: theme.textMuted }]}>{t("appOptions")}</Text>
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
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerIcon: { width: 40, height: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langRow: {
    flexDirection: "row",
    gap: 10,
  },
  langOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  langLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  themeRowLabel: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  themeOptions: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  themeOptionActive: {
    borderWidth: 1.5,
  },
  themeColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  themeOptionText: {
    fontSize: 13,
    flex: 1,
    letterSpacing: 0.2,
  },
  deleteAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f87171",
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
  },
});
