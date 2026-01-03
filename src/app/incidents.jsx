import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Clock, MapPin, AlertCircle } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import Badge from "@/components/Badge";
import { getIncidents } from "@/utils/api";

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

export default function MyIncidentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch incidents from backend using React Query
  const {
    data: incidentsResponse = { results: [] },
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["incidents"],
    queryFn: getIncidents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const incidents = incidentsResponse?.results || [];

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
              justifyContent: "space-between",
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
                flex: 1,
                textAlign: "center",
                marginRight: 40,
              }}
            >
              My Incidents
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoading && !refreshing ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginBottom: 16 }}
              />
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                Loading incidents...
              </Text>
            </View>
          ) : isError ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <AlertCircle size={48} color={colors.primary} style={{ marginBottom: 16 }} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Failed to load incidents
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {error?.message || "An error occurred while fetching incidents"}
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
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
          ) : incidents.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                No incidents reported
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Your reported incidents will appear here
              </Text>
            </View>
          ) : (
            incidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                onPress={() => router.push(`/incident-detail?id=${incident.id}`)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  borderLeftWidth: 4,
                  borderLeftColor: getStatusColor(incident.status),
                }}
              >
                {/* Header Row */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <Text style={{ fontSize: 20, marginRight: 8 }}>
                      {getStatusEmoji(incident.status)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textSecondary,
                          marginBottom: 2,
                        }}
                      >
                        Location
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {incident.beacon?.location_name ||
                          incident.location ||
                          "Unknown"}
                      </Text>
                    </View>
                  </View>
                  <Badge
                    text={incident.status}
                    color={getStatusColor(incident.status)}
                  />
                </View>

                {/* Description */}
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 20,
                    marginBottom: 12,
                  }}
                  numberOfLines={2}
                >
                  {incident.description}
                </Text>

                {/* Guard Assignment Info */}
                {incident.guard_assignment && (
                  <View
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      Assigned Guard
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {incident.guard_assignment?.guard_name ||
                        "Assigned Guard"}
                    </Text>
                  </View>
                )}

                {/* Signal Count */}
                {incident.signal_count && (
                  <View
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginBottom: 2,
                      }}
                    >
                      Signal Count
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {incident.signal_count} signal
                      {incident.signal_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}

                {/* Footer Info */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Clock size={14} color={colors.textTertiary} />
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textTertiary,
                    }}
                  >
                    {new Date(incident.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </GridBackground>
  );
}
