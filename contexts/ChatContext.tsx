import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo, useEffect, useState } from "react";
import { Room, Message } from "@/types/chat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

export const [ChatProvider, useChat] = createContextHook(() => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const fetchRooms = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data: roomMembers, error: membersError } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", user.id);

      if (membersError) {
        console.error("Error fetching rooms:", JSON.stringify(membersError, null, 2));
        throw membersError;
      }

      const roomIds = roomMembers.map((rm) => rm.room_id);

      if (roomIds.length === 0) {
        setRooms([]);
        return;
      }

      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .in("id", roomIds)
        .order("created_at", { ascending: false });

      if (roomsError) {
        console.error("Error fetching rooms data:", JSON.stringify(roomsError, null, 2));
        throw roomsError;
      }

      const roomsWithMessages = await Promise.all(
        roomsData.map(async (room) => {
          const { data: messages, error: messagesError } = await supabase
            .from("messages")
            .select(`
              id,
              text,
              created_at,
              user_id,
              profiles!inner(name)
            `)
            .eq("room_id", room.id)
            .order("created_at", { ascending: true });

          if (messagesError) {
            console.error("Error fetching messages:", JSON.stringify(messagesError, null, 2));
            throw messagesError;
          }

          const formattedMessages: Message[] = messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.profiles.name,
            timestamp: new Date(msg.created_at).getTime(),
            roomId: room.id,
          }));

          return {
            id: room.id,
            name: room.name,
            code: room.code,
            createdAt: new Date(room.created_at).getTime(),
            messages: formattedMessages,
          };
        })
      );

      setRooms(roomsWithMessages);
    } catch (error: any) {
      console.error("Error fetching rooms:", JSON.stringify(error, null, 2));
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [user, fetchRooms]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("room-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchRooms();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRooms]);

  const createRoom = useCallback(
    async (name: string): Promise<Room> => {
      if (!user) throw new Error("User not authenticated");

      try {
        console.log("[ChatContext] Creating room:", { name, userId: user.id });
        const code = generateCode();
        console.log("[ChatContext] Generated code:", code);

        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .insert({
            name,
            code,
            created_by: user.id,
          })
          .select()
          .single();

        if (roomError) {
          console.error("[ChatContext] Room insert error:", JSON.stringify(roomError, null, 2));
          throw roomError;
        }

        console.log("[ChatContext] Room created:", room.id);

        const { error: memberError } = await supabase
          .from("room_members")
          .insert({
            room_id: room.id,
            user_id: user.id,
          });

        if (memberError) {
          console.error("[ChatContext] Member insert error:", JSON.stringify(memberError, null, 2));
          throw memberError;
        }

        console.log("[ChatContext] Member added successfully");

        const newRoom: Room = {
          id: room.id,
          name: room.name,
          code: room.code,
          createdAt: new Date(room.created_at).getTime(),
          messages: [],
        };

        await fetchRooms();
        return newRoom;
      } catch (error: any) {
        console.error("[ChatContext] Create room error:", error);
        console.error("[ChatContext] Error details:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        });
        
        let errorMessage = "Failed to create room";
        if (error?.message) {
          errorMessage += ": " + error.message;
        }
        
        Alert.alert("Error", errorMessage);
        throw error;
      }
    },
    [user, fetchRooms]
  );

  const joinRoom = useCallback(
    async (code: string): Promise<Room | null> => {
      if (!user) throw new Error("User not authenticated");

      try {
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", code.toUpperCase())
          .single();

        if (roomError || !room) {
          Alert.alert("Error", "Room not found");
          return null;
        }

        const { data: existingMember } = await supabase
          .from("room_members")
          .select("*")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .single();

        if (!existingMember) {
          const { error: memberError } = await supabase
            .from("room_members")
            .insert({
              room_id: room.id,
              user_id: user.id,
            });

          if (memberError) throw memberError;
        }

        await fetchRooms();

        return {
          id: room.id,
          name: room.name,
          code: room.code,
          createdAt: new Date(room.created_at).getTime(),
          messages: [],
        };
      } catch (error) {
        console.error("Join room error:", error);
        Alert.alert("Error", "Failed to join room");
        return null;
      }
    },
    [user, fetchRooms]
  );

  const sendMessage = useCallback(
    async (roomId: string, text: string) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("messages").insert({
          room_id: roomId,
          user_id: user.id,
          text,
        });

        if (error) throw error;

        await fetchRooms();
      } catch (error) {
        console.error("Send message error:", error);
        Alert.alert("Error", "Failed to send message");
      }
    },
    [user, fetchRooms]
  );

  const deleteRoom = useCallback(
    async (roomId: string) => {
      try {
        const { error } = await supabase.from("rooms").delete().eq("id", roomId);

        if (error) throw error;

        await fetchRooms();
      } catch (error) {
        console.error("Delete room error:", error);
        Alert.alert("Error", "Failed to delete room");
      }
    },
    [fetchRooms]
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
      refetchRooms: fetchRooms,
    }),
    [rooms, user, isLoading, createRoom, joinRoom, sendMessage, deleteRoom, fetchRooms]
  );
});
