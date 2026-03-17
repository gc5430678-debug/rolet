import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { searchUsersById, type UserSearchResult } from "../../utils/usersApi";
import { fetchOnlineUserIds } from "../../utils/messagesApi";
import { getFlagEmoji, getCountryName } from "../../utils/countries";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";

type Props = {
  onBack: () => void;
  onUserPress: (user: UserSearchResult) => void;
};

export default function SearchScreen({ onBack, onUserPress }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = () => fetchOnlineUserIds().then((ids) => setOnlineIds(new Set(ids)));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const users = await searchUsersById(q);
      setSearchResults(users);
      if (users.length === 0) setSearchError(t("search.noResults"));
    } catch {
      setSearchError(t("search.error"));
    } finally {
      setSearching(false);
    }
  }, [searchQuery, t]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color={theme.accentSoft} />
          <Text style={[styles.backText, { color: theme.accentSoft }]}>{t("back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t("search.byId")}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* شريط بحث مع زر البحث بداخله */}
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.searchBtnInside, { backgroundColor: theme.accent }]}
            onPress={handleSearch}
            activeOpacity={0.85}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: theme.textLight }]}
            placeholder="ابحث بالمعرف..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setSearchError(null);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            editable={!searching}
          />
        </View>

        {/* نتائج البحث */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsTitle, { color: theme.textLight }]}>نتائج البحث ({searchResults.length})</Text>
            {searchResults.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.userRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                activeOpacity={0.85}
                onPress={() => onUserPress(u)}
              >
                <View style={styles.avatarWrap}>
                  {u.profileImage ? (
                    <Image source={{ uri: u.profileImage }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, styles.userAvatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
                      <Ionicons name="person" size={24} color={theme.textMuted} />
                    </View>
                  )}
                  {u.id && onlineIds.has(u.id) && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.textLight }]} numberOfLines={1}>
                    {u.name}
                  </Text>
                  <Text style={[styles.userId, { color: theme.textMuted }]}>{u.id}</Text>
                  <View style={styles.badgesRow}>
                    {u.country && (
                      <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
                        <Text style={styles.badgeEmoji}>{getFlagEmoji(u.country)}</Text>
                        <Text style={[styles.badgeText, { color: theme.textLight }]}>{getCountryName(u.country) || "—"}</Text>
                      </View>
                    )}
                    {(u.gender || u.age != null) && (
                      <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
                        <Text style={[styles.badgeIcon, { color: theme.accentSoft }]}>
                          {u.gender === "male" ? "♂" : u.gender === "female" ? "♀" : "—"}
                        </Text>
                        <Text style={[styles.badgeText, { color: theme.textLight }]}>{u.age != null ? String(u.age) : "—"}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchError && !searching && (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={24} color={theme.textMuted} />
            <Text style={[styles.errorText, { color: theme.textMuted }]}>{searchError}</Text>
          </View>
        )}

        {!searchQuery.trim() && searchResults.length === 0 && !searchError && (
          <View style={styles.emptyWrap}>
            <Ionicons name="search" size={48} color={theme.textMuted} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>أدخل المعرف للبحث عن المستخدمين المسجلين</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "ios" ? 40 : 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 12,
  },
  backText: { fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 24,
  },
  searchBtnInside: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    textAlign: "right",
  },
  resultsSection: { marginBottom: 24 },
  resultsTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  avatarWrap: {
    position: "relative",
    marginLeft: 12,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#1a1625",
  },
  userAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  userId: { fontSize: 12, marginBottom: 8 },
  badgesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeEmoji: { fontSize: 14 },
  badgeIcon: { fontSize: 14 },
  badgeText: { fontSize: 11 },
  errorWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  errorText: { fontSize: 14 },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 14, marginTop: 16, textAlign: "center" },
});
