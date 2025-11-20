import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === "web") {
      console.log("Push notifications not supported on web");
      return undefined;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return undefined;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "p03ynwm0kjgdsyleu570j",
      });

      console.log("Push token obtained:", token.data);
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      Alert.alert("Error", "Failed to register for push notifications");
      return undefined;
    }
  }

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        try {
          await supabase.from("push_tokens").upsert({
            user_id: user.id,
            token,
          });
          console.log("Token registered with backend");
        } catch (error) {
          console.error("Failed to register token with backend:", error);
        }
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification tapped:", response);
        const data = response.notification.request.content.data;
        
        if (data.roomId && data.type === "new_message") {
          router.push(`/room/${data.roomId}`);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  return useMemo(() => ({
    expoPushToken,
  }), [expoPushToken]);
});
