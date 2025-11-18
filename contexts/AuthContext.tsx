import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useState } from "react";
import { User } from "@/types/chat";
import { trpc } from "@/lib/trpc";
import { setSession, clearSession, getSession } from "@/lib/trpc";
import { Alert } from "react-native";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: meData, refetch: refetchMe } = trpc.auth.me.useQuery(undefined, {
    enabled: false,
  });

  const loginMutation = trpc.auth.login.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();

  const loadAuth = useCallback(async () => {
    try {
      const sessionId = await getSession();
      if (sessionId) {
        const result = await refetchMe();
        if (result.data) {
          setUser(result.data);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Error loading auth:", error);
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [refetchMe]);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await loginMutation.mutateAsync({ email, password });
        await setSession(result.sessionId);
        setUser(result.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Login error:", error);
        Alert.alert("Error", "Invalid email or password");
        throw error;
      }
    },
    [loginMutation]
  );

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const result = await signupMutation.mutateAsync({
          email,
          password,
          name,
        });
        await setSession(result.sessionId);
        setUser(result.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Signup error:", error);
        Alert.alert("Error", "Email already in use");
        throw error;
      }
    },
    [signupMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await clearSession();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [logoutMutation]);

  const deleteAccount = useCallback(async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      await clearSession();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
    }
  }, [deleteAccountMutation]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    deleteAccount,
  };
});
