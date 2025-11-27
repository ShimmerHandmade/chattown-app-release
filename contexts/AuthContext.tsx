import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useState, useMemo } from "react";
import { User } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";
import { Session } from "@supabase/supabase-js";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('[AuthContext] Loading profile for user:', userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('[AuthContext] Profile load error:', error);
        throw error;
      }

      if (data) {
        const profile = data as {
          id: string;
          email: string;
          name: string;
          bio: string;
          avatar_color: string;
        };
        console.log('[AuthContext] Profile loaded:', profile);
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          bio: profile.bio,
          avatarColor: profile.avatar_color,
        });
        setIsAuthenticated(true);
        console.log('[AuthContext] User authenticated');
      }
    } catch (error) {
      console.error("[AuthContext] Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert("Error", error.message || "Failed to create account");
      throw error;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Login auth error:', error);
        throw error;
      }

      console.log('[AuthContext] Login successful, user:', data.user?.id);
      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error("[AuthContext] Login error:", error);
      Alert.alert("Error", error.message || "Invalid email or password");
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      if (!user) return;

      const { error } = await supabase.rpc("delete_user");

      if (error) throw error;

      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error("Delete account error:", error);
      Alert.alert("Error", error.message || "Failed to delete account");
      throw error;
    }
  }, [user]);

  const updateProfile = useCallback(
    async (updates: { name?: string; bio?: string; avatarColor?: string }) => {
      try {
        if (!user) return;

        const updateData: { name?: string; bio?: string; avatar_color?: string } =
          {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.bio !== undefined) updateData.bio = updates.bio;
        if (updates.avatarColor !== undefined)
          updateData.avatar_color = updates.avatarColor;

        const { error } = await supabase
          .from("profiles")
          .update(updateData as any)
          .eq("id", user.id);

        if (error) throw error;

        setUser({
          ...user,
          name: updates.name ?? user.name,
          bio: updates.bio ?? user.bio,
          avatarColor: updates.avatarColor ?? user.avatarColor,
        });
      } catch (error: any) {
        console.error("Update profile error:", error);
        Alert.alert("Error", error.message || "Failed to update profile");
        throw error;
      }
    },
    [user]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) throw error;

      Alert.alert("Success", "Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Password reset error:", error);
      Alert.alert("Error", error.message || "Failed to send reset email");
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Password updated successfully");
    } catch (error: any) {
      console.error("Reset password error:", error);
      Alert.alert("Error", error.message || "Failed to reset password");
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      user,
      session,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout,
      deleteAccount,
      updateProfile,
      requestPasswordReset,
      resetPassword,
    }),
    [
      user,
      session,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout,
      deleteAccount,
      updateProfile,
      requestPasswordReset,
      resetPassword,
    ]
  );
});
