/**
 * LiveKit voice integration for group chat.
 * Requires @livekit/react-native and development build (not Expo Go).
 */

export type LiveKitVoiceState = "disconnected" | "connecting" | "connected" | "error";

let currentState: LiveKitVoiceState = "disconnected";

export function getLiveKitVoiceState(): LiveKitVoiceState {
  return currentState;
}

export function setLiveKitVoiceState(state: LiveKitVoiceState): void {
  currentState = state;
}

/**
 * Connect to LiveKit room with token and wsUrl.
 * Returns cleanup function to disconnect.
 */
export async function connectLiveKitVoice(
  token: string,
  wsUrl: string,
  _roomName?: string
): Promise<() => void> {
  try {
    setLiveKitVoiceState("connecting");
    const { Room } = await import("@livekit/react-native");
    const room = new Room();
    await room.connect(wsUrl, token);
    setLiveKitVoiceState("connected");
    return () => {
      room.disconnect();
      setLiveKitVoiceState("disconnected");
    };
  } catch (err) {
    setLiveKitVoiceState("error");
    throw err;
  }
}
