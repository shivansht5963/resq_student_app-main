import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Shield } from "lucide-react-native";
import GridBackground from "@/components/GridBackground";
import { useTheme } from "@/utils/useTheme";

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Glow animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    glow.start();

    // Navigate to login after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2500);

    return () => {
      clearTimeout(timer);
      glow.stop();
    };
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [1, 1.3],
    outputRange: [0.3, 0.6],
  });

  return (
    <GridBackground>
      <StatusBar style={colors.statusBar} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Glow rings */}
        <Animated.View
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: colors.primary,
            transform: [{ scale: glowAnim }],
            opacity: glowOpacity,
          }}
        />

        {/* Logo */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
            marginBottom: 24,
          }}
        >
          <Shield size={80} color={colors.primary} strokeWidth={2.5} />
        </View>

        {/* App name */}
        <Text
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: colors.primary,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          ResQ
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: "500",
          }}
        >
          Your Campus Safety Companion
        </Text>
      </View>
    </GridBackground>
  );
}
