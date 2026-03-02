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

function getFullImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/uploads/${url.replace(/^\//, "")}`;
}

const PURPLE_DARK = "#1a1625";
const ACCENT_SOFT = "#c4b5fd";
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const CARD_BG = "rgba(45, 38, 64, 0.6)";
const BORDER_SOFT = "rgba(167, 139, 250, 0.2)";
const FRIEND_GREEN = "#34d399";

type Props = {
  type: "admirers" | "following" | "friends" | "blocked";
  currentUserId: string | undefined;
  onBack: () => void;
  onSwitchType: (t: "admirers" | "following" | "friends" | "blocked") => void;
  onAdmirerPress?: (user: SocialUser, isFriend: boolean) => void;
};

const TITLES = {
  admirers: "المعجبون",
  following: "أتابع",
  friends: "صديق",
  blocked: "قائمة الحظر",
};

export default function SocialListScreen({ type, currentUserId, onBack, onSwitchType, onAdmirerPress }: Props) {
  const title = TITLES[type];
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color={ACCENT_SOFT} />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_SOFT} />
        }
      >
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("friends")} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{friends.length}</Text>
              <Text style={styles.statLabel}>صديق</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("following")} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{following.length}</Text>
              <Text style={styles.statLabel}>أتابع</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("admirers")} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{followers.length}</Text>
              <Text style={styles.statLabel}>معجب</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => onSwitchType("blocked")} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{blocked.length}</Text>
              <Text style={styles.statLabel}>محظور</Text>
            </TouchableOpacity>
          </View>
        </View>

        {type === "admirers" && followers.length > 0 ? (
          <View style={styles.followersList}>
            {followers.map((f) => {
              const friend = isFriend(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={styles.followerCard}
                  activeOpacity={0.8}
                  onPress={() => onAdmirerPress?.(f, friend)}
                >
                  {f.profileImage ? (
                    <Image source={{ uri: getFullImageUrl(f.profileImage) }} style={styles.followerAvatar} />
                  ) : (
                    <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder]}>
                      <Ionicons name="person" size={24} color={TEXT_MUTED} />
                    </View>
                  )}
                  <View style={styles.followerInfo}>
                    <View style={styles.followerNameRow}>
                      <Text style={styles.followerName}>{f.name}</Text>
                      {friend && (
                        <View style={styles.friendBadge}>
                          <Ionicons name="checkmark-done" size={12} color="#fff" />
                          <Text style={styles.friendBadgeText}>صديق</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.followerId}>{f.id}</Text>
                    <View style={styles.followerMeta}>
                      {f.country && (
                        <View style={styles.followerBadge}>
                          <Text style={styles.followerFlag}>{getFlagEmoji(f.country)}</Text>
                          <Text style={styles.followerMetaText}>{getCountryName(f.country) || f.country}</Text>
                        </View>
                      )}
                      {f.age != null && f.age > 0 && (
                        <View style={styles.followerBadge}>
                          <Text style={styles.followerMetaText}>{f.age} سنة</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
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
                  style={styles.followerCard}
                  activeOpacity={0.8}
                  onPress={() => onAdmirerPress?.(f, friend)}
                >
                  {f.profileImage ? (
                    <Image source={{ uri: getFullImageUrl(f.profileImage) }} style={styles.followerAvatar} />
                  ) : (
                    <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder]}>
                      <Ionicons name="person" size={24} color={TEXT_MUTED} />
                    </View>
                  )}
                  <View style={styles.followerInfo}>
                    <View style={styles.followerNameRow}>
                      <Text style={styles.followerName}>{f.name}</Text>
                      {friend && (
                        <View style={styles.friendBadge}>
                          <Ionicons name="checkmark-done" size={12} color="#fff" />
                          <Text style={styles.friendBadgeText}>صديق</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.followerId}>{f.id}</Text>
                    <View style={styles.followerMeta}>
                      {f.country && (
                        <View style={styles.followerBadge}>
                          <Text style={styles.followerFlag}>{getFlagEmoji(f.country)}</Text>
                          <Text style={styles.followerMetaText}>{getCountryName(f.country) || f.country}</Text>
                        </View>
                      )}
                      {f.age != null && f.age > 0 && (
                        <View style={styles.followerBadge}>
                          <Text style={styles.followerMetaText}>{f.age} سنة</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : type === "friends" && friends.length > 0 ? (
          <View style={styles.followersList}>
            {friends.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.followerCard}
                activeOpacity={0.8}
                onPress={() => onAdmirerPress?.(f, true)}
              >
                {f.profileImage ? (
                  <Image source={{ uri: getFullImageUrl(f.profileImage) }} style={styles.followerAvatar} />
                ) : (
                  <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder]}>
                    <Ionicons name="person" size={24} color={TEXT_MUTED} />
                  </View>
                )}
                <View style={styles.followerInfo}>
                  <View style={styles.followerNameRow}>
                    <Text style={styles.followerName}>{f.name}</Text>
                    <View style={styles.friendBadge}>
                      <Ionicons name="checkmark-done" size={12} color="#fff" />
                      <Text style={styles.friendBadgeText}>صديق</Text>
                    </View>
                  </View>
                  <Text style={styles.followerId}>{f.id}</Text>
                  <View style={styles.followerMeta}>
                    {f.country && (
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerFlag}>{getFlagEmoji(f.country)}</Text>
                        <Text style={styles.followerMetaText}>{getCountryName(f.country) || f.country}</Text>
                      </View>
                    )}
                    {f.age != null && f.age > 0 && (
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerMetaText}>{f.age} سنة</Text>
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
                style={styles.followerCard}
                activeOpacity={0.8}
                onPress={() => onAdmirerPress?.(b, isFriend(b.id))}
              >
                {b.profileImage ? (
                  <Image source={{ uri: getFullImageUrl(b.profileImage) }} style={styles.followerAvatar} />
                ) : (
                  <View style={[styles.followerAvatar, styles.followerAvatarPlaceholder]}>
                    <Ionicons name="person" size={24} color={TEXT_MUTED} />
                  </View>
                )}
                <View style={styles.followerInfo}>
                  <View style={styles.followerNameRow}>
                    <Text style={styles.followerName}>{b.name}</Text>
                    <View style={styles.friendBadge}>
                      <Ionicons name="ban-outline" size={12} color="#fff" />
                      <Text style={styles.friendBadgeText}>
                        {b.relation === "blocked"
                          ? "محظور"
                          : b.relation === "blocked_me"
                          ? "قام بحظرك"
                          : "محظور متبادل"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.followerId}>{b.id}</Text>
                  <View style={styles.followerMeta}>
                    {b.country && (
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerFlag}>{getFlagEmoji(b.country)}</Text>
                        <Text style={styles.followerMetaText}>{getCountryName(b.country) || b.country}</Text>
                      </View>
                    )}
                    {b.age != null && b.age > 0 && (
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerMetaText}>{b.age} سنة</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyTitle}>لا يوجد أحد بعد</Text>
            <Text style={styles.emptySub}>
              {type === "admirers" && "لم يتابعك أحد بعد"}
              {type === "following" && "لم تتابع أحداً بعد"}
              {type === "friends" && "لم تضف أصدقاء بعد"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PURPLE_DARK, paddingTop: Platform.OS === "ios" ? 40 : 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167, 139, 250, 0.12)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
   marginRight: 12,
  },
  backText: { fontSize: 15, fontWeight: "600", color: ACCENT_SOFT },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT_LIGHT, flex: 1, textAlign: "center" },
  scroll: { flex: 1 },
  content: { padding: 20, flex: 1, gap: 20 },
  statsCard: {
    backgroundColor: "rgba(45, 38, 64, 0.6)",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.12)",
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
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderRadius: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_LIGHT,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: TEXT_LIGHT, marginBottom: 8 },
  emptySub: { fontSize: 14, color: TEXT_MUTED },
  followersList: {
    marginTop: 16,
    gap: 12,
  },
  followerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    gap: 14,
  },
  followerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  followerAvatarPlaceholder: {
    backgroundColor: "rgba(167, 139, 250, 0.2)",
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
    color: TEXT_LIGHT,
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
    color: TEXT_MUTED,
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
    color: TEXT_MUTED,
  },
});
