import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo } from "react";
import { Room } from "@/types/chat";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Alert } from "react-native";

export const [ChatProvider, useChat] = createContextHook(() => {
  const { user } = useAuth();
  
  const { data: rooms = [], refetch: refetchRooms, isLoading } = trpc.rooms.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createRoomMutation = trpc.rooms.create.useMutation();
  const joinRoomMutation = trpc.rooms.join.useMutation();
  const deleteRoomMutation = trpc.rooms.delete.useMutation();
  const sendMessageMutation = trpc.messages.send.useMutation();

  const createRoom = useCallback(
    async (name: string): Promise<Room> => {
      try {
        const room = await createRoomMutation.mutateAsync({ name });
        await refetchRooms();
        return room;
      } catch (error) {
        console.error("Create room error:", error);
        Alert.alert("Error", "Failed to create room");
        throw error;
      }
    },
    [createRoomMutation, refetchRooms]
  );

  const joinRoom = useCallback(
    async (code: string): Promise<Room | null> => {
      try {
        const room = await joinRoomMutation.mutateAsync({ code });
        await refetchRooms();
        return room;
      } catch (error) {
        console.error("Join room error:", error);
        Alert.alert("Error", "Room not found");
        return null;
      }
    },
    [joinRoomMutation, refetchRooms]
  );

  const sendMessage = useCallback(
    async (roomId: string, text: string) => {
      if (!user) return;

      try {
        await sendMessageMutation.mutateAsync({ roomId, text });
        await refetchRooms();
      } catch (error) {
        console.error("Send message error:", error);
        Alert.alert("Error", "Failed to send message");
      }
    },
    [user, sendMessageMutation, refetchRooms]
  );

  const deleteRoom = useCallback(
    async (roomId: string) => {
      try {
        await deleteRoomMutation.mutateAsync({ roomId });
        await refetchRooms();
      } catch (error) {
        console.error("Delete room error:", error);
        Alert.alert("Error", "Failed to delete room");
      }
    },
    [deleteRoomMutation, refetchRooms]
  );

  return useMemo(
    () => ({
      rooms,
      currentUser: user,
      isLoading,
      createRoom,
      joinRoom,
      sendMessage,
      deleteRoom,
      refetchRooms,
    }),
    [
      rooms,
      user,
      isLoading,
      createRoom,
      joinRoom,
      sendMessage,
      deleteRoom,
      refetchRooms,
    ]
  );
});
