import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Localization from "expo-localization";
import { getFlagEmoji, getCountryName } from "../../utils/countries";
import { fetchFollowers, fetchFriends, fetchFollowing, fetchProfileVisitors } from "../../utils/socialApi";
import { fetchProfileLikers } from "../../utils/profileLikesApi";
import { fetchWallet } from "../../utils/walletApi";
import { useAppAlert } from "../../components/AppAlertProvider";
import { useLanguage } from "../_contexts/LanguageContext";
import { useTheme } from "../_contexts/ThemeContext";
import { usePrivileges } from "../_contexts/PrivilegesContext";

const GOLD = "#facc15";
const ORANGE_FINANCE = "#f59e0b";
const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  android: { elevation: 4 },
});

function getDeviceCountryCode(): string {
  try {
    const locale = Localization.getLocales?.()?.[0] as {
      regionCode?: string;
      countryCode?: string;
    } | undefined;
    const region = locale?.regionCode || locale?.countryCode || "";
    return region ? String(region).toUpperCase().slice(0, 2) : "";
  } catch {
    return "";
  }
}

function ageFromDateOfBirth(dateStr?: string): number | null {
  if (!dateStr) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(5, 7), 10);
  if (isNaN(y) || isNaN(m)) return null;

  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m) age -= 1;
  return age >= 0 ? age : null;
}

type Props = {
  user: {
    id?: string;
    name?: string;
    email: string;
    profileImage?: string;
    age?: number | null;
    dateOfBirth?: string;
    country?: string;
    gender?: string;
  };
  onEditProfile: () => void;
  onOpenMyProfile?: () => void;
  onOpenInfoPage: () => void;
  onOpenTopup: () => void;
  onOpenRevenues: () => void;
  onOpenTaskCenter: () => void;
  onOpenDecorations: () => void;
  onOpenSettings: () => void;
  onOpenAdmirers: () => void;
  onOpenVisitors: () => void;
  onOpenProfileLikers?: () => void;
  onOpenFollowing: () => void;
  onOpenFriends: () => void;
};

