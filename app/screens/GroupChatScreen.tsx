import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchGroupChatMessages,
  sendGroupChatMessage,
  fetchGroupChatUsers,
  joinGroupChat,
  leaveGroupChat,
  uploadVoiceMessage,
  uploadImageMessage,
  fetchVoiceToLocalUri,
  getVoicePlaybackUrl,
  type GroupChatMessage,
  type GroupChatUser,
} from "../../utils/messagesApi";
import { fetchWallet } from "../../utils/walletApi";
import { API_BASE_URL } from "../../utils/authHelper";
import * as ImagePicker from "expo-image-picker";
import peacockAnim from "../../assets/animations/Peacock The Beauty of Nature.json";
import dragonAnim from "../../assets/animations/Dragon.json";
import spaceAnim from "../../assets/animations/space.json";
import loveAnim from "../../assets/animations/Love.json";
import birdAnim from "../../assets/animations/Bird pair love and flying sky.json";
import ghostAnim from "../../assets/animations/Ghost emoji animation.json";
import roseAnim from "../../assets/animations/rose.json";
import flowerAnim from "../../assets/animations/floer.json";
import surpriseGiftAnim from "../../assets/animations/Surprise in a gift box.json";
import { useLanguage } from "../_contexts/LanguageContext";

type CurrentUser = {
  id?: string;
  name?: string;
  profileImage?: string;
};

type Props = {
  user: CurrentUser | null;
  selectedSlot?: string | null;
  onSelectedSlotChange?: (userId: string | null) => void;
  onBack: () => void;
  onOpenTopup?: () => void;
};

const BG_DARK = "#1a1625";
const BG = BG_DARK;
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const INPUT_BG = "rgba(255,255,255,0.04)";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUBBLE_MAX_WIDTH = SCREEN_WIDTH * 0.64;
const MAX_VOICE_SEC = 30;
const REPLY_PREVIEW_BG = "#d4af37";
const REPLY_PREVIEW_TEXT = "#000000";

function toAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/uploads/${url.replace(/^\//, "")}`;
}

const EMOJI_ROWS: string[][] = [
  ["😘", "🤣", "🌹", "✌️", "🙂", "😂"],
  ["😊", "🥲", "🥰", "😉", "😁", "😄"],
  ["😅", "😆", "😎", "🙂", "😃", "🎲"],
  ["😜", "🤪", "😛", "🤑", "😶", "😐"],
  ["🙄", "😑", "😬", "🤫", "🤐", "😯"],
  ["😮", "😲", "😳", "🥺", "😦", "😧"],
  ["😢", "😭", "😤", "😠", "😡", "🤬"],
  ["🤢", "🤮", "🤧", "🥵", "🥶", "😵"],
  ["😵‍💫", "🤯", "😶‍🌫️", "🥱", "😴", "🤤"],
  ["😷", "🤒", "🤕", "🤑", "😈", "👿"],
  ["😪", "😌", "😔", "😞", "😟", "😕"],
  ["🙁", "☹️", "😣", "😖", "😫", "😩"],
  ["🥺", "😢", "😭", "😤", "😠", "😡"],
  ["🤠", "🥳", "😎", "🤓", "🧐", "😕"],
  ["😮", "😯", "😲", "😳", "🥸", "😏"],
  ["😶", "😐", "😑", "😬", "🙄", "😬"],
];

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Parse gift as GIFT:key:amount */
function parseGiftFromText(
  text: string | null | undefined
): { isGift: boolean; giftType: string | null; amount: number | null } {
  if (!text) return { isGift: false, giftType: null, amount: null };
  const match = text.match(/^GIFT:([^:]+):(\d+)/);
  if (!match) return { isGift: false, giftType: null, amount: null };
  const amount = parseInt(match[2], 10);
  if (!Number.isFinite(amount) || amount <= 0) return { isGift: false, giftType: null, amount: null };
  return { isGift: true, giftType: match[1], amount };
}

const GIFT_ITEMS: { key: string; image: number; name: string; cost: string }[] = [
  { key: "peacock", image: require("../../assets/images/taws.jpg"), name: "طاوس", cost: "500" },
  { key: "dragon", image: require("../../assets/images/tenen.jpg"), name: "تنين وردي", cost: "100" },
  { key: "space", image: require("../../assets/images/spec.jpj.png"), name: "رجل فضاء", cost: "25" },
  { key: "love", image: require("../../assets/images/love.jpg"), name: "رسالة حب", cost: "10" },
  { key: "bird", image: require("../../assets/images/perd.jpg"), name: "طيور حب", cost: "45" },
  { key: "ghost", image: require("../../assets/images/chost.jpg"), name: "شبح", cost: "5" },
  { key: "rose", image: require("../../assets/images/تنزيل.png"), name: "وردة", cost: "1" },
  { key: "flower", image: require("../../assets/images/flo.jpg"), name: "زهرة كرز", cost: "200" },
];

const GIFT_COSTS: Record<string, number> = {
  peacock: 500,
  dragon: 100,
  space: 25,
  love: 10,
  bird: 45,
  ghost: 5,
  rose: 1,
  flower: 200,
};

const GIFT_NAMES: Record<string, string> = {
  peacock: "طاوس",
  dragon: "تنين وردي",
  space: "رجل فضاء",
  love: "رسالة حب",
  bird: "طيور حب",
  ghost: "شبح",
  rose: "وردة",
  flower: "زهرة كرز",
};

const GIFT_IMAGES: Record<string, number> = {
  peacock: require("../../assets/images/taws.jpg"),
  dragon: require("../../assets/images/tenen.jpg"),
  space: require("../../assets/images/spec.jpj.png"),
  love: require("../../assets/images/love.jpg"),
  bird: require("../../assets/images/perd.jpg"),
  ghost: require("../../assets/images/chost.jpg"),
  rose: require("../../assets/images/تنزيل.png"),
  flower: require("../../assets/images/flo.jpg"),
};

const GIFT_ANIMS: Record<string, any> = {
  peacock: peacockAnim,
  dragon: dragonAnim,
  space: spaceAnim,
  love: loveAnim,
  bird: birdAnim,
  ghost: ghostAnim,
  rose: roseAnim,
  flower: flowerAnim,
};

type LocalGroupChatMessage = GroupChatMessage & {
  status?: "sending" | "sent" | "failed";
  specialType?: "gift";
  specialAnimating?: boolean;
  giftType?: string | null;
  giftAmount?: number | null;
  localImageUri?: string | null;
};

const GiftGridItem = React.memo(function GiftGridItem({
  item,
  selected,
  index,
  onSelect,
  giftItemStyle,
  giftItemSelectedStyle,
  giftItemImageStyle,
  giftItemNameStyle,
  giftItemCostRowStyle,
  giftItemCostStyle,
  goldCoinIconStyle,
}: {
  item: (typeof GIFT_ITEMS)[0];
  selected: boolean;
  index: number;
  onSelect: (i: number) => void;
  giftItemStyle: object;
  giftItemSelectedStyle: object;
  giftItemImageStyle: object;
  giftItemNameStyle: object;
  giftItemCostRowStyle: object;
  giftItemCostStyle: object;
  goldCoinIconStyle: object;
}) {
  return (
    <TouchableOpacity
      style={[giftItemStyle, selected && giftItemSelectedStyle]}
      onPress={() => onSelect(index)}
      activeOpacity={0.7}
    >
      <Image source={item.image} style={giftItemImageStyle} resizeMode="cover" />
      <Text style={giftItemNameStyle} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={giftItemCostRowStyle}>
        <Text style={giftItemCostStyle}>{item.cost}</Text>
        <Text style={goldCoinIconStyle}>🪙</Text>
      </View>
    </TouchableOpacity>
  );
});

export default function GroupChatScreen({
  user,
  selectedSlot,
  onSelectedSlotChange,
  onBack,
  onOpenTopup,
}: Props) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<LocalGroupChatMessage[]>([]);
  const [groupUsers, setGroupUsers] = useState<GroupChatUser[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<LocalGroupChatMessage | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [bubbleMenuMsg, setBubbleMenuMsg] = useState<LocalGroupChatMessage | null>(null);
  const [bubbleMenuPos, setBubbleMenuPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const bubbleRefs = useRef<Record<string, unknown>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>(["😘", "🤣", "🌹", "✌️", "🙂", "😂"]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [goldBalance, setGoldBalance] = useState<number>(0);
  const [chargedGold, setChargedGold] = useState<number>(0);
  const [freeGold, setFreeGold] = useState<number>(0);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [selectedGiftIndex, setSelectedGiftIndex] = useState<number | null>(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [showGiftOverlay, setShowGiftOverlay] = useState(false);
  const [giftOverlayType, setGiftOverlayType] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToRecent = useCallback((emoji: string) => {
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 8);
      return next;
    });
  }, []);

  const dedupeById = useCallback(<T extends { id: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, []);

  const mapServerToLocal = useCallback((m: GroupChatMessage): LocalGroupChatMessage => {
    const { isGift, giftType, amount } = parseGiftFromText(m.text);
    return {
      ...m,
      status: "sent" as const,
      specialType: isGift ? "gift" : undefined,
      specialAnimating: false,
      giftType: isGift ? giftType : null,
      giftAmount: isGift ? amount : null,
    };
  }, []);

  useEffect(() => {
    joinGroupChat().catch(() => {});
    return () => {
      leaveGroupChat().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchGroupChatMessages(), fetchGroupChatUsers()]).then(([msgs, users]) => {
      if (cancelled) return;
      setMessages(dedupeById(msgs.map(mapServerToLocal)));
      setGroupUsers(users);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    });
    return () => {
      cancelled = true;
    };
  }, [dedupeById, mapServerToLocal]);

  const POLL_INTERVAL_MS = 3000;
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGroupChatMessages().then((list) => {
        setMessages((prev) => {
          const fromServer = dedupeById(list.map(mapServerToLocal));
          const serverKeys = new Set(
            fromServer.map((m) => `${m.fromId}:${m.text}:${m.createdAt?.slice(0, 19)}`)
          );
          const sending = prev.filter((m) => {
            if (m.status !== "sending") return false;
            const key = `${m.fromId}:${m.text}:${m.createdAt?.slice(0, 19)}`;
            return !serverKeys.has(key);
          });
          const merged = dedupeById([...fromServer, ...sending]);
          merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return merged;
        });
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dedupeById, mapServerToLocal]);

  const stopRecordingAndCleanup = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingSec(0);
  }, []);

  const handleStopVoice = useCallback(
    async (overrideDuration?: number) => {
      const rec = recordingRef.current;
      if (!rec || !user?.id) {
        stopRecordingAndCleanup();
        return;
      }
      try {
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        recordingRef.current = null;
        stopRecordingAndCleanup();
        if (!uri) return;
        const durationSec = overrideDuration ?? Math.min(Math.max(recordingSec, 1), MAX_VOICE_SEC);
        const up = await uploadVoiceMessage(uri);
        if (!up) return;
        const optimistic: LocalGroupChatMessage = {
          id: `local-${Date.now()}`,
          fromId: user.id,
          fromName: user.name ?? "أنت",
          fromProfileImage: user.profileImage,
          text: "🎤 رسالة صوتية",
          createdAt: new Date().toISOString(),
          status: "sending",
          audioUrl: up.audioUrl,
          audioDurationSeconds: durationSec,
        };
        setMessages((prev) => [...prev, optimistic]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);
        const result = await sendGroupChatMessage("🎤 رسالة صوتية", {
          audioUrl: up.audioUrl,
          audioDurationSeconds: durationSec,
          toId: selectedSlot ?? null,
        });
        if (result) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimistic.id ? { ...result, status: "sent" } : m))
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m))
          );
        }
      } catch (e) {
        console.log("stop voice error:", e);
      } finally {
        recordingRef.current = null;
        stopRecordingAndCleanup();
      }
    },
    [user?.id, user?.name, user?.profileImage, recordingSec, stopRecordingAndCleanup, selectedSlot]
  );

  const handleStartVoice = useCallback(async () => {
    if (!user?.id || isRecording) return;
    try {
      const prev = recordingRef.current;
      if (prev) {
        try {
          await prev.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
        await new Promise((r) => setTimeout(r, 300));
      }
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingSec(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSec((s) => {
          if (s >= MAX_VOICE_SEC - 1) {
            stopRecordingAndCleanup();
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
            handleStopVoice(MAX_VOICE_SEC);
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.log("start voice error:", e);
      stopRecordingAndCleanup();
    }
  }, [user?.id, isRecording, stopRecordingAndCleanup, handleStopVoice]);

  const handleSend = async () => {
    if (!user?.id || !text.trim()) return;
    const trimmed = text.trim();
    const optimistic: LocalGroupChatMessage = {
      id: `local-${Date.now()}`,
      fromId: user.id,
      fromName: user.name ?? "أنت",
      fromProfileImage: user.profileImage,
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: "sending",
      replyToText: replyTo?.text ?? null,
      replyToFromId: replyTo?.fromId ?? null,
      replyToFromName: replyTo?.fromName ?? null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);
    setText("");
    setReplyTo(null);
    setActiveMenuId(null);
    const result = await sendGroupChatMessage(trimmed, {
      toId: selectedSlot ?? null,
      replyToText: optimistic.replyToText ?? null,
      replyToFromId: optimistic.replyToFromId ?? null,
    });
    const emojiMatch = trimmed.match(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}]/gu
    );
    if (emojiMatch?.length) emojiMatch.forEach((e) => addToRecent(e));
    if (result) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id
            ? { ...result, status: "sent", replyToText: optimistic.replyToText ?? null }
            : m
        )
      );
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m))
      );
    }
  };

  const retrySend = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status: "sending" } : m))
    );
    let imageUrl = msg.imageUrl ?? null;
    if (!imageUrl && msg.localImageUri) {
      const uploaded = await uploadImageMessage(msg.localImageUri);
      if (!uploaded) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: "failed" } : m))
        );
        return;
      }
      imageUrl = uploaded.imageUrl;
    }
    const { amount: giftAmt } = parseGiftFromText(msg.text);
    const result = await sendGroupChatMessage(msg.text, {
      imageUrl,
      toId: selectedSlot ?? null,
      giftAmount: giftAmt ?? null,
      replyToText: msg.replyToText ?? null,
      replyToFromId: msg.replyToFromId ?? null,
    });
    if (result) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...result, status: "sent" } : m))
      );
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: "failed" } : m))
      );
    }
  };

  const getMessageTextToCopy = useCallback((m: LocalGroupChatMessage): string => {
    const { isGift, giftType, amount } = parseGiftFromText(m.text);
    if (isGift) return `هدية: ${giftType} x${amount}`;
    if (m.audioUrl) return "رسالة صوتية";
    if (m.imageUrl) return "صورة";
    return m.text || "";
  }, []);

  const handleBubbleLongPress = useCallback((m: LocalGroupChatMessage) => {
    if (m.fromId === user?.id) return;
    const ref = bubbleRefs.current[m.id] as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null;
    ref?.measureInWindow?.((x, y, w, h) => {
      setBubbleMenuMsg(m);
      setBubbleMenuPos({ x, y, w, h });
    });
  }, [user?.id]);

  const handleBubbleReply = useCallback(() => {
    if (!bubbleMenuMsg) return;
    setReplyTo(bubbleMenuMsg);
    setBubbleMenuMsg(null);
    setBubbleMenuPos(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [bubbleMenuMsg]);

  const handleBubbleCopy = useCallback(async () => {
    if (!bubbleMenuMsg) return;
    const toCopy = getMessageTextToCopy(bubbleMenuMsg);
    if (toCopy) await Clipboard.setStringAsync(toCopy);
    setBubbleMenuMsg(null);
    setBubbleMenuPos(null);
  }, [bubbleMenuMsg, getMessageTextToCopy]);

  const handleCopy = useCallback(async (msg: LocalGroupChatMessage) => {
    const copyText = getMessageTextToCopy(msg);
    if (copyText) await Clipboard.setStringAsync(copyText);
    setActiveMenuId(null);
  }, [getMessageTextToCopy]);

  const handleToggleEmoji = () => setShowEmojiPicker((prev) => !prev);

  const handleOpenGiftModal = useCallback(() => {
    setShowEmojiPicker(false);
    if (showGiftModal) {
      setShowGiftModal(false);
      return;
    }
    setSelectedGiftIndex(0);
    setGiftQuantity(1);
    setShowGiftModal(true);
    fetchWallet().then((w) => {
      setGoldBalance(w?.totalGold ?? 0);
      setChargedGold(w?.chargedGold ?? 0);
      setFreeGold(w?.freeGold ?? 0);
    });
  }, [showGiftModal]);

  const handleCloseGiftModal = useCallback(() => {
    setShowGiftModal(false);
    setShowEmojiPicker(false);
  }, []);

  const handleSendGift = useCallback(() => {
    if (!user?.id || selectedGiftIndex === null) {
      handleCloseGiftModal();
      return;
    }
    const item = GIFT_ITEMS[selectedGiftIndex];
    const giftKey = item.key;
    const baseAmount = GIFT_COSTS[giftKey] ?? 100;
    const amount = baseAmount * Math.max(1, giftQuantity);

    if (goldBalance <= 0 || goldBalance < amount) {
      setShowGiftModal(false);
      setShowInsufficientBalanceModal(true);
      return;
    }

    const text = `GIFT:${giftKey}:${amount}`;
    const id = `local-gift-${Date.now()}`;
    const optimistic: LocalGroupChatMessage = {
      id,
      fromId: user.id,
      fromName: user.name ?? "أنت",
      fromProfileImage: user.profileImage,
      text,
      createdAt: new Date().toISOString(),
      status: "sending",
      specialType: "gift",
      specialAnimating: true,
      giftType: giftKey,
      giftAmount: amount,
      replyToText: replyTo?.text ?? null,
      replyToFromId: replyTo?.fromId ?? null,
      replyToFromName: replyTo?.fromName ?? null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);
    setShowGiftModal(false);
    const takeFromCharged = Math.min(chargedGold, amount);
    const takeFromFree = amount - takeFromCharged;
    setChargedGold((c) => Math.max(0, c - takeFromCharged));
    setFreeGold((f) => Math.max(0, f - takeFromFree));
    setGoldBalance((g) => g - amount);
    setGiftOverlayType(giftKey);
    setShowGiftOverlay(true);

    setTimeout(() => {
      setShowGiftOverlay(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, specialAnimating: false } : m))
      );
      void (async () => {
        const result = await sendGroupChatMessage(text, {
          toId: selectedSlot ?? null,
          giftAmount: amount,
          replyToText: optimistic.replyToText ?? null,
          replyToFromId: optimistic.replyToFromId ?? null,
        });
        if (result) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...result,
                    status: "sent",
                    specialType: "gift",
                    giftType: giftKey,
                    giftAmount: amount,
                  }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: "failed" } : m))
          );
        }
      })();
    }, 1800);
  }, [
    user?.id,
    user?.name,
    user?.profileImage,
    giftQuantity,
    selectedGiftIndex,
    replyTo,
    handleCloseGiftModal,
    goldBalance,
    chargedGold,
    selectedSlot,
  ]);

  const handlePickImage = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const localUri = result.assets[0].uri;
      if (!localUri) return;

      const id = `local-img-${Date.now()}`;
      const optimistic: LocalGroupChatMessage = {
        id,
        fromId: user.id,
        fromName: user.name ?? "أنت",
        fromProfileImage: user.profileImage,
        text: "📷 صورة",
        createdAt: new Date().toISOString(),
        status: "sending",
        imageUrl: localUri,
        localImageUri: localUri,
        replyToText: replyTo?.text ?? null,
        replyToFromId: replyTo?.fromId ?? null,
        replyToFromName: replyTo?.fromName ?? null,
      };
      setMessages((prev) => [...prev, optimistic]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);

      const uploaded = await uploadImageMessage(localUri);
      if (!uploaded) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "failed" } : m))
        );
        return;
      }

      const sendResult = await sendGroupChatMessage("📷 صورة", {
        imageUrl: uploaded.imageUrl,
        toId: selectedSlot ?? null,
        replyToText: optimistic.replyToText ?? null,
        replyToFromId: optimistic.replyToFromId ?? null,
      });
      if (sendResult) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...sendResult, status: "sent", imageUrl: uploaded.imageUrl, localImageUri: localUri }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, status: "failed", imageUrl: uploaded.imageUrl, localImageUri: localUri }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.status === "sending" && (m.imageUrl || m.localImageUri)
            ? { ...m, status: "failed" as const }
            : m
        )
      );
    }
  }, [user?.id, user?.name, user?.profileImage, replyTo, selectedSlot]);

  const handlePickEmoji = (emoji: string) => {
    addToRecent(emoji);
    setText((prev) => (prev || "") + emoji);
  };

  const handlePlayVoice = useCallback(
    async (msg: LocalGroupChatMessage) => {
      if (!msg.audioUrl) return;
      if (playingId === msg.id) {
        try {
          const s = soundRef.current;
          if (s) {
            const st = await s.getStatusAsync();
            if (st?.isLoaded && (st as { isPlaying?: boolean }).isPlaying) {
              await s.pauseAsync();
            } else {
              await s.playAsync();
            }
          }
        } catch {
          setPlayingId(null);
        }
        return;
      }
      if (loadingVoiceId) return;
      setLoadingVoiceId(msg.id);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeAndroid: 1,
          interruptionModeIOS: 1,
        });
        if (soundRef.current) await soundRef.current.unloadAsync();

        let playUri: string | null = await fetchVoiceToLocalUri(msg.audioUrl);
        if (playUri && !playUri.startsWith("file://")) playUri = `file://${playUri}`;
        if (!playUri) playUri = await getVoicePlaybackUrl(msg.audioUrl);
        if (!playUri) {
          setLoadingVoiceId(null);
          return;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: playUri },
          { shouldPlay: true, isLooping: false, volume: 1 }
        );
        soundRef.current = sound;
        setPlayingId(msg.id);
        setPlaybackPosition(0);
        sound.setOnPlaybackStatusUpdate((st: any) => {
          if (!st?.isLoaded) return;
          setPlaybackPosition(Math.floor((st.positionMillis || 0) / 1000));
          const done =
            (st.didJustFinish && !st.isPlaying) ||
            st.positionMillis >= (st.durationMillis || 1) - 50;
          if (done) {
            setPlayingId(null);
            setPlaybackPosition(0);
            sound.unloadAsync().catch(() => {});
          }
        });
      } catch (e) {
        console.log("play voice error:", e);
        setPlayingId(null);
      } finally {
        setLoadingVoiceId(null);
      }
    },
    [playingId, loadingVoiceId]
  );

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    };
  }, []);

  const renderBubbleContent = (
    m: LocalGroupChatMessage,
    isMine: boolean,
    status: "sending" | "sent" | "failed"
  ) => {
    const isVoice = !!m.audioUrl;
    const dur = m.audioDurationSeconds ?? 0;
    const isGift = m.specialType === "gift" || /^GIFT:/.test(m.text || "");

    if (isGift) {
      const amount = m.giftAmount ?? 0;
      const giftKey = m.giftType ?? "peacock";
      const baseAmount = GIFT_COSTS[giftKey] ?? 100;
      const qty = Math.max(1, Math.round(amount / (baseAmount || 1)) || 1);
      const titleText = isMine ? "إرسال" : `${m.fromName ?? "مستخدم"} أرسل`;
      return (
        <View style={styles.giftCardBubble}>
          <Image
            source={GIFT_IMAGES[giftKey] ?? GIFT_IMAGES.peacock}
            style={styles.giftCardImage}
            resizeMode="cover"
          />
          <View style={styles.giftCardContent}>
            <Text style={styles.giftCardTitle}>{titleText}</Text>
            <Text style={styles.giftCardSubtitle}>
              {GIFT_NAMES[giftKey] ?? giftKey} x{qty}
            </Text>
            <View style={styles.giftCardBottomRow}>
              <TouchableOpacity
                style={styles.giftPlayBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setGiftOverlayType(giftKey);
                  setShowGiftOverlay(true);
                }}
              >
                <Ionicons name="play-circle" size={18} color="#a855f7" />
              </TouchableOpacity>
              <View style={styles.giftCardGoldRow}>
                <Text style={styles.goldCoinIcon}>🪙</Text>
                <Text style={styles.giftCardGoldText}>{amount}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (isVoice) {
      const loading = loadingVoiceId === m.id;
      return (
        <View style={styles.voiceRow}>
          <TouchableOpacity
            style={styles.voicePlayBtn}
            onPress={() => handlePlayVoice(m)}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isMine ? "#fff" : TEXT_LIGHT} />
            ) : (
              <Ionicons
                name={playingId === m.id ? "pause" : "play"}
                size={18}
                color={isMine ? "#fff" : TEXT_LIGHT}
              />
            )}
          </TouchableOpacity>
          <Text
            style={[
              styles.voiceDuration,
              isMine ? styles.voiceDurationMine : styles.voiceDurationOther,
            ]}
          >
            {playingId === m.id
              ? `${fmtDuration(playbackPosition)} / ${fmtDuration(dur)}`
              : fmtDuration(dur)}
          </Text>
        </View>
      );
    }

    const isImage = !!m.imageUrl || !!m.localImageUri;
    if (isImage) {
      const uri = (m.imageUrl || m.localImageUri) as string;
      const displayUri = uri.startsWith("http") ? uri : toAbsoluteImageUrl(uri) ?? uri;
      return (
        <>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPreviewImage(displayUri)}
          >
            <Image
              source={{ uri: displayUri }}
              style={styles.imageBubble}
              resizeMode="cover"
            />
          </TouchableOpacity>
          {isMine && status === "failed" && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => retrySend(m.id)}
              style={styles.failedRow}
            >
              <Ionicons name="alert-circle" size={14} color="#f87171" />
              <Text style={styles.failedText}>{t("chat.sendFailed")}</Text>
            </TouchableOpacity>
          )}
        </>
      );
    }

    return (
      <>
        <Text style={isMine ? styles.myMsgText : styles.otherMsgText}>{m.text}</Text>
        {isMine && status === "failed" && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => retrySend(m.id)}
            style={styles.failedRow}
          >
            <Ionicons name="alert-circle" size={14} color="#f87171" />
            <Text style={styles.failedText}>{t("chat.sendFailed")}</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const replyPreviewStyle = {
    backgroundColor: REPLY_PREVIEW_BG,
    borderRightColor: REPLY_PREVIEW_TEXT,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={TEXT_LIGHT} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>الدردشة الجماعية</Text>
            {groupUsers.length > 0 && (
              <Text style={styles.headerSubtitle}>{groupUsers.length} مشارك</Text>
            )}
          </View>
          <View style={{ width: 32 }} />
        </View>

        {onSelectedSlotChange && (
          <View style={styles.slotBar}>
            <Text style={styles.slotLabel}>إرسال إلى:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.slotChip, !selectedSlot && styles.slotChipActive]}
                onPress={() => onSelectedSlotChange(null)}
              >
                <Text style={styles.slotChipText}>الكل</Text>
              </TouchableOpacity>
              {groupUsers.map((u) => (
                <TouchableOpacity
                  key={u.userId}
                  style={[
                    styles.slotChip,
                    selectedSlot === u.userId && styles.slotChipActive,
                  ]}
                  onPress={() => onSelectedSlotChange(u.userId)}
                >
                  <Text style={styles.slotChipText} numberOfLines={1}>
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView style={styles.messagesContainer} ref={scrollRef}>
          {dedupeById(messages).map((m) => {
            const isMine = m.fromId === user?.id;
            const status: "sending" | "sent" | "failed" = m.status || "sent";
            const isGift = m.specialType === "gift" || /^GIFT:/.test(m.text || "");
            const replyName = m.replyToFromName ?? m.replyToFromId ?? "";

            return (
              <View key={m.id} style={isMine ? styles.myMsgRow : styles.otherMsgRow}>
                {!isMine && (
                  <View>
                    {m.fromProfileImage ? (
                      <Image
                        source={{
                          uri: toAbsoluteImageUrl(m.fromProfileImage) ?? "",
                        }}
                        style={styles.msgAvatarOther}
                      />
                    ) : (
                      <View style={[styles.msgAvatarOther, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={18} color={TEXT_MUTED} />
                      </View>
                    )}
                    <Text style={styles.senderName} numberOfLines={1}>
                      {m.fromName ?? m.fromId}
                    </Text>
                  </View>
                )}
                <View style={isMine ? styles.myMsgSideMine : styles.myMsgSideOther}>
                  {isMine ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onLongPress={() => setActiveMenuId(m.id)}
                      delayLongPress={220}
                    >
                      {isGift ? (
                        <View style={styles.specialStandalone}>
                          {!!m.replyToText && (
                            <View style={[styles.replyPreviewInBubble, replyPreviewStyle]}>
                              {replyName ? (
                                <Text style={styles.replyPreviewNameGolden}>: {replyName}</Text>
                              ) : null}
                              <Text style={styles.replyPreviewTextGolden}>{m.replyToText}</Text>
                            </View>
                          )}
                          {renderBubbleContent(m, isMine, status)}
                        </View>
                      ) : (
                        <View style={styles.myMsgBubble}>
                          {!!m.replyToText && (
                            <View style={[styles.replyPreviewInBubble, replyPreviewStyle]}>
                              {replyName ? (
                                <Text style={styles.replyPreviewNameGolden}>: {replyName}</Text>
                              ) : null}
                              <Text style={styles.replyPreviewTextGolden}>{m.replyToText}</Text>
                            </View>
                          )}
                          {renderBubbleContent(m, isMine, status)}
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Pressable onLongPress={() => handleBubbleLongPress(m)}>
                      {isGift ? (
                        <View
                          ref={(r) => {
                            if (r) (bubbleRefs.current as Record<string, unknown>)[m.id] = r;
                          }}
                          collapsable={false}
                          style={styles.specialStandalone}
                        >
                          {!!m.replyToText && (
                            <View style={[styles.replyPreviewInBubble, replyPreviewStyle]}>
                              {replyName ? (
                                <Text style={styles.replyPreviewNameGolden}>: {replyName}</Text>
                              ) : null}
                              <Text style={styles.replyPreviewTextGolden}>{m.replyToText}</Text>
                            </View>
                          )}
                          {renderBubbleContent(m, isMine, status)}
                        </View>
                      ) : (
                        <View
                          ref={(r) => {
                            if (r) (bubbleRefs.current as Record<string, unknown>)[m.id] = r;
                          }}
                          collapsable={false}
                          style={styles.otherMsgBubble}
                        >
                          {!!m.replyToText && (
                            <View style={[styles.replyPreviewInBubble, replyPreviewStyle]}>
                              {replyName ? (
                                <Text style={styles.replyPreviewNameGolden}>: {replyName}</Text>
                              ) : null}
                              <Text style={styles.replyPreviewTextGolden}>{m.replyToText}</Text>
                            </View>
                          )}
                          {renderBubbleContent(m, isMine, status)}
                        </View>
                      )}
                    </Pressable>
                  )}
                  {isMine && activeMenuId === m.id && (
                    <View style={styles.messageMenu}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.menuBtn}
                        onPress={() => {
                          setReplyTo(m);
                          setActiveMenuId(null);
                        }}
                      >
                        <Text style={styles.menuBtnText}>رد</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.menuBtn}
                        onPress={() => handleCopy(m)}
                      >
                        <Text style={styles.menuBtnText}>نسخ</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {isMine && (
                  <View>
                    {user?.profileImage ? (
                      <Image
                        source={{ uri: toAbsoluteImageUrl(user.profileImage) ?? "" }}
                        style={styles.msgAvatarMine}
                      />
                    ) : (
                      <View style={[styles.msgAvatarMine, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={18} color={TEXT_MUTED} />
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputArea}>
          {isRecording && (
            <View style={styles.recordingBar}>
              <View style={styles.recordingWave} />
              <Text style={styles.recordingText}>جاري التسجيل {fmtDuration(recordingSec)}</Text>
              <TouchableOpacity onPress={() => handleStopVoice()} style={styles.recordingStopBtn}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {replyTo && !isRecording && (
            <View style={[styles.replyBar, { backgroundColor: REPLY_PREVIEW_BG }]}>
              <View style={styles.replyBarLeft}>
                <View style={[styles.replyBarLine, { backgroundColor: REPLY_PREVIEW_TEXT }]} />
                <Text style={[styles.replyBarLabel, { color: REPLY_PREVIEW_TEXT }]}>الرد على</Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.replyBarText, { color: REPLY_PREVIEW_TEXT }]}
              >
                {replyTo.text}
              </Text>
              <TouchableOpacity
                onPress={() => setReplyTo(null)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={16} color={REPLY_PREVIEW_TEXT} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mainInputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={t("chat.typeMessage")}
              placeholderTextColor={TEXT_MUTED}
              multiline
              value={text}
              onChangeText={setText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              onFocus={() => setShowEmojiPicker(false)}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={22}
                color={text.trim() ? "#4ade80" : TEXT_MUTED}
              />
            </TouchableOpacity>
          </View>

          {showEmojiPicker && (
            <View style={styles.emojiPanel}>
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionLabel}>{t("chat.recent")}</Text>
                <View style={styles.emojiRow}>
                  {recentEmojis.map((emoji, i) => (
                    <TouchableOpacity
                      key={`recent-${i}-${emoji}`}
                      style={styles.emojiBtn}
                      activeOpacity={0.8}
                      onPress={() => handlePickEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionLabel}>{t("chat.all")}</Text>
                <ScrollView
                  style={styles.emojiScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {EMOJI_ROWS.map((row, idx) => (
                    <View key={idx} style={styles.emojiRow}>
                      {row.map((emoji, colIdx) => (
                        <TouchableOpacity
                          key={`${idx}-${colIdx}`}
                          style={styles.emojiBtn}
                          activeOpacity={0.8}
                          onPress={() => handlePickEmoji(emoji)}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.emojiActions}>
                <TouchableOpacity
                  style={[styles.emojiActionBtn, !text.trim() && styles.emojiActionBtnDisabled]}
                  onPress={() => text.trim() && handleSend()}
                  activeOpacity={0.8}
                  disabled={!text.trim()}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={text.trim() ? "#4ade80" : TEXT_MUTED}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emojiActionBtn}
                  onPress={() => setText((prev) => prev.slice(0, -1))}
                  activeOpacity={0.8}
                >
                  <Ionicons name="backspace-outline" size={20} color={TEXT_LIGHT} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.bottomActions}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                onPress={handleStartVoice}
                activeOpacity={0.8}
                disabled={isRecording}
              >
                {isRecording ? (
                  <ActivityIndicator size="small" color="#f87171" />
                ) : (
                  <Ionicons name="mic" size={22} color="#60a5fa" />
                )}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleToggleEmoji}>
                <Ionicons name="happy-outline" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <View style={styles.rightActions}>
              <TouchableOpacity activeOpacity={0.8} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleOpenGiftModal}>
                <LottieView
                  source={surpriseGiftAnim}
                  autoPlay
                  loop
                  style={styles.giftIconAnim}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {bubbleMenuMsg && bubbleMenuPos && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => {
              setBubbleMenuMsg(null);
              setBubbleMenuPos(null);
            }}
          >
            <View style={StyleSheet.absoluteFill}>
              <TouchableWithoutFeedback
                onPress={() => {
                  setBubbleMenuMsg(null);
                  setBubbleMenuPos(null);
                }}
              >
                <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
              <View
                style={[
                  styles.bubbleFloatingMenu,
                  {
                    left: bubbleMenuPos.x + bubbleMenuPos.w - 100,
                    top: bubbleMenuPos.y - 44,
                  },
                ]}
              >
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.menuBtn}
                    onPress={handleBubbleReply}
                  >
                    <Text style={styles.menuBtnText}>رد</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.menuBtn}
                    onPress={handleBubbleCopy}
                  >
                    <Text style={styles.menuBtnText}>نسخ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {previewImage && (
          <Modal visible transparent onRequestClose={() => setPreviewImage(null)}>
            <TouchableOpacity
              style={styles.previewBackdrop}
              activeOpacity={1}
              onPress={() => setPreviewImage(null)}
            >
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Modal>
        )}

        {showGiftOverlay && giftOverlayType && GIFT_ANIMS[giftOverlayType] && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setShowGiftOverlay(false)}
          >
            <View style={styles.giftOverlay}>
              <LottieView
                source={GIFT_ANIMS[giftOverlayType]}
                autoPlay
                loop={false}
                style={styles.giftOverlayLottie}
                onAnimationFinish={() => {
                  setShowGiftOverlay(false);
                  setGiftOverlayType(null);
                }}
              />
            </View>
          </Modal>
        )}

        {showInsufficientBalanceModal && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setShowInsufficientBalanceModal(false)}
          >
            <View style={styles.insufficientModalOverlay}>
              <View style={styles.insufficientModalCard}>
                <View style={styles.insufficientModalIconWrap}>
                  <Text style={styles.insufficientModalIcon}>🪙</Text>
                </View>
                <Text style={styles.insufficientModalTitle}>
                  {t("chat.insufficientBalance")}
                </Text>
                <Text style={styles.insufficientModalSubtitle}>
                  {t("chat.needMoreGold")}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowInsufficientBalanceModal(false);
                    onOpenTopup?.();
                  }}
                  activeOpacity={0.85}
                  style={styles.insufficientModalBtnWrap}
                >
                  <LinearGradient
                    colors={["#7c3aed", "#a855f7", "#c084fc"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.insufficientModalBtn}
                  >
                    <Ionicons name="card" size={20} color="#fff" />
                    <Text style={styles.insufficientModalBtnText}>
                      {t("chat.goToTopup")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.insufficientModalCloseBtn}
                  onPress={() => setShowInsufficientBalanceModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.insufficientModalCloseText}>{t("me.cancel")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showGiftModal && (
          <Modal
            visible
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleCloseGiftModal}
          >
            <TouchableWithoutFeedback onPress={handleCloseGiftModal}>
              <View style={styles.giftModalBackdrop}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.giftModal}>
                    <View style={styles.giftModalHeader}>
                      <TouchableOpacity
                        style={styles.giftGoldPill}
                        activeOpacity={0.8}
                        onPress={onOpenTopup}
                      >
                        <View style={styles.giftGoldPillContent}>
                          <Text style={styles.goldCoinIcon}>🪙</Text>
                          <View>
                            <Text style={styles.giftGoldText}>{goldBalance}</Text>
                            <Text style={styles.giftGoldSubtext}>
                              {t("me.charged")} {chargedGold} · {t("me.free")} {freeGold}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={TEXT_MUTED}
                          style={{ marginLeft: 6 }}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.giftGrid}>
                      {GIFT_ITEMS.map((item, i) => (
                        <GiftGridItem
                          key={item.key}
                          item={item}
                          selected={selectedGiftIndex === i}
                          index={i}
                          onSelect={setSelectedGiftIndex}
                          giftItemStyle={styles.giftItem}
                          giftItemSelectedStyle={styles.giftItemSelected}
                          giftItemImageStyle={styles.giftItemImage}
                          giftItemNameStyle={styles.giftItemName}
                          giftItemCostRowStyle={styles.giftItemCostRow}
                          giftItemCostStyle={styles.giftItemCost}
                          goldCoinIconStyle={styles.goldCoinIcon}
                        />
                      ))}
                    </View>
                    <View style={styles.giftModalFooter}>
                      <View style={styles.giftQuantityPill}>
                        <Ionicons name="gift-outline" size={18} color={TEXT_LIGHT} />
                        <Text style={styles.giftQuantityText}>{giftQuantity}</Text>
                        <TouchableOpacity
                          onPress={() => setGiftQuantity((q) => Math.min(q + 1, 99))}
                          hitSlop={8}
                        >
                          <Ionicons name="chevron-up" size={18} color={TEXT_LIGHT} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setGiftQuantity((q) => Math.max(1, q - 1))}
                          hitSlop={8}
                        >
                          <Ionicons name="chevron-down" size={18} color={TEXT_LIGHT} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.giftSendBtn}
                        onPress={handleSendGift}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.giftSendText}>{t("chat.send")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.25)",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: TEXT_LIGHT },
  headerSubtitle: { fontSize: 11, color: TEXT_MUTED },
  slotBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(15,23,42,0.5)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.15)",
    gap: 8,
  },
  slotLabel: { fontSize: 12, color: TEXT_MUTED },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.2)",
    marginLeft: 8,
  },
  slotChipActive: {
    backgroundColor: "#a855f7",
  },
  slotChipText: { fontSize: 12, color: TEXT_LIGHT, fontWeight: "600", maxWidth: 80 },
  messagesContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 5 },
  myMsgRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  otherMsgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    alignSelf: "flex-end",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  senderName: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginBottom: 2,
    marginRight: 6,
    textAlign: "right",
  },
  myMsgBubble: {
    marginTop: -1,
    maxWidth: BUBBLE_MAX_WIDTH,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    backgroundColor: "#a855f7",
    minWidth: 80,
    alignSelf: "flex-end",
  },
  myMsgText: { fontSize: 14, color: "#fff" },
  otherMsgBubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  otherMsgText: { fontSize: 14, color: "#1a1625" },
  voiceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceDuration: { fontSize: 13, fontWeight: "600" },
  voiceDurationMine: { color: "#fff" },
  voiceDurationOther: { color: TEXT_LIGHT },
  myMsgSideMine: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  myMsgSideOther: { flex: 1, alignItems: "flex-start", gap: 4 },
  replyPreviewInBubble: {
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderRightWidth: 2,
    width: "100%",
  },
  replyPreviewNameGolden: { fontSize: 12, color: REPLY_PREVIEW_TEXT, marginBottom: 2 },
  replyPreviewTextGolden: { fontSize: 12, color: REPLY_PREVIEW_TEXT },
  failedRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
  },
  failedText: { fontSize: 11, color: "#f87171", fontWeight: "700" },
  msgAvatarMine: { width: 34, height: 34, borderRadius: 8, marginLeft: 6 },
  msgAvatarOther: { width: 34, height: 34, borderRadius: 8, marginRight: 6 },
  avatarPlaceholder: {
    backgroundColor: "rgba(31,41,55,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: Platform.OS === "ios" ? 34 : 59,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,23,42,0.9)",
    backgroundColor: BG,
    gap: 8,
  },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  recordingWave: {
    width: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#f87171",
  },
  recordingText: { flex: 1, fontSize: 13, color: "#fca5a5", fontWeight: "600" },
  recordingStopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  mainInputRow: {
    backgroundColor: INPUT_BG,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 22,
    maxHeight: 80,
    color: TEXT_LIGHT,
    textAlignVertical: "center",
  },
  emojiPanel: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.98)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
    gap: 4,
  },
  emojiSection: { marginBottom: 4 },
  emojiSectionLabel: {
    fontSize: 13,
    color: "#e2e8f0",
    marginBottom: 4,
    textAlign: "right",
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  emojiBtn: { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 999 },
  emojiText: { fontSize: 24 },
  emojiScroll: { maxHeight: 180 },
  emojiActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.25)",
  },
  emojiActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiActionBtnDisabled: { opacity: 0.5 },
  specialStandalone: { alignItems: "center", justifyContent: "center", marginVertical: 2 },
  imageBubble: {
    width: 180,
    height: 200,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: { width: "90%", height: "80%", borderRadius: 16 },
  giftModalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  giftModal: {
    backgroundColor: "#1e1b2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  giftModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  giftGoldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  giftGoldPillContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  giftGoldText: { fontSize: 16, fontWeight: "800", color: "#fbbf24" },
  giftGoldSubtext: { fontSize: 11, color: "rgba(251,191,36,0.85)", marginTop: 2 },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: SCREEN_WIDTH - 32,
  },
  giftItem: {
    width: (SCREEN_WIDTH - 32 - 24) / 4,
    alignItems: "center",
    marginBottom: 16,
  },
  giftItemSelected: {
    borderWidth: 2,
    borderColor: "#a855f7",
    borderRadius: 10,
    padding: 4,
    margin: -4,
  },
  giftItemImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(148,163,184,0.2)",
    marginBottom: 6,
  },
  giftItemName: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginBottom: 4,
    width: "100%",
    textAlign: "center",
  },
  giftItemCostRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  giftItemCost: { fontSize: 12, color: "#fbbf24", fontWeight: "600" },
  goldCoinIcon: { fontSize: 14, marginRight: 2 },
  giftModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  giftQuantityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.15)",
  },
  giftQuantityText: { fontSize: 15, fontWeight: "600", color: TEXT_LIGHT },
  giftSendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },
  giftSendText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  giftIconAnim: { width: 36, height: 36 },
  giftOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  giftOverlayLottie: { width: "80%", height: "80%" },
  giftCardBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#d9c7ff",
    gap: 10,
    maxWidth: BUBBLE_MAX_WIDTH,
    minWidth: BUBBLE_MAX_WIDTH * 0.7,
    alignSelf: "flex-start",
  },
  giftCardImage: { width: 52, height: 52, borderRadius: 26 },
  giftCardContent: { flex: 1, alignItems: "flex-start", gap: 4 },
  giftCardTitle: {
    fontSize: 13,
    color: "#33225c",
    fontWeight: "700",
    textAlign: "left",
  },
  giftCardSubtitle: { fontSize: 12, color: "#6b567f", textAlign: "left" },
  giftCardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 3,
  },
  giftPlayBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,85,247,0.16)",
  },
  giftCardGoldRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  giftCardGoldText: { fontSize: 13, fontWeight: "600", color: "#fbbf24" },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -10,
  },
  leftActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  rightActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  messageMenu: { flexDirection: "row", alignItems: "center", gap: 8 },
  bubbleFloatingMenu: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 100,
  },
  menuBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
  },
  menuBtnText: { fontSize: 11, color: TEXT_LIGHT, fontWeight: "600" },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  replyBarLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  replyBarLine: { width: 2, height: 18, borderRadius: 999 },
  replyBarLabel: { fontSize: 11 },
  replyBarText: { flex: 1, fontSize: 12 },
  insufficientModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  insufficientModalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1e1b2e",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  insufficientModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(251,191,36,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  insufficientModalIcon: { fontSize: 36 },
  insufficientModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  insufficientModalSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  insufficientModalBtnWrap: { width: "100%", marginBottom: 12 },
  insufficientModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  insufficientModalBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  insufficientModalCloseBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  insufficientModalCloseText: { fontSize: 14, color: TEXT_MUTED },
});
