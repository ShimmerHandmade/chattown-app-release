import { db } from "../db";

interface PushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: Record<string, any>;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  const tokens = await db.getPushTokens(userId);
  
  if (tokens.length === 0) {
    return;
  }

  const messages: PushMessage[] = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log("Push notification sent:", result);
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}
