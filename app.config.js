/**
 * إعدادات Expo — في التطوير نستخدم App ID تجريبي من Google
 * حتى تظهر الإعلانات أثناء الاختبار.
 *
 * للإنتاج: استخدم App ID الحقيقي من AdMob > التطبيق > إعدادات
 * (صيغة: ca-app-pub-XXXX~YYYY — الرقم بعد ~ مختلف عن Ad Unit!)
 */
const appJson = require("./app.json");
const isDev = process.env.APP_VARIANT === "development" || process.env.NODE_ENV !== "production";

const TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const PROD_APP_ID = "ca-app-pub-6295703745962080~4344172011";

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    plugins: [
      [
        "expo-font",
        {
          fonts: ["./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"],
        },
      ],
      ...appJson.expo.plugins.map((p) => {
      if (Array.isArray(p) && p[0] === "react-native-google-mobile-ads") {
        return [
          "react-native-google-mobile-ads",
          {
            androidAppId: isDev ? TEST_APP_ID : PROD_APP_ID,
            iosAppId: isDev ? TEST_APP_ID : PROD_APP_ID,
          },
        ];
      }
      return p;
    }),
    ],
  },
};
