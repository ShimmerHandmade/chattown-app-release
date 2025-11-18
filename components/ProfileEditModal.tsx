import { useAuth } from "@/contexts/AuthContext";
import { X, LogOut, Trash2 } from "lucide-react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({
  visible,
  onClose,
}: ProfileEditModalProps) {
  const { user, logout, deleteAccount } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          onClose();
          router.replace("/auth");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              onClose();
              router.replace("/auth");
              Alert.alert("Success", "Your account has been deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.avatarContainer}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: user?.avatarColor || "#007AFF" },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {user?.name.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <LogOut size={20} color="#007AFF" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                >
                  <Trash2 size={20} color="#FF3B30" />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F2F2F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingBottom: 32,
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFF",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#000",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#8E8E93",
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#007AFF",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FF3B30",
  },
});
