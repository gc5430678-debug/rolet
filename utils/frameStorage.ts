import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "app_selectedFrame";

export type FrameId = "none" | "gold-shimmer" | "vip-glow" | "royal-blue";

const VALID_FRAMES: FrameId[] = ["none", "gold-shimmer", "vip-glow", "royal-blue"];

export async function getSelectedFrame(): Promise<FrameId> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v && VALID_FRAMES.includes(v as FrameId)) return v as FrameId;
  } catch {}
  return "none";
}

export async function setSelectedFrame(frameId: FrameId): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, frameId);
  } catch {}
}
