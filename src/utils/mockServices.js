// Mock service functions for integrations
// TODO: Replace these with real implementations

/**
 * Mock BLE Beacon Scanner
 * TODO: Integrate with react-native-ble-plx
 */
export async function scanBeacons() {
  // Simulate BLE scan delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock beacon data
  const mockBeacons = [
    { id: "beacon-001", name: "West Corridor - Block A", rssi: -45 },
    { id: "beacon-002", name: "East Wing - Library", rssi: -67 },
    { id: "beacon-003", name: "Main Entrance", rssi: -82 },
  ];

  // Return nearest beacon (highest RSSI)
  return mockBeacons.sort((a, b) => b.rssi - a.rssi)[0];
}

/**
 * Mock Authentication with OTP
 * TODO: Integrate with Firebase Auth
 */
export async function authenticateWithOTP(phoneNumber, otp) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock validation (accept any 6-digit OTP for demo)
  if (otp.length === 6) {
    return {
      success: true,
      user: {
        id: `user-${Date.now()}`,
        phoneNumber,
        name: "Student User",
      },
    };
  }

  throw new Error("Invalid OTP");
}

/**
 * Mock Push Notification
 * TODO: Integrate with Firebase Cloud Messaging (FCM)
 */
export async function sendPushNotification(userId, notification) {
  console.log("📱 Mock Push Notification:", {
    userId,
    title: notification.title,
    body: notification.body,
    data: notification.data,
  });

  // Simulate notification send
  await new Promise((resolve) => setTimeout(resolve, 500));

  return { success: true, messageId: `msg-${Date.now()}` };
}

/**
 * Mock Media Upload
 * TODO: Integrate with Firebase Storage or @react-native-firebase/storage
 */
export async function uploadMedia(uri) {
  console.log("📤 Mock Media Upload:", uri);

  // Simulate upload delay with progress
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return mock uploaded URL
  return {
    success: true,
    id: `media-${Date.now()}`,
    url: uri, // In real implementation, this would be the Firebase Storage URL
  };
}

/**
 * Mock ML Backend Call
 * TODO: Integrate with your ML backend API
 */
export async function postToMLBackend(imageUri) {
  console.log("🤖 Mock ML Backend Call:", imageUri);

  // Simulate ML processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock ML response
  return {
    success: true,
    analysis: {
      threat_level: "medium",
      detected_objects: ["person", "suspicious_activity"],
      confidence: 0.78,
    },
  };
}

/**
 * Mock Firestore Write
 * TODO: Integrate with @react-native-firebase/firestore
 */
export async function saveIncidentToFirestore(incident) {
  console.log("💾 Mock Firestore Write:", incident);

  // Simulate Firestore write
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    docId: `incident-${Date.now()}`,
  };
}

/**
 * Mock GPS Location
 * TODO: Integrate with expo-location
 */
export async function getCurrentLocation() {
  // Simulate location fetch
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: 10,
  };
}
