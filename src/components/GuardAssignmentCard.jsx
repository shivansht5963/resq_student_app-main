import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { Phone, MessageCircle, CheckCircle, User } from "lucide-react-native";

export default function GuardAssignmentCard({ guard, onChat, onCall }) {
  const { colors, isDark } = useTheme();

  const cardColors = {
    background: isDark ? "#1E1E1E" : "#F0FDF4",
    cardBg: isDark ? "#2E7D32" : "#ECFDF5",
    headerBg: isDark ? "#1B5E20" : "#DBEAFE",
    text: isDark ? "#E5E7EB" : "#1F2937",
    textSecondary: isDark ? "#9CA3AF" : "#6B7280",
    button: isDark ? "#4CAF50" : "#10B981",
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
          <CheckCircle size={40} color={cardColors.button} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: cardColors.text,
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          Security Assigned
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: cardColors.textSecondary,
            textAlign: "center",
          }}
        >
          A guard is on the way
        </Text>
      </View>

      {/* Guard Details Card */}
      <View
        style={{
          backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: cardColors.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {guard.full_name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: cardColors.textSecondary,
            marginBottom: 12,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {guard.email}
        </Text>
        {guard.phone && (
          <Text
            style={{
              fontSize: 14,
              color: cardColors.textSecondary,
              textAlign: "center",
            }}
          >
            {guard.phone}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 12 }}>
        {/* Chat Button */}
        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: cardColors.button,
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={onChat}
          activeOpacity={0.8}
        >
          <MessageCircle size={20} color={cardColors.buttonText} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: cardColors.buttonText,
            }}
          >
            Chat with Guard
          </Text>
        </TouchableOpacity>

        {/* Call Button */}
        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={onCall}
          activeOpacity={0.8}
        >
          <Phone size={20} color={cardColors.text} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: cardColors.text,
            }}
          >
            Call Guard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stay Calm Message */}
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? '#4B5563' : '#D1D5DB' }}>
        <Text
          style={{
            fontSize: 12,
            color: cardColors.textSecondary,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          Stay calm. Help will arrive shortly.
        </Text>
      </View>
    </View>
  );
}
