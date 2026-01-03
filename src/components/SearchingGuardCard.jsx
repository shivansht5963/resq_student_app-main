import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { Search, Radio, AlertCircle } from "lucide-react-native";

export default function SearchingGuardCard({ 
  pendingCount = 0, 
  beaconLocation, 
  nearestBeacon,
  guardStatus = null, // 'NO_ASSIGNMENT', 'WAITING_FOR_GUARD', 'GUARD_ASSIGNED'
  guardStatusMessage = null,
  incidentStatus = 'CREATED',
  priority = null,
  priorityDisplay = null,
}) {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Dot animation
    const dot = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );
    dot.start();

    return () => {
      pulse.stop();
      dot.stop();
    };
  }, [pulseAnim, dotAnim]);

  const cardColors = {
    cardBg: isDark ? "#1E2633" : "#F3F4F6",
    pulseBg: isDark ? "rgba(139, 92, 246, 0.25)" : "rgba(168, 85, 247, 0.25)",
    circleBg: isDark ? "#7C3AED" : "#A855F7",
    text: isDark ? "#E5E7EB" : "#1F2937",
    textSecondary: isDark ? "#9CA3AF" : "#6B7280",
    badge: isDark ? "#1F2937" : "#E5E7EB",
    badgeText: isDark ? "#9CA3AF" : "#374151",
    helpCardBg: isDark ? "#7F1D1D" : "#FB7185",
    helpText: "#FFFFFF",
    statusCreated: "#F59E0B",
    statusAssigned: "#10B981",
    statusInProgress: "#3B82F6",
  };

  // Dynamic status display based on guard_status
  const getStatusDisplay = () => {
    switch (guardStatus) {
      case 'NO_ASSIGNMENT':
        return {
          icon: '🔍',
          title: 'Finding nearby security guards...',
          subtitle: 'Searching for available guards in your area',
          statusText: 'Searching',
          statusColor: cardColors.statusCreated,
        };
      case 'WAITING_FOR_GUARD':
        return {
          icon: '📡',
          title: `Alerting guards...`,
          subtitle: pendingCount > 0 
            ? `${pendingCount} guard${pendingCount > 1 ? 's' : ''} being contacted`
            : 'Contacting available guards',
          statusText: 'Contacting',
          statusColor: cardColors.statusCreated,
        };
      case 'GUARD_ASSIGNED':
        return {
          icon: '✅',
          title: 'Guard is responding!',
          subtitle: 'Help is on the way',
          statusText: 'Assigned',
          statusColor: cardColors.statusAssigned,
        };
      default:
        // Default based on incident status
        if (incidentStatus === 'CREATED') {
          return {
            icon: '🔍',
            title: 'Searching for nearby security...',
            subtitle: 'Finding available guards',
            statusText: 'Searching',
            statusColor: cardColors.statusCreated,
          };
        }
        return {
          icon: '📡',
          title: 'Processing your request...',
          subtitle: 'Please wait',
          statusText: incidentStatus,
          statusColor: cardColors.statusCreated,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <View style={{ width: "100%", gap: 16, marginBottom: 20 }}>
      {/* Searching Card */}
      <View
        style={{
          width: "100%",
          backgroundColor: cardColors.cardBg,
          borderRadius: 24,
          padding: 24,
        }}
      >
        {/* Animated Pulse Circle - Single circle with pulse effect */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
            {/* Single pulse ring */}
            <Animated.View
              style={{
                position: "absolute",
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: cardColors.pulseBg,
                transform: [{ scale: pulseAnim }],
              }}
            />

            {/* Main circle */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: cardColors.circleBg,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: cardColors.circleBg,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              {guardStatus === 'WAITING_FOR_GUARD' ? (
                <Radio size={36} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Search size={36} color="#FFFFFF" strokeWidth={2} />
              )}
            </View>
          </View>
        </View>

        {/* Status Text */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: cardColors.text,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {statusDisplay.title}
        </Text>
        
        <Text
          style={{
            fontSize: 14,
            color: cardColors.textSecondary,
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 20,
          }}
        >
          {guardStatusMessage || statusDisplay.subtitle}
        </Text>

        {/* Status Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: cardColors.badge,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusDisplay.statusColor,
              opacity: dotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            }}
          />
          <Text
            style={{
              fontSize: 13,
              color: cardColors.badgeText,
              fontWeight: "600",
            }}
          >
            Status: {statusDisplay.statusText}
          </Text>
        </View>

        {/* Priority Badge (if available) */}
        {priorityDisplay && (
          <View
            style={{
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: priority >= 4 ? "#FEE2E2" : "#FEF3C7",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <AlertCircle size={14} color={priority >= 4 ? "#DC2626" : "#D97706"} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: priority >= 4 ? "#DC2626" : "#D97706",
                }}
              >
                Priority: {priorityDisplay}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Help Card */}
      <View
        style={{
          width: "100%",
          backgroundColor: cardColors.helpCardBg,
          borderRadius: 24,
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: cardColors.helpText,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Help is on the way.
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: cardColors.helpText,
            opacity: 0.9,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Campus Security has been notified of your location and is searching for available guards.
        </Text>

        {/* Beacon Info */}
        <View style={{ paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" }}>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 4 }}>
            📍 Location: {beaconLocation || nearestBeacon?.name || "Campus Beacon"}
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
            Detection: {nearestBeacon?.source === "ble" ? "Auto-detected (BLE)" : "Fallback beacon"}
          </Text>
        </View>
      </View>
    </View>
  );
}
