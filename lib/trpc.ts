import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "@chat_app_session";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const getSession = async (): Promise<string | null> => {
  return AsyncStorage.getItem(SESSION_KEY);
};

export const setSession = async (sessionId: string): Promise<void> => {
  await AsyncStorage.setItem(SESSION_KEY, sessionId);
};

export const clearSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: async () => {
        const sessionId = await getSession();
        return sessionId ? { "x-session-id": sessionId } : {};
      },
      fetch: async (url, options) => {
        console.log("[tRPC Client] Making request to:", url);
        console.log("[tRPC Client] Request method:", options?.method);
        console.log("[tRPC Client] Request headers:", options?.headers);
        console.log("[tRPC Client] Request body:", options?.body);
        
        try {
          const response = await fetch(url, options);
          console.log("[tRPC Client] Response status:", response.status);
          console.log("[tRPC Client] Response Content-Type:", response.headers.get('content-type'));
          
          if (!response.ok) {
            const text = await response.clone().text();
            console.error("[tRPC Client] Error response body:", text.substring(0, 500));
          }
          
          return response;
        } catch (error) {
          console.error("[tRPC Client] Fetch error:", error);
          throw error;
        }
      },
    }),
  ],
});
