import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
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
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

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

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.log("No EAS project ID configured, skipping push token registration");
        console.log("To enable push notifications, configure EAS project ID in app.json");
        return undefined;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("Push token obtained:", token.data);
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return undefined;
    }
  }

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        
        if (!isMounted) return;
        
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
      } catch (error) {
        console.error("Error in notification setup:", error);
      }
    };

    setupNotifications();

    try {
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
    } catch (error) {
      console.error("Error setting up notification listeners:", error);
    }

    return () => {
      isMounted = false;
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        console.error("Error removing notification listeners:", error);
      }
    };
  }, [user]);

  return useMemo(() => ({
    expoPushToken,
  }), [expoPushToken]);
});
