
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inForgotPassword = segments[0] === "forgot-password";

    console.log('[RootLayoutNav] Auth state:', { isAuthenticated, isLoading, segments });

    if (!isAuthenticated && !inAuthGroup && !inForgotPassword) {
      console.log('[RootLayoutNav] Redirecting to auth');
      router.replace("/auth");
    } else if (isAuthenticated && (inAuthGroup || inForgotPassword)) {
      console.log('[RootLayoutNav] Redirecting to home');
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="room/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NestedProviders />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function NestedProviders() {
  const { user, isLoading } = useAuth();
  
  return (
    <GestureHandlerRootView style={styles.gestureHandler}>
      {!isLoading && (
        <NotificationProvider user={user}>
          <ChatProvider user={user}>
            <RootLayoutNav />
          </ChatProvider>
        </NotificationProvider>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
});
