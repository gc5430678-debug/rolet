import React from "react";
import { View, StyleSheet } from "react-native";
import { AD_UNITS } from "../utils/adConfig";

export function AdBanner() {
  if (!AD_UNITS.BANNER) return null;
  try {
    const { BannerAd, BannerAdSize } = require("react-native-google-mobile-ads");
    return (
      <View style={styles.wrap}>
        <BannerAd unitId={AD_UNITS.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>
    );
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
