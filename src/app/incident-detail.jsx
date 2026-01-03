import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertCircle,
  Phone,
  MessageSquare,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { getIncidentDetail } from "@/utils/api";

const getStatusEmoji = (status) => {
  const emojis = {
    CREATED: "🔴",
    ASSIGNED: "🟡",
    IN_PROGRESS: "🔵",
    RESOLVED: "🟢",
  };
  return emojis[status] || "⚫";
};

const getStatusColor = (status) => {
  const statusMap = {
    CREATED: "#EF4444",
    ASSIGNED: "#F59E0B",
    IN_PROGRESS: "#3B82F6",
    RESOLVED: "#10B981",
  };
  return statusMap[status] || "#6B7280";
};

const getStatusDescription = (status) => {
  const descriptions = {
    CREATED: "Incident reported. Waiting for guard response.",
    ASSIGNED: "Guard has been assigned to your incident.",
    IN_PROGRESS: "Guard is on the way or with you.",
    RESOLVED: "Incident has been resolved.",
  };
  return descriptions[status] || status;
};

export default function IncidentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Fetch incident details from backend using React Query
  const {
    data: incident,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncidentDetail(id),
    enabled: !!id,
    staleTime: 1000 * 5, // 5 seconds - real-time updates
  });

  if (isLoading) {
    return (
      <GridBackground>
        <StatusBar style={colors.statusBar} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GridBackground>
    );
  }

  if (isError || !incident) {
    return (
      <GridBackground>
        <StatusBar style={colors.statusBar} />
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 20,
              paddingBottom: 16,
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Error Content */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <AlertCircle size={48} color={colors.primary} style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Failed to load incident
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 16,
                paddingHorizontal: 40,
              }}
            >
              {error?.message || "Incident not found or an error occurred"}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <StatusBar style={colors.statusBar} />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              Incident Details
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card - Always Visible */}
          <View
            style={{
              backgroundColor: getStatusColor(incident.status),
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 40 }}>
                {getStatusEmoji(incident.status)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: 4,
                  }}
                >
                  Current Status
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  {incident.status}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 18,
                  }}
                >
                  {getStatusDescription(incident.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Beacon/Location Card */}
          {incident.beacon && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <MapPin size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Location
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  >
                    {incident.beacon.location_name}
                  </Text>
                  <View style={{ gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                      }}
                    >
                      Building: <Text style={{ color: colors.text }}>{incident.beacon.building}</Text>
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                      }}
                    >
                      Floor: <Text style={{ color: colors.text }}>{incident.beacon.floor}</Text>
                    </Text>
                    {incident.beacon.latitude && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textTertiary,
                        }}
                      >
                        Coordinates: {incident.beacon.latitude.toFixed(4)},{" "}
                        {incident.beacon.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Date & Time Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Calendar size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginBottom: 2,
                }}
              >
                Reported Date & Time
              </Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: "600" }}>
                {new Date(incident.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          {/* Guard Assignment Card */}
          {incident.guard_assignment && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <View style={{ gap: 12 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    Assigned Guard
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {incident.guard_assignment?.guard?.full_name ||
                      "Assigned Guard"}
                  </Text>
                </View>
                {incident.guard_assignment?.guard?.phone && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Phone size={16} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.text,
                        fontWeight: "600",
                      }}
                    >
                      {incident.guard_assignment.guard.phone}
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  Assigned at:{" "}
                  {new Date(incident.guard_assignment?.assigned_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Guard Alerts Card */}
          {incident.guard_alerts && incident.guard_alerts.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Guard Alerts ({incident.guard_alerts.length})
              </Text>
              <View style={{ gap: 10 }}>
                {incident.guard_alerts.map((alert, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 10,
                      borderLeftWidth: 3,
                      borderLeftColor:
                        alert.status === "SENT" ? colors.primary : colors.textTertiary,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {alert.guard.full_name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          backgroundColor:
                            alert.status === "SENT"
                              ? colors.primary
                              : colors.textTertiary,
                          color: "#FFFFFF",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                          fontWeight: "600",
                        }}
                      >
                        {alert.status}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      Priority Rank: #{alert.priority_rank}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textTertiary,
                      }}
                    >
                      Alert sent at:{" "}
                      {new Date(alert.alert_sent_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Signal Information */}
          {incident.signals && incident.signals.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Signals ({incident.signals.length})
              </Text>
              <View style={{ gap: 10 }}>
                {incident.signals.map((signal, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.text,
                        marginBottom: 4,
                      }}
                    >
                      {signal.signal_type}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      From:{" "}
                      <Text style={{ fontWeight: "600" }}>
                        {signal.source_user?.full_name}
                      </Text>
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textTertiary,
                      }}
                    >
                      {new Date(signal.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Description
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: colors.text,
                lineHeight: 24,
              }}
            >
              {incident.description}
            </Text>
          </View>

          {/* Images */}
          {incident.images && incident.images.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Evidence ({incident.images.length} image
                {incident.images.length !== 1 ? "s" : ""})
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {incident.images.map((imageUri, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setFullscreenImage(imageUri)}
                    style={{
                      width: "48%",
                      aspectRatio: 1,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Chat Section */}
          {incident.conversation && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <MessageSquare size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Messages ({incident.conversation.messages?.length || 0})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/chat?conversationId=${incident.conversation.id}`)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  View Chat
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <StatusBar hidden />
          <TouchableOpacity
            style={{ width: "100%", height: "100%" }}
            activeOpacity={1}
            onPress={() => setFullscreenImage(null)}
          >
            <Image
              source={{ uri: fullscreenImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFullscreenImage(null)}
            style={{
              position: "absolute",
              top: insets.top + 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, color: "#FFFFFF" }}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </GridBackground>
  );
}
