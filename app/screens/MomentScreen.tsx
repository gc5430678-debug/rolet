import { StyleSheet, Text, View } from "react-native";

const TEXT_LIGHT = "#f5f3ff";
const TEXT_MUTED = "#a1a1aa";

export default function MomentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>لحظة</Text>
      <Text style={styles.subtitle}>لحظاتك تظهر هنا</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_LIGHT,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    paddingHorizontal: 20,
  },
});
