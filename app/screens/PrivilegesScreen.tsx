import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";
import { usePrivileges } from "../_contexts/PrivilegesContext";

type Props = {
  onBack: () => void;
};

export default function PrivilegesScreen({ onBack }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { hideWealthMagic, setHideWealthMagic } = usePrivileges();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.accentMuted }]} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={theme.textLight} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t("settings.myPrivileges")}</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t("settings.hideData")}</Text>
        <View style={[styles.row, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.rowLabel, { color: theme.textLight }]}>{t("settings.hideWealthMagic")}</Text>
          <Switch
            value={hideWealthMagic}
            onValueChange={(v) => setHideWealthMagic(v)}
            trackColor={{ false: theme.border, true: "rgba(167, 139, 250, 0.5)" }}
            thumbColor={hideWealthMagic ? theme.accentSoft : "#94a3b8"}
          />
        </View>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
