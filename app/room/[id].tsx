import { useChat } from "@/contexts/ChatContext";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Send, Copy, ArrowLeft, Share2, User, Users, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import ProfileEditModal from "@/components/ProfileEditModal";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, currentUser, sendMessage, refetchRooms } = useChat();
  const [message, setMessage] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const room = rooms.find((r) => r.id === id);

  const fetchMembers = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("room_members")
        .select(`
          user_id,
          profiles!inner(
            id,
            name,
            email,
            avatar_color
          )
        `)
        .eq("room_id", id);

      if (error) throw error;

      const formattedMembers: Member[] = data.map((item: any) => ({
        id: item.profiles.id,
        name: item.profiles.name,
        email: item.profiles.email,
        avatarColor: item.profiles.avatar_color,
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load room members");
    }
  }, [id]);

  const removeUser = async (userId: string) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", id)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing user:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (room && room.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [room, room?.messages.length]);

  useEffect(() => {
    if (showMembersModal) {
      fetchMembers();
    }
  }, [showMembersModal, id, fetchMembers]);

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Room not found</Text>
      </View>
    );
  }

  const handleSend = () => {
    if (message.trim() && id) {
      sendMessage(id, message.trim());
      setMessage("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(room.code);
    Alert.alert("Copied!", `Room code "${room.code}" copied to clipboard`);
  };

  const shareCode = () => {
    Alert.alert(
      "Share Room Code",
      `Share this code with friends to join:\n\n${room.code}`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View>
              <Text style={styles.headerTitle}>{room.name}</Text>
              <Text style={styles.headerSubtitle}>Code: {room.code}</Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={copyCode} style={styles.headerButton}>
                <Copy size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareCode} style={styles.headerButton}>
                <Share2 size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowMembersModal(true);
                }}
                style={styles.headerButton}
              >
                <Users size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowProfileModal(true)}
                style={styles.headerButton}
              >
                <User size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {room.messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyText}>
              Send a message to get things going!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={room.messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            renderItem={({ item, index }) => {
              const isOwnMessage = item.sender === currentUser?.name;
              const previousMessage = index > 0 ? room.messages[index - 1] : null;
              const showSender =
                !previousMessage || previousMessage.sender !== item.sender;

              const date = new Date(item.timestamp);
              const timeString = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <View
                  style={[
                    styles.messageContainer,
                    isOwnMessage
                      ? styles.ownMessageContainer
                      : styles.otherMessageContainer,
                  ]}
                >
                  {showSender && !isOwnMessage && (
                    <Text style={styles.senderName}>{item.sender}</Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.ownMessage : styles.otherMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isOwnMessage
                          ? styles.ownMessageText
                          : styles.otherMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text
                      style={[
                        styles.timestamp,
                        isOwnMessage
                          ? styles.ownTimestamp
                          : styles.otherTimestamp,
                      ]}
                    >
                      {timeString}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <SafeAreaView edges={["bottom"]} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#8E8E93"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Send
                size={20}
                color={message.trim() ? "#FFF" : "#8E8E93"}
                fill={message.trim() ? "#FFF" : "transparent"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <ProfileEditModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <Modal
        visible={showMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Room Members</Text>
                <TouchableOpacity
                  onPress={() => setShowMembersModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.memberList}
                renderItem={({ item }) => (
                  <View style={styles.memberCard}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: item.avatarColor },
                      ]}
                    >
                      <Text style={styles.memberAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{item.name}</Text>
                      <Text style={styles.memberEmail}>{item.email}</Text>
                    </View>
                    {currentUser?.id !== item.id && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={async () => {
                          Alert.alert(
                            "Remove User",
                            `Are you sure you want to remove ${item.name} from this room?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Remove",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await removeUser(item.id);
                                    await fetchMembers();
                                    await refetchRooms();
                                    Alert.alert(
                                      "Success",
                                      `${item.name} has been removed from the room`
                                    );
                                  } catch {
                                    Alert.alert(
                                      "Error",
                                      "Failed to remove user"
                                    );
                                  }
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  keyboardView: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
  },
  backButton: {
    paddingRight: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#000",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "75%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#8E8E93",
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  ownMessage: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#FFF",
  },
  otherMessageText: {
    color: "#000",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  ownTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: "#8E8E93",
  },
  inputContainer: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000",
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E5EA",
  },
  errorText: {
    fontSize: 18,
    color: "#8E8E93",
    textAlign: "center",
  },
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
  memberList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#000",
  },
  memberEmail: {
    fontSize: 14,
    color: "#8E8E93",
  },
  removeButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFF",
  },
});
