import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ACCENT_SOFT = "#c4b5fd";
const ACCENT_MUTED = "rgba(167, 139, 250, 0.25)";
const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";
const INPUT_BG = "rgba(255,255,255,0.05)";

type Props = {
  user: {
    name?: string;
    email: string;
    profileImage?: string;
  };
  onEditProfile: () => void;
};

export default function MeScreen({ user, onEditProfile }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={36} color={TEXT_MUTED} />
          </View>
        )}
        <Text style={styles.name}>{user.name || "أنا"}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={onEditProfile} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>تعديل الملف</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  card: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: INPUT_BG,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 20,
  },
  editBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: ACCENT_MUTED,
  },
  editBtnText: {
    fontSize: 14,
    color: ACCENT_SOFT,
    fontWeight: "600",
  },
});
