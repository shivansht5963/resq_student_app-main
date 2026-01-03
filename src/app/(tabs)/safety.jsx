import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FileText,
  MessageCircle,
  AlertCircle,
  MapPin,
  Moon,
  Sun,
  LogOut,
} from "lucide-react-native";
import GridBackground from "@/components/GridBackground";
import SOSButton from "@/components/SOSButton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/utils/useTheme";
import ErrorModal from "@/components/ErrorModal";
import { logoutUser } from "@/utils/api";

export default function SafetyPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendSOSAlert, currentBeacon } = useApp();
  const { colors, toggleTheme, isDark } = useTheme();

  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Getting location...");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [sosError, setSOSError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    // Get user location
    if (Platform.OS !== "web") {
      (async () => {
        try {
          const Location = await import("expo-location");
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });

            // Reverse geocode to get location name
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });

            if (address && address.length > 0) {
              const addr = address[0];
              const name =
                addr.street || addr.name || addr.district || "Current Location";
              setLocationName(name);
            } else {
              setLocationName(
                `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
              );
            }
            setLoadingLocation(false);
          } else {
            setLocationName("Location permission denied");
            setLoadingLocation(false);
          }
        } catch (error) {
          console.error("Error getting location:", error);
          setLocationName("Unable to get location");
          setLoadingLocation(false);
        }
      })();
    } else {
      // Mock location for web preview
      setLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setLocationName("Market Street, San Francisco");
      setLoadingLocation(false);
    }
  }, []);

  const handleSOSTrigger = () => {
    try {
      sendSOSAlert();
      router.push("/sos-alert");
    } catch (error) {
      console.error('SOS trigger error:', error);
      setSOSError({
        status: error.status || 500,
        message: 'Failed to trigger SOS alert',
        type: error.type || 'ERROR',
        detail: error.detail,
      });
      setShowErrorModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace("/login");
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      router.replace("/login");
    }
  };

  return (
    <GridBackground>
      <StatusBar style={colors.statusBar} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20, 
          // Added extra padding at bottom for tab bar clearance if needed, 
          // though usually Tabs handle this. 
        }}
      >
        {/* Header with Theme Toggle & Logout */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                Safety Center
              </Text>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                Your Campus Shield
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {isDark ? (
                  <Sun size={22} color={colors.primary} />
                ) : (
                  <Moon size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Current Location */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            marginBottom: 24,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <MapPin size={20} color={colors.primary} />
          {loadingLocation ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginLeft: 8 }}
            />
          ) : (
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                flex: 1,
              }}
            >
              {locationName}
            </Text>
          )}
        </View>

        {/* SOS Button */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 20,
          }}
        >
          <SOSButton onSOSTrigger={handleSOSTrigger} />
        </View>

        {/* Feature Cards - Reorganized Layout */}
        <View style={{ marginTop: 10 }}>
          {/* Top Row: My Incidents and Chat */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {/* My Incidents Card */}
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 16,
                paddingVertical: 24,
                paddingHorizontal: 16,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
                minHeight: 130,
              }}
              onPress={() => router.push("/incidents")}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <AlertCircle size={28} color={colors.primary} strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                My Incidents
              </Text>
            </TouchableOpacity>

            {/* Chat Card */}
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 16,
                paddingVertical: 24,
                paddingHorizontal: 16,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
                minHeight: 130,
              }}
              onPress={() => router.push("/chat")}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MessageCircle
                  size={28}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                Chat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Report Incident - Bigger Card */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              paddingVertical: 32,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              minHeight: 110,
            }}
            onPress={() => router.push("/report")}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <FileText size={28} color={colors.primary} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.text,
                letterSpacing: 0.5,
              }}
            >
              Report Incident
            </Text>
          </TouchableOpacity>
        </View>

        <ErrorModal
          visible={showErrorModal}
          error={sosError}
          onDismiss={() => setShowErrorModal(false)}
        />
      </View>
    </GridBackground>
  );
}
