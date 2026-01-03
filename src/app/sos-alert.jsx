import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/utils/useTheme";
import MapView, { Marker } from "react-native-maps";
import { reportSOS, getIncidentDetail, pollIncidentStatus } from "@/utils/api";
import { useBLE } from "@/utils/useBLE";
import ErrorModal from "@/components/ErrorModal";
import GuardAssignmentCard from "@/components/GuardAssignmentCard";
import SearchingGuardCard from "@/components/SearchingGuardCard";
import NoGuardAvailableCard from "@/components/NoGuardAvailableCard";
import IncidentResolvedCard from "@/components/IncidentResolvedCard";
import { AlertCircle } from "lucide-react-native";

export default function SOSAlertScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentBeacon } = useApp();
  const { colors, isDark } = useTheme();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;

  const [location, setLocation] = useState(null);
  const [incidentId, setIncidentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sosError, setSOSError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [incidentStatus, setIncidentStatus] = useState('CREATED');
  const [beaconLocation, setBeaconLocation] = useState(null);
  const { nearestBeacon, isScanning, startBLEScan, fallbackBeaconId } = useBLE();

  // Guard polling states
  const [guardStatus, setGuardStatus] = useState(null); // 'WAITING_FOR_GUARD', 'GUARD_ASSIGNED', 'NO_ASSIGNMENT'
  const [guardStatusMessage, setGuardStatusMessage] = useState(null); // Dynamic message from backend
  const [guardAssignment, setGuardAssignment] = useState(null); // Guard details when assigned
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [priority, setPriority] = useState(null);
  const [priorityDisplay, setPriorityDisplay] = useState(null);
  const pollingIntervalRef = useRef(null);

  // Theme-aware colors
  const alertColors = {
    background: isDark ? "#0F0F0F" : "#FFF1F2",
    cardBg: isDark ? "#7F1D1D" : "#FB7185",
    cardSecondaryBg: isDark ? "#991B1B" : "#FECDD3",
    mainText: isDark ? "#FFFFFF" : "#1F2937",
    secondaryText: isDark ? "#E5E7EB" : "#4B5563",
    tertiaryText: isDark ? "#9CA3AF" : "#6B7280",
    dangerBtn: "#EF4444",
    pulseColor: isDark ? "rgba(220, 38, 38, 0.3)" : "rgba(251, 113, 133, 0.4)",
  };

  // Initialize SOS: Get location, detect beacon, submit SOS
  useEffect(() => {
    const initializeSOS = async () => {
      setIsLoading(true);

      try {
        // Step 1: Get user location
        if (Platform.OS !== "web") {
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
          }
        } else {
          // Mock location for web
          setLocation({
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }

        // Step 2: Detect nearest beacon via BLE
        let beaconIdToUse = fallbackBeaconId;
        try {
          // Start BLE scan with 10 second timeout - returns promise with beacon
          const detectedBeacon = await startBLEScan(10000);

          if (detectedBeacon && detectedBeacon.source === 'ble') {
            console.log('✅ Using detected BLE beacon:', detectedBeacon.id);
            beaconIdToUse = detectedBeacon.id;
          } else {
            console.warn('⚠️ No BLE beacon detected, using fallback beacon');
            beaconIdToUse = fallbackBeaconId;
          }
        } catch (bleError) {
          console.warn('⚠️ BLE detection error, using fallback beacon:', bleError);
          beaconIdToUse = fallbackBeaconId;
        }

        // Step 3: Submit SOS to backend (ONLY ONCE)
        const sosResponse = await reportSOS(
          beaconIdToUse,
          `SOS Alert triggered at ${new Date().toLocaleString()}`
        );

        console.log('Full SOS response:', sosResponse);
        console.log('Checking for incident_id:', sosResponse?.incident_id);

        if (sosResponse?.incident_id) {
          setIncidentId(sosResponse.incident_id);
          setIncidentStatus(sosResponse.incident?.status || 'CREATED');
          setBeaconLocation(sosResponse.incident?.beacon?.location_name || 'Campus Beacon');
          setIsLoading(false);
        } else {
          console.error('Response structure:', JSON.stringify(sosResponse, null, 2));
          throw new Error('No incident ID received from server');
        }
      } catch (error) {
        console.error('SOS initialization error:', error);
        setSOSError({
          status: error.status || 500,
          message: error.message || 'Failed to send SOS alert',
          type: error.type || 'ERROR',
          detail: error.detail,
        });
        setShowErrorModal(true);
        setIsLoading(false);
      }
    };

    initializeSOS();
  }, []); // Empty dependency array - runs only ONCE on mount

  // Start polling for guard assignment once incident is created
  useEffect(() => {
    if (!incidentId) return;

    setIsPolling(true);

    const startPolling = async () => {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await pollIncidentStatus(incidentId);

          console.log('📡 Poll response:', statusData);

          // Update incident status
          if (statusData.status) {
            setIncidentStatus(statusData.status);
          }

          // Update priority
          if (statusData.priority !== undefined) {
            setPriority(statusData.priority);
            setPriorityDisplay(statusData.priority_display);
          }

          // Update location from response
          if (statusData.location) {
            setBeaconLocation(statusData.location);
          }

          // Update guard status
          if (statusData.guard_status) {
            setGuardStatus(statusData.guard_status.status);
            setGuardStatusMessage(statusData.guard_status.message);
            setPendingAlerts(statusData.pending_alerts || []);
          }

          // If guard assigned, show guard details
          if (statusData.guard_assignment && statusData.guard_assignment.guard) {
            setGuardAssignment(statusData.guard_assignment.guard);
            console.log('✅ Guard assigned:', statusData.guard_assignment.guard.full_name);
          }

          // Stop polling only when incident is RESOLVED
          if (statusData.status === 'RESOLVED') {
            console.log('✅ Incident RESOLVED - stopping polling');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('❌ Polling error:', error);
          // Continue polling even if there's an error
        }
      }, 5000); // Poll every 5 seconds as per spec
    };

    startPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [incidentId]);

  useEffect(() => {
    // Pulsing red rings animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Pulsing dot animation
    const dot = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    dot.start();

    return () => {
      pulse.stop();
      dot.stop();
    };
  }, []);

  const handleCancelAlert = () => {
    // Stop polling when canceling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    router.back();
  };

  const handleChatWithGuard = () => {
    // Navigate to chat screen with guard
    if (incidentId) {
      router.push({
        pathname: '/chat',
        params: { incidentId },
      });
    }
  };

  const handleCallGuard = async () => {
    // Implement call functionality - you can use Linking API
    if (guardAssignment?.phone) {
      await Linking.openURL(`tel:${guardAssignment.phone}`);
    } else {
      // Fallback: show info that phone number not available
      alert('Guard phone number not available. Use chat instead.');
    }
  };

  const handleRetrySearch = async () => {
    // Reset guard states and restart polling
    setGuardAssignment(null);
    setGuardStatus(null);
    setGuardStatusMessage(null);
    setPendingAlerts([]);
    setIsPolling(true);

    // Restart polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const interval = setInterval(async () => {
      try {
        const statusData = await pollIncidentStatus(incidentId);

        // Update incident status
        if (statusData.status) {
          setIncidentStatus(statusData.status);
        }

        // Update guard status
        if (statusData.guard_status) {
          setGuardStatus(statusData.guard_status.status);
          setGuardStatusMessage(statusData.guard_status.message);
          setPendingAlerts(statusData.pending_alerts || []);
        }

        // If guard assigned, show guard details
        if (statusData.guard_assignment && statusData.guard_assignment.guard) {
          setGuardAssignment(statusData.guard_assignment.guard);
        }

        // Stop polling when resolved
        if (statusData.status === 'RESOLVED') {
          clearInterval(interval);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Retry polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    pollingIntervalRef.current = interval;
  };

  const handleContactAdmin = async () => {
    // Implement contact admin functionality
    // This could open a contact form or directly call/email admin
    alert('Contact Admin feature coming soon.\nEmail: campus-security@university.edu\nPhone: +1-555-0123');
  };

  const handleRatingSubmit = async (rating, feedback) => {
    // TODO: Connect to backend API when ready
    console.log(`Rating submitted: ${rating} stars, Feedback: ${feedback}`);

    // For now, just show a thank you and go home
    alert('Thank you for your feedback!');
    router.replace('/(tabs)');
  };

  const handleSkipRating = () => {
    router.replace('/(tabs)');
  };

  // Show loading state while SOS is being submitted
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#0F0F0F" : "#FFF1F2",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color="#EF4444" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: isDark ? "#E5E7EB" : "#4B5563",
            textAlign: "center",
          }}
        >
          Sending SOS alert...
          {isScanning && '\n(Detecting nearest beacon)'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: alertColors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* Main Content Area */}
        {incidentStatus === 'RESOLVED' ? (
          <IncidentResolvedCard
            guard={guardAssignment}
            incidentId={incidentId}
            onSubmitRating={handleRatingSubmit}
            onSkip={handleSkipRating}
          />
        ) : (
          <>
            {/* SOS Icon with Pulsing Rings */}
            <View style={{ alignItems: "center", marginBottom: 30 }}>
              <View
                style={{
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Single pulsing ring */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: alertColors.pulseColor,
                    transform: [{ scale: pulseAnim }],
                  }}
                />

                {/* Main SOS button */}
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: alertColors.dangerBtn,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: alertColors.dangerBtn,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      color: "#FFFFFF",
                      letterSpacing: 2,
                    }}
                  >
                    SOS
                  </Text>
                </View>
              </View>

              {/* Alert Sent Text */}
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: alertColors.mainText,
                  marginTop: 30,
                  letterSpacing: 1,
                }}
              >
                ALERT SENT
              </Text>
            </View>

            {/* Guard Assignment Status Cards */}
            {guardAssignment ? (
              // Case: Guard Assigned ✅
              <GuardAssignmentCard
                guard={guardAssignment}
                onChat={handleChatWithGuard}
                onCall={handleCallGuard}
              />
            ) : guardStatus === "NO_ASSIGNMENT" ? (
              // Case: No Guard Available ⚠️
              <NoGuardAvailableCard
                onRetry={handleRetrySearch}
                onContactAdmin={handleContactAdmin}
              />
            ) : (
              // Case: Still Searching (default) 🔍
              <SearchingGuardCard
                pendingCount={pendingAlerts.length}
                beaconLocation={beaconLocation}
                nearestBeacon={nearestBeacon}
                guardStatus={guardStatus}
                guardStatusMessage={guardStatusMessage}
                incidentStatus={incidentStatus}
                priority={priority}
                priorityDisplay={priorityDisplay}
              />
            )}

            {/* Map Card - Hide when guard is assigned */}
            {!guardAssignment && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: alertColors.cardSecondaryBg,
                  borderRadius: 24,
                  padding: 20,
                  paddingBottom: 24,
                }}
              >
                {/* Map View */}
                <View
                  style={{
                    width: "100%",
                    height: 300,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: "#FFFFFF",
                    marginBottom: 16,
                  }}
                >
                  {location && Platform.OS !== "web" ? (
                    // MapView disabled - requires Google Maps API key
                    // <MapView
                    //   style={{ flex: 1 }}
                    //   initialRegion={location}
                    //   showsUserLocation={true}
                    //   showsMyLocationButton={false}
                    //   zoomEnabled={true}
                    //   scrollEnabled={true}
                    // >
                    //   <Marker
                    //     coordinate={{
                    //       latitude: location.latitude,
                    //       longitude: location.longitude,
                    //     }}
                    //     title="Your Location"
                    //     description="SOS Alert Triggered"
                    //     pinColor={alertColors.dangerBtn}
                    //   />
                    // </MapView>
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F9FAFB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6B7280",
                          textAlign: "center",
                          paddingHorizontal: 20,
                        }}
                      >
                        Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F9FAFB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#1F2937",
                          textAlign: "center",
                          paddingHorizontal: 20,
                          fontWeight: "600",
                        }}
                      >
                        {location
                          ? `📍 Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                          : "📍 Loading location..."}
                      </Text>
                      {location && (
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6B7280",
                            marginTop: 8,
                          }}
                        >
                          Emergency services have been notified
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Sharing Live Location */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Animated.View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: alertColors.dangerBtn,
                      marginRight: 10,
                      opacity: dotAnim,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: isDark ? "#FFFFFF" : "#1F2937",
                      fontWeight: "500",
                    }}
                  >
                    Sharing Live Location...
                  </Text>
                </View>
              </View>
            )}

            {/* Incident ID Display */}
            {incidentId && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: '#10B981',
                }}
              >
                <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 4 }}>
                  Incident ID
                </Text>
                <Text style={{ fontSize: 14, color: isDark ? '#E5E7EB' : '#1F2937', fontFamily: 'monospace', fontWeight: '600' }}>
                  {incidentId}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 8 }}>
                  Status: {incidentStatus}
                </Text>
              </View>
            )}

            {/* Cancel Alert Button */}
            <TouchableOpacity
              onPress={handleCancelAlert}
              style={{
                width: "100%",
                backgroundColor: isDark ? "#374151" : "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: "center",
                marginTop: 30,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: alertColors.mainText,
                }}
              >
                Cancel Alert
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <ErrorModal
        visible={showErrorModal}
        error={sosError}
        onDismiss={() => {
          setShowErrorModal(false);
          router.back();
        }}
      />
    </View>
  );
}
