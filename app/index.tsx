import { useChat } from "@/contexts/ChatContext";
import { router } from "expo-router";
import {
  MessageCircle,
  Plus,
  Hash,
  Trash2,
  UserCircle,
} from "lucide-react-native";
import { useState } from "react";
import ProfileEditModal from "@/components/ProfileEditModal";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { rooms, createRoom, joinRoom, deleteRoom } = useChat();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");


  const handleCreateRoom = async () => {
    if (roomName.trim()) {
      const newRoom = await createRoom(roomName.trim());
      setRoomName("");
      setShowCreateModal(false);
      router.push(`/room/${newRoom.id}`);
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.trim()) {
      const room = await joinRoom(roomCode.trim());
      setRoomCode("");
      setShowJoinModal(false);
      if (room) {
        router.push(`/room/${room.id}`);
      }
    }
  };

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    Alert.alert(
      "Delete Room",
      `Are you sure you want to delete "${roomName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => await deleteRoom(roomId),
        },
      ]
    );
  };

  const sortedRooms = [...rooms].sort((a, b) => {
    const aLastMessage = a.messages[a.messages.length - 1];
    const bLastMessage = b.messages[b.messages.length - 1];
    const aTime = aLastMessage?.timestamp || a.createdAt;
    const bTime = bLastMessage?.timestamp || b.createdAt;
    return bTime - aTime;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MessageCircle size={32} color="#007AFF" strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Chats</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <UserCircle size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.createButton]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Create Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton]}
            onPress={() => setShowJoinModal(true)}
          >
            <Hash size={20} color="#007AFF" strokeWidth={2.5} />
            <Text style={styles.joinButtonText}>Join Room</Text>
          </TouchableOpacity>
        </View>

        {rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#C7C7CC" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Rooms Yet</Text>
            <Text style={styles.emptyText}>
              Create a new room or join one with a code
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedRooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const lastMessage = item.messages[item.messages.length - 1];
              const messageCount = item.messages.length;

              return (
                <TouchableOpacity
                  style={styles.roomCard}
                  onPress={() => router.push(`/room/${item.id}`)}
                  onLongPress={() => handleDeleteRoom(item.id, item.name)}
                >
                  <View style={styles.roomIcon}>
                    <Hash size={24} color="#007AFF" strokeWidth={2} />
                  </View>
                  <View style={styles.roomInfo}>
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomName}>{item.name}</Text>
                      <Text style={styles.roomCode}>{item.code}</Text>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {lastMessage
                        ? `${lastMessage.sender}: ${lastMessage.text}`
                        : "No messages yet"}
                    </Text>
                  </View>
                  <View style={styles.roomMeta}>
                    {messageCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{messageCount}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteRoom(item.id, item.name)}
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create New Room</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Room name"
                  placeholderTextColor="#8E8E93"
                  value={roomName}
                  onChangeText={setRoomName}
                  autoFocus
                  onSubmitEditing={handleCreateRoom}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleCreateRoom}
                  >
                    <Text style={styles.confirmButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowJoinModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Join Room</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter room code"
                  placeholderTextColor="#8E8E93"
                  value={roomCode}
                  onChangeText={setRoomCode}
                  autoCapitalize="characters"
                  autoFocus
                  onSubmitEditing={handleJoinRoom}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowJoinModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleJoinRoom}
                  >
                    <Text style={styles.confirmButtonText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <ProfileEditModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#F2F2F7",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700" as const,
    color: "#000",
    letterSpacing: 0.4,
  },
  profileButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButton: {
    backgroundColor: "#007AFF",
  },
  joinButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  joinButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: "#000",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  roomInfo: {
    flex: 1,
    gap: 6,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#000",
    flex: 1,
  },
  roomCode: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#007AFF",
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lastMessage: {
    fontSize: 15,
    color: "#8E8E93",
  },
  roomMeta: {
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: 320,
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#F2F2F7",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFF",
  },

});
