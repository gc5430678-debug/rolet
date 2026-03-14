import { Platform } from "react-native";

/**
 * إعدادات AdMob — اجمع نقاط حتى 10$
 *
 * App ID: ca-app-pub-6295703745962080~4344172011
 * إعلان 1 (أول زر): ca-app-pub-6295703745962080/6723554238
 * إعلان 2 (ثاني زر): ca-app-pub-6295703745962080/9820548331
 * كل إعلان يحسب على حدة في AdMob
 *
 * في التطوير: إعلانات تجريبية من Google
 */
const PROD_REWARDED_INTERSTITIAL = "ca-app-pub-6295703745962080/6723554238";
const PROD_REWARDED_INTERSTITIAL_2 = "ca-app-pub-6295703745962080/9820548331";
const PROD_REWARDED = "ca-app-pub-6295703745962080/6828641222";
const TEST_REWARDED_ANDROID = "ca-app-pub-3940256099942544/5224354917";
const TEST_REWARDED_IOS = "ca-app-pub-3940256099942544/1712485313";
const TEST_REWARDED_INTERSTITIAL_ANDROID = "ca-app-pub-3940256099942544/5354046379";
const TEST_REWARDED_INTERSTITIAL_IOS = "ca-app-pub-3940256099942544/6978759866";

export const AD_UNITS = {
  /** إعلان بيني مقابل مكافأة — الأول */
  REWARDED_INTERSTITIAL: __DEV__
    ? Platform.OS === "ios"
      ? TEST_REWARDED_INTERSTITIAL_IOS
      : TEST_REWARDED_INTERSTITIAL_ANDROID
    : PROD_REWARDED_INTERSTITIAL,
  /** إعلان بيني مقابل مكافأة — الثاني (تحت الأول) */
  REWARDED_INTERSTITIAL_2: __DEV__
    ? Platform.OS === "ios"
      ? TEST_REWARDED_INTERSTITIAL_IOS
      : TEST_REWARDED_INTERSTITIAL_ANDROID
    : PROD_REWARDED_INTERSTITIAL_2,
  /** إعلان مكافأة — احتياطي */
  REWARDED: __DEV__
    ? Platform.OS === "ios"
      ? TEST_REWARDED_IOS
      : TEST_REWARDED_ANDROID
    : PROD_REWARDED,
  BANNER: "",
} as const;
