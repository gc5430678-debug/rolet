/**
 * إطار بروفايل فخم متحرك — تدرجات ذهبية وبنفسجية مع تأثير shimmer
 * للإطارات Lottie: أضف ملفات في assets/animations/frames/ من LottieFiles
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { FrameId } from "../utils/frameStorage";

type Props = {
  frameId: FrameId;
  size: number;
  imageUri?: string | null;
  children?: React.ReactNode;
};

const GOLD = ["#fde047", "#fbbf24", "#f59e0b", "#d97706", "#fbbf24"];
const VIP_PURPLE = ["#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#a78bfa"];
const ROYAL_BLUE = ["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#60a5fa"];

export default function ProfileFrameView({ frameId, size, imageUri, children }: Props) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (frameId === "none") return;
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [frameId, shimmerAnim]);

  useEffect(() => {
    if (frameId === "vip-glow" || frameId === "royal-blue") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.98, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [frameId, pulseAnim]);

  const borderWidth = frameId === "none" ? 0 : 5;
  const innerSize = size - borderWidth * 2;

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (frameId === "gold-shimmer") return GOLD;
    if (frameId === "vip-glow") return VIP_PURPLE;
    if (frameId === "royal-blue") return ROYAL_BLUE;
    return ["transparent", "transparent"];
  };

  const hasGradientFrame = frameId === "gold-shimmer" || frameId === "vip-glow" || frameId === "royal-blue";

  if (frameId === "none") {
    return (
      <View style={[styles.outer, { width: size, height: size }]}>
        <View style={[styles.imageWrap, { width: size, height: size, borderRadius: size / 2 }]}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.outer, { width: size, height: size }]}>
      {hasGradientFrame && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: frameId === "vip-glow" || frameId === "royal-blue" ? [{ scale: pulseAnim }] : [],
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors() as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
        </Animated.View>
      )}

      <View style={[styles.imageWrap, { width: innerSize, height: innerSize, borderRadius: innerSize / 2, left: borderWidth, top: borderWidth }]}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : children}
      </View>

      {frameId === "gold-shimmer" && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              opacity: shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0.2] }),
            },
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.5)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: "center", justifyContent: "center" },
  imageWrap: { position: "absolute", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
});
