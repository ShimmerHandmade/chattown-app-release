import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useState, useMemo } from "react";
import { User } from "@/types/chat";
import { supabase } from "@/lib/supabase";
import { Alert, Platform } from "react-native";
import { Session } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] Session error:', error);
        if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
          console.log('[AuthContext] Invalid refresh token, clearing session');
          supabase.auth.signOut().catch(e => console.error('[AuthContext] Error signing out:', e));
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }
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
      console.log('[AuthContext] Auth state change:', _event);
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
        console.error('[AuthContext] Profile load error:', JSON.stringify(error, null, 2));
        console.error('[AuthContext] Error code:', error.code);
        console.error('[AuthContext] Error message:', error.message);
        
        if (error.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found, waiting for trigger to create it...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryData, error: retryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          
          if (retryError && retryError.code === 'PGRST116') {
            console.log('[AuthContext] Profile still not found after retry, creating manually...');
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              throw new Error('User session not found');
            }
            
            const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A8E6CF'];
            const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
            
            const newProfile = {
              id: userId,
              email: user.email || '',
              name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
              bio: '',
              avatar_color: randomColor,
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single();
            
            if (createError) {
              console.error('[AuthContext] Failed to create profile:', createError);
              throw createError;
            }
            
            if (createdProfile) {
              console.log('[AuthContext] Profile created manually:', createdProfile);
              const profile = createdProfile as {
                id: string;
                email: string;
                name: string;
                bio: string;
                avatar_color: string;
              };
              setUser({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                bio: profile.bio,
                avatarColor: profile.avatar_color,
              });
              setIsAuthenticated(true);
              console.log('[AuthContext] User authenticated with manually created profile');
              return;
            }
          } else if (retryError) {
            console.error('[AuthContext] Retry failed:', JSON.stringify(retryError, null, 2));
            throw retryError;
          }
          
          if (retryData) {
            const profile = retryData as {
              id: string;
              email: string;
              name: string;
              bio: string;
              avatar_color: string;
            };
            console.log('[AuthContext] Profile loaded after retry:', profile);
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              bio: profile.bio,
              avatarColor: profile.avatar_color,
            });
            setIsAuthenticated(true);
            console.log('[AuthContext] User authenticated after retry');
            return;
          }
        } else {
          throw error;
        }
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
    } catch (error: any) {
      console.error("[AuthContext] Error loading profile:", JSON.stringify(error, null, 2));
      console.error("[AuthContext] Error details - message:", error?.message, "code:", error?.code);
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

      console.log('[AuthContext] Attempting to delete account');
      const { error } = await supabase.rpc("delete_user");

      if (error) {
        console.error('[AuthContext] Delete account RPC error:', JSON.stringify(error, null, 2));
        console.error('[AuthContext] Error code:', error.code);
        console.error('[AuthContext] Error message:', error.message);
        throw error;
      }

      console.log('[AuthContext] Account deleted, signing out');
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error('[AuthContext] Delete account error:', JSON.stringify(error, null, 2));
      console.error('[AuthContext] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      Alert.alert("Error", error.message || error.details || "Failed to delete account");
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

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('[AuthContext] Starting Google OAuth');
      
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/auth/callback`
        : 'rork-app://auth/callback';
      console.log('[AuthContext] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        console.error('[AuthContext] OAuth error:', error);
        Alert.alert('Error', error.message || 'Failed to sign in with Google');
        throw error;
      }

      if (Platform.OS !== 'web' && data?.url) {
        console.log('[AuthContext] Opening browser with URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('[AuthContext] Auth session result:', result);

        if (result.type === 'success' && result.url) {
          console.log('[AuthContext] Full callback URL:', result.url);
          
          const parsedUrl = Linking.parse(result.url);
          console.log('[AuthContext] Parsed URL:', parsedUrl);
          
          const url = new URL(result.url);
          const fragmentParams = new URLSearchParams(url.hash.substring(1));
          const queryParams = new URLSearchParams(url.search);
          
          const accessToken = fragmentParams.get('access_token') || queryParams.get('access_token') || parsedUrl.queryParams?.access_token;
          const refreshToken = fragmentParams.get('refresh_token') || queryParams.get('refresh_token') || parsedUrl.queryParams?.refresh_token;
          const errorDescription = fragmentParams.get('error_description') || queryParams.get('error_description') || parsedUrl.queryParams?.error_description;

          console.log('[AuthContext] Access token present:', !!accessToken);
          console.log('[AuthContext] Refresh token present:', !!refreshToken);

          if (errorDescription) {
            console.error('[AuthContext] OAuth returned error:', errorDescription);
            Alert.alert('Authentication Failed', errorDescription as string);
            return;
          }

          if (accessToken && refreshToken) {
            console.log('[AuthContext] Setting session with tokens');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken as string,
              refresh_token: refreshToken as string,
            });

            if (sessionError) {
              console.error('[AuthContext] Session error:', sessionError);
              Alert.alert('Error', sessionError.message || 'Failed to establish session');
              throw sessionError;
            }

            if (sessionData.user) {
              console.log('[AuthContext] User authenticated, loading profile');
              await loadUserProfile(sessionData.user.id);
              Alert.alert('Success', 'Signed in successfully!');
            }
          } else {
            console.error('[AuthContext] No tokens in callback URL');
            console.error('[AuthContext] URL hash:', url.hash);
            console.error('[AuthContext] URL search:', url.search);
            Alert.alert('Authentication Failed', 'No authentication tokens received');
          }
        } else if (result.type === 'cancel') {
          console.log('[AuthContext] User cancelled OAuth');
          Alert.alert('Cancelled', 'Sign in was cancelled');
        } else if (result.type === 'dismiss') {
          console.log('[AuthContext] User dismissed OAuth');
          Alert.alert('Cancelled', 'Sign in was dismissed');
        }
      }
    } catch (error: any) {
      console.error('[AuthContext] Google sign-in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
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
      signInWithGoogle,
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
      signInWithGoogle,
    ]
  );
});
