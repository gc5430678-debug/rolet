import { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  name: string;
  gender?: "male" | "female" | string;
  onComplete?: () => void;
};

export default function ComingNotification({ name, gender = "male", onComplete }: Props) {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const isMale = gender === "male" || !gender;
    const durationIn = 400;
    const stayMs = 1800;
    const durationOut = 350;

    const useNative = Platform.OS === "ios";
    const anim = Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: durationIn,
        useNativeDriver: useNative,
      }),
      Animated.delay(stayMs),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: durationOut,
        useNativeDriver: useNative,
      }),
    ]);

    anim.start(() => onComplete?.());
    return () => anim.stop();
  }, [name, gender]);

  const isMale = gender === "male" || !gender;
  const bgColor = isMale ? "rgba(59, 130, 246, 0.55)" : "rgba(236, 72, 153, 0.55)";

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          backgroundColor: bgColor,
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Text style={styles.coming}>قادم</Text>
        <Text style={[styles.name, { marginHorizontal: 6 }]} numberOfLines={1}>{name || "—"}</Text>
        <View style={styles.gemWrap}>
          <Ionicons name="diamond" size={18} color="#fff" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    top: "50%",
    marginTop: -20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 15,
    overflow: "visible",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  coming: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    maxWidth: 100,
    letterSpacing: 0.2,
  },
  gemWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
