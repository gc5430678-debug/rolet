import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
  Alert,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../utils/authHelper";
import { useLanguage } from "../_contexts/LanguageContext";
import spinWheelAnim from "../../assets/animations/spin wheel.json";
import giftBoxAnim from "../../assets/animations/Gift box.json";

const { width } = Dimensions.get("window");

// توزيع الأرباح: المستخدم 45% — المالك 55%
// gold = 0.45 * price_usd / cost_per_gold | cost_per_gold ≈ 0.004
// gold ≈ 112.5 * price_usd (تقريب أعداد صحيحة مناسبة)
const TOPUP_PACKAGES: { priceUsd: number; gold: number; priceLabel: string }[] = [
  { priceUsd: 0.35, gold: 39, priceLabel: "0.35$" },
  { priceUsd: 0.99, gold: 111, priceLabel: "0.99$" },
  { priceUsd: 1.99, gold: 224, priceLabel: "1.99$" },
  { priceUsd: 4.99, gold: 561, priceLabel: "4.99$" },
  { priceUsd: 9.99, gold: 1124, priceLabel: "9.99$" },
  { priceUsd: 19.99, gold: 2249, priceLabel: "19.99$" },
  { priceUsd: 49.99, gold: 5624, priceLabel: "49.99$" },
  { priceUsd: 99.99, gold: 11249, priceLabel: "99.99$" },
  { priceUsd: 199.99, gold: 22499, priceLabel: "199.99$" },
  { priceUsd: 399.99, gold: 44999, priceLabel: "399.99$" },
  { priceUsd: 499.99, gold: 56249, priceLabel: "499.99$" },
  { priceUsd: 599.99, gold: 67499, priceLabel: "599.99$" },
  { priceUsd: 799.99, gold: 89999, priceLabel: "799.99$" },
  { priceUsd: 899.99, gold: 101249, priceLabel: "899.99$" },
  { priceUsd: 999.99, gold: 112499, priceLabel: "999.99$" },
];

type Props = {
  onBack: () => void;
};

