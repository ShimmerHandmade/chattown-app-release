import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { MessageCircleOff } from "lucide-react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <MessageCircleOff size={64} color="#8E8E93" />
        <Text style={styles.title}>Page Not Found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back to chats</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F2F2F7",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: "#000",
  },
  link: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007AFF",
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFF",
  },
});
