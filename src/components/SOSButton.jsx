import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/utils/useTheme";

export default function SOSButton({ onSOSTrigger }) {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  // Continuous glow animation
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    glow.start();
    return () => glow.stop();
  }, []);

  const handlePressIn = () => {
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        // Trigger SOS
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSOSTrigger();
        resetButton();
      }
    });
  };

  const handlePressOut = () => {
    resetButton();
  };

  const resetButton = () => {
    setIsPressed(false);
    progressAnim.setValue(0);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handlePressIn,
      onPanResponderRelease: handlePressOut,
      onPanResponderTerminate: handlePressOut,
    }),
  ).current;

  const progressRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [1, 1.15],
    outputRange: [0.2, 0.4],
  });

  return (
    <View style={styles.container}>
      {/* Outer glow rings - continuously animating */}
      <Animated.View
        style={[
          styles.glowRing1,
          {
            borderColor: colors.primary,
            transform: [{ scale: glowAnim }],
            opacity: glowOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing2,
          {
            borderColor: colors.primary,
            transform: [{ scale: Animated.multiply(glowAnim, 1.1) }],
            opacity: Animated.multiply(glowOpacity, 0.6),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing3,
          {
            borderColor: colors.primary,
            transform: [{ scale: Animated.multiply(glowAnim, 1.2) }],
            opacity: Animated.multiply(glowOpacity, 0.3),
          },
        ]}
      />

      {/* Progress ring when pressed */}
      {isPressed && (
        <Animated.View
          style={[
            styles.progressRing,
            {
              borderColor: colors.success,
              transform: [{ rotate: progressRotation }],
            },
          ]}
        />
      )}

      {/* Main SOS button */}
      <View {...panResponder.panHandlers} style={styles.buttonWrapper}>
        <View
          style={[
            styles.button,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              shadowColor: colors.primary,
            },
            isPressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.sosTop, { color: "#FF0000" }]}>SOS</Text>
          <Text style={[styles.holdText, { color: colors.text }]}>
            Hold to Trigger
          </Text>
          <Text style={[styles.sosBottom, { color: "#FF0000" }]}>
            🚨
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowRing1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  glowRing2: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
  },
  glowRing3: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
  },
  progressRing: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 4,
    borderStyle: "dashed",
  },
  buttonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  sosTop: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  holdText: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 8,
  },
  sosBottom: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 3,
  },
});
