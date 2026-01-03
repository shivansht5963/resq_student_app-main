import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { RotateCcw, AlertTriangle } from "lucide-react-native";

export default function NoGuardAvailableCard({ onRetry, onContactAdmin }) {
  const { colors, isDark } = useTheme();

  const cardColors = {
    cardBg: isDark ? "#1E1E1E" : "#FEF2F2",
    headerBg: isDark ? "#7F1D1D" : "#FEE2E2",
    text: isDark ? "#E5E7EB" : "#1F2937",
    textSecondary: isDark ? "#9CA3AF" : "#6B7280",
    dangerButton: isDark ? "#DC2626" : "#EF4444",
    secondaryButton: isDark ? "#374151" : "#E5E7EB",
    buttonText: "#FFFFFF",
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: cardColors.cardBg,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: cardColors.headerBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <AlertTriangle size={40} color={cardColors.dangerButton} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: cardColors.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          No Guard Available
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: cardColors.textSecondary,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          We couldn't find available guards in your area at the moment
        </Text>
      </View>

      {/* Info Card */}
      <View
        style={{
          backgroundColor: isDark ? "#2D2D2D" : "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderLeftWidth: 3,
          borderLeftColor: cardColors.dangerButton,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: cardColors.textSecondary,
            fontWeight: "600",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          What to do:
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: cardColors.text,
            lineHeight: 22,
          }}
        >
          1. Try searching again in a few moments{"\n"}
          2. Contact campus admin for immediate help{"\n"}
          3. Move to a location with better guard coverage if safe
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 12 }}>
        {/* Retry Button */}
        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: cardColors.dangerButton,
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <RotateCcw size={20} color={cardColors.buttonText} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: cardColors.buttonText,
            }}
          >
            Retry Search
          </Text>
        </TouchableOpacity>

        {/* Contact Admin Button */}
        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: cardColors.secondaryButton,
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={onContactAdmin}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: cardColors.text,
            }}
          >
            Contact Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Message */}
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? '#4B5563' : '#D1D5DB' }}>
        <Text
          style={{
            fontSize: 12,
            color: cardColors.textSecondary,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          You can still chat with campus security through the admin contact option.
        </Text>
      </View>
    </View>
  );
}
