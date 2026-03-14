import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import * as Clipboard from "expo-clipboard";
import { getFlagEmoji, getCountryName } from "../../utils/countries";
import { useLanguage } from "../_contexts/LanguageContext";
import { translations } from "../../utils/i18n";
import { API_BASE_URL } from "../../utils/authHelper";
import { fetchMoments, toggleMomentLike, type Moment } from "../../utils/momentsApi";
import { searchUsersById, type UserSearchResult } from "../../utils/usersApi";
import { sendMessage, buildSenderForNotification } from "../../utils/messagesApi";
import { fetchWallet } from "../../utils/walletApi";
import { GiftModal, type GiftKey } from "../../components/GiftModal";
import { followUser, unfollowUser, isFollowing, acceptFriendRequest, blockUser, unblockUser, fetchBlocked, recordProfileVisit } from "../../utils/socialApi";
import { fetchProfileLikes, likeProfile } from "../../utils/profileLikesApi";
import {
  setLocalAddFriendClaimedAt,
  getLocalAddFriendSecondsUntilClaim,
  claimAddFriendBonus,
} from "../../utils/tasksApi";
import { useAppAlert } from "../../components/AppAlertProvider";
import { usePrivileges } from "../_contexts/PrivilegesContext";

function getFullMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/uploads/${url.replace(/^\//, "")}`;
}

const ACCENT_SOFT = "#c4b5fd";
const ACCENT_MUTED = "rgba(167, 139, 250, 0.25)";
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const CARD_BG = "rgba(45, 38, 64, 0.6)";
const BORDER_SOFT = "rgba(167, 139, 250, 0.2)";
const HEART_COLOR = "#f472b6";
const ADD_COLOR = "#34d399";
const MESSAGE_COLOR = "#60a5fa";
const GIFT_COLOR = "#fbbf24";
const PINK_BG = "rgba(244,114,182,0.25)";
const BLUE_BG = "rgba(96,165,250,0.25)";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(SCREEN_WIDTH - 32, 340);
const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  android: { elevation: 4 },
});

function formatRelativeTime(input: string | Date | null | undefined, lang: "ar" | "en"): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const tr = translations[lang].userProfile;
  if (diffSec < 60) return tr.agoMoments;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return tr.agoMin.replace("{n}", String(diffMin));
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return tr.agoHour.replace("{n}", String(diffHours));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return tr.agoDay.replace("{n}", String(diffDays));
  return new Date(input).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
}

type CurrentUser = {
  id?: string;
  name?: string;
  profileImage?: string;
  age?: number | null;
  country?: string;
  gender?: string;
};

type Props = {
  user: UserSearchResult;
  currentUser: CurrentUser | null;
  onBack: () => void;
  fromAdmirers?: boolean;
  isFriend?: boolean;
  onAcceptFriend?: () => void;
  onOpenChat?: (user: UserSearchResult) => void;
  onWalletUpdate?: () => void;
  onOpenTopup?: () => void;
};

