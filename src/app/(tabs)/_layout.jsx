import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { Home, Shield, GraduationCap, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useAuth } from "@/utils/auth/useAuth";
import { Alert } from "react-native";

export default function TabLayout() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { erpAuth } = useAuth();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
                    borderTopColor: isDark ? "#333" : "#f0f0f0",
                    elevation: 0,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 5,
                    paddingTop: 5,
                    position: "absolute",
                },
                tabBarBackground: () =>
                    Platform.OS === "ios" ? (
                        <BlurView
                            intensity={80}
                            tint={isDark ? "dark" : "light"}
                            style={{ flex: 1 }}
                        />
                    ) : null,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600'
                }
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    href: "/(tabs)/home",
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Home size={size} color={color} strokeWidth={2.5} />
                    ),
                }}
            />

            <Tabs.Screen
                name="academics"
                options={{
                    href: "/(tabs)/academics",
                    title: "Academics",
                    tabBarIcon: ({ color, size }) => (
                        <GraduationCap size={size} color={color} strokeWidth={2.5} />
                    ),
                }}
            />

            {/* Safety Tab - Standardized */}
            <Tabs.Screen
                name="safety"
                options={{
                    href: "/(tabs)/safety",
                    title: "Safety",
                    tabBarIcon: ({ color, size }) => (
                        <Shield size={size} color={color} strokeWidth={2.5} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: "/(tabs)/profile",
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <User size={size} color={color} strokeWidth={2.5} />
                    ),
                }}
            />
        </Tabs>
    );
}
