import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFlagEmoji, getCountryName } from "../../utils/countries";
import { fetchProfileVisitors, fetchFriends, type SocialUser } from "../../utils/socialApi";
import { fetchProfileLikers } from "../../utils/profileLikesApi";
import { API_BASE_URL } from "../../utils/authHelper";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";

function getFullImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/uploads/${url.replace(/^\//, "")}`;
}

type ModeType = "visitors" | "profileLikers";

type Props = {
  mode: ModeType;
  currentUserId: string | undefined;
  onBack: () => void;
  onUserPress?: (user: SocialUser, isFriend: boolean) => void;
};

export default function VisitorsScreen({ mode, currentUserId, onBack, onUserPress }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [visitors, setVisitors] = useState<SocialUser[]>([]);
  const [profileLikers, setProfileLikers] = useState<SocialUser[]>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    const [vList, plList, frList] = await Promise.all([
      fetchProfileVisitors(),
      fetchProfileLikers(currentUserId),
      fetchFriends(),
    ]);
    setVisitors(vList);
    setProfileLikers(plList);
    setFriends(frList);
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const isFriend = (userId: string) => friends.some((f) => f.id === userId);
  const visitorsList = visitors.filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
  const likersList = profileLikers.filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i);

  const renderUserCard = (u: SocialUser) => {
    const friend = isFriend(u.id);
    return (
      <TouchableOpacity
        key={u.id}
        style={[styles.followerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        activeOpacity={0.8}
        onPress={() => onUserPress?.(u, friend)}
      >
        {u.profileImage ? (
          <Image source={{ uri: getFullImageUrl(u.profileImage) }} style={styles.followerAvatar} />
        ) : (
          <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="person" size={24} color={theme.textMuted} />
          </View>
        )}
        <View style={styles.followerInfo}>
          <View style={styles.followerNameRow}>
            <Text style={[styles.followerName, { color: theme.textLight }]}>{u.name}</Text>
            {friend && (
              <View style={styles.friendBadge}>
                <Ionicons name="checkmark-done" size={12} color="#fff" />
                <Text style={styles.friendBadgeText}>{t("social.friends")}</Text>
              </View>
            )}
          </View>
          <View style={styles.followerMeta}>
            {u.location && (
              <View style={styles.followerBadge}>
                <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{u.location}</Text>
              </View>
            )}
            {u.country && (
              <View style={styles.followerBadge}>
                <Text style={styles.followerFlag}>{getFlagEmoji(u.country)}</Text>
                <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{getCountryName(u.country) || u.country}</Text>
              </View>
            )}
            {u.age != null && u.age > 0 && (
              <View style={styles.followerBadge}>
                <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{u.age} {t("social.years")}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-back" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    );
  };

  const currentList = mode === "visitors" ? visitorsList : likersList;
  const emptyKey = mode === "visitors" ? "social.emptyVisitors" : "social.emptyProfileLikers";
  const titleKey = mode === "visitors" ? "me.visitors" : "social.profileLikers";

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color={theme.accentSoft} />
          <Text style={[styles.backText, { color: theme.accentSoft }]}>{t("back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{t(titleKey)}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accentSoft} />
        }
      >
        {currentList.length > 0 ? (
          <View style={styles.followersList}>
            {currentList.map((u) => renderUserCard(u))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={[styles.emptyTitle, { color: theme.textLight }]}>{t("social.emptyTitle")}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>{t(emptyKey)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  content: { padding: 20, flex: 1, gap: 20 },
  statsCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: 24,
    borderRadius: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 14 },
  followersList: {
    marginTop: 16,
    gap: 12,
  },
  followerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 14,
  },
  followerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  followerAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  followerInfo: { flex: 1 },
  followerNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  followerName: { fontSize: 15, fontWeight: "600" },
  friendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#34d399",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  friendBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  followerId: { fontSize: 11, marginTop: 2 },
  followerMeta: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  followerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  followerFlag: { fontSize: 14 },
  followerMetaText: { fontSize: 11 },
});