export default function UserProfileScreen({ user, currentUser, onBack, fromAdmirers, isFriend, onAcceptFriend, onOpenChat, onWalletUpdate, onOpenTopup }: Props) {
  const { show } = useAppAlert();
  const { t, lang } = useLanguage();
  const { hideWealthMagic } = usePrivileges();
  const [copied, setCopied] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [acceptedAsFriend, setAcceptedAsFriend] = useState(isFriend ?? false);
  const [accepting, setAccepting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "moment">("info");
  const [moments, setMoments] = useState<Moment[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);
  const [momentsError, setMomentsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mediaModal, setMediaModal] = useState<Moment | null>(null);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [bonusModal, setBonusModal] = useState<{ reward: number } | null>(null);
  const visitRecordedRef = useRef(false);
  const [displayUser, setDisplayUser] = useState<UserSearchResult>(user);
  const scrollRef = useRef<ScrollView | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [goldBalance, setGoldBalance] = useState(0);
  const [chargedGold, setChargedGold] = useState(0);
  const [freeGold, setFreeGold] = useState(0);
  const [profileLikeCount, setProfileLikeCount] = useState(0);
  const [profileLikedByMe, setProfileLikedByMe] = useState(false);
  const [likeToast, setLikeToast] = useState<string | null>(null);

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  useEffect(() => {
    fetchProfileLikes(user.id).then((r) => {
      if (r) {
        setProfileLikeCount(r.likeCount);
        setProfileLikedByMe(r.likedByMe);
      }
    });
  }, [user.id]);

  useEffect(() => {
    const missing = user.age == null || !user.country || !user.gender;
    if (!missing) return;
    const uid = user.id;
    searchUsersById(uid).then((users) => {
      const found = users.find((u) => u.id === uid);
      if (found) {
        setDisplayUser((prev) => prev.id === uid ? { ...prev, age: found.age ?? prev.age, country: found.country || prev.country, gender: found.gender || prev.gender } : prev);
      }
    });
  }, [user]);

  const copyId = async () => {
    await Clipboard.setStringAsync(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadMoments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setMomentsLoading(true);
    setMomentsError(null);
    try {
      const list = await fetchMoments();
      setMoments(list.filter((m) => m.userId === user.id));
    } catch {
      setMomentsError(t("userProfile.momentsLoadError"));
      setMoments([]);
    } finally {
      setMomentsLoading(false);
      setRefreshing(false);
    }
  }, [user.id, t]);

  useEffect(() => {
    if (activeTab === "moment") loadMoments();
  }, [activeTab, loadMoments]);

  useEffect(() => {
    if (!currentUser?.id) return;
    isFollowing(user.id).then(setIsFollowed);
  }, [user.id, currentUser?.id]);

  useEffect(() => {
    visitRecordedRef.current = false;
  }, [user.id]);

  useEffect(() => {
    if (!currentUser?.id || currentUser.id === user.id || visitRecordedRef.current) return;
    visitRecordedRef.current = true;
    recordProfileVisit(user.id);
  }, [user.id, currentUser?.id]);

  useEffect(() => {
    fetchBlocked().then((list) => {
      const blockedByMe = list.find(
        (b) => b.id === user.id && (b.relation === "blocked" || b.relation === "mutual")
      );
      const blockedMeUser = list.find(
        (b) => b.id === user.id && (b.relation === "blocked_me" || b.relation === "mutual")
      );
      setIsBlocked(!!blockedByMe);
      setBlockedMe(!!blockedMeUser);
    });
  }, [user.id]);

  useEffect(() => {
    setAcceptedAsFriend(isFriend ?? false);
  }, [isFriend]);

  const handleFollowToggle = useCallback(async () => {
    if (!currentUser?.id) return;
    if (currentUser.id === user.id) return;
    if (blockedMe) {
      show({
        title: t("userProfile.cannotAdd"),
        message: t("userProfile.blockedByUser").replace("{name}", user.name).replace("{id}", user.id),
        type: "error",
      });
      return;
    }
    if (isFollowed) {
      const ok = await unfollowUser(user.id);
      if (ok) {
        setIsFollowed(false);
        // عند إلغاء المتابعة نرجع زر \"قبول طلب\" لوضعه الطبيعي
        setAcceptedAsFriend(false);
      } else {
        show({
          title: t("userProfile.requestTimeout"),
          message: t("userProfile.requestFailed"),
          type: "error",
        });
      }
    } else {
      const ok = await followUser(user.id);
      if (ok) {
        setIsFollowed(true);
        const secsLeft = await getLocalAddFriendSecondsUntilClaim();
        if (secsLeft === null || secsLeft === 0) {
          await setLocalAddFriendClaimedAt(Date.now());
          setBonusModal({ reward: 25 });
          claimAddFriendBonus().then(() => onWalletUpdate?.());
        }
      } else {
        show({
          title: t("userProfile.requestTimeout"),
          message: t("userProfile.requestFailed"),
          type: "error",
        });
      }
    }
  }, [currentUser, user.id, isFollowed, blockedMe, show, user.name, onWalletUpdate, t]);

  const handleAcceptFriend = useCallback(async () => {
    if (accepting || acceptedAsFriend) return;
    setAccepting(true);
    const ok = await acceptFriendRequest(user.id);
    setAccepting(false);
    if (ok) {
      setAcceptedAsFriend(true);
      onAcceptFriend?.();
      const secsLeft = await getLocalAddFriendSecondsUntilClaim();
      if (secsLeft === null || secsLeft === 0) {
        await setLocalAddFriendClaimedAt(Date.now());
        setBonusModal({ reward: 25 });
        claimAddFriendBonus().then(() => onWalletUpdate?.());
      }
    }
  }, [user.id, accepting, acceptedAsFriend, onAcceptFriend, onWalletUpdate]);

  const handleLike = useCallback(async (moment: Moment) => {
    const res = await toggleMomentLike(moment.id);
    if (res)
      setMoments((prev) =>
        prev.map((m) => (m.id === moment.id ? { ...m, likeCount: res.likeCount, likedByMe: res.likedByMe } : m))
      );
  }, []);

  const genderColor = displayUser.gender === "female" ? "#f472b6" : displayUser.gender === "male" ? "#60a5fa" : ACCENT_SOFT;

  useEffect(() => {
    if (showGiftModal) {
      fetchWallet().then((w) => {
        if (w) {
          setGoldBalance(w.totalGold ?? 0);
          setChargedGold(w.chargedGold ?? 0);
          setFreeGold(w.freeGold ?? 0);
        }
      });
    }
  }, [showGiftModal]);

  const handleLikeProfile = useCallback(async () => {
    if (profileLikedByMe) {
      setLikeToast(t("userProfile.alreadyLiked"));
      setTimeout(() => setLikeToast(null), 2000);
      return;
    }
    const res = await likeProfile(user.id);
    if (res.success) {
      setProfileLikedByMe(true);
      if (res.alreadyLiked) {
        setLikeToast(t("userProfile.alreadyLiked"));
      } else {
        setProfileLikeCount((c) => (res.likeCount != null ? res.likeCount : c + 1));
        setLikeToast(t("userProfile.likedSuccess"));
      }
      setTimeout(() => setLikeToast(null), 2000);
    }
  }, [user.id, profileLikedByMe, t]);

  const handleOpenGiftProfile = useCallback(() => {
    if (currentUser?.id === user.id) {
      setActiveTab("info");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } else {
      setShowGiftModal(true);
    }
  }, [currentUser?.id, user.id]);

  const handleSendGift = useCallback(
    async (giftKey: GiftKey, amount: number, quantity: number) => {
      if (!currentUser?.id || currentUser.id === user.id) return;
      if (goldBalance < amount) {
        setShowGiftModal(false);
        onOpenTopup?.();
        return;
      }
      const text = `GIFT:${giftKey}:${amount}`;
      const result = await sendMessage(
        user.id,
        text,
        null,
        null,
        null,
        null,
        null,
        buildSenderForNotification(currentUser ? { name: currentUser.name, profileImage: currentUser.profileImage } : null),
        amount
      );
      if (result) {
        onWalletUpdate?.();
        onOpenChat?.(user);
      }
    },
    [currentUser, user, goldBalance, onWalletUpdate, onOpenChat, onOpenTopup]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color={ACCENT_SOFT} />
          <Text style={styles.backText}>{t("userProfile.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("userProfile.title")}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => activeTab === "moment" && loadMoments(true)}
            tintColor={ACCENT_SOFT}
          />
        }
      >
        {/* صورة شخصية مربعة مع إطار — معلومات داخل الصورة أسفل يسار + زر خيارات أعلى اليسار */}
        <View style={styles.profileImageWrap}>
          <View style={styles.moreBtnWrap}>
            <TouchableOpacity
              style={styles.moreBtn}
              activeOpacity={0.8}
              onPress={() => setMoreMenuVisible(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={TEXT_LIGHT} />
            </TouchableOpacity>
          </View>
          <View style={styles.likeBadgeWrap}>
            <Ionicons name="heart" size={12} color="#6B4423" />
            <Text style={styles.likeBadgeCount}>{profileLikeCount}</Text>
          </View>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Ionicons name="person" size={100} color={TEXT_MUTED} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageOverlay}
          >
            <View style={styles.overlayContent}>
              {/* اسم + عمر + أيقونة ذكر/أنثى + علم دولة + اسمها — من الباك اند (أنا وأي مستخدم) */}
              <View style={styles.nameRow}>
                <Text style={styles.overlayName}>{displayUser.name}</Text>
                {displayUser.age != null && (
                  <Text style={[styles.ageText, { color: genderColor }]}>{displayUser.age}</Text>
                )}
                {(displayUser.gender === "male" || displayUser.gender === "female") && (
                  <Ionicons
                    name={displayUser.gender === "female" ? "female" : "male"}
                    size={14}
                    color={genderColor}
                  />
                )}
                {displayUser.country && (
                  <>
                    <Text style={styles.flagEmoji}>{getFlagEmoji(displayUser.country)}</Text>
                    <Text style={styles.flagText} numberOfLines={1}>
                      {getCountryName(displayUser.country, lang) || displayUser.country}
                    </Text>
                  </>
                )}
              </View>
              <TouchableOpacity style={styles.idRow} onPress={copyId} activeOpacity={0.8}>
                <Text style={styles.overlayId}>{user.id}</Text>
                <Ionicons
                  name={copied ? "checkmark-circle" : "copy-outline"}
                  size={16}
                  color={copied ? "#34d399" : TEXT_MUTED}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* تبويبان: معلومات | لحظة — كتابة صغيرة وجذابة */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "info" && styles.tabActive]}
            onPress={() => setActiveTab("info")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={14} color={activeTab === "info" ? "#0f172a" : TEXT_MUTED} />
            <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>{t("userProfile.info")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "moment" && styles.tabActive]}
            onPress={() => setActiveTab("moment")}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles-outline" size={14} color={activeTab === "moment" ? "#0f172a" : TEXT_MUTED} />
            <Text style={[styles.tabText, activeTab === "moment" && styles.tabTextActive]}>{t("userProfile.moment")}</Text>
          </TouchableOpacity>
        </View>

        {/* المحتوى حسب التبويب */}
        {activeTab === "info" ? (
          <View style={styles.infoContent}>
            {/* ليفل + قيمة سحر + سحر ثروة — أولاً بجنب بعض */}
            {!hideWealthMagic && (
            <View style={[styles.statsInfoCard, CARD_SHADOW]}>
              <View style={styles.statsInfoRow}>
                <View style={styles.statsInfoItem}>
                  <Ionicons name="trophy-outline" size={14} color="#fbbf24" />
                  <Text style={styles.statsInfoLabel}>{t("userProfile.level")}</Text>
                  <Text style={styles.statsInfoValue}>0</Text>
                </View>
                <View style={styles.statsInfoItem}>
                  <Ionicons name="diamond-outline" size={14} color="#f472b6" />
                  <Text style={styles.statsInfoLabel}>{t("userProfile.magicValue")}</Text>
                  <Text style={styles.statsInfoValue}>0</Text>
                </View>
                <View style={styles.statsInfoItem}>
                  <Ionicons name="diamond-outline" size={14} color="#60a5fa" />
                  <Text style={styles.statsInfoLabel}>{t("userProfile.wealthMagic")}</Text>
                  <Text style={styles.statsInfoValue}>0</Text>
                </View>
              </View>
            </View>
            )}

            <View style={[styles.infoCard, CARD_SHADOW]}>
              <View style={styles.infoRow}>
                <Ionicons name="finger-print-outline" size={18} color={ACCENT_SOFT} />
                <Text style={styles.infoLabel}>{t("userProfile.id")}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user.id}</Text>
                <TouchableOpacity onPress={copyId} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={18} color={copied ? "#34d399" : ACCENT_SOFT} />
                </TouchableOpacity>
              </View>
              {user.country && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoFlag}>{getFlagEmoji(user.country)}</Text>
                    <Text style={styles.infoLabel}>{t("userProfile.country")}</Text>
                    <Text style={styles.infoValue}>{getCountryName(user.country, lang) || user.country}</Text>
                  </View>
                </>
              )}
              {(user.gender || user.age != null) && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Ionicons name={user.gender === "female" ? "female" : "male"} size={18} color={genderColor} />
                    <Text style={styles.infoLabel}>{t("userProfile.genderAge")}</Text>
                    <Text style={[styles.infoValue, { color: genderColor }]}>
                      {[user.gender === "male" ? t("userProfile.male") : user.gender === "female" ? t("userProfile.female") : "", user.age != null ? `${user.age} ${t("userProfile.years")}` : ""].filter(Boolean).join(" · ") || "—"}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="resize-outline" size={18} color={ACCENT_SOFT} />
                <Text style={styles.infoLabel}>{t("userProfile.height")}</Text>
                <Text style={styles.infoValue}>
                  {user.height != null && Number(user.height) > 0 ? `${user.height} ${t("userProfile.cm")}` : "—"}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="barbell-outline" size={18} color={ACCENT_SOFT} />
                <Text style={styles.infoLabel}>{t("userProfile.weight")}</Text>
                <Text style={styles.infoValue}>
                  {user.weight != null && Number(user.weight) > 0 ? `${user.weight} ${t("userProfile.kg")}` : "—"}
                </Text>
              </View>
            </View>

            {/* كارت منفصل: اركب + العيلة */}
            <View style={[styles.quickActionsCard, CARD_SHADOW]}>
              <TouchableOpacity style={styles.quickRow} activeOpacity={0.8}>
                <View style={styles.quickLeft}>
                  <Ionicons name="car-outline" size={18} color={ACCENT_SOFT} />
                  <Text style={styles.quickTitle}>{t("userProfile.ride")}</Text>
                </View>
                <Ionicons name="chevron-back" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
              <View style={styles.quickDivider} />
              <TouchableOpacity style={styles.quickRow} activeOpacity={0.8}>
                <View style={styles.quickLeft}>
                  <Ionicons name="people-outline" size={18} color={ACCENT_SOFT} />
                  <Text style={styles.quickTitle}>{t("userProfile.family")}</Text>
                </View>
                <Ionicons name="chevron-back" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {/* كارت جدار الهدايا */}
            <View style={[styles.giftCard, CARD_SHADOW]}>
              <View style={styles.giftHeaderRow}>
                <View style={styles.giftTitleRow}>
                  <Ionicons name="gift-outline" size={18} color={GIFT_COLOR} />
                  <Text style={styles.giftTitle}>{t("userProfile.giftWall")}</Text>
                </View>
                <Ionicons name="chevron-back" size={18} color={TEXT_MUTED} />
              </View>
              <Text style={styles.giftSub}>
                {t("userProfile.giftWallDesc")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.momentContent}>
            {momentsLoading ? (
              <View style={styles.momentLoadingWrap}>
                <ActivityIndicator size="small" color={ACCENT_SOFT} />
                <Text style={styles.momentLoadingText}>{t("userProfile.loading")}</Text>
              </View>
            ) : momentsError ? (
              <View style={styles.momentErrorWrap}>
                <Ionicons name="alert-circle-outline" size={20} color={TEXT_MUTED} />
                <Text style={styles.momentErrorText}>{momentsError}</Text>
              </View>
            ) : moments.length === 0 ? (
              <View style={styles.momentEmptyWrap}>
                <Ionicons name="images-outline" size={36} color={TEXT_MUTED} />
                <Text style={styles.momentEmptyTitle}>{t("userProfile.noMoments")}</Text>
                <Text style={styles.momentEmptySub}>{t("userProfile.noMomentsDesc")}</Text>
              </View>
            ) : (
              <View style={styles.momentGrid}>
                {moments.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.momentCard, CARD_SHADOW]}
                    activeOpacity={0.9}
                    onPress={() => setMediaModal(m)}
                  >
                    <View style={styles.momentMediaWrap}>
                      <Image source={{ uri: getFullMediaUrl(m.thumbnailUrl || m.mediaUrl) }} style={styles.momentImage} resizeMode="cover" />
                      {m.mediaType === "video" && (
                        <View style={styles.momentPlayOverlay}>
                          <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.95)" />
                        </View>
                      )}
                    </View>
                    <View style={styles.momentFooter}>
                      <Text style={styles.momentTime}>{formatRelativeTime(m.createdAt, lang)}</Text>
                      <TouchableOpacity style={styles.momentLikeBtn} onPress={() => handleLike(m)} activeOpacity={0.7}>
                        <Ionicons name={m.likedByMe ? "heart" : "heart-outline"} size={14} color={m.likedByMe ? "#f472b6" : TEXT_MUTED} />
                        <Text style={styles.momentLikeCount}>{m.likeCount}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* سايد بار صغير لخيارات المستخدم (حظر / إلغاء متابعة) */}
      {moreMenuVisible && (
        <Pressable
          style={styles.moreMenuOverlay}
          onPress={() => setMoreMenuVisible(false)}
        >
          <View style={styles.moreMenuCard}>
            <TouchableOpacity
              style={styles.moreMenuItem}
              activeOpacity={0.7}
              onPress={async () => {
                if (!currentUser?.id || currentUser.id === user.id) {
                  setMoreMenuVisible(false);
                  return;
                }
                if (isBlocked) {
                  const ok = await unblockUser(user.id);
                  if (ok) setIsBlocked(false);
                } else {
                  const ok = await blockUser(user.id);
                  if (ok) setIsBlocked(true);
                }
                setMoreMenuVisible(false);
              }}
            >
              <Ionicons name="ban-outline" size={18} color="#f97373" />
                  <Text style={[styles.moreMenuText, { color: "#f97373" }]}>
                {isBlocked ? t("userProfile.unblock") : t("userProfile.blockUser")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreMenuItem}
              activeOpacity={0.7}
              onPress={async () => {
                await handleFollowToggle();
                setMoreMenuVisible(false);
              }}
              disabled={!currentUser?.id || currentUser.id === user.id}
            >
              <Ionicons name="person-remove-outline" size={18} color="#facc15" />
              <Text style={[styles.moreMenuText, { color: "#facc15" }]}>
                {isFollowed ? t("userProfile.unfollow") : t("userProfile.follow")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      {/* مودال عرض الصور والفيديو على طول الصفحة */}
      <Modal visible={!!mediaModal} animationType="fade" transparent onRequestClose={() => setMediaModal(null)}>
        <Pressable style={styles.mediaModalOverlay} onPress={() => setMediaModal(null)}>
          <View style={styles.mediaModalContent}>
            {mediaModal && (
              <Pressable onPress={(e) => e.stopPropagation()} style={styles.mediaModalInner}>
                {mediaModal.mediaType === "video" ? (
                  <Video
                    source={{
                      uri: getFullMediaUrl(mediaModal.mediaUrl),
                      headers: { "bypass-tunnel-reminder": "true" },
                    }}
                    style={styles.mediaFullScreen}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    onError={(e) => console.warn("Video error:", e)}
                  />
                ) : (
                  <Image
                    source={{ uri: getFullMediaUrl(mediaModal.mediaUrl) }}
                    style={styles.mediaFullScreen}
                    resizeMode="contain"
                  />
                )}
                <TouchableOpacity style={styles.mediaCloseBtn} onPress={() => setMediaModal(null)}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* مودال مبروك — حصلت على 25 ذهب عند إضافة صديق */}
      <Modal visible={!!bonusModal} transparent animationType="fade">
        <Pressable style={styles.bonusModalOverlay} onPress={() => setBonusModal(null)}>
          <View style={styles.bonusModalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.bonusModalEmoji}>🎉</Text>
            <Text style={styles.bonusModalTitle}>{t("userProfile.congrats")}</Text>
            <Text style={styles.bonusModalText}>{t("userProfile.bonusReceived").replace("{amount}", String(bonusModal?.reward ?? 25))}</Text>
            <TouchableOpacity style={styles.bonusModalBtn} onPress={() => setBonusModal(null)} activeOpacity={0.8}>
              <Text style={styles.bonusModalBtnText}>{t("userProfile.ok")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* صف الأيقونات — هدية، رسالة، إضافة، إعجاب — صغيرة ومرتبة */}
      <View style={styles.actionsRow}>
        {fromAdmirers && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={handleAcceptFriend}
            disabled={accepting || acceptedAsFriend}
          >
            <View
              style={[
                styles.actionIconWrap,
                {
                  backgroundColor: acceptedAsFriend ? "rgba(52,211,153,0.4)" : "rgba(96,165,250,0.25)",
                },
              ]}
            >
              <Ionicons
                name={acceptedAsFriend ? "checkmark-done" : "person-add"}
                size={18}
                color={acceptedAsFriend ? ADD_COLOR : MESSAGE_COLOR}
              />
            </View>
            <Text
              style={[
                styles.actionLabel,
                acceptedAsFriend && { color: ADD_COLOR, fontWeight: "700" },
              ]}
              numberOfLines={1}
            >
              {acceptedAsFriend ? t("userProfile.friend") : accepting ? t("userProfile.accepting") : t("userProfile.acceptRequest")}
            </Text>
          </TouchableOpacity>
        )}
        {currentUser?.id !== user.id && (
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleOpenGiftProfile}>
          <View style={[styles.actionIconWrap, { backgroundColor: "rgba(251,191,36,0.2)" }]}>
            <Ionicons name="gift-outline" size={18} color={GIFT_COLOR} />
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>{t("userProfile.gift")}</Text>
        </TouchableOpacity>
        )}
        {currentUser?.id !== user.id && (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (!currentUser) return;
            onOpenChat?.(user);
          }}
          disabled={!currentUser}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: "rgba(96,165,250,0.2)" }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={MESSAGE_COLOR} />
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>{t("userProfile.message")}</Text>
        </TouchableOpacity>
        )}
        {currentUser?.id !== user.id && (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={handleFollowToggle}
          disabled={!currentUser?.id}
        >
          <View
            style={[
              styles.actionIconWrap,
              { backgroundColor: isFollowed ? "rgba(52,211,153,0.35)" : "rgba(52,211,153,0.2)" },
            ]}
          >
            <Ionicons
              name={isFollowed ? "checkmark-circle" : "person-add-outline"}
              size={18}
              color={ADD_COLOR}
            />
          </View>
          <Text style={[styles.actionLabel, isFollowed && { color: ADD_COLOR, fontWeight: "700" }]} numberOfLines={1}>
            {isFollowed ? t("userProfile.added") : t("userProfile.follow")}
          </Text>
        </TouchableOpacity>
        )}
        {currentUser?.id !== user.id && (
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={handleLikeProfile}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: profileLikedByMe ? "rgba(244,114,182,0.35)" : "rgba(244,114,182,0.2)" }]}>
            <Ionicons name={profileLikedByMe ? "heart" : "heart-outline"} size={18} color={HEART_COLOR} />
          </View>
          <Text style={[styles.actionLabel, profileLikedByMe && { color: HEART_COLOR, fontWeight: "700" }]} numberOfLines={1}>{t("userProfile.like")}</Text>
        </TouchableOpacity>
        )}
      </View>

      {likeToast && (
        <View style={styles.likeToast} pointerEvents="none">
          <Text style={styles.likeToastText}>{likeToast}</Text>
        </View>
      )}

      <GiftModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        goldBalance={goldBalance}
        chargedGold={chargedGold}
        freeGold={freeGold}
        onSend={handleSendGift}
        onOpenTopup={onOpenTopup}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1625", paddingTop: Platform.OS === "ios" ? 40 : 20 },
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
  content: { padding: 16, paddingBottom: 24, alignItems: "center" },
  profileImageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: BORDER_SOFT,
    marginBottom: 16,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  profileImagePlaceholder: {
    backgroundColor: ACCENT_MUTED,
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtnWrap: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 5,
  },
  likeBadgeWrap: {
    position: "absolute",
    bottom: 10,
    right: 10,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.75)",
  },
  likeBadgeCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B4423",
  },
  likeToast: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "45%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  likeToastText: {
    fontSize: 11,
    color: "#f5f3ff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.75)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 14,
    paddingBottom: 14,
    justifyContent: "flex-end",
  },
  overlayContent: {
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  overlayName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  ageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  ageText: {
    fontSize: 13,
    fontWeight: "700",
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlayId: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flagEmoji: { fontSize: 16 },
  flagText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(45, 38, 64, 0.5)",
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  tabActive: {
    backgroundColor: "rgba(167, 139, 250, 0.25)",
    borderColor: ACCENT_SOFT,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_MUTED,
  },
  tabTextActive: {
    color: ACCENT_SOFT,
    fontWeight: "700",
  },
  infoContent: {
    width: "100%",
    paddingHorizontal: 4,
  },
  infoCard: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    overflow: "hidden",
  },
  statsInfoCard: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.25)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statsInfoItem: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    gap: 2,
  },
  statsInfoLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  statsInfoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: TEXT_LIGHT,
  },
  quickActionsCard: {
    width: "100%",
    marginTop: 12,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    paddingVertical: 4,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_LIGHT,
  },
  quickDivider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.35)",
    marginHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    width: 70,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_LIGHT,
  },
  infoDivider: {
    height: 1,
    backgroundColor: BORDER_SOFT,
    marginLeft: 42,
  },
  infoFlag: { fontSize: 18 },
  giftCard: {
    width: "100%",
    marginTop: 12,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  giftHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  giftTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  giftTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_LIGHT,
  },
  giftSub: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  momentContent: {
    width: SCREEN_WIDTH - 32,
    paddingBottom: 24,
  },
  momentLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 32,
  },
  momentLoadingText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  momentErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  momentErrorText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  momentEmptyWrap: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  momentEmptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_LIGHT,
  },
  momentEmptySub: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  momentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  momentCard: {
    width: (SCREEN_WIDTH - 32 - 12) / 2,
    marginBottom: 12,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  momentMediaWrap: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  momentImage: {
    width: "100%",
    height: "100%",
  },
  momentPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  momentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  momentTime: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  momentLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  momentLikeCount: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_LIGHT,
  },
  mediaModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaModalContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaModalInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaFullScreen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  mediaCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 24,
    right: 16,
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  moreMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  moreMenuCard: {
    marginTop: 56,
    marginLeft: 12,
    minWidth: 160,
    backgroundColor: "rgba(15,23,42,0.97)",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  moreMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 8,
  },
  moreMenuText: {
    fontSize: 13,
    fontWeight: "500",
    color: TEXT_LIGHT,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  statPink: { backgroundColor: PINK_BG },
  statBlue: { backgroundColor: BLUE_BG },
  statLabel: { fontSize: 11, fontWeight: "600", color: TEXT_LIGHT },
  statValue: { fontSize: 13, fontWeight: "800", color: TEXT_LIGHT },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  levelText: { fontSize: 11, fontWeight: "700", color: "#fbbf24" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === "ios" ? 22 : 12,
    marginTop: 10,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER_SOFT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 3,
    marginTop:-1
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "600",

    color: TEXT_MUTED,
    marginBottom:50,
  },
  bonusModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bonusModalCard: {
    width: "78%",
    maxWidth: 260,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
    ...CARD_SHADOW,
  },
  bonusModalEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  bonusModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_LIGHT,
    marginBottom: 6,
  },
  bonusModalText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 14,
  },
  bonusModalBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  bonusModalBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
