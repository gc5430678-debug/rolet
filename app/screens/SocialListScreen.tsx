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
import { fetchFollowers, fetchFriends, fetchFollowing, fetchBlocked, type SocialUser, type BlockedUser } from "../../utils/socialApi";
import { API_BASE_URL } from "../../utils/authHelper";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";

function getFullImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/uploads/${url.replace(/^\//, "")}`;
}

const FRIEND_GREEN = "#34d399";

type Props = {
  type: "admirers" | "following" | "friends" | "blocked";
  currentUserId: string | undefined;
  onBack: () => void;
  onSwitchType: (t: "admirers" | "following" | "friends" | "blocked") => void;
  onAdmirerPress?: (user: SocialUser, isFriend: boolean) => void;
};

const TITLE_KEYS: Record<Props["type"], string> = {
  admirers: "social.admirers",
  following: "social.following",
  friends: "social.friends",
  blocked: "social.blocked",
};

export default function SocialListScreen({ type, currentUserId, onBack, onSwitchType, onAdmirerPress }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const title = t(TITLE_KEYS[type]);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    const [fList, frList, foList, blList] = await Promise.all([
      fetchFollowers(),
      fetchFriends(),
      fetchFollowing(),
      fetchBlocked(),
    ]);
    setFollowers(fList);
    setFriends(frList);
    setFollowing(foList);
    setBlocked(blList);
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
  /** المعجبون = فقط من أضافوني (تابعوني)، مع إزالة التكرار إن وجد */
  const admirersList = followers.filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color={theme.accentSoft} />
          <Text style={[styles.backText, { color: theme.accentSoft }]}>{t("back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textLight }]}>{title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accentSoft} />
        }
      >
        <View style={[styles.statsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("friends")} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{friends.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("social.friends")}</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("following")} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{following.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("social.following")}</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("admirers")} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{admirersList.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("social.admirers")}</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("blocked")} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{blocked.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("social.blockedLabel")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {type === "admirers" && admirersList.length > 0 ? (
          <View style={styles.followersList}>
            {admirersList.map((f) => {
              const friend = isFriend(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.followerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => onAdmirerPress?.(f, friend)}
                >
                  {f.profileImage ? (
                    <Image source={{ uri: getFullImageUrl(f.profileImage) }} style={styles.followerAvatar} />
                  ) : (
                    <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
                      <Ionicons name="person" size={24} color={theme.textMuted} />
                    </View>
                  )}
                  <View style={styles.followerInfo}>
                    <View style={styles.followerNameRow}>
                      <Text style={[styles.followerName, { color: theme.textLight }]}>{f.name}</Text>
                      {friend && (
                        <View style={styles.friendBadge}>
                          <Ionicons name="checkmark-done" size={12} color="#fff" />
                          <Text style={styles.friendBadgeText}>{t("social.friends")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.followerId, { color: theme.textMuted }]}>{f.id}</Text>
                    <View style={styles.followerMeta}>
                      {f.country && (
                        <View style={styles.followerBadge}>
                          <Text style={styles.followerFlag}>{getFlagEmoji(f.country)}</Text>
                          <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{getCountryName(f.country) || f.country}</Text>
                        </View>
                      )}
                      {f.age != null && f.age > 0 && (
                        <View style={styles.followerBadge}>
                          <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{f.age} سنة</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-back" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : type === "following" && following.length > 0 ? (
          <View style={styles.followersList}>
            {following.map((f) => {
              const friend = isFriend(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.followerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => onAdmirerPress?.(f, friend)}
                >
                  {f.profileImage ? (
                    <Image source={{ uri: getFullImageUrl(f.profileImage) }} style={styles.followerAvatar} />
                  ) : (
                    <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
                      <Ionicons name="person" size={24} color={theme.textMuted} />
                    </View>
                  )}
                  <View style={styles.followerInfo}>
                    <View style={styles.followerNameRow}>
                      <Text style={[styles.followerName, { color: theme.textLight }]}>{f.name}</Text>
                      {friend && (
                        <View style={styles.friendBadge}>
                          <Ionicons name="checkmark-done" size={12} color="#fff" />
                          <Text style={styles.friendBadgeText}>{t("social.friends")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.followerId, { color: theme.textMuted }]}>{f.id}</Text>
                    <View style={styles.followerMeta}>
                      {f.country && (
                        <View style={styles.followerBadge}>
                          <Text style={styles.followerFlag}>{getFlagEmoji(f.country)}</Text>
                          <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{getCountryName(f.country) || f.country}</Text>
                        </View>
                      )}
                      {f.age != null && f.age > 0 && (
                        <View style={styles.followerBadge}>
                          <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{f.age} سنة</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-back" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : type === "friends" && friends.length > 0 ? (
          <View style={styles.followersList}>
            {friends.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.followerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                activeOpacity={0.8}
                onPress={() => onAdmirerPress?.(f, true)}
              >
                {f.profileImage ? (
                  <Image source={{ uri: getFullImageUrl(f.profileImage) }} style={styles.followerAvatar} />
                ) : (
                  <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
                    <Ionicons name="person" size={24} color={theme.textMuted} />
                  </View>
                )}
                <View style={styles.followerInfo}>
                  <View style={styles.followerNameRow}>
                    <Text style={[styles.followerName, { color: theme.textLight }]}>{f.name}</Text>
                    <View style={styles.friendBadge}>
                      <Ionicons name="checkmark-done" size={12} color="#fff" />
                      <Text style={styles.friendBadgeText}>{t("social.friends")}</Text>
                    </View>
                  </View>
                  <Text style={[styles.followerId, { color: theme.textMuted }]}>{f.id}</Text>
                  <View style={styles.followerMeta}>
                    {f.country && (
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerFlag}>{getFlagEmoji(f.country)}</Text>
                        <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{getCountryName(f.country) || f.country}</Text>
                      </View>
                    )}
                    {f.age != null && f.age > 0 && (
                      <View style={styles.followerBadge}>
                        <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{f.age} سنة</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : type === "blocked" && blocked.length > 0 ? (
          <View style={styles.followersList}>
            {blocked.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.followerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                activeOpacity={0.8}
                onPress={() => onAdmirerPress?.(b, isFriend(b.id))}
              >
                {b.profileImage ? (
                  <Image source={{ uri: getFullImageUrl(b.profileImage) }} style={styles.followerAvatar} />
                ) : (
                  <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
                    <Ionicons name="person" size={24} color={theme.textMuted} />
                  </View>
                )}
                <View style={styles.followerInfo}>
                  <View style={styles.followerNameRow}>
                    <Text style={[styles.followerName, { color: theme.textLight }]}>{b.name}</Text>
                    <View style={styles.friendBadge}>
                      <Ionicons name="ban-outline" size={12} color="#fff" />
                      <Text style={styles.friendBadgeText}>
                        {b.relation === "blocked"
                          ? t("social.blockedLabel")
                          : b.relation === "blocked_me"
                          ? t("social.blockedYou")
                          : t("social.mutuallyBlocked")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.followerId, { color: theme.textMuted }]}>{b.id}</Text>
                  <View style={styles.followerMeta}>
                    {b.country && (
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerFlag}>{getFlagEmoji(b.country)}</Text>
                        <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{getCountryName(b.country) || b.country}</Text>
                      </View>
                    )}
                    {b.age != null && b.age > 0 && (
                      <View style={styles.followerBadge}>
                        <Text style={[styles.followerMetaText, { color: theme.textMuted }]}>{b.age} {t("social.years")}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={[styles.emptyTitle, { color: theme.textLight }]}>{t("social.emptyTitle")}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              {type === "admirers" && t("social.emptyAdmirers")}
              {type === "following" && t("social.emptyFollowing")}
              {type === "friends" && t("social.emptyFriends")}
              {type === "blocked" && t("social.emptyBlocked")}
            </Text>
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
  followerInfo: { flex: 1, gap: 4 },
  followerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  friendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: FRIEND_GREEN,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  friendBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  followerId: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  followerMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  followerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  followerFlag: { fontSize: 14 },
  followerMetaText: {
    fontSize: 12,
  },
});
