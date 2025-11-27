import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { Mail, UserCircle2, AtSign, Lock } from "lucide-react-native";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (isSignup && !name.trim()) {
      Alert.alert("Error", "Please enter your display name");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      if (isSignup) {
        console.log('[AuthScreen] Attempting signup');
        await signup(email.trim(), password.trim(), name.trim());
        console.log('[AuthScreen] Signup successful');
      } else {
        console.log('[AuthScreen] Attempting login');
        await login(email.trim(), password.trim());
        console.log('[AuthScreen] Login successful');
      }
    } catch (error) {
      console.error('[AuthScreen] Auth error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <UserCircle2 size={80} color="#007AFF" strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>
                {isSignup ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={styles.subtitle}>
                {isSignup
                  ? "Join the conversation with your friends"
                  : "Sign in to continue chatting"}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color="#8E8E93" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#8E8E93"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color="#8E8E93" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isSignup ? "password-new" : "password"}
                />
              </View>

              {isSignup && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <AtSign size={20} color="#8E8E93" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Display Name"
                    placeholderTextColor="#8E8E93"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {isSignup ? "Create Account" : "Sign In"}
                </Text>
              </TouchableOpacity>

              {!isSignup && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isSignup
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
                  <Text style={styles.switchLink}>
                    {isSignup ? "Sign In" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5F1FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 16,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFF",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  switchText: {
    fontSize: 15,
    color: "#8E8E93",
  },
  switchLink: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#007AFF",
  },
  forgotPasswordButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500" as const,
  },
});
