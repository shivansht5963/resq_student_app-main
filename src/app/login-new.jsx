import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import GridBackground from "@/components/GridBackground";
import ErrorModal from "@/components/ErrorModal";
import { loginUser, setAuthToken } from "@/utils/api";
import { useTheme } from "@/utils/useTheme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      setError({
        status: 400,
        message: "Please enter your email",
        type: "BAD_REQUEST",
        detail: "Email is required",
      });
      setShowErrorModal(true);
      return;
    }

    if (!password.trim()) {
      setError({
        status: 400,
        message: "Please enter your password",
        type: "BAD_REQUEST",
        detail: "Password is required",
      });
      setShowErrorModal(true);
      return;
    }

    if (!email.includes("@")) {
      setError({
        status: 400,
        message: "Please enter a valid email address",
        type: "BAD_REQUEST",
        detail: "Invalid email format",
      });
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(email, password);
      
      // Token should be automatically stored by loginUser
      if (response.token) {
        // Navigate to home
        router.replace("/home");
      } else {
        throw new Error("No token received from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError({
        status: err.status || 500,
        message: err.message || "Login failed. Please try again.",
        type: err.type || "ERROR",
        detail: err.detail,
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <GridBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={{ alignItems: "center", marginBottom: 50, marginTop: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: "#8B5CF6",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#8B5CF6",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 36, fontWeight: "bold", color: "#FFFFFF" }}>
                ⚡
              </Text>
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: isDark ? "#FFFFFF" : "#1F2937",
                marginTop: 20,
              }}
            >
              ResQ
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 8,
              }}
            >
              Emergency Response System
            </Text>
          </View>

          {/* Header Text */}
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: isDark ? "#FFFFFF" : "#1F2937",
                marginBottom: 8,
              }}
            >
              Welcome Back
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9CA3AF" : "#6B7280",
                lineHeight: 20,
              }}
            >
              Sign in to your account to access emergency services
            </Text>
          </View>

          {/* Email Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#E5E7EB" : "#4B5563",
                marginBottom: 8,
              }}
            >
              Email Address
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                borderRadius: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#E5E7EB",
                height: 52,
              }}
            >
              <Mail size={20} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: isDark ? "#FFFFFF" : "#1F2937",
                  padding: 0,
                }}
                placeholder="student@example.com"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#E5E7EB" : "#4B5563",
                marginBottom: 8,
              }}
            >
              Password
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                borderRadius: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#E5E7EB",
                height: 52,
              }}
            >
              <Lock size={20} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: isDark ? "#FFFFFF" : "#1F2937",
                  padding: 0,
                }}
                placeholder="••••••••"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Eye size={20} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                ) : (
                  <EyeOff size={20} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#8B5CF6",
              height: 52,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 30,
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  letterSpacing: 0.5,
                }}
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#9CA3AF" : "#6B7280",
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              By signing in, you agree to our{"\n"}
              <Text style={{ fontWeight: "600" }}>Terms of Service</Text> and{" "}
              <Text style={{ fontWeight: "600" }}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Demo Credentials */}
          <View
            style={{
              marginTop: 30,
              padding: 14,
              backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginBottom: 6,
                fontWeight: "600",
              }}
            >
              Test Credentials
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#D1D5DB" : "#4B5563",
                lineHeight: 18,
              }}
            >
              Email: student@example.com{"\n"}
              Password: password123
            </Text>
          </View>
        </ScrollView>

        {/* Error Modal */}
        <ErrorModal
          visible={showErrorModal}
          error={error}
          onDismiss={() => {
            setShowErrorModal(false);
            setError(null);
          }}
        />
      </GridBackground>
    </KeyboardAvoidingView>
  );
}
