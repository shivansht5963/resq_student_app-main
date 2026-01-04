import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { User, Settings, Shield, ChevronRight, LogOut, Mail, Phone, BookOpen, GraduationCap } from "lucide-react-native";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

export default function StudentProfileScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const router = useRouter();
    const { user: authUser, signOut, isErpAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [studentProfile, setStudentProfile] = useState(null);

    useEffect(() => {
        fetchStudentProfile();
    }, [authUser]);

    const fetchStudentProfile = async () => {
        if (!isErpAuthenticated || !authUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const students = await api.getStudents();
            const myStudent = students.find(s => s.user.id === authUser.id);
            setStudentProfile(myStudent);
        } catch (error) {
            console.error("Failed to fetch student profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace("/login");
        } catch (error) {
            console.error('Logout error:', error);
            router.replace("/login");
        }
    };

    const displayUser = authUser || {};

    return (
        <GridBackground>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 100,
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 24 }}>
                    Profile
                </Text>

                {/* Profile Card */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{
                        width: 100, height: 100, borderRadius: 50,
                        backgroundColor: colors.primaryLight, marginBottom: 16,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 4, borderColor: colors.surface
                    }}>
                        <User size={40} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>
                        {displayUser.first_name || "Student"} {displayUser.last_name || ""}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {studentProfile?.course_name || "Course Not Enrolled"}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        ID: {studentProfile?.roll_number || displayUser.email || "N/A"}
                    </Text>
                </View>

                {/* Info Section */}
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Personal Info</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <Mail size={18} color={colors.textSecondary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Email</Text>
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{displayUser.email || "N/A"}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <Phone size={18} color={colors.textSecondary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Phone</Text>
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{displayUser.phone || studentProfile?.contact_number || "N/A"}</Text>
                        </View>
                    </View>

                    {studentProfile && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <GraduationCap size={18} color={colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Semester</Text>
                                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Sem {studentProfile.semester}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Academic Summary (Mock/Static for now as API lacks direct endpoints for these) */}
                {studentProfile && (
                    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Academic Summary</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>-</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>CGPA</Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: colors.border }} />
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.success }}>-</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Attendance</Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: colors.border }} />
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.error }}>-</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Backlog</Text>
                            </View>
                        </View>
                        <Text style={{ marginTop: 12, fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
                            * Check detailed reports in Academics tab
                        </Text>
                    </View>
                )}

                {/* Menu Items */}
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 8 }}>
                    {[
                        { icon: Shield, label: "Safety History", route: "/(tabs)/safety" },
                        { icon: Settings, label: "Settings", action: () => { } },
                        { icon: LogOut, label: "Log Out", action: handleLogout, color: '#EF4444' },
                    ].map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                borderBottomWidth: index < 2 ? 1 : 0,
                                borderBottomColor: colors.border
                            }}
                            onPress={item.action || (() => router.push(item.route))}
                        >
                            <item.icon size={22} color={item.color || colors.text} />
                            <Text style={{ flex: 1, marginLeft: 16, fontSize: 16, color: item.color || colors.text }}>{item.label}</Text>
                            <ChevronRight size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </GridBackground>
    );
}
