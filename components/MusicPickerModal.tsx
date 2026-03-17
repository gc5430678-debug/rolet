import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BG = "#1a1625";
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const ACCENT = "#a78bfa";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (uri: string, filename?: string) => void;
};

export default function MusicPickerModal({ visible, onClose, onSelect }: Props) {
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    try {
      setLoading(true);
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      onSelect(file.uri, file.name);
      onClose();
    } catch (err) {
      console.warn("MusicPickerModal error:", err);
      Alert.alert("خطأ", "لتحديد أغنية قم بتثبيت: npx expo install expo-document-picker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>اختر أغنية</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={pickFile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={BG} />
            ) : (
              <>
                <Ionicons name="musical-notes" size={22} color={BG} />
                <Text style={styles.btnText}>اختيار من الجهاز</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: BG,
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 320,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT_LIGHT,
    marginBottom: 20,
    textAlign: "center",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
    color: BG,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
});