export default function MeScreen({ user, onEditProfile, onOpenMyProfile, onOpenInfoPage, onOpenTopup, onOpenRevenues, onOpenTaskCenter, onOpenDecorations, onOpenSettings, onOpenAdmirers, onOpenVisitors, onOpenProfileLikers, onOpenFollowing, onOpenFriends }: Props) {
  const { show } = useAppAlert();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const { hideWealthMagic } = usePrivileges();
  const deviceCountry = getDeviceCountryCode();
  const countryCode = user.country || deviceCountry || "";
  const flag = getFlagEmoji(countryCode);
  const countryName = getCountryName(countryCode, lang);

  const age = user.age ?? ageFromDateOfBirth(user.dateOfBirth);
  const userId = user.id || user.email?.split("@")[0] || "—";
  const profileId = user.id || user.email || "";
  const [admirersCount, setAdmirersCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [profileLikersCount, setProfileLikersCount] = useState(0);
  const [goldBalance, setGoldBalance] = useState<number | null>(null);
  const [chargedGold, setChargedGold] = useState<number | null>(null);
  const [freeGold, setFreeGold] = useState<number | null>(null);
  const [diamondBalance, setDiamondBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!profileId) return;
    fetchFollowers().then((list) => setAdmirersCount(list.length));
    fetchFriends().then((list) => setFriendsCount(list.length));
    fetchFollowing().then((list) => setFollowingCount(list.length));
    fetchProfileVisitors().then((list) => setVisitorsCount(list.length));
    fetchProfileLikers(profileId).then((list) => setProfileLikersCount(list.length));
  }, [profileId]);

  useEffect(() => {
    fetchWallet().then((w) => {
      if (w) {
        setGoldBalance(w.totalGold ?? 0);
        setChargedGold(w.chargedGold ?? 0);
        setFreeGold(w.freeGold ?? 0);
        setDiamondBalance(w.diamonds ?? 0);
      }
    });
  }, []);

  const copyUserId = useCallback(async () => {
    await Clipboard.setStringAsync(String(userId));
    show({ title: t("me.copyId"), message: t("me.copyIdSuccess"), type: "success" });
  }, [userId, show, t]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <View style={styles.infoSection}>
          <TouchableOpacity
            style={[styles.photoWrap, { borderColor: theme.accentSoft }]}
            onPress={onEditProfile}
            activeOpacity={0.8}
          >
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.accentMuted }]}>
                <Ionicons name="person" size={28} color={theme.textMuted} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCol}
            onPress={onOpenMyProfile || onEditProfile}
            activeOpacity={0.8}
          >
            <Text style={[styles.name, { color: theme.textLight }]}>{user.name || t("me.defaultName")}</Text>

            <TouchableOpacity style={styles.idRow} onPress={copyUserId}>
              <Text style={[styles.userId, { color: theme.textMuted }]}>{userId}</Text>
              <Ionicons name="copy-outline" size={12} color={theme.accentSoft} />
            </TouchableOpacity>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
                <Text style={styles.badgeEmoji}>{flag}</Text>
                <Text style={[styles.badgeText, { color: theme.textLight }]}>{countryName || "—"}</Text>
              </View>

              {user.gender && age != null && (
                <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
                  <Text style={[styles.badgeIcon, { color: theme.accentSoft }]}>
                    {user.gender === "male" ? "♂" : "♀"}
                  </Text>
                  <Text style={[styles.badgeText, { color: theme.textLight }]}>{age}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.arrowBtn, { backgroundColor: theme.accentMuted }]} onPress={onOpenMyProfile || onEditProfile}>
                <Ionicons name="chevron-forward" size={20} color={theme.accentSoft} />
        </TouchableOpacity>
      </View>

      {/* الإحصائيات — بطاقة واحدة حديثة */}
      <View style={styles.order}>
        <View style={[styles.statsCard, CARD_SHADOW, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={onOpenFriends} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{friendsCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("me.friends")}</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={onOpenFollowing} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("me.following")}</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={onOpenAdmirers} activeOpacity={0.7}>
              <Text style={[styles.statNumber, { color: theme.textLight }]}>{admirersCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{t("me.admirers")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* الشحن والإيرادات — تُخفى عند تفعيل إخفاء ثروة وسحر */}
        {!hideWealthMagic && (
        <View style={styles.financeRow}>
          <TouchableOpacity
            style={[styles.financeCard, CARD_SHADOW]}
            activeOpacity={0.85}
            onPress={onOpenTopup}
          >
            <View style={styles.financeCardInner}>
              <View>
                <Ionicons name="cash-outline" size={20} color="#fff7ed" />
                <Text style={styles.financeLabel}>{t("me.topup")}</Text>
                <Text style={styles.financeBalance}>{goldBalance != null ? `${goldBalance} 🪙` : "—"}</Text>
                <Text style={styles.financeSub}>{chargedGold != null && freeGold != null ? `${t("me.charged")} ${chargedGold} · ${t("me.free")} ${freeGold}` : ""}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#fff7ed" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.financeCardPurple, CARD_SHADOW]} activeOpacity={0.85} onPress={onOpenRevenues}>
            <View style={styles.financeCardInner}>
              <View>
                <Ionicons name="wallet-outline" size={20} color={GOLD} />
                <Text style={styles.financeLabel}>{t("me.revenues")}</Text>
                <Text style={styles.financeBalance}>{diamondBalance != null ? `${Number(diamondBalance).toFixed(2)} 💎` : "—"}</Text>
                <Text style={styles.financeSub}>{t("me.diamondsHint")}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={theme.textLight} />
            </View>
          </TouchableOpacity>
        </View>
        )}

        {/* الأقسام الجديدة تحت شحن وإيرادات */}
        <View style={styles.newSections}>
            {[
            { titleKey: "me.taskCenter", icon: "list", onPress: onOpenTaskCenter },
            { titleKey: "me.decorations", icon: "color-palette", onPress: onOpenDecorations },
            { titleKey: "me.visitors", icon: "people", onPress: onOpenVisitors, badge: visitorsCount > 0 ? visitorsCount : undefined },
            { titleKey: "social.profileLikers", icon: "heart", onPress: onOpenProfileLikers, badge: profileLikersCount > 0 ? profileLikersCount : undefined },
            { titleKey: "me.howToUse", icon: "help-circle", onPress: undefined },
            { titleKey: "settings.title", icon: "settings", onPress: onOpenSettings },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={[styles.newSectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={item.onPress} activeOpacity={item.onPress ? 0.7 : 1} disabled={!item.onPress}>
              <View style={styles.newSectionRow}>
                <Ionicons name={item.icon as any} size={20} color={theme.accentSoft} />
                <Text style={[styles.newSectionText, { color: theme.textLight }]}>{t(item.titleKey)}</Text>
                {"badge" in item && item.badge && item.badge > 0 && (
                  <View style={[styles.visitorsBadge, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.visitorsBadgeText, { color: theme.bg }]}>{item.badge > 99 ? "99+" : item.badge}</Text>
                  </View>
                )}
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={theme.accentSoft}
                  style={{ marginLeft: "auto" }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 40 },
  content: { padding: 16 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  infoSection: { flex: 1, flexDirection: "row", gap: 14 },

  photoWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
  },

  avatar: { width: "100%", height: "100%" },

  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  infoCol: { flex: 1, gap: 6 },

  name: { fontSize: 15, fontWeight: "600", letterSpacing: 0.2 },

  idRow: { flexDirection: "row", gap: 6 },

  userId: { fontSize: 11, letterSpacing: 0.3, opacity: 0.9 },

  badgesRow: { flexDirection: "row", gap: 8, marginTop: 4 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  badgeEmoji: { fontSize: 12 },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 10, letterSpacing: 0.2 },

  order: { marginTop: 22 },

  statsCard: {
    borderRadius: 18,
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
    height: 22,
    borderRadius: 1,
  },

  statNumber: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  statLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.2,
  },

  financeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    alignItems: "center",
  },

  financeCard: {
    flex: 1,
    backgroundColor: ORANGE_FINANCE,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: "center",
  },

  financeCardPurple: {
    flex: 1,
    backgroundColor: "#A855F7",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: "center",
  },

  financeCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  financeLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#f5f3ff",
    letterSpacing: 0.2,
  },
  financeBalance: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.3,
  },
  financeSub: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.15,
  },

  newSections: {
    marginTop: 20,
    gap: 10,
  },

  newSectionCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    ...CARD_SHADOW,
  },

  newSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  newSectionText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.25,
  },

  visitorsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: "center",
  },
  visitorsBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});