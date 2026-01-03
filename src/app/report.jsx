import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, Camera, X, Loader, Bluetooth } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { useApp } from "@/context/AppContext";
import { reportIncident } from "@/utils/api";
import { useBLE } from "@/utils/useBLE";

const INCIDENT_TYPES = [
  { id: "theft", label: "Theft", emoji: "🔒", backendLabel: "Theft" },
  { id: "harassment", label: "Harassment", emoji: "⚠️", backendLabel: "Harassment" },
  { id: "suspicious", label: "Suspicious Activity", emoji: "👀", backendLabel: "Suspicious Activity" },
  { id: "vandalism", label: "Vandalism", emoji: "🔨", backendLabel: "Vandalism" },
  { id: "safety", label: "Safety Concern", emoji: "🚨", backendLabel: "Safety Concern" },
  { id: "other", label: "Other", emoji: "📝", backendLabel: "Other" },
];

export default function ReportIncidentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useApp();
  const { nearestBeacon, isScanning, startBLEScan, fallbackBeaconId } = useBLE();

  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [beaconId, setBeaconId] = useState(null);
  const [beaconLoading, setBeaconLoading] = useState(true);
  const [beaconName, setBeaconName] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const MAX_IMAGES = 3;

  // Fetch location and beacon on component mount
  useEffect(() => {
    fetchLocationAndBeacon();
  }, []);

  const fetchLocationAndBeacon = async () => {
    try {
      setLocationLoading(true);
      setBeaconLoading(true);

      // Fetch location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          try {
            const address = await Location.reverseGeocodeAsync({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            if (address && address.length > 0) {
              const { name, street, city, region } = address[0];
              const locationString =
                `${name || street || ""} ${city || ""} ${region || ""}`
                  .trim()
                  .replace(/  +/g, " ") || "Location detected";
              setLocation(locationString);
            } else {
              setLocation(
                `Campus (${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)})`,
              );
            }
          } catch {
            setLocation(
              `Campus (${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)})`,
            );
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          setLocation("Campus");
        }
      } else {
        setLocation("Campus");
      }

      // Scan for nearest beacon with 10-second timeout
      let beaconIdToUse = null;
      try {
        // Start BLE scan - returns promise with detected beacon
        const detectedBeacon = await startBLEScan(10000);
        
        // Check if a real BLE beacon was detected
        if (detectedBeacon && detectedBeacon.source === 'ble') {
          beaconIdToUse = detectedBeacon.id;
          setBeaconId(detectedBeacon.id);
          setBeaconName(detectedBeacon.name || "Beacon");
          console.log("Found BLE beacon:", detectedBeacon.id, detectedBeacon.name);
        } else {
          // No BLE beacon found, use fallback
          console.warn("No BLE beacon detected, using fallback beacon");
          beaconIdToUse = fallbackBeaconId;
          setBeaconId(fallbackBeaconId);
          setBeaconName("Campus Beacon (Fallback)");
        }
      } catch (error) {
        console.warn("Beacon scan error:", error);
        // On error, use fallback beacon
        beaconIdToUse = fallbackBeaconId;
        setBeaconId(fallbackBeaconId);
        setBeaconName("Campus Beacon (Fallback)");
      }
    } finally {
      setLocationLoading(false);
      setBeaconLoading(false);
    }
  };

  const pickImage = async (mode) => {
    try {
      console.log('🎥 Image picker started - Mode:', mode);
      
      if (mode === "camera") {
        console.log('📷 Launching camera...');
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const imageUri = result.assets[0].uri;
          console.log('✅ Camera image captured:', imageUri);
          console.log('📊 Current images count:', images.length, '/', MAX_IMAGES);
          
          if (images.length < MAX_IMAGES) {
            const newImages = [...images, imageUri];
            setImages(newImages);
            console.log('✅ Image added to list. Total:', newImages.length);
          } else {
            console.log('❌ Max images reached:', MAX_IMAGES);
            Alert.alert("Error", `Maximum ${MAX_IMAGES} images allowed`);
          }
        } else {
          console.log('❌ Camera capture cancelled');
        }
      } else {
        console.log('🖼️ Launching image library...');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultiple: true,
        });

        if (!result.canceled && result.assets) {
          const newImages = result.assets.map((asset) => asset.uri);
          const totalImages = images.length + newImages.length;

          console.log('✅ Images selected from library:', newImages.length);
          console.log('📊 Total images will be:', totalImages, '/', MAX_IMAGES);
          console.log('🔗 Selected URIs:', newImages);

          if (totalImages > MAX_IMAGES) {
            console.log('❌ Too many images selected');
            Alert.alert(
              "Error",
              `Maximum ${MAX_IMAGES} images allowed. You selected ${newImages.length} images.`,
            );
            return;
          }

          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          console.log('✅ All images added to list. Total:', updatedImages.length);
        } else {
          console.log('❌ Gallery selection cancelled');
        }
      }
    } catch (error) {
      console.error("❌ Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = (index) => {
    const removedUri = images[index];
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    console.log('🗑️ Image removed:', removedUri);
    console.log('📊 Remaining images:', updated.length);
  };

  const handleSubmit = async () => {
    if (!selectedType || !description) {
      Alert.alert(
        "Error",
        "Please select incident type and provide description",
      );
      return;
    }

    // Validate that we have either beacon or location
    if (!beaconId && !location) {
      Alert.alert("Error", "Unable to determine location or beacon. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      // Get the backend label for the selected type
      const selectedTypeObj = INCIDENT_TYPES.find(t => t.id === selectedType);
      const backendType = selectedTypeObj?.backendLabel || selectedType;

      console.log('\n' + '='.repeat(70));
      console.log('🚀 INCIDENT REPORT SUBMISSION STARTED');
      console.log('='.repeat(70));
      console.log('📋 Report Details:', {
        type: backendType,
        description: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
        location,
        beaconId,
        beaconName,
        imageCount: images.length,
        timestamp: new Date().toISOString(),
      });
      console.log('🖼️ Images to upload:', images.length);
      images.forEach((uri, idx) => {
        const shortUri = uri.substring(uri.length - 40);
        console.log(`   [Image ${idx + 1}] ...${shortUri}`);
      });

      // Call the API with beacon if found, otherwise with location
      const result = await reportIncident({
        type: backendType,
        description,
        location: location || null,
        beaconId: beaconId || null, // Prefer beacon if available
        imageUris: images,
      });

      if (result.success && result.data) {
        const incident = result.data.incident;
        const status = result.data.status;

        console.log('\n✅ INCIDENT REPORT SUBMISSION SUCCESSFUL');
        console.log('Status:', status);
        console.log('Incident ID:', incident?.id);
        if (incident?.images?.length > 0) {
          console.log('📸 Images uploaded:', incident.images.length);
          incident.images.forEach((img, idx) => {
            console.log(`   [${idx + 1}] ${img.image}`);
          });
        }
        console.log('='.repeat(70) + '\n');

        if (status === "incident_created") {
          Alert.alert(
            "Success ✓",
            `Your incident report has been submitted successfully.\n\nIncident ID: ${incident.id.slice(0, 8)}...\n\nGuards have been alerted.`,
            [
              {
                text: "Done",
                onPress: () => router.back(),
              },
            ],
          );
        } else if (status === "signal_added_to_existing") {
          Alert.alert(
            "Report Added ✓",
            `Your report has been added to an existing incident.\n\nIncident ID: ${incident.id.slice(0, 8)}...\n\nOther students reported the same issue.`,
            [
              {
                text: "Done",
                onPress: () => router.back(),
              },
            ],
          );
        } else {
          Alert.alert(
            "Success ✓",
            "Your incident report has been submitted successfully.",
            [
              {
                text: "Done",
                onPress: () => router.back(),
              },
            ],
          );
        }
      } else {
        Alert.alert("Error", "Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      
      let errorMessage = "Failed to submit report. Please try again.";
      let errorTitle = "Error";
      
      if (error.status === 400) {
        errorTitle = "Validation Error";
        if (error.detail && typeof error.detail === 'object') {
          if (error.detail.error) {
            errorMessage = error.detail.error;
          } else if (error.detail.type) {
            errorMessage = Array.isArray(error.detail.type) 
              ? error.detail.type[0] 
              : error.detail.type;
          } else if (error.detail.beacon_id) {
            errorMessage = Array.isArray(error.detail.beacon_id)
              ? error.detail.beacon_id[0]
              : error.detail.beacon_id;
          } else if (error.detail.location) {
            errorMessage = Array.isArray(error.detail.location)
              ? error.detail.location[0]
              : error.detail.location;
          } else {
            errorMessage = JSON.stringify(error.detail).slice(0, 200);
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error.status === 401) {
        errorTitle = "Session Expired";
        errorMessage = "Please login again to submit a report.";
      } else if (error.status === 403) {
        errorTitle = "Permission Denied";
        errorMessage = "Only students can report incidents.";
      } else if (error.status === 500) {
        errorTitle = "Server Error";
        errorMessage = "Server error. Please check that beacon or location is provided and try again.";
      } else if (error.status === 0 || error.type === 'NETWORK_ERROR') {
        errorTitle = "Network Error";
        errorMessage = "Unable to connect to server. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
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
              Report Incident
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
          {/* Incident Type Selection */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Incident Type
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor:
                    selectedType === type.id ? colors.primary : colors.surface,
                  borderWidth: 2,
                  borderColor:
                    selectedType === type.id ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: selectedType === type.id ? "#FFFFFF" : colors.text,
                  }}
                >
                  {type.emoji} {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 15,
              color: colors.text,
              height: 150,
              textAlignVertical: "top",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
            placeholder="Describe what happened..."
            placeholderTextColor={colors.textTertiary}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Location - Auto Detected */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Location (Auto-Detected)
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              marginBottom: 24,
            }}
          >
            <MapPin size={20} color={colors.primary} />
            {locationLoading ? (
              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                  }}
                >
                  Detecting location...
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  paddingVertical: 16,
                  fontSize: 15,
                  color: colors.text,
                  fontWeight: "500",
                }}
              >
                {location}
              </Text>
            )}
          </View>

          {/* Beacon Status */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Beacon Status
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: beaconId ? colors.surface : colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: beaconId ? "#10B981" : colors.border,
              paddingHorizontal: 16,
              marginBottom: 24,
            }}
          >
            <Bluetooth size={20} color={beaconId ? "#10B981" : colors.primary} />
            {beaconLoading ? (
              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                  }}
                >
                  Scanning for beacons...
                </Text>
              </View>
            ) : beaconId ? (
              <View style={{ flex: 1, marginLeft: 12, paddingVertical: 16 }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: "#10B981",
                    fontWeight: "600",
                  }}
                >
                  ✓ Beacon Found
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 4,
                  }}
                >
                  {beaconName}
                </Text>
              </View>
            ) : (
              <View style={{ flex: 1, marginLeft: 12, paddingVertical: 16 }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    fontWeight: "500",
                  }}
                >
                  No beacon detected
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 4,
                  }}
                >
                  Will use location-based report
                </Text>
              </View>
            )}
          </View>

          {/* Images Section */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Images ({images.length}/{MAX_IMAGES})
          </Text>

          {/* Image Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {images.map((imageUri, index) => (
              <View
                key={index}
                style={{
                  width: "31%",
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
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#000000CC",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Image Upload Buttons */}
          {images.length < MAX_IMAGES && (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginBottom: 32,
              }}
            >
              <TouchableOpacity
                onPress={() => pickImage("camera")}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Camera size={24} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.text }}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickImage("gallery")}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Camera size={24} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.text }}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Validation Status */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderLeftWidth: 4,
              borderLeftColor:
                selectedType && description ? colors.primary : "#F59E0B",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Required Fields
            </Text>

            <View style={{ gap: 8 }}>
              {/* Incident Type Check */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: selectedType
                      ? colors.primary
                      : "rgba(245, 158, 11, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: selectedType ? "#FFFFFF" : "#F59E0B",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {selectedType ? "✓" : "!"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: selectedType ? colors.text : colors.textSecondary,
                    fontWeight: selectedType ? "600" : "400",
                  }}
                >
                  Incident Type {selectedType ? "✓" : "(required)"}
                </Text>
              </View>

              {/* Description Check */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: description
                      ? colors.primary
                      : "rgba(245, 158, 11, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: description ? "#FFFFFF" : "#F59E0B",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {description ? "✓" : "!"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: description ? colors.text : colors.textSecondary,
                    fontWeight: description ? "600" : "400",
                  }}
                >
                  Description {description ? "✓" : "(required)"}
                </Text>
              </View>

              {/* Images Info */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#10B981",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    ℹ
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Images: {images.length}/3 (optional)
                </Text>
              </View>
            </View>

            {!selectedType || !description ? (
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#F59E0B",
                    fontStyle: "italic",
                  }}
                >
                  {!selectedType && !description
                    ? "Please select incident type and provide description"
                    : !selectedType
                      ? "Please select an incident type"
                      : "Please provide a description"}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: "600",
                  }}
                >
                  ✓ Ready to submit!
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !selectedType || !description}
            style={{
              backgroundColor:
                !selectedType || !description || loading
                  ? colors.surfaceElevated
                  : colors.primary,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              shadowColor:
                !selectedType || !description
                  ? "transparent"
                  : colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: !selectedType || !description ? 0 : 4,
              opacity: loading || !selectedType || !description ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color:
                  !selectedType || !description
                    ? colors.textSecondary
                    : "#FFFFFF",
              }}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GridBackground>
  );
}