export default function TopupScreen({ onBack }: Props) {
  const { t } = useLanguage();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const contentRef = useRef<ScrollView>(null);

  const [wheelVisible, setWheelVisible] = useState(false);
  const [boxRewardsVisible, setBoxRewardsVisible] = useState(false);
  const [palaceEffectVisible, setPalaceEffectVisible] = useState(false);
  const palaceAnim = useRef(new Animated.Value(0)).current;
  const [bouquetEffectVisible, setBouquetEffectVisible] = useState(false);
  const bouquetAnim = useRef(new Animated.Value(0)).current;
  const winnersPulse = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewardText, setRewardText] = useState<string | null>(null);
  const [lastBonusPercent, setLastBonusPercent] = useState(0);

  const [totalGold, setTotalGold] = useState(0);
  const [chargedGold, setChargedGold] = useState(0);
  const [freeGold, setFreeGold] = useState(0);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingPrice, setPendingPrice] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  // شرائح الدولاب (الترتيب مطابق تماماً لمواقع الدوائر على العجلة)
  const rewardSegments = [
    { label: "3%", angle: 0 },
    { label: "5%", angle: 60 },
    { label: "7%", angle: 120 },
    { label: "8%", angle: 180 },
    { label: "2%", angle: 240 },
    { label: "10%", angle: 300 },
  ];

  const handleOpenWheel = () => {
    setRewardText(null);
    setLastBonusPercent(0);
    setWheelVisible(true);
  };

  const handleOpenBoxRewards = () => {
    setBoxRewardsVisible(true);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(winnersPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(winnersPulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [winnersPulse]);

  const triggerBouquetEffect = () => {
    bouquetAnim.setValue(0);
    setBouquetEffectVisible(true);
    Animated.timing(bouquetAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      setBouquetEffectVisible(false);
    });
  };

  const triggerPalaceEffect = () => {
    palaceAnim.setValue(0);
    setPalaceEffectVisible(true);
    Animated.timing(palaceAnim, {
      toValue: 1,
      duration: 7200,
      useNativeDriver: true,
    }).start(() => {
      setPalaceEffectVisible(false);
    });
  };

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setRewardText(null);
    setLastBonusPercent(0);

    spinValue.setValue(0);

    const randomIndex = Math.floor(Math.random() * rewardSegments.length);
    const chosen = rewardSegments[randomIndex];

    // مؤشر السهم ثابت في الأعلى، لذلك يجب أن نلفّ العجلة عكس اتجاه
    // موضع الشريحة (زاوية سالبة) حتى تتحرك الشريحة المختارة إلى الأعلى بدقة.
    const fullRotations = 4; // لفّات كاملة قبل التوقف
    const targetAngle = fullRotations * 360 - chosen.angle;

    Animated.timing(spinValue, {
      toValue: targetAngle / 360,
      duration: 2600,
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setRewardText(chosen.label);

      const numeric = parseInt(chosen.label.replace("%", ""), 10);
      setLastBonusPercent(Number.isNaN(numeric) ? 0 : numeric);
    });
  };

  const handleGoToTopup = () => {
    // إغلاق دولاب الحظ والانتقال إلى قسم باقات الشحن
    setWheelVisible(false);
    setTimeout(() => {
      contentRef.current?.scrollTo({ y: 0, animated: true });
    }, 250);
  };

  const handleOfferPress = (amount: number, price: string) => {
    setPendingAmount(amount);
    setPendingPrice(price);
    setConfirmVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const ok = await handlePurchase(pendingAmount);
      if (ok) {
        setConfirmVisible(false);
        setPendingAmount(0);
        setPendingPrice("");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchase = async (amount: number): Promise<boolean> => {
    const bonus = Math.round((amount * lastBonusPercent) / 100);
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      Alert.alert(t("topup.alert"), t("topup.loginRequired"));
      return false;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/wallet/topup`,
        { amount, bonus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );
      if (res.data?.success && res.data?.wallet) {
        const w = res.data.wallet;
        setTotalGold(w.totalGold ?? 0);
        setChargedGold(w.chargedGold ?? 0);
        setFreeGold(w.freeGold ?? 0);
        return true;
      }
      Alert.alert(t("topup.error"), t("topup.purchaseFailed"));
      return false;
    } catch {
      Alert.alert(t("topup.noConnection"), t("topup.noConnectionMsg"));
      return false;
    }
  };

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const fetchWallet = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (res.data?.success && res.data?.wallet) {
        const w = res.data.wallet;
        setTotalGold(w.totalGold ?? 0);
        setChargedGold(w.chargedGold ?? 0);
        setFreeGold(w.freeGold ?? 0);
      }
    } catch {
      // المستخدم غير مسجّل أو خطأ شبكة
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = index === 0 ? 1 : 0;
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color="#c4b5fd" />
          <Text style={styles.backText}>{t("topup.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("topup.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ١. مجموع ذهب — مشحون — مجاني (نفس النمط السابق) */}
      <View style={styles.totalCardWrap}>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <View style={styles.totalLeft}>
              <View style={styles.coinBigOuter}>
                <View style={styles.coinBigInner}>
                  <Text style={styles.coinBigLetter}>🪙</Text>
                </View>
              </View>
              <View>
                <Text style={styles.cardTitle}>{t("topup.totalGold")}</Text>
                <Text style={styles.totalValue}>{totalGold}</Text>
              </View>
            </View>
            <View style={styles.totalRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("topup.charged")} {chargedGold}</Text>
              </View>
              <View style={styles.badgeSecondary}>
                <Text style={styles.badgeTextSecondary}>{t("topup.free")} {freeGold}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ٢. مكافآت شحن — مكافأة الصندوق — ٣. باقات شحن (سكرول) */}
      <ScrollView
        ref={contentRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.rewardSliderWrapper}>
        <LinearGradient
          colors={["#111827", "#020617"]}
          style={styles.rewardBackground}
        >
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Slide 1 - مكافأة شحن */}
            <View style={styles.slide}>
              <View style={styles.wheelRow}>
                <View style={styles.wheelAnimWrap}>
                  <LottieView
                    source={spinWheelAnim}
                    autoPlay
                    loop
                    style={styles.wheelAnim}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.wheelTextBox}
                  onPress={handleOpenWheel}
                >
                  <Text style={styles.slideTag}>{t("topup.spinBonus")}</Text>
                  <Text style={styles.slideTitle}>{t("topup.spinTitle")}</Text>
                  <Text style={styles.slideSub}>
                    {t("topup.spinDesc")}
                  </Text>
                  <View style={styles.slideCta}>
                    <Text style={styles.slideCtaText}>{t("topup.spinCta")}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Slide 2 - مكافأة صندوق */}
            <View style={styles.slide}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleOpenBoxRewards}
                style={styles.wheelRow}
              >
                <View style={styles.wheelAnimWrap}>
                  <LottieView
                    source={giftBoxAnim}
                    autoPlay
                    loop
                    style={styles.wheelAnim}
                  />
                </View>
                <View style={styles.wheelTextBox}>
                  <Text style={styles.slideTag}>{t("topup.boxTag")}</Text>
                  <Text style={styles.slideTitle}>{t("topup.boxTitle")}</Text>
                  <Text style={styles.slideSub}>
                    {t("topup.boxDesc")}
                  </Text>
                  <View style={styles.slideCta}>
                    <Text style={styles.slideCtaText}>{t("topup.boxCta")}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {[0, 1].map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [6, 16, 6],
                extrapolate: "clamp",
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
                />
              );
            })}
          </View>
        </LinearGradient>
      </View>

      {/* ٣. باقات شحن */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("topup.packagesTitle")}</Text>
            <Text style={styles.sectionSubtitle}>
              {t("topup.packagesDesc")}
            </Text>
          </View>

          <View style={styles.carch}>
            {TOPUP_PACKAGES.map((pkg, i) => (
              <TouchableOpacity
                key={i}
                style={styles.offerContainer}
                activeOpacity={0.9}
                onPress={() => handleOfferPress(pkg.gold, pkg.priceLabel)}
              >
                <View style={styles.coin3DOuter}>
                  <View style={styles.coin3DMiddle}>
                    <View style={styles.coin3DInner}>
                      <Text style={styles.coin3DText}>🪙</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.offerAmount}>{pkg.gold}</Text>
                <View style={styles.offerDivider} />
                <Text style={styles.offerPrice}>{pkg.priceLabel}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      </ScrollView>

      {/* Wheel of Fortune Modal */}
      <Modal visible={wheelVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("topup.wheelTitle")}</Text>
            <Text style={styles.modalSubtitle}>
              {t("topup.wheelDesc")}
            </Text>

            <View style={styles.modalWheelWrapper}>
              <View style={styles.modalWheelPointer} />
              <Animated.View style={[styles.modalWheelOuter, { transform: [{ rotate }] }]}>
                <LinearGradient
                  colors={["#f97316", "#facc15"]}
                  style={styles.modalWheelGradient}
                >
                  <View style={styles.modalWheelInner}>
                    <View style={[styles.modalSegmentBadge, styles.modalSegment1]}>
                      <Text style={styles.modalSegmentText}>3%</Text>
                    </View>
                    <View style={[styles.modalSegmentBadge, styles.modalSegment2]}>
                      <Text style={styles.modalSegmentText}>5%</Text>
                    </View>
                    <View style={[styles.modalSegmentBadge, styles.modalSegment3]}>
                      <Text style={styles.modalSegmentText}>7%</Text>
                    </View>
                    <View style={[styles.modalSegmentBadge, styles.modalSegment4]}>
                      <Text style={styles.modalSegmentText}>8%</Text>
                    </View>
                    <View style={[styles.modalSegmentBadge, styles.modalSegment5]}>
                      <Text style={styles.modalSegmentText}>2%</Text>
                    </View>
                    <View style={[styles.modalSegmentBadge, styles.modalSegment6]}>
                      <Text style={styles.modalSegmentText}>10%</Text>
                    </View>
                    <View style={styles.modalWheelCenter} />
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>

            {rewardText && (
              <View style={styles.rewardBanner}>
                <Text style={styles.rewardBannerValue}>
                  {`${t("topup.congrats")} ${rewardText} ${t("topup.extraGold")}`}
                </Text>
              </View>
            )}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setWheelVisible(false)}
                disabled={isSpinning}
              >
                <Text style={styles.modalButtonSecondaryText}>{t("topup.close")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, isSpinning && styles.modalButtonDisabled]}
                onPress={
                  !isSpinning && rewardText
                    ? handleGoToTopup
                    : handleSpin
                }
                activeOpacity={0.9}
                disabled={isSpinning}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {isSpinning
                    ? t("topup.spinning")
                    : rewardText
                    ? t("topup.goTopup")
                    : t("topup.spinWheel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* صفحة مكافآت الصندوق - خلفية ملكية فاخرة */}
      <Modal visible={boxRewardsVisible} animationType="slide">
        <View style={styles.boxRewardsScreen}>
          <LinearGradient
            colors={["#0d0221", "#1a0a2e", "#2d1b4e", "#1a0a2e", "#0d0221"]}
            style={StyleSheet.absoluteFill}
          />
          {/* طبقة ذهبية علوية */}
          <LinearGradient
            colors={["rgba(212,175,55,0.15)", "transparent"]}
            style={styles.boxRewardsGoldTop}
          />
          {/* زخارف ملكية */}
          <View style={styles.boxRewardsPattern}>
            <View style={[styles.boxRewardsDiamond, styles.boxDiamond1]} />
            <View style={[styles.boxRewardsDiamond, styles.boxDiamond2]} />
            <View style={[styles.boxRewardsDiamond, styles.boxDiamond3]} />
          </View>

          <View style={styles.boxRewardsContent}>
            <TouchableOpacity
              onPress={() => setBoxRewardsVisible(false)}
              style={styles.boxRewardsBackBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward" size={24} color="#D4AF37" />
              <Text style={styles.boxRewardsBackText}>رجوع</Text>
            </TouchableOpacity>

            {/* الرابح في الجولة الأخيرة */}
            <View style={styles.winnersCard}>
              <LinearGradient
                colors={["#22d3ee", "#6366f1"]}
                style={styles.winnersHeader}
              >
                <Text style={styles.winnersHeaderText}>الرابح في الجولة الأخيرة</Text>
              </LinearGradient>
              <View style={styles.winnersRow}>
                {[0, 1, 2].map((i) => {
                  return (
                    <View
                      key={i}
                      style={[
                        styles.winnerItem,
                        i === 1 && styles.winnerItemCenter,
                      ]}
                    >
                      <Animated.View style={styles.winnerAvatarOuter}>
                        {i === 1 ? (
                          <View style={styles.winnerFireFrame}>
                            <Video
                              source={require("../../assets/images/dreamina-2026-02-27-4973-The flames surrounding the ornate golden....mp4")}
                              style={StyleSheet.absoluteFillObject}
                              isMuted
                              isLooping
                              shouldPlay
                              resizeMode={ResizeMode.COVER}
                            />
                            <View style={styles.winnerAvatarInnerBig}>
                              <Image
                                source={require("../../assets/images/fel.jpg")}
                                style={styles.winnerFireFrameImage}
                                resizeMode="cover"
                              />
                            </View>
                          </View>
                        ) : i === 0 ? (
                          <ImageBackground
                            source={require("../../assets/images/asdselver.jpg")}
                            style={styles.winnerFireFrame}
                            imageStyle={styles.winnerFireFrameImage}
                          >
                            <View style={styles.winnerAvatarInnerBig}>
                              <Ionicons name="cafe" size={24} color="#fefce8" />
                            </View>
                          </ImageBackground>
                        ) : (
                          <ImageBackground
                            source={require("../../assets/images/asdred.jpg")}
                            style={styles.winnerFireFrame}
                            imageStyle={styles.winnerFireFrameImage}
                          >
                            <View style={styles.winnerAvatarInnerBig}>
                              <Ionicons name="cafe" size={24} color="#fefce8" />
                            </View>
                          </ImageBackground>
                        )}
                      </Animated.View>
                      <Text style={styles.winnerName}>
                        {i === 1 ? "كرسي الفائز" : "كرسي مميز"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <ScrollView
              style={{ marginTop: 16 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.boxRewardsHeader}>
                <View style={styles.boxRewardsCrownWrap}>
                  <LottieView
                    source={require("../../assets/images/3D Treasure Box (1).json")}
                    autoPlay
                    loop
                    style={{ width: 140, height: 140, marginHorizontal: -10, marginVertical: -10 }}
                  />
                </View>
                <Text style={styles.boxRewardsTitle}>مكافآت الصندوق</Text>
                <View style={styles.boxRewardsSubtitleRow}>
                  <Ionicons name="trophy" size={18} color="#facc15" style={styles.boxRewardsSubtitleIcon} />
                  <Text style={styles.boxRewardsSubtitleText}>
                    افتح الصندوق واربح جوائز مميزة تصل إلى{" "}
                    <Text style={styles.boxRewardsSubtitleHighlight}>1000 🪙</Text>
                  </Text>
                </View>
              </View>

              <LinearGradient
                colors={["rgba(212,175,55,0.25)", "rgba(124,58,237,0.2)"]}
                style={styles.boxRewardsCard}
              >
                <View style={styles.boxRewardsCardInner}>
                  <Text style={styles.royalSectionTitle}>الهدايا الملكية</Text>

                  <View style={styles.royalThrone}>
                    <View style={styles.royalThroneBack} />
                    <View style={styles.royalThroneSeat}>
                      <View style={styles.royalGiftsRow}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={triggerBouquetEffect}
                          style={styles.royalGiftItem}
                        >
                          <View style={styles.royalGiftCrystal}>
                            <View style={styles.royalGiftInner}>
                              <Text style={styles.royalGiftEmoji}>💐</Text>
                            </View>
                          </View>
                          <Text style={styles.royalGiftLabel}>باقة ورد فخمة</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={triggerPalaceEffect}
                          style={styles.royalGiftItem}
                        >
                          <View style={styles.royalGiftCrystal}>
                            <View style={styles.royalGiftInner}>
                              <Image
                                source={require("../../assets/images/fel.jpg")}
                                style={styles.royalGiftImage}
                              />
                            </View>
                          </View>
                          <Text style={styles.royalGiftLabel}>   قصر ملكي فاخر </Text>
                        </TouchableOpacity>

                        <View style={styles.royalGiftItem}>
                          <View style={styles.royalGiftCrystal}>
                            <View style={styles.royalGiftInner}>
                              <Text style={styles.royalGiftEmoji}>🏰</Text>
                            </View>
                          </View>
                          <Text style={styles.royalGiftLabel}> رولز رويس </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.boxRewardsHint}>
                    كل صندوق يمكن أن يفتح لك واحدة من هذه الهدايا الملكية داخل كريستال فاخر، مع فرصة للوصول إلى{" "}
                    <Text style={styles.boxRewardsSubtitleHighlight}>1000 🪙</Text>.
                  </Text>
                </View>
              </LinearGradient>

              {/* خلفية العرش مع صندوق وزر "افتح الصندوق" */}
              <View style={styles.throneSection}>
                <ImageBackground
                  source={require("../../assets/images/arsh.jpg")}
                  style={styles.throneImage}
                  imageStyle={styles.throneImageInner}
                >
                  <View style={styles.throneCenter}>
                    <LottieView
                      source={require("../../assets/images/3D Treasure Box (1).json")}
                      autoPlay
                      loop
                      style={styles.throneBoxLottie}
                    />
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.throneButton}
                    >
                      <Text style={styles.throneButtonText}>افتح الصندوق</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>

              {/* عرض المكافآت أسفل العرش (مثل الصورة المرسلة) */}
              <View style={styles.rewardsSection}>
                <Text style={styles.rewardsTitle}>عرض المكافآت</Text>

                {/* صندوق أساسي */}
                <View style={styles.rewardsBoxCard}>
                  <View style={styles.rewardsBoxHeader}>
                    <Text style={styles.rewardsBoxHeaderText}>صندوق الاساسي</Text>
                  </View>
                  <View style={styles.rewardsRow}>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardItemIconWrap}>
                        <Text style={styles.rewardItemEmoji}>🌹</Text>
                      </View>
                      <Text style={styles.rewardItemLabel}>الورود الذهبية</Text>
                      <Text style={styles.rewardItemCount}>1×</Text>
                    </View>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardItemIconWrap}>
                        <Ionicons name="car-sport" size={20} color="#e5e7eb" />
                      </View>
                      <Text style={styles.rewardItemLabel}>سيارة فخمة</Text>
                      <Text style={styles.rewardItemCount}>1×</Text>
                    </View>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardItemIconWrap}>
          <Text style={styles.rewardItemEmoji}>🪙</Text>
                      </View>
                      <Text style={styles.rewardItemLabel}>الذهب</Text>
                      <Text style={styles.rewardItemCount}>8×</Text>
                    </View>
                  </View>
                </View>

                {/* صندوق متوسط */}
                <View style={styles.rewardsBoxCard}>
                  <View style={styles.rewardsBoxHeader}>
                    <Text style={styles.rewardsBoxHeaderText}>صندوق المتوسط</Text>
                  </View>
                  <View style={styles.rewardsRow}>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardItemIconWrap}>
                        <Text style={styles.rewardItemEmoji}>🎂</Text>
                      </View>
                      <Text style={styles.rewardItemLabel}>هدية احتفالية</Text>
                      <Text style={styles.rewardItemCount}>1×</Text>
                    </View>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardItemIconWrap}>
                        <Ionicons name="bicycle" size={20} color="#e5e7eb" />
                      </View>
                      <Text style={styles.rewardItemLabel}>مركبة نادرة</Text>
                      <Text style={styles.rewardItemCount}>1×</Text>
                    </View>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardItemIconWrap}>
                        <Text style={styles.rewardItemEmoji}>💰</Text>
                      </View>
                      <Text style={styles.rewardItemLabel}>ذهب إضافي</Text>
                      <Text style={styles.rewardItemCount}>4×</Text>
                    </View>
                  </View>
                </View>

                {/* صندوق متطور (سطر أفقي قابل للتمرير مثل الصورة) */}
                <View style={styles.rewardsBoxCard}>
                  <View style={styles.rewardsBoxHeader}>
                    <Text style={styles.rewardsBoxHeaderText}>صندوق المتطور</Text>
                  </View>
                  <View style={styles.advancedRowWrapper}>
                    <Ionicons name="chevron-back" size={18} color="#bfdbfe" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.advancedRow}
                    >
                      <View style={styles.advancedRewardItem}>
                        <View style={styles.advancedRewardIcon}>
                          <Text style={styles.rewardItemEmoji}>🟣</Text>
                        </View>
                        <Text style={styles.rewardItemLabel}>كرة الحوت</Text>
                        <Text style={styles.rewardItemCount}>1×</Text>
                      </View>
                      <View style={styles.advancedRewardItem}>
                        <View style={styles.advancedRewardIcon}>
                          <Text style={styles.rewardItemEmoji}>⭐</Text>
                        </View>
                        <Text style={styles.rewardItemLabel}>VIP</Text>
                        <Text style={styles.rewardItemCount}>1×</Text>
                      </View>
                      <View style={styles.advancedRewardItem}>
                        <View style={styles.advancedRewardIcon}>
                          <Text style={styles.rewardItemEmoji}>🏝️</Text>
                        </View>
                        <Text style={styles.rewardItemLabel}>جزيرة الصيف</Text>
                        <Text style={styles.rewardItemCount}>1×</Text>
                      </View>
                      <View style={styles.advancedRewardItem}>
                        <View style={styles.advancedRewardIcon}>
                          <Ionicons name="bicycle" size={18} color="#e5e7eb" />
                        </View>
                        <Text style={styles.rewardItemLabel}>دراجة</Text>
                        <Text style={styles.rewardItemCount}>1×</Text>
                      </View>
                    </ScrollView>
                    <Ionicons name="chevron-forward" size={18} color="#bfdbfe" />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* تأثير باقة الورد فقط (بدون صورة خلفية، حركة للإيموجي والنجوم) */}
      <Modal visible={bouquetEffectVisible} transparent animationType="fade">
        <View style={styles.bouquetEffectOverlay}>
          <Animated.View
            style={[
              styles.bouquetEffectBubble,
              {
                opacity: bouquetAnim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    scale: bouquetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1.1],
                    }),
                  },
                  {
                    translateY: bouquetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, -10],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#f97316", "#facc15"]}
              style={styles.bouquetEffectBubbleInner}
            >
              <Text style={styles.bouquetEffectEmojiText}>💐</Text>
            </LinearGradient>
          </Animated.View>

          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.bouquetStar,
                styles[`bouquetStar${i + 1}` as "bouquetStar1"],
                {
                  opacity: bouquetAnim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      scale: bouquetAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="star" size={20} color="#facc15" />
            </Animated.View>
          ))}
        </View>
      </Modal>

      {/* تأثير قصر ملكي عند الضغط */}
      <Modal visible={palaceEffectVisible} transparent animationType="fade">
        <View style={styles.palaceEffectOverlay}>
          <Animated.View
            style={[
              styles.palaceEffectImageWrap,
              {
                opacity: palaceAnim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    scale: palaceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.3],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("../../assets/images/fel.jpg")}
              style={styles.palaceEffectImage}
            />
          </Animated.View>

          {/* نجوم لامعة حول الصورة */}
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.palaceStar,
                styles[`palaceStar${i + 1}` as "palaceStar1"],
                {
                  opacity: palaceAnim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      scale: palaceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="star" size={20} color="#facc15" />
            </Animated.View>
          ))}
        </View>
      </Modal>

      {/* نافذة تأكيد الشراء */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t("topup.confirmTitle")}</Text>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{t("topup.gold")}:</Text>
              <Text style={styles.confirmValue}>{pendingAmount} 🪙</Text>
            </View>
            {lastBonusPercent > 0 && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>{t("topup.bonus")} ({lastBonusPercent}%):</Text>
                <Text style={styles.confirmValue}>
                  +{Math.round((pendingAmount * lastBonusPercent) / 100)} 🪙
                </Text>
              </View>
            )}
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{t("topup.price")}:</Text>
              <Text style={styles.confirmValue}>{pendingPrice}</Text>
            </View>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => {
                  setConfirmVisible(false);
                  setPendingAmount(0);
                  setPendingPrice("");
                }}
                disabled={isPurchasing}
              >
                <Text style={styles.confirmBtnCancelText}>{t("topup.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnOk, isPurchasing && styles.confirmBtnDisabled]}
                onPress={handleConfirmPurchase}
                disabled={isPurchasing}
              >
                <Text style={styles.confirmBtnOkText}>
                  {isPurchasing ? t("topup.purchasing") : t("topup.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>


    
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816", paddingTop: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },

  backText: { fontSize: 15, color: "#c4b5fd", fontWeight: "600" },

  title: { fontSize: 18, fontWeight: "700", color: "#fff" },

  totalCardWrap: {
    paddingHorizontal: 20,
    marginTop: 12,
  },

  rewardSliderWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
  },

  rewardBackground: {
    borderRadius: 24,
    overflow: "hidden",
    paddingVertical: 14,
  },

  slide: {
    width,
    paddingHorizontal: 24,
  },

  wheelRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  wheelAnimWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    marginLeft: 12,
    marginRight: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  wheelAnim: {
    width: 110,
    height: 110,
    backgroundColor: "transparent",
  },

  wheelContainer: {
    width: 90,
    height: 90,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginRight: 20,
  },

  wheelOuter: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(250,250,250,0.4)",
  },

  wheelInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  wheelSegmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },

  wheelSegmentText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#facc15",
  },

  wheelCenter: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -10,
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#facc15",
    borderWidth: 2,
    borderColor: "#fff",
  },

  wheelPointer: {
    position: "absolute",
    right: -6,
    top: "50%",
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#facc15",
  },

  wheelTextBox: {
    flex: 1,
    paddingRight: 20,
  },

  slideTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a5b4fc",
    marginBottom: 2,
  },

  slideTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  slideSub: {
    fontSize: 11,
    marginTop: 4,
    color: "#e5e7eb",
    lineHeight: 17,
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  dot: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#4b5563",
    marginHorizontal: 4,
  },

  slideCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },

  slideCtaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#f9fafb",
  },

  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#7c3aed",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  totalRight: {
    alignItems: "flex-end",
    gap: 8,
  },

  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#facc15",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#facc15",
  },

  badgeSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#38bdf8",
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },

  badgeTextSecondary: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },

  coinBigOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#3f2a11",
    alignItems: "center",
    justifyContent: "center",
  },

  coinBigInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },

  coinBigLetter: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#e5e7eb",
    marginBottom: 2,
  },

  sectionSubtitle: {
    fontSize: 10,
    color: "#9ca3af",
    lineHeight: 15,
  },

  carch: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  coin3DOuter: {
    flexDirection: "row",
    gap:10,
  width: 26,
  height: 26,
  borderRadius: 13,
  alignItems: "center",
  justifyContent: "center",
},

coin3DMiddle: {
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: "#b45309",
  alignItems: "center",
  justifyContent: "center",
},

  coin3DInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fde68a",
  },

  coin3DText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
  },

  offerContainer: {
    width: "31%",
    marginBottom: 14,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.45)",
  },

  offerAmount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#facc15",
  },

  offerDivider: {
    width: "60%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginVertical: 8,
  },

  offerPrice: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    width: 60,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    color: "#f9fafb",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f9fafb",
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 6,
  },

  modalWheelWrapper: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  modalWheelOuter: {
    width: 210,
    height: 210,
    borderRadius: 105,
    overflow: "hidden",
  },

  modalWheelGradient: {
    flex: 1,
    borderRadius: 105,
    padding: 10,
  },

  modalWheelInner: {
    flex: 1,
    borderRadius: 95,
    backgroundColor: "#020617",
    borderWidth: 2,
    borderColor: "rgba(248,250,252,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalWheelCenter: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#facc15",
    borderWidth: 2,
    borderColor: "#fefce8",
    justifyContent: "center",
    alignItems: "center",
  },

  modalSegmentBadge: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 2,
    borderColor: "rgba(248,250,252,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  modalSegmentText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#facc15",
  },

  // 6 شرائح حول الدائرة لتمثيل 3% 5% 7% 8% 2% 10%
  modalSegment1: {
    top: 14,
  },

  modalSegment2: {
    top: 44,
    right: 22,
  },

  modalSegment3: {
    bottom: 44,
    right: 22,
  },

  modalSegment4: {
    bottom: 14,
  },

  modalSegment5: {
    bottom: 44,
    left: 22,
  },

  modalSegment6: {
    top: 44,
    left: 22,
  },

  modalWheelPointer: {
    position: "absolute",
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#facc15",
    zIndex: 2,
  },

  rewardBanner: {
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(22,163,74,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.6)",
    alignItems: "center",
  },

  rewardBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#bbf7d0",
  },

  rewardBannerValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#4ade80",
  },

  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  modalButtonSecondary: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#4b5563",
  },

  modalButtonPrimary: {
    marginLeft: 8,
    backgroundColor: "#22c55e",
  },

  modalButtonDisabled: {
    opacity: 0.6,
  },

  modalButtonSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e5e7eb",
  },

  modalButtonPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#022c22",
  },

  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.5)",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f9fafb",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  confirmLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#facc15",
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#64748b",
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  confirmBtnOk: {
    backgroundColor: "#22c55e",
  },
  confirmBtnOkText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#022c22",
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },

  // صفحة مكافآت الصندوق - خلفية ملكية
  boxRewardsScreen: {
    flex: 1,
    paddingTop: 50,
  },
  boxRewardsGoldTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  boxRewardsPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  boxRewardsDiamond: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
  },
  boxDiamond1: { top: 120, left: -30 },
  boxDiamond2: { top: 200, right: -20 },
  boxDiamond3: { bottom: 150, left: "40%" },
  boxRewardsContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  boxRewardsBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  boxRewardsBackText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D4AF37",
  },
  boxRewardsHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  boxRewardsCrownWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.15)",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  boxRewardsTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fefce8",
    textAlign: "center",
  },
  boxRewardsSubtitle: {
    fontSize: 15,
    color: "#e9d5ff",
    marginTop: 8,
    textAlign: "center",
  },
  boxRewardsSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  boxRewardsSubtitleIcon: {
    marginLeft: 8,
  },
  boxRewardsSubtitleText: {
    fontSize: 14,
    color: "#e9d5ff",
    textAlign: "center",
    flexShrink: 1,
  },
  boxRewardsSubtitleHighlight: {
    color: "#facc15",
    fontWeight: "800",
  },
  boxRewardsCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    padding: 24,
  },
  boxRewardsCardInner: {
    backgroundColor: "rgba(13,2,33,0.6)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
  },
  royalSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fefce8",
    textAlign: "center",
    marginBottom: 16,
  },
  royalThrone: {
    marginBottom: 20,
    alignItems: "center",
  },
  royalThroneBack: {
    width: "100%",
    maxWidth: 260,
    height: 36,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "rgba(147,51,234,0.35)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
  },
  royalThroneSeat: {
    marginTop: -6,
    width: "100%",
    maxWidth: 280,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.6)",
    alignItems: "center",
  },
  royalGiftsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: 12,
  },
  royalGiftItem: {
    alignItems: "center",
    flex: 1,
  },
  royalGiftCrystal: {
    width: 62,
    height: 62,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "rgba(244,244,245,0.7)",
    backgroundColor: "rgba(56,189,248,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  royalGiftInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(15,23,42,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  royalGiftImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  royalGiftEmoji: {
    fontSize: 26,
  },
  royalGiftLabel: {
    marginTop: 8,
    fontSize: 11,
    color: "#e5e7eb",
    textAlign: "center",
  },
  boxRewardsBoxRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  boxRewardItem: {
    alignItems: "center",
  },
  boxRewardBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  boxRewardBoxLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  boxRewardsHint: {
    fontSize: 14,
    color: "#c4b5fd",
    lineHeight: 22,
    textAlign: "center",
  },
  throneSection: {
    marginTop: 24,
    borderRadius: 24,
    overflow: "hidden",
  },
  throneImage: {
    width: "100%",
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  throneImageInner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  throneCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  throneBoxLottie: {
    width: 120,
    height: 120,
  },
  throneButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.95)",
  },
  throneButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  winnersCard: {
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.8)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  winnersHeader: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 6,
    alignSelf: "center",
    marginBottom: 10,
  },
  winnersHeaderText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f9fafb",
  },
  winnersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  winnerItem: {
    flex: 1,
    alignItems: "center",
  },
  winnerItemCenter: {
    transform: [{ translateY: -6 }],
  },
  winnerAvatarOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  winnerAvatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(15,23,42,0.96)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.9)",
  },
  winnerAvatarInnerBig: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 4,
  },
  winnerName: {
    fontSize: 11,
    color: "#e5e7eb",
    textAlign: "center",
  },
  winnerFireFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  winnerFireFrameImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  rewardsSection: {
    marginTop: 24,
    gap: 16,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 4,
  },
  rewardsBoxCard: {
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rewardsBoxHeader: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    backgroundColor: "rgba(59,130,246,0.7)",
    marginBottom: 10,
  },
  rewardsBoxHeaderText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f9fafb",
  },
  rewardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  advancedRowWrapper: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  advancedRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  rewardItem: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(30,64,175,0.7)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.6)",
  },
  advancedRewardItem: {
    width: 90,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 2,
    borderColor: "rgba(56,189,248,0.8)",
  },
  advancedRewardIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  rewardItemIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  rewardItemEmoji: {
    fontSize: 22,
  },
  rewardItemLabel: {
    fontSize: 11,
    color: "#e5e7eb",
    textAlign: "center",
  },
  rewardItemCount: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#bfdbfe",
  },
  bouquetEffectOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bouquetEffectBubble: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
  },
  bouquetEffectBubbleInner: {
    width: "100%",
    height: "100%",
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(253,224,71,0.9)",
  },
  bouquetEffectEmojiText: {
    fontSize: 52,
  },
  bouquetStar: {
    position: "absolute",
  },
  bouquetStar1: {
    top: "30%",
    right: "20%",
  },
  bouquetStar2: {
    top: "55%",
    left: "18%",
  },
  bouquetStar3: {
    bottom: "25%",
    right: "40%",
  },
  palaceEffectOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  palaceEffectImageWrap: {
    width: "160%",
    height: "80%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(250,204,21,0.8)",
  },
  palaceEffectImage: {
    width: "100%",
    height: "100%",
  },
  palaceStar: {
    position: "absolute",
  },
  palaceStar1: {
    top: "35%",
    right: "20%",
  },
  palaceStar2: {
    top: "55%",
    left: "22%",
  },
  palaceStar3: {
    bottom: "30%",
    right: "45%",
  },
});