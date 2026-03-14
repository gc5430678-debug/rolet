import { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const SIZE = 52;
const X_ZONE_SIZE = 28;

type Props = {
  onOpen: () => void;
  onClose: () => void;
};

export default function GroupChatMiniFloating({ onOpen, onClose }: Props) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const defaultX = screenWidth - 18 - SIZE;
  const defaultY = Platform.OS === "ios" ? 60 : 40;

  const pan = useRef(new Animated.ValueXY()).current;
  const positionRef = useRef({ x: defaultX, y: defaultY });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(8, Math.min(screenWidth - SIZE - 8, positionRef.current.x + gestureState.dx));
        const newY = Math.max(8, Math.min(screenHeight - 180, positionRef.current.y + gestureState.dy));
        pan.setValue({
          x: newX - positionRef.current.x,
          y: newY - positionRef.current.y,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        const newX = Math.max(8, Math.min(screenWidth - SIZE - 8, positionRef.current.x + gestureState.dx));
        const newY = Math.max(8, Math.min(screenHeight - 180, positionRef.current.y + gestureState.dy));
        positionRef.current = { x: newX, y: newY };
        pan.flattenOffset();
        pan.setOffset({ x: newX, y: newY });
        pan.setValue({ x: 0, y: 0 });

        const moved = Math.abs(gestureState.dx) + Math.abs(gestureState.dy);
        if (moved < 12) {
          const tapScreenX = gestureState.x0 + gestureState.dx;
          const tapScreenY = gestureState.y0 + gestureState.dy;
          const localX = tapScreenX - positionRef.current.x;
          const localY = tapScreenY - positionRef.current.y;
          if (localX > SIZE - X_ZONE_SIZE && localY < X_ZONE_SIZE) {
            onClose();
          } else {
            onOpen();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    positionRef.current = { x: defaultX, y: defaultY };
    pan.setOffset({ x: defaultX, y: defaultY });
    pan.setValue({ x: 0, y: 0 });
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
      collapsable={false}
    >
      <View style={styles.inner} collapsable={false}>
        {Platform.OS === "ios" ? (
          <LinearGradient
            colors={["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        ) : (
          <View style={[styles.gradient, { backgroundColor: "#14b8a6" }]} />
        )}
        <View style={styles.chatIconWrap}>
          <Ionicons name="chatbubbles" size={22} color="#fff" />
        </View>
        <View style={styles.closeBtn}>
          <Ionicons name="close" size={14} color="#fff" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  inner: {
    width: SIZE,
    height: SIZE,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 12,
  },
  gradient: {
    width: SIZE,
    height: SIZE,
    borderRadius: 12,
  },
  chatIconWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
